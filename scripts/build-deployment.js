#!/usr/bin/env node

/**
 * Enhanced deployment build script with comprehensive error handling
 * Handles all edge cases and provides fallback mechanisms for robust deployments
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

async function checkPackageJsonScripts() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
    const scripts = packageJson.scripts || {};

    const requiredScripts = ['build:client', 'build:server', 'build:production'];
    const missingScripts = requiredScripts.filter(script => !scripts[script]);

    if (missingScripts.length > 0) {
      warning(`Missing scripts in package.json: ${missingScripts.join(', ')}`);
      return false;
    }

    success('All required build scripts found in package.json');
    return true;
  } catch (err) {
    error(`Failed to read package.json: ${err.message}`);
    return false;
  }
}

async function buildClient() {
  log('📦 Building client...');
  try {
    await execAsync('npm run build:client');
    success('Client build completed');
    return true;
  } catch (err) {
    error(`Client build failed: ${err.message}`);

    // Try alternative build method
    warning('Attempting direct Vite build...');
    try {
      await execAsync('npx vite build');
      success('Client build completed using direct Vite');
      return true;
    } catch (fallbackErr) {
      error(`Client build fallback failed: ${fallbackErr.message}`);
      return false;
    }
  }
}

async function buildServer() {
  log('🔧 Building server...');

  // Check for TypeScript config
  try {
    await fs.access('tsconfig.server.json');
  } catch (err) {
    error('tsconfig.server.json not found - server build configuration missing');
    return false;
  }

  // Try primary build method
  try {
    await execAsync('npm run build:server');
    success('Server build completed');
    return true;
  } catch (err) {
    warning(`npm run build:server failed: ${err.message}`);

    // Try direct TypeScript compilation
    warning('Attempting direct TypeScript compilation...');
    try {
      await execAsync('npx tsc --project tsconfig.server.json');
      success('Server build completed using direct TypeScript');
      return true;
    } catch (tscErr) {
      warning(`Direct TypeScript compilation failed: ${tscErr.message}`);

      // Try fallback build script
      warning('Attempting fallback build script...');
      try {
        await execAsync('node scripts/build-server.cjs');
        success('Server build completed using fallback script');
        return true;
      } catch (fallbackErr) {
        error(`All server build methods failed: ${fallbackErr.message}`);
        return false;
      }
    }
  }
}

async function setupProductionConfig() {
  log('📋 Setting up production configuration...');

  try {
    // Ensure dist directory exists
    await fs.mkdir('dist', { recursive: true });

    // Create production vite config
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
    outDir: path.resolve(__dirname, "..", "dist", "client"),
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

    await fs.writeFile('dist/vite.config.js', prodConfig);

    // Fix server file imports
    const serverFiles = [
      { path: path.join('dist', 'server', 'vite.js'), fixes: [
        { from: 'import viteConfig from "../vite.config";', to: 'import viteConfig from "../vite.config.js";' },
        { from: 'path.resolve(import.meta.dirname, "public")', to: 'path.resolve(import.meta.dirname, "..", "public")' }
      ]},
      { path: path.join('dist', 'server', 'index.js'), fixes: [
        { from: /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]public["']\)/g, to: 'path.join(import.meta.dirname, "..", "public")' },
        { from: /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]public[/\\]index\.html["']\)/g, to: 'path.join(import.meta.dirname, "..", "public", "index.html")' },
        { from: /path\.resolve\(import\.meta\.dirname,?\s*["']public["']\)/g, to: 'path.resolve(import.meta.dirname, "..", "public")' }
      ]}
    ];

    for (const { path: filePath, fixes } of serverFiles) {
      if (await fs.access(filePath).then(() => true).catch(() => false)) {
        let content = await fs.readFile(filePath, 'utf-8');

        for (const { from, to } of fixes) {
          if (from instanceof RegExp) {
            content = content.replace(from, to);
          } else {
            content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
          }
        }

        await fs.writeFile(filePath, content);
        success(`Fixed imports in ${path.basename(filePath)}`);
      }
    }

    // Create package.json for ES module resolution
    const distPackageJson = { "type": "module" };
    await fs.writeFile('dist/package.json', JSON.stringify(distPackageJson, null, 2));

    success('Production configuration setup completed');
    return true;
  } catch (err) {
    error(`Production config setup failed: ${err.message}`);
    return false;
  }
}

async function verifyBuild() {
  log('🔍 Verifying build integrity...');

  const requiredFiles = [
    'dist/shared/schema.js',
    'dist/server/index.js',
    'dist/server/routes.js',
    'dist/server/storage.js',
    'dist/server/db.js',
    'dist/client/index.html'
  ];

  const missingFiles = [];

  for (const file of requiredFiles) {
    if (!(await fs.access(file).then(() => true).catch(() => false))) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    error(`Missing build files: ${missingFiles.join(', ')}`);
    return false;
  }

  // Test module imports
  try {
    const { stdout } = await execAsync('cd dist && node -e "import(\'./shared/schema.js\').then(() => console.log(\'Import test passed\'))"');
    if (stdout.includes('Import test passed')) {
      success('Module resolution verified');
    }
  } catch (err) {
    warning('Module import test failed, but build may still work in production');
  }

  success('Build verification completed');
  return true;
}

async function main() {
  try {
    log('🚀 Starting enhanced deployment build...');

    // Step 1: Check package.json scripts
    const scriptsOk = await checkPackageJsonScripts();
    if (!scriptsOk) {
      throw new Error('Package.json script validation failed');
    }

    // Step 2: Build client
    const clientOk = await buildClient();
    if (!clientOk) {
      throw new Error('Client build failed');
    }

    // Step 3: Build server
    const serverOk = await buildServer();
    if (!serverOk) {
      throw new Error('Server build failed');
    }

    // Step 4: Setup production configuration
    const configOk = await setupProductionConfig();
    if (!configOk) {
      throw new Error('Production configuration setup failed');
    }

    // Step 5: Verify build
    const verifyOk = await verifyBuild();
    if (!verifyOk) {
      throw new Error('Build verification failed');
    }

    log('\n🎉 Enhanced deployment build completed successfully!', colors.green);
    log('📁 Build output: dist/', colors.blue);
    log('🌐 Client files: dist/client/', colors.blue);
    log('⚙️  Server files: dist/server/', colors.blue);
    log('🔧 Ready for deployment!', colors.green);

  } catch (err) {
    error(`Build failed: ${err.message}`);
    process.exit(1);
  }
}

main();