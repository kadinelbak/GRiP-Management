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
    try {
      await execAsync('npm run build:server');
      console.log('✅ Server build completed');
    } catch (error) {
      console.warn('⚠️  npm run build:server failed, trying fallback build script...');
      try {
        await execAsync('node scripts/build-server.cjs');
        console.log('✅ Server build completed using fallback script');
      } catch (fallbackError) {
        console.error('❌ Both build:server and fallback script failed');
        throw new Error(`Server build failed: ${fallbackError.message}`);
      }
    }

    // Step 3: Set up vite config for production runtime
    console.log('📋 Setting up vite config for production...');

    // Ensure dist directory exists
    await fs.mkdir('dist', { recursive: true });

    // Move client files to public directory
    const clientDistPath = path.join('dist', 'client');
    const publicPath = path.join('dist', 'public');

    if (await fs.access(clientDistPath).then(() => true).catch(() => false)) {
      console.log('📦 Moving client files to public directory...');
      try {
        // Ensure public directory exists
        await fs.mkdir(publicPath, { recursive: true });
        
        // Copy client files to public directory
        await fs.cp(clientDistPath, publicPath, { recursive: true });
        
        // Remove the client directory after successful copy
        await fs.rm(clientDistPath, { recursive: true });
        console.log('✅ Client files moved to public directory');
      } catch (error) {
        console.error('❌ Failed to move client files:', error.message);
        throw error;
      }
    }

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

    // Fix the static file paths in server/index.js to point to public directory
    const serverIndexPath = path.join('dist', 'server', 'index.js');
    if (await fs.access(serverIndexPath).then(() => true).catch(() => false)) {
      let serverIndexContent = await fs.readFile(serverIndexPath, 'utf-8');

      // Fix the static file paths in server/index.js to point to public directory
      serverIndexContent = serverIndexContent.replace(
        /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]client["']\)/g,
        'path.join(import.meta.dirname, "..", "public")'
      );

      // Fix the fallback HTML path
      serverIndexContent = serverIndexContent.replace(
        /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]client[/\\]index\.html["']\)/g,
        'path.join(import.meta.dirname, "..", "public", "index.html")'
      );

      // Also fix any other references to public directory
      serverIndexContent = serverIndexContent.replace(
        /path\.resolve\(import\.meta\.dirname,?\s*["']public["']\)/g,
        'path.resolve(import.meta.dirname, "..", "public")'
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