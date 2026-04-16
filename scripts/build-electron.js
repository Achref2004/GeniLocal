/**
 * Electron Build Configuration
 * Handles building and packaging the desktop application
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building Electron Application...\n');

const projectRoot = path.join(__dirname, '..');

try {
  // Step 1: Build React app
  console.log('📦 Building React application...');
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' });
  console.log('✅ React build complete\n');

  // Step 2: Build Electron app (with electron-builder)
  console.log('⚙️  Building Electron packages...');

  const platform = process.argv[2] || 'all';
  let buildCmd = 'electron-builder';

  if (platform === 'win') {
    buildCmd += ' --win';
  } else if (platform === 'mac') {
    buildCmd += ' --mac';
  } else if (platform === 'linux') {
    buildCmd += ' --linux';
  }

  execSync(buildCmd, { cwd: projectRoot, stdio: 'inherit' });

  console.log('\n✅ Build complete!');
  console.log('\n📁 Output location: ./dist');
  console.log('   - Windows: dist/PFEStudy-1.0.0-Setup.exe');
  console.log('   - Mac: dist/PFEStudy-1.0.0.dmg');
  console.log('   - Linux: dist/PFEStudy-1.0.0.AppImage\n');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
