# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for the Leads System Admin Frontend.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "Leads System Admin")
5. Click "Create"

## Step 2: Enable Google OAuth API

1. In your newly created project, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type and click "Create"
3. Fill in the required fields:
   - **App name**: Leads System Admin
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. On the "Scopes" page, click "Save and Continue" (we'll use the default scopes)
6. On the "Test users" page, add any email addresses you want to allow during testing
7. Click "Save and Continue"
8. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "Leads Admin Frontend")
5. Under "Authorized JavaScript origins", add:
   ```
   https://leads-admin-frontend-new.onrender.com
   ```
6. Under "Authorized redirect URIs", add:
   ```
   https://leads-admin-frontend-new.onrender.com/login
   ```
7. Click "Create"
8. **IMPORTANT**: Copy the "Client ID" that appears in the popup. You'll need this in the next step.

## Step 5: Update Environment Configuration

You have two options for updating the Client ID:

### Option A: Automated Script (Recommended)

Run the automated configuration script:

```bash
node configure-oauth.js
```

The script will:
- Prompt you to enter your Google Client ID
- Validate the Client ID format
- Update `.env.production` automatically
- Show you a preview of the changes
- Commit and push the changes to GitHub
- Provide next steps

**Or use direct mode:**

```bash
node configure-oauth.js your-client-id.apps.googleusercontent.com
```

### Option B: Manual Configuration

1. Open the `.env.production` file in the repository
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID:
   ```env
   NEXT_PUBLIC_API_URL=https://leads-system-v2.onrender.com
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
   ```
3. Save the file

## Step 6: Verify and Deploy

### Verify Configuration (Optional but Recommended)

Before deploying, verify your configuration:

```bash
node verify-config.js
```

This will check:
- Environment variables are configured correctly
- All required files are present
- Git repository status
- Backend API connectivity
- Package configuration

### Deploy Changes

If you used the automated script in Step 5, deployment happens automatically.

If you configured manually, deploy with:

```bash
git add .env.production
git commit -m "Configure Google OAuth Client ID"
git push origin main
```

The Render deployment will automatically trigger and rebuild the application with the new OAuth configuration.

## Step 7: Test Authentication

1. Wait for the deployment to complete (check [Render Dashboard](https://dashboard.render.com/static/srv-d42j0gk9c44c7387gh40))
2. Visit [https://leads-admin-frontend-new.onrender.com/login](https://leads-admin-frontend-new.onrender.com/login)
3. Click "Sign in with Google"
4. Select your Google account
5. Grant the requested permissions

## Expected Behavior

### First-Time Users
- After successful Google authentication, new users will see a "Pending Approval" message
- An administrator must approve the user in the backend before they can access the system
- To approve a user, an admin must:
  1. Access the database or use the API
  2. Update the user's `is_approved` field to `true`
  3. Optionally set their `role` (user/manager/admin) and `can_manage` flag

### Approved Users
- After approval, users can log in and access the dashboard
- Access levels are determined by their role:
  - **User**: Can view and manage leads
  - **Manager**: Can view and manage leads + manage users
  - **Admin**: Full access including pending approvals

## Troubleshooting

### "Redirect URI mismatch" Error
- Ensure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://leads-admin-frontend-new.onrender.com/login
  ```
- No trailing slash
- Must be HTTPS
- Must match the exact domain

### "This app isn't verified" Warning
- This is normal for apps in development/testing
- Click "Advanced" and then "Go to Leads System Admin (unsafe)" to proceed
- To remove this warning, submit your app for Google verification (optional)

### OAuth Not Working After Deployment
- Verify the Client ID was correctly set in `.env.production`
- Check that the deployment completed successfully
- Clear your browser cache and try again
- Check browser console for any errors

## Security Notes

- Never commit the `.env.production` file if it contains sensitive information (though Client IDs are generally considered public)
- The OAuth Client Secret is NOT needed for this implementation (we use the backend API for token validation)
- All authentication tokens are stored securely in httpOnly cookies on the backend

## Next Steps

After OAuth is configured:
1. Create an admin user in the database
2. Log in with Google
3. Approve pending users
4. Start managing leads

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all URLs match exactly
3. Ensure the Google Cloud project has the OAuth API enabled
4. Check that test users are added if the app is in "Testing" mode
