#!/usr/bin/env node

/**
 * Configuration Verification Script
 *
 * This script verifies that the Leads Admin Frontend is properly configured
 * and ready for deployment.
 *
 * Usage:
 *   node verify-config.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

function checkMark(passed) {
  return passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
}

/**
 * Check if .env.production is configured
 */
function checkEnvFile() {
  printHeader('Checking Environment Configuration');

  const envPath = path.join(__dirname, '.env.production');

  if (!fs.existsSync(envPath)) {
    log('✗ .env.production not found!', 'red');
    return false;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  let apiUrlConfigured = false;
  let clientIdConfigured = false;
  let issues = [];

  lines.forEach((line, index) => {
    if (line.startsWith('NEXT_PUBLIC_API_URL=')) {
      const value = line.split('=')[1];
      if (value && value !== 'YOUR_API_URL_HERE') {
        apiUrlConfigured = true;
        log(`${checkMark(true)} API URL configured: ${value}`, 'green');
      } else {
        issues.push('API URL not configured');
      }
    }

    if (line.startsWith('NEXT_PUBLIC_GOOGLE_CLIENT_ID=')) {
      const value = line.split('=')[1];
      if (value && value !== 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        if (value.endsWith('.apps.googleusercontent.com')) {
          clientIdConfigured = true;
          const masked = value.substring(0, 20) + '...' + value.substring(value.length - 30);
          log(`${checkMark(true)} Google Client ID configured: ${masked}`, 'green');
        } else {
          issues.push('Google Client ID format appears invalid (should end with .apps.googleusercontent.com)');
        }
      } else {
        issues.push('Google Client ID not configured');
      }
    }
  });

  if (issues.length > 0) {
    log('\nIssues found:', 'yellow');
    issues.forEach(issue => log(`  • ${issue}`, 'red'));
    return false;
  }

  return apiUrlConfigured && clientIdConfigured;
}

/**
 * Check if package.json is valid
 */
function checkPackageJson() {
  printHeader('Checking Package Configuration');

  const packagePath = path.join(__dirname, 'package.json');

  if (!fs.existsSync(packagePath)) {
    log('✗ package.json not found!', 'red');
    return false;
  }

  try {
    const content = fs.readFileSync(packagePath, 'utf8');
    const pkg = JSON.parse(content);

    log(`${checkMark(true)} Package name: ${pkg.name}`, 'green');
    log(`${checkMark(true)} Version: ${pkg.version}`, 'green');

    const requiredScripts = ['dev', 'build', 'start'];
    const missingScripts = requiredScripts.filter(s => !pkg.scripts[s]);

    if (missingScripts.length > 0) {
      log(`✗ Missing required scripts: ${missingScripts.join(', ')}`, 'red');
      return false;
    }

    log(`${checkMark(true)} All required scripts present`, 'green');
    return true;

  } catch (error) {
    log(`✗ Error parsing package.json: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Check backend API connectivity
 */
function checkBackendAPI() {
  return new Promise((resolve) => {
    printHeader('Checking Backend API Connectivity');

    const apiUrl = 'https://leads-system-v2.onrender.com/docs';

    log('Testing connection to backend API...', 'cyan');

    https.get(apiUrl, (res) => {
      if (res.statusCode === 200) {
        log(`${checkMark(true)} Backend API is accessible (Status: ${res.statusCode})`, 'green');
        log(`${checkMark(true)} API Documentation available at: ${apiUrl}`, 'green');
        resolve(true);
      } else {
        log(`${checkMark(false)} Backend API returned status: ${res.statusCode}`, 'yellow');
        resolve(false);
      }
    }).on('error', (error) => {
      log(`${checkMark(false)} Cannot reach backend API: ${error.message}`, 'red');
      log('Note: The backend may be spinning down (Render free tier)', 'yellow');
      resolve(false);
    });
  });
}

/**
 * Check Git status
 */
function checkGitStatus() {
  printHeader('Checking Git Repository Status');

  const gitPath = path.join(__dirname, '.git');

  if (!fs.existsSync(gitPath)) {
    log('✗ Not a git repository!', 'red');
    return false;
  }

  log(`${checkMark(true)} Git repository initialized`, 'green');

  try {
    const { execSync } = require('child_process');

    // Check if there are uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.trim().length > 0) {
      log(`${checkMark(false)} Uncommitted changes detected:`, 'yellow');
      console.log(status);
      log('Remember to commit and push before deployment!', 'yellow');
    } else {
      log(`${checkMark(true)} No uncommitted changes`, 'green');
    }

    // Check current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    log(`${checkMark(true)} Current branch: ${branch}`, 'green');

    return true;

  } catch (error) {
    log(`${checkMark(false)} Error checking git status: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Check file structure
 */
function checkFileStructure() {
  printHeader('Checking Project Structure');

  const requiredPaths = [
    { path: 'app', type: 'directory' },
    { path: 'app/dashboard', type: 'directory' },
    { path: 'app/login', type: 'directory' },
    { path: 'components', type: 'directory' },
    { path: 'lib', type: 'directory' },
    { path: 'public', type: 'directory' },
    { path: 'next.config.ts', type: 'file' },
    { path: 'tailwind.config.ts', type: 'file' },
    { path: 'tsconfig.json', type: 'file' },
    { path: 'OAUTH_SETUP.md', type: 'file' },
    { path: 'README.md', type: 'file' }
  ];

  let allPresent = true;

  requiredPaths.forEach(({ path: itemPath, type }) => {
    const fullPath = path.join(__dirname, itemPath);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      const stats = fs.statSync(fullPath);
      const isCorrectType = type === 'directory' ? stats.isDirectory() : stats.isFile();

      if (isCorrectType) {
        log(`${checkMark(true)} ${itemPath}`, 'green');
      } else {
        log(`${checkMark(false)} ${itemPath} (wrong type)`, 'red');
        allPresent = false;
      }
    } else {
      log(`${checkMark(false)} ${itemPath} (missing)`, 'red');
      allPresent = false;
    }
  });

  return allPresent;
}

/**
 * Print summary and next steps
 */
function printSummary(results) {
  printHeader('Verification Summary');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  if (passed === total) {
    log(`All checks passed! (${passed}/${total})`, 'green');
    log('\n✓ Your application is ready for deployment!', 'bright');

    printHeader('Next Steps');
    log('1. If you haven\'t configured OAuth yet:', 'cyan');
    log('   • Run: node configure-oauth.js', 'yellow');
    log('   • Or follow OAUTH_SETUP.md manually', 'yellow');
    log('\n2. Commit and push any remaining changes:', 'cyan');
    log('   • git add .', 'yellow');
    log('   • git commit -m "Your message"', 'yellow');
    log('   • git push origin main', 'yellow');
    log('\n3. Monitor deployment:', 'cyan');
    log('   • https://dashboard.render.com/static/srv-d42j0gk9c44c7387gh40', 'yellow');
    log('\n4. Test authentication:', 'cyan');
    log('   • https://leads-admin-frontend-new.onrender.com/login', 'yellow');
    log('\n5. Create first admin user:', 'cyan');
    log('   • Follow First_Admin_User_Setup_Guide.html', 'yellow');

  } else {
    log(`${passed}/${total} checks passed`, 'yellow');
    log('\nPlease resolve the issues above before deploying.', 'red');

    if (!results.envFile) {
      log('\nTo configure OAuth:', 'cyan');
      log('  • Run: node configure-oauth.js', 'yellow');
      log('  • Or see: OAUTH_SETUP.md', 'yellow');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  printHeader('Leads Admin Frontend - Configuration Verification');
  log('Checking configuration and readiness for deployment...', 'cyan');

  const results = {
    fileStructure: checkFileStructure(),
    packageJson: checkPackageJson(),
    envFile: checkEnvFile(),
    gitStatus: checkGitStatus(),
    backendAPI: await checkBackendAPI()
  };

  printSummary(results);
}

// Run verification
main().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});
