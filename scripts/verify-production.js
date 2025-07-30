
#!/usr/bin/env node

/**
 * Quick verification script to check if production build is ready
 */

import { promises as fs } from 'fs';
import path from 'path';

async function verifyProduction() {
  console.log('🔍 Verifying production build...');
  
  const requiredFiles = [
    'dist/server/index.js',
    'dist/server/routes.js', 
    'dist/server/storage.js',
    'dist/public/index.html'
  ];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      console.log(`✅ ${file} exists`);
    } catch {
      console.error(`❌ Missing: ${file}`);
      process.exit(1);
    }
  }
  
  console.log('✅ Production build verification passed');
}

verifyProduction();
