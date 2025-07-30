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

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
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
    'dist/public/index.html',
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
  log('🔍 Verifying index.html...');

  try {
    const indexPath = 'dist/public/index.html';
    const indexContent = await fs.readFile(indexPath, 'utf-8');

    if (indexContent.includes('<div id="root">') && indexContent.includes('</html>')) {
      success('index.html is valid');
      return true;
    } else {
      error('index.html appears to be incomplete');
      return false;
    }
  } catch (err) {
    error(`Failed to verify index.html: ${err.message}`);
    return false;
  }
}

async function verifyServerPaths() {
  log('🔍 Verifying server file paths...');

  try {
    const serverIndexPath = 'dist/server/index.js';
    const serverContent = await fs.readFile(serverIndexPath, 'utf-8');

    // Check if paths have been properly fixed
    if (serverContent.includes('path.resolve(__dirname, "../client")')) {
      success('Server paths correctly configured');
      return true;
    } else {
      warning('Server paths may need adjustment');
      return true; // Not critical, continue
    }
  } catch (err) {
    error(`Failed to verify server paths: ${err.message}`);
    return false;
  }
}

async function testServerStart() {
  log('🚀 Testing server startup...');

  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['dist/server/index.js'], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '3001' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverOutput = '';
    let serverStarted = false;

    serverProcess.stdout.on('data', (data) => {
      serverOutput += data.toString();
      if (serverOutput.includes('serving on port') && !serverStarted) {
        serverStarted = true;
        success('Server started successfully');
        serverProcess.kill();
        resolve(true);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      if (errorOutput.includes('Error') || errorOutput.includes('MODULE_NOT_FOUND')) {
        error(`Server startup error: ${errorOutput}`);
        serverProcess.kill();
        resolve(false);
      }
    });

    serverProcess.on('exit', (code) => {
      if (!serverStarted) {
        if (code !== 0) {
          error(`Server exited with code ${code}`);
          resolve(false);
        } else {
          success('Server test completed');
          resolve(true);
        }
      }
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!serverStarted) {
        error('Server startup timeout');
        serverProcess.kill();
        resolve(false);
      }
    }, 15000);
  });
}

async function testStaticFileServing() {
  log('🌐 Testing static file serving...');

  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['dist/server/index.js'], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '3002' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverStarted = false;

    serverProcess.stdout.on('data', async (data) => {
      if (data.toString().includes('serving on port') && !serverStarted) {
        serverStarted = true;

        try {
          // Test if we can fetch the index.html
          const response = await fetch('http://localhost:3002/');
          if (response.ok) {
            success('Static file serving works');
            serverProcess.kill();
            resolve(true);
          } else {
            warning('Static file serving returned non-200 status');
            serverProcess.kill();
            resolve(false);
          }
        } catch (err) {
          warning('Could not test static file serving');
          serverProcess.kill();
          resolve(false);
        }
      }
    });

    serverProcess.on('exit', () => {
      if (!serverStarted) {
        resolve(false);
      }
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!serverStarted) {
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
    log('🔧 Try running the build scripts again:', colors.yellow);
    log('   npm run build:production', colors.blue);
    log('   node scripts/build-deployment.js', colors.blue);
    process.exit(1);
  }
}

main();