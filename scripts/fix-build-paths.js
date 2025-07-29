
#!/usr/bin/env node

/**
 * Script to fix build path issues and ensure correct file locations
 */

import { promises as fs } from 'fs';
import path from 'path';

async function fixBuildPaths() {
  console.log('🔧 Fixing build paths...');
  
  try {
    // 1. Ensure dist/public directory exists
    await fs.mkdir('dist/public', { recursive: true });
    console.log('✅ Created dist/public directory');
    
    // 2. Check if client build exists in wrong location and move it
    const wrongClientPath = 'dist/client';
    const correctClientPath = 'dist/public';
    
    try {
      const stats = await fs.stat(wrongClientPath);
      if (stats.isDirectory()) {
        console.log('📦 Found client build in wrong location, moving...');
        
        // Copy all files from dist/client to dist/public
        const files = await fs.readdir(wrongClientPath);
        for (const file of files) {
          const srcPath = path.join(wrongClientPath, file);
          const destPath = path.join(correctClientPath, file);
          
          const srcStats = await fs.stat(srcPath);
          if (srcStats.isDirectory()) {
            await fs.cp(srcPath, destPath, { recursive: true });
          } else {
            await fs.copyFile(srcPath, destPath);
          }
        }
        
        // Remove the old directory
        await fs.rm(wrongClientPath, { recursive: true });
        console.log('✅ Moved client build to correct location');
      }
    } catch (error) {
      // dist/client doesn't exist, which is fine
    }
    
    // 3. Fix server file paths
    const serverIndexPath = 'dist/server/index.js';
    try {
      let serverContent = await fs.readFile(serverIndexPath, 'utf-8');
      
      // Fix all static file path references
      const originalContent = serverContent;
      
      serverContent = serverContent.replace(
        /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]public["']\)/g,
        'path.join(import.meta.dirname, "..", "public")'
      );
      
      serverContent = serverContent.replace(
        /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]client["']\)/g,
        'path.join(import.meta.dirname, "..", "public")'
      );
      
      serverContent = serverContent.replace(
        /path\.resolve\(import\.meta\.dirname,?\s*["']public["']\)/g,
        'path.resolve(import.meta.dirname, "..", "public")'
      );
      
      serverContent = serverContent.replace(
        /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]public[/\\]index\.html["']\)/g,
        'path.join(import.meta.dirname, "..", "public", "index.html")'
      );
      
      serverContent = serverContent.replace(
        /path\.join\(import\.meta\.dirname,?\s*["'][^"']*dist[/\\]client[/\\]index\.html["']\)/g,
        'path.join(import.meta.dirname, "..", "public", "index.html")'
      );
      
      if (serverContent !== originalContent) {
        await fs.writeFile(serverIndexPath, serverContent);
        console.log('✅ Fixed server file paths');
      }
    } catch (error) {
      console.warn('⚠️  Could not fix server file paths:', error.message);
    }
    
    // 4. Ensure index.html exists in dist/public
    const indexHtmlPath = 'dist/public/index.html';
    try {
      await fs.access(indexHtmlPath);
      console.log('✅ index.html found in correct location');
    } catch (error) {
      // Try to copy from client/index.html
      try {
        await fs.copyFile('client/index.html', indexHtmlPath);
        console.log('✅ Copied index.html to dist/public');
      } catch (copyError) {
        console.warn('⚠️  Could not copy index.html:', copyError.message);
      }
    }
    
    console.log('🎉 Build paths fixed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fix build paths:', error.message);
    process.exit(1);
  }
}

fixBuildPaths();
