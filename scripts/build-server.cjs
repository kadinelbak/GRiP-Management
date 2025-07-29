#!/usr/bin/env node

/**
 * Alternative TypeScript server compilation script
 * Fallback build script for server files when npm run build:server is missing
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function buildServer() {
  try {
    console.log('🔧 Building server with build-server.cjs...');
    
    // Check if TypeScript is available
    try {
      await execAsync('npx tsc --version');
    } catch (error) {
      throw new Error('TypeScript compiler not found. Please install TypeScript: npm install -g typescript');
    }
    
    // Check if tsconfig.server.json exists
    const tsconfigPath = path.resolve('tsconfig.server.json');
    try {
      await fs.access(tsconfigPath);
    } catch (error) {
      throw new Error('tsconfig.server.json not found. Server build configuration is missing.');
    }
    
    // Run TypeScript compilation
    await execAsync('npx tsc --project tsconfig.server.json');
    console.log('✅ Server TypeScript compilation completed');
    
    // Verify build output
    const distServerPath = path.resolve('dist', 'server');
    try {
      await fs.access(distServerPath);
      console.log('✅ Server build output verified');
    } catch (error) {
      throw new Error('Server build output not found in dist/server');
    }
    
    console.log('🎉 Server build completed successfully!');
    
  } catch (error) {
    console.error('❌ Server build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildServer();
}

module.exports = { buildServer };