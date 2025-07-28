#!/usr/bin/env node

/**
 * Script to add the build:production script to package.json
 * This is needed for deployment to work correctly
 */

import { promises as fs } from 'fs';

async function addBuildProductionScript() {
  try {
    // Read the current package.json
    const packageJsonContent = await fs.readFile('package.json', 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Add the build:production script if it doesn't exist
    if (!packageJson.scripts['build:production']) {
      packageJson.scripts['build:production'] = 'node scripts/build-production.js';
      
      // Write the updated package.json
      await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2) + '\n');
      console.log('✅ Added build:production script to package.json');
    } else {
      console.log('✅ build:production script already exists');
    }
    
  } catch (error) {
    console.error('❌ Failed to add build:production script:', error.message);
    process.exit(1);
  }
}

addBuildProductionScript();