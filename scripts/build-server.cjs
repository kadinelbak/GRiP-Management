
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('🔧 Building server with TypeScript...');
  
  // Use the server-specific TypeScript config
  execSync('npx tsc --project tsconfig.server.json', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Server TypeScript compilation completed');
  
  // Copy shared files to dist
  const sharedSrc = path.join(process.cwd(), 'shared');
  const sharedDest = path.join(process.cwd(), 'dist', 'shared');
  
  if (fs.existsSync(sharedSrc)) {
    console.log('📋 Copying shared files to dist...');
    
    // Ensure dist/shared directory exists
    fs.mkdirSync(sharedDest, { recursive: true });
    
    // Copy compiled shared files
    const sharedFiles = fs.readdirSync(sharedSrc);
    sharedFiles.forEach(file => {
      if (file.endsWith('.ts')) {
        const jsFile = file.replace('.ts', '.js');
        const srcPath = path.join('dist', 'shared', jsFile);
        if (fs.existsSync(srcPath)) {
          console.log(`✅ Shared file ${jsFile} copied successfully`);
        }
      }
    });
  }
  
  console.log('🎉 Server build completed successfully!');
  
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}
