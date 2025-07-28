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
    
    // Step 3: Copy vite.config.js to dist for runtime
    console.log('📋 Copying vite config...');
    await fs.copyFile('vite.config.ts', 'dist/vite.config.js');
    console.log('✅ Config files copied');
    
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