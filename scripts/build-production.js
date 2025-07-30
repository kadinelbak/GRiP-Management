#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

async function buildProduction() {
  try {
    console.log('🚀 Starting simplified production build...');
    
    // Step 1: Clean any existing build
    try {
      await fs.rm('dist', { recursive: true, force: true });
      console.log('🧹 Cleaned existing dist directory');
    } catch (error) {
      // Ignore if dist doesn't exist
    }

    // Step 2: Build client (outputs to dist/client automatically via vite.config.ts)
    console.log('📦 Building client...');
    execSync('npm run build:client', { stdio: 'inherit' });
    console.log('✅ Client build completed');

    // Step 3: Build server (outputs to dist/server automatically)
    console.log('🔧 Building server...');
    execSync('npm run build:server', { stdio: 'inherit' });
    console.log('✅ Server build completed');

    // Step 4: Fix import paths in compiled server code
    console.log('🔧 Fixing server import paths...');
    
    const serverVitePath = path.join('dist', 'server', 'vite.js');
    const serverIndexPath = path.join('dist', 'server', 'index.js');
    
    // Fix vite.js imports
    if (await fs.access(serverVitePath).then(() => true).catch(() => false)) {
      let viteContent = await fs.readFile(serverVitePath, 'utf-8');
      
      // Fix vite config import
      viteContent = viteContent.replace(
        'import viteConfig from "../vite.config";',
        'import viteConfig from "../vite.config.js";'
      );
      
      await fs.writeFile(serverVitePath, viteContent);
      console.log('✅ Fixed vite.js imports');
    }

    // Step 5: Create production vite config that matches current paths
    const prodViteConfig = `
// Production vite config for deployment
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist", "client"),
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

    await fs.writeFile('dist/vite.config.js', prodViteConfig);
    console.log('✅ Created production vite config');

    // Step 6: Create ES module package.json
    const distPackageJson = {
      "type": "module"
    };
    await fs.writeFile('dist/package.json', JSON.stringify(distPackageJson, null, 2));
    console.log('✅ Created dist package.json');

    // Step 7: Verify build
    console.log('🔍 Verifying build...');
    
    const requiredFiles = [
      'dist/client/index.html',
      'dist/server/index.js',
      'dist/server/vite.js',
      'dist/shared/schema.js'
    ];

    for (const file of requiredFiles) {
      if (!(await fs.access(file).then(() => true).catch(() => false))) {
        throw new Error(`❌ Missing required file: ${file}`);
      }
    }

    console.log('✅ All required files present');
    console.log('\n🎉 Production build completed successfully!');
    console.log('📁 Build output: dist/');
    console.log('🌐 Client files: dist/client/');
    console.log('⚙️  Server files: dist/server/');
    console.log('\n🚀 Ready for deployment!');

  } catch (error) {
    console.error('💥 Build failed:', error.message);
    process.exit(1);
  }
}

buildProduction();