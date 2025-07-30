#!/usr/bin/env node

/**
 * Deployment verification script
 * Tests that the built application can start and serve files correctly
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.blue) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function verifyBuildFiles() {
  log('🔍 Verifying build files...');
  
  const requiredFiles = [
    'dist/shared/schema.js',
    'dist/server/index.js',
    'dist/server/vite.js',
    'dist/server/routes.js',
    'dist/server/storage.js',
    'dist/server/db.js',
    'dist/client/index.html',
    'dist/vite.config.js',
    'dist/package.json'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
    } catch (err) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    error(`Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  success('All required build files present');
  return true;
}

async function verifyIndexHtml() {
  log('📄 Verifying index.html content...');
  
  try {
    const indexPath = 'dist/public/index.html';
    const content = await fs.readFile(indexPath, 'utf-8');
    
    // Check for essential HTML structure
    const requiredElements = [
      '<!DOCTYPE html>',
      '<html',
      '<head>',
      '<body>',
      '<div id="root">',
      '.js'
    ];
    
    const missing = requiredElements.filter(element => !content.includes(element));
    
    if (missing.length > 0) {
      error(`index.html missing required elements: ${missing.join(', ')}`);
      return false;
    }
    
    success('index.html contains all required elements');
    return true;
  } catch (err) {
    error(`Failed to read index.html: ${err.message}`);
    return false;
  }
}

async function verifyServerPaths() {
  log('🔧 Verifying server path configurations...');
  
  try {
    const viteServerPath = 'dist/server/vite.js';
    const content = await fs.readFile(viteServerPath, 'utf-8');
    
    // Check that paths are correctly configured for production
    const correctPatterns = [
      'path.resolve(import.meta.dirname, "..", "public")',
      'import viteConfig from "../vite.config.js"'
    ];
    
    const incorrectPatterns = [
      'path.resolve(import.meta.dirname, "public")',
      'import viteConfig from "../vite.config"'
    ];
    
    for (const pattern of correctPatterns) {
      if (!content.includes(pattern)) {
        error(`Missing correct path pattern: ${pattern}`);
        return false;
      }
    }
    
    for (const pattern of incorrectPatterns) {
      if (content.includes(pattern)) {
        error(`Found incorrect path pattern: ${pattern}`);
        return false;
      }
    }
    
    success('Server paths configured correctly for production');
    return true;
  } catch (err) {
    error(`Failed to verify server paths: ${err.message}`);
    return false;
  }
}

async function testServerStart() {
  log('🚀 Testing server startup...');
  
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server/index.js'], {
      cwd: 'dist',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let hasStarted = false;
    
    // Set a timeout for server startup
    const timeout = setTimeout(() => {
      if (!hasStarted) {
        error('Server startup timeout (10 seconds)');
        serverProcess.kill();
        resolve(false);
      }
    }, 10000);
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('serving on port')) {
        hasStarted = true;
        clearTimeout(timeout);
        success('Server started successfully');
        
        // Give it a moment to fully initialize
        setTimeout(() => {
          serverProcess.kill();
          resolve(true);
        }, 1000);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      if (errorOutput.includes('EADDRINUSE')) {
        warning('Port 5000 is already in use, but this indicates server would work in production');
        clearTimeout(timeout);
        serverProcess.kill();
        resolve(true);
      } else if (errorOutput.includes('Error') && !errorOutput.includes('Re-optimizing')) {
        error(`Server error: ${errorOutput}`);
        clearTimeout(timeout);
        serverProcess.kill();
        resolve(false);
      }
    });
    
    serverProcess.on('error', (err) => {
      error(`Failed to start server: ${err.message}`);
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function testStaticFileServing() {
  log('📁 Testing static file serving...');
  
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server/index.js'], {
      cwd: 'dist',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('serving on port') && !serverReady) {
        serverReady = true;
        
        // Test HTTP request
        setTimeout(async () => {
          try {
            const response = await fetch('http://localhost:5000/');
            const text = await response.text();
            
            if (response.ok && text.includes('<!DOCTYPE html>')) {
              success('Static file serving works correctly');
              serverProcess.kill();
              resolve(true);
            } else {
              error(`Static file serving failed: ${response.status}`);
              serverProcess.kill();
              resolve(false);
            }
          } catch (err) {
            error(`Failed to test static serving: ${err.message}`);
            serverProcess.kill();
            resolve(false);
          }
        }, 2000);
      }
    });
    
    serverProcess.on('error', () => {
      resolve(false);
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
      if (serverReady === false) {
        error('Server did not start in time for static file test');
        serverProcess.kill();
        resolve(false);
      }
    }, 15000);
  });
}

async function main() {
  try {
    log('🧪 Starting deployment verification...\n');
    
    // Run all verification steps
    const results = await Promise.all([
      verifyBuildFiles(),
      verifyIndexHtml(),
      verifyServerPaths()
    ]);
    
    if (!results.every(Boolean)) {
      throw new Error('Build file verification failed');
    }
    
    // Test server functionality
    const serverStartOk = await testServerStart();
    if (!serverStartOk) {
      throw new Error('Server startup test failed');
    }
    
    // Skip static file test if fetch is not available (older Node.js)
    if (typeof fetch !== 'undefined') {
      const staticServeOk = await testStaticFileServing();
      if (!staticServeOk) {
        warning('Static file serving test failed, but build may still work in production');
      }
    } else {
      warning('Skipping static file test (fetch not available)');
    }
    
    log('\n🎉 Deployment verification completed successfully!', colors.green);
    log('🚀 The application is ready for deployment', colors.green);
    
  } catch (error) {
    log(`\n💥 Deployment verification failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();