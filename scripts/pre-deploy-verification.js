#!/usr/bin/env node

// Pre-deployment verification script for VecinoSimple
// Usage: node scripts/pre-deploy-verification.js [admin-web|resident-app|staff-app|all]

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkApp(appName) {
  log(colors.blue, `🔍 Verifying ${appName}...`);

  const appDir = path.join('apps', appName);

  // Check if app directory exists
  if (!fs.existsSync(appDir)) {
    log(colors.red, `❌ App directory ${appDir} not found`);
    return false;
  }

  // Check if package.json exists
  if (!fs.existsSync(path.join(appDir, 'package.json'))) {
    log(colors.red, `❌ package.json not found in ${appDir}`);
    return false;
  }

  // Check if vercel.json exists
  if (!fs.existsSync(path.join(appDir, 'vercel.json'))) {
    log(colors.red, `❌ vercel.json not found in ${appDir}`);
    return false;
  }

  // Check if src/app directory exists
  if (!fs.existsSync(path.join(appDir, 'src', 'app'))) {
    log(colors.red, `❌ src/app directory not found in ${appDir}`);
    return false;
  }

  // Check for required error pages
  const requiredPages = ['error.tsx', 'not-found.tsx'];
  for (const page of requiredPages) {
    if (!fs.existsSync(path.join(appDir, 'src', 'app', page))) {
      log(colors.yellow, `⚠️  ${page} not found in ${appDir}/src/app`);
    }
  }

  // App-specific checks
  if (appName === 'resident-app' || appName === 'staff-app') {
    // Check for offline page
    if (!fs.existsSync(path.join(appDir, 'src', 'app', 'offline', 'page.tsx'))) {
      log(colors.yellow, `⚠️  offline/page.tsx not found in ${appDir}/src/app`);
    }

    // Check for maintenance page
    if (!fs.existsSync(path.join(appDir, 'src', 'app', 'mantenimiento', 'page.tsx'))) {
      log(colors.yellow, `⚠️  mantenimiento/page.tsx not found in ${appDir}/src/app`);
    }

    // Check for PWA files
    if (!fs.existsSync(path.join(appDir, 'public', 'manifest.json'))) {
      log(colors.yellow, `⚠️  manifest.json not found in ${appDir}/public`);
    }
  }

  // Try to build the app
  log(colors.blue, `🔨 Testing build for ${appName}...`);
  try {
    execSync('pnpm build', {
      cwd: appDir,
      stdio: 'pipe'
    });
    log(colors.green, `✅ Build successful for ${appName}`);
  } catch (error) {
    log(colors.red, `❌ Build failed for ${appName}`);
    console.log(error.stdout?.toString() || error.message);
    return false;
  }

  log(colors.green, `✅ ${appName} verification passed`);
  return true;
}

function main() {
  // Change to the project root directory (parent of scripts)
  const scriptDir = path.dirname(__filename);
  const projectRoot = path.resolve(scriptDir, '..');
  process.chdir(projectRoot);

  const targetApp = process.argv[2];

  if (!targetApp || !['admin-web', 'resident-app', 'staff-app', 'all'].includes(targetApp)) {
    console.log('Usage: node scripts/pre-deploy-verification.js [admin-web|resident-app|staff-app|all]');
    process.exit(1);
  }

  log(colors.blue, '🚀 Starting pre-deployment verification...\n');

  let allPassed = true;
  const apps = targetApp === 'all' ? ['admin-web', 'resident-app', 'staff-app'] : [targetApp];

  if (targetApp === 'all') {
    log(colors.yellow, '🔍 Verifying all apps...');
  }

  for (const app of apps) {
    const passed = checkApp(app);
    allPassed = allPassed && passed;

    if (targetApp === 'all' && app !== apps[apps.length - 1]) {
      console.log('');
    }
  }

  console.log('');

  if (allPassed) {
    log(colors.green, '🎉 Pre-deployment verification completed successfully!');
    console.log('');
    log(colors.yellow, '📋 Ready for deployment. You can now run:');
    console.log(`  .\\scripts\\deploy.ps1 ${targetApp}`);
  } else {
    log(colors.red, '❌ Pre-deployment verification failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();