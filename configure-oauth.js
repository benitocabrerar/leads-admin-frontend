#!/usr/bin/env node

/**
 * OAuth Configuration Helper Script
 *
 * This script automates the process of configuring Google OAuth Client ID
 * for the Leads Admin Frontend application.
 *
 * Usage:
 *   node configure-oauth.js YOUR_CLIENT_ID_HERE
 *
 * Or run without arguments for interactive mode:
 *   node configure-oauth.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const ENV_FILE = '.env.production';
const PLACEHOLDER = 'YOUR_GOOGLE_CLIENT_ID_HERE';

/**
 * Print colored message to console
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

/**
 * Validate Google Client ID format
 */
function isValidClientId(clientId) {
  // Google Client IDs end with .apps.googleusercontent.com
  return clientId &&
         typeof clientId === 'string' &&
         clientId.trim().length > 0 &&
         clientId.endsWith('.apps.googleusercontent.com');
}

/**
 * Read current .env.production file
 */
function readEnvFile() {
  try {
    const envPath = path.join(__dirname, ENV_FILE);
    return fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    log(`Error reading ${ENV_FILE}: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Update .env.production with new Client ID
 */
function updateEnvFile(clientId) {
  const content = readEnvFile();

  if (!content.includes(PLACEHOLDER)) {
    log('Warning: Placeholder not found. Checking if already configured...', 'yellow');

    if (content.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID=') &&
        !content.includes(PLACEHOLDER)) {
      log('Client ID appears to already be configured.', 'yellow');
      log('Current configuration:', 'cyan');
      console.log(content);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('\nDo you want to replace it? (yes/no): ', (answer) => {
        rl.close();
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          const updated = content.replace(
            /NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*/,
            `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId}`
          );
          writeAndCommit(updated, clientId);
        } else {
          log('Configuration cancelled.', 'yellow');
          process.exit(0);
        }
      });
      return;
    }
  }

  const updated = content.replace(PLACEHOLDER, clientId);
  writeAndCommit(updated, clientId);
}

/**
 * Write updated content and commit changes
 */
function writeAndCommit(content, clientId) {
  const envPath = path.join(__dirname, ENV_FILE);

  printHeader('Preview of Changes');
  log('New .env.production content:', 'cyan');
  console.log(content);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nDo you want to save and deploy these changes? (yes/no): ', (answer) => {
    rl.close();

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      // Write the file
      fs.writeFileSync(envPath, content, 'utf8');
      log(`✓ Updated ${ENV_FILE}`, 'green');

      // Git operations
      try {
        printHeader('Committing Changes to Git');

        execSync('git add .env.production', { stdio: 'inherit' });
        log('✓ Staged .env.production', 'green');

        execSync('git commit -m "Configure Google OAuth Client ID"', { stdio: 'inherit' });
        log('✓ Created commit', 'green');

        log('\nPushing to GitHub...', 'yellow');
        execSync('git push origin main', { stdio: 'inherit' });
        log('✓ Pushed to GitHub', 'green');

        printHeader('Deployment Status');
        log('Changes have been pushed to GitHub!', 'green');
        log('Render will automatically detect the changes and redeploy.', 'cyan');
        log('\nNext steps:', 'bright');
        log('1. Check deployment status at: https://dashboard.render.com/static/srv-d42j0gk9c44c7387gh40', 'yellow');
        log('2. Wait for deployment to complete (usually 2-5 minutes)', 'yellow');
        log('3. Test authentication at: https://leads-admin-frontend-new.onrender.com/login', 'yellow');
        log('4. Follow First_Admin_User_Setup_Guide.html to create your admin user', 'yellow');

      } catch (error) {
        log(`\nError during git operations: ${error.message}`, 'red');
        log('\nYou may need to commit and push manually:', 'yellow');
        log('  git add .env.production', 'cyan');
        log('  git commit -m "Configure Google OAuth Client ID"', 'cyan');
        log('  git push origin main', 'cyan');
      }
    } else {
      log('Configuration cancelled. No changes were made.', 'yellow');
    }
  });
}

/**
 * Interactive mode - prompt for Client ID
 */
function interactiveMode() {
  printHeader('Google OAuth Configuration Helper');

  log('This script will help you configure the Google OAuth Client ID', 'cyan');
  log('for the Leads Admin Frontend application.\n', 'cyan');

  log('Before proceeding, make sure you have:', 'yellow');
  log('1. Created a Google Cloud Project', 'yellow');
  log('2. Enabled the Google OAuth API', 'yellow');
  log('3. Configured the OAuth consent screen', 'yellow');
  log('4. Created OAuth 2.0 credentials', 'yellow');
  log('5. Copied your Client ID\n', 'yellow');

  log('Need help? See OAUTH_SETUP.md for detailed instructions.\n', 'cyan');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter your Google Client ID: ', (clientId) => {
    rl.close();

    const trimmedId = clientId.trim();

    if (!isValidClientId(trimmedId)) {
      log('\nError: Invalid Client ID format!', 'red');
      log('Expected format: xxxxxxx.apps.googleusercontent.com', 'yellow');
      log('Example: 123456789-abc123def456.apps.googleusercontent.com', 'cyan');
      process.exit(1);
    }

    log(`\n✓ Valid Client ID format detected`, 'green');
    updateEnvFile(trimmedId);
  });
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive mode
    interactiveMode();
  } else if (args.length === 1) {
    // Direct mode with Client ID as argument
    const clientId = args[0].trim();

    if (!isValidClientId(clientId)) {
      log('Error: Invalid Client ID format!', 'red');
      log('Expected format: xxxxxxx.apps.googleusercontent.com', 'yellow');
      log('Example: 123456789-abc123def456.apps.googleusercontent.com', 'cyan');
      process.exit(1);
    }

    printHeader('Google OAuth Configuration Helper');
    log(`Client ID: ${clientId}`, 'cyan');
    updateEnvFile(clientId);
  } else {
    log('Usage:', 'yellow');
    log('  Interactive mode:  node configure-oauth.js', 'cyan');
    log('  Direct mode:       node configure-oauth.js YOUR_CLIENT_ID', 'cyan');
    process.exit(1);
  }
}

// Run the script
main();
