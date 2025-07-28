#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Building server with TypeScript using proper ESM configuration...');
  
  // Use the server-specific tsconfig which supports ES2020 modules and import.meta
  execSync('npx tsc --project tsconfig.server.json --skipLibCheck', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('Server build completed successfully!');
  console.log('Build artifacts saved to ./dist/');
} catch (error) {
  console.error('Server build failed:', error.message);
  process.exit(1);
}