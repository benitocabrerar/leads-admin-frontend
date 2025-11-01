# Google OAuth Configuration for Render Deployment

## Issue
The frontend is successfully deployed at `https://leads-admin-frontend-ssr.onrender.com`, but users cannot log in. This is because Google OAuth requires the new domain to be registered in Google Cloud Console.

## Current Configuration
- **Google Client ID**: `957135134177-jnvd7m5il2b4uqkpv4nmenp0h9adf3vm.apps.googleusercontent.com`
- **New Domain**: `https://leads-admin-frontend-ssr.onrender.com`
- **Backend API**: `https://leads-system-v2.onrender.com/api/v1`

## Why This Is Needed
Google OAuth restricts where authentication callbacks can be sent for security. The new Render domain must be explicitly allowed in your Google Cloud Console settings.

---

## Step-by-Step Fix Instructions

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with the Google account that owns the OAuth credentials
3. Select your project from the project dropdown at the top

### Step 2: Navigate to OAuth Credentials
1. Click the **hamburger menu** (☰) in the top-left corner
2. Go to **APIs & Services** → **Credentials**
3. Find the OAuth 2.0 Client ID with ID: `957135134177-jnvd7m5il2b4uqkpv4nmenp0h9adf3vm`
4. Click on the credential name to edit it

### Step 3: Add Authorized JavaScript Origins
In the **Authorized JavaScript origins** section, add:
```
https://leads-admin-frontend-ssr.onrender.com
```

**Important Notes:**
- Do NOT include a trailing slash
- Use `https://` (not `http://`)
- The domain must match exactly

### Step 4: Add Authorized Redirect URIs
In the **Authorized redirect URIs** section, add all of these:
```
https://leads-admin-frontend-ssr.onrender.com
https://leads-admin-frontend-ssr.onrender.com/
https://leads-admin-frontend-ssr.onrender.com/login
https://leads-admin-frontend-ssr.onrender.com/login/
```

**Why multiple URIs?**
- Google's `@react-oauth/google` library may use different callback paths
- Different browsers may include/exclude trailing slashes
- This ensures compatibility across all scenarios

### Step 5: Keep Existing URIs
**IMPORTANT**: Do NOT remove the existing URIs for `localhost`. You need both for development and production:

**Keep these for local development:**
```
http://localhost:3000
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/login/
```

**Keep these if you had previous deployments:**
```
https://leads-admin-frontend.onrender.com
https://leads-admin-frontend.onrender.com/
https://leads-admin-frontend.onrender.com/login
https://leads-admin-frontend.onrender.com/login/
```

### Step 6: Save Changes
1. Click **SAVE** at the bottom of the page
2. Wait for the confirmation message: "Client ID updated"

### Step 7: Wait for Propagation (Usually Instant)
- Changes typically take effect immediately
- In rare cases, allow up to 5-10 minutes for propagation

### Step 8: Test the Login
1. Go to `https://leads-admin-frontend-ssr.onrender.com`
2. Click the **"Sign in with Google"** button
3. Complete the Google authentication flow
4. You should be redirected to `/dashboard` after successful login

---

## Complete List of Authorized Origins & Redirect URIs

After completing the setup, your Google OAuth credential should have:

### Authorized JavaScript Origins:
```
http://localhost:3000
https://leads-admin-frontend-ssr.onrender.com
```

### Authorized Redirect URIs:
```
http://localhost:3000
http://localhost:3000/
http://localhost:3000/login
http://localhost:3000/login/
https://leads-admin-frontend-ssr.onrender.com
https://leads-admin-frontend-ssr.onrender.com/
https://leads-admin-frontend-ssr.onrender.com/login
https://leads-admin-frontend-ssr.onrender.com/login/
```

---

## Troubleshooting

### Issue: "Access blocked: This app's request is invalid"
**Cause**: The domain is not in the Authorized JavaScript origins
**Fix**: Double-check that you added `https://leads-admin-frontend-ssr.onrender.com` exactly as shown

### Issue: "Redirect URI mismatch"
**Cause**: The redirect URI is not in the allowed list
**Fix**: Make sure all four redirect URI variations are added (with/without trailing slash, with/without `/login`)

### Issue: Still getting errors after adding domains
**Possible causes**:
1. Wrong Google account - Make sure you're editing the correct OAuth credential
2. Typo in domain - Domain must match exactly (no extra spaces, correct protocol)
3. Propagation delay - Wait 5-10 minutes and try again
4. Browser cache - Try in incognito/private mode or clear browser cache

### Issue: "This app is blocked"
**Cause**: OAuth consent screen not configured or app in testing mode
**Fix**:
1. Go to **APIs & Services** → **OAuth consent screen**
2. Add your email to **Test users** (if app is in testing mode)
3. Or publish the app if ready for production

---

## Verification Checklist

After configuration, verify:
- [ ] Authorized JavaScript origins includes new domain
- [ ] All 4 redirect URI variations are added
- [ ] Localhost URIs are still present (for development)
- [ ] Changes are saved successfully
- [ ] Login works at `https://leads-admin-frontend-ssr.onrender.com`

---

## Technical Details

### Authentication Flow:
1. User clicks Google Login button (`app/login/page.tsx:69-78`)
2. Google OAuth popup appears
3. User authorizes and Google returns credential token
4. Frontend calls `authApi.googleLogin(googleToken)` (`lib/store/auth.ts:37-68`)
5. Backend validates token at `/auth/google` endpoint
6. Backend returns JWT access_token and refresh_token
7. Tokens stored in localStorage (`lib/store/auth.ts:46-48`)
8. User redirected to `/dashboard` (`app/login/page.tsx:17-21`)

### Environment Variables Used:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `NEXT_PUBLIC_API_URL`: Backend API base URL

### Key Files:
- `components/providers.tsx`: GoogleOAuthProvider setup
- `app/login/page.tsx`: Login UI with GoogleLogin button
- `lib/store/auth.ts`: Authentication state management
- `lib/api.ts`: API client with token interceptors

---

## Need Help?

If you continue experiencing issues after following these steps:

1. **Check browser console** (F12 → Console tab) for error messages
2. **Check backend logs** on Render dashboard for authentication errors
3. **Verify environment variables** are correctly set in Render
4. **Test with incognito/private browser** to rule out caching issues

---

**Last Updated**: November 1, 2025
**Deployment**: `https://leads-admin-frontend-ssr.onrender.com`
**Service ID**: `srv-d42rb3ripnbc73c3qjh0`
