#!/usr/bin/env node

/**
 * Script to copy vite.config.ts to dist/vite.config.js for production builds
 */

import { promises as fs } from 'fs';
import path from 'path';

async function copyViteConfig() {
  try {
    // Ensure dist directory exists
    await fs.mkdir('dist', { recursive: true });
    
    // Create a production-compatible vite config
    const prodConfig = `
// Production vite config
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
    
    // Write both .js and extensionless versions for compatibility
    await fs.writeFile('dist/vite.config.js', prodConfig);
    await fs.writeFile('dist/vite.config', prodConfig);
    console.log('✅ Vite config copied to dist/ (both .js and extensionless versions)');
    
  } catch (error) {
    console.error('❌ Failed to copy vite config:', error.message);
    process.exit(1);
  }
}

copyViteConfig();