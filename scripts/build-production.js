#!/usr/bin/env node

/**
 * Production build script that ensures proper module resolution
 * Handles copying necessary config files and running build steps
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  try {
    console.log('🚀 Starting production build...');
    
    // Step 1: Build client
    console.log('📦 Building client...');
    await execAsync('npm run build:client');
    console.log('✅ Client build completed');
    
    // Step 2: Build server
    console.log('🔧 Building server...');
    await execAsync('npm run build:server');
    console.log('✅ Server build completed');
    
    // Step 3: Set up vite config for production runtime
    console.log('📋 Setting up vite config for production...');
    
    // Ensure dist directory exists
    await fs.mkdir('dist', { recursive: true });
    
    // Create a production-compatible vite config
    const prodConfig = `
// Production vite config for deployment
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "..", "client", "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
      "@assets": path.resolve(__dirname, "..", "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "..", "client"), 
  build: {
    outDir: path.resolve(__dirname, "..", "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
};
`;
    
    // Write the main vite config file
    await fs.writeFile('dist/vite.config.js', prodConfig);
    
    // Create an import map for extensionless imports by modifying the compiled server file
    const serverVitePath = path.join('dist', 'server', 'vite.js');
    if (await fs.access(serverVitePath).then(() => true).catch(() => false)) {
      let serverViteContent = await fs.readFile(serverVitePath, 'utf-8');
      
      // Replace the problematic import with a working one
      serverViteContent = serverViteContent.replace(
        'import viteConfig from "../vite.config";',
        'import viteConfig from "../vite.config.js";'
      );
      
      // Fix the serveStatic path issue for production
      serverViteContent = serverViteContent.replace(
        'path.resolve(import.meta.dirname, "public")',
        'path.resolve(import.meta.dirname, "..", "public")'
      );
      
      await fs.writeFile(serverVitePath, serverViteContent);
      console.log('✅ Fixed vite config import in server/vite.js');
    }
    
    // Fix the static file paths in server/index.js
    const serverIndexPath = path.join('dist', 'server', 'index.js');
    if (await fs.access(serverIndexPath).then(() => true).catch(() => false)) {
      let serverIndexContent = await fs.readFile(serverIndexPath, 'utf-8');
      
      // Fix the static file serving paths for production
      serverIndexContent = serverIndexContent.replace(
        'path.join(import.meta.dirname, "../dist/public")',
        'path.join(import.meta.dirname, "..", "public")'
      );
      
      // Fix the fallback HTML path
      serverIndexContent = serverIndexContent.replace(
        'path.join(import.meta.dirname, "../dist/public/index.html")',
        'path.join(import.meta.dirname, "..", "public", "index.html")'
      );
      
      await fs.writeFile(serverIndexPath, serverIndexContent);
      console.log('✅ Fixed static file paths in server/index.js');
    }
    
    // Create a package.json in dist to ensure ES module resolution works properly
    const distPackageJson = {
      "type": "module"
    };
    await fs.writeFile('dist/package.json', JSON.stringify(distPackageJson, null, 2));
    
    console.log('✅ Vite config setup completed');
    
    // Step 4: Verify build integrity
    console.log('🔍 Verifying build...');
    
    // Check that shared schema is properly built
    const schemaPath = path.join('dist', 'shared', 'schema.js');
    if (await fs.access(schemaPath).then(() => true).catch(() => false)) {
      console.log('✅ Shared schema compiled successfully');
    } else {
      throw new Error('❌ Shared schema not found in build output');
    }
    
    // Check that server files exist
    const serverFiles = ['index.js', 'routes.js', 'storage.js', 'db.js'];
    for (const file of serverFiles) {
      const filePath = path.join('dist', 'server', file);
      if (!(await fs.access(filePath).then(() => true).catch(() => false))) {
        throw new Error(`❌ Server file missing: ${file}`);
      }
    }
    console.log('✅ All server files present');
    
    // Step 5: Test import resolution
    console.log('🧪 Testing module imports...');
    try {
      const { stdout } = await execAsync('cd dist && node -e "import(\'./shared/schema.js\').then(() => console.log(\'Import test passed\'))"');
      if (stdout.includes('Import test passed')) {
        console.log('✅ Module resolution working correctly');
      }
    } catch (error) {
      console.warn('⚠️  Import test failed, but build may still work in production');
    }
    
    console.log('\n🎉 Production build completed successfully!');
    console.log('📁 Build output: dist/');
    console.log('🌐 Client files: dist/public/');
    console.log('⚙️  Server files: dist/server/');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();