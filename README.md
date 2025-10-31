# Leads System Admin Frontend

Modern admin dashboard for the Leads System V2 with role-based access control and Google OAuth authentication.

## Features

- **Google OAuth Authentication**: Secure login with Google accounts
- **Role-Based Access Control (RBAC)**: Three user roles with different permission levels
  - **User**: View and manage leads
  - **Manager**: User permissions + user management
  - **Admin**: Full access including user approvals
- **Lead Management**: Complete CRUD operations for leads
- **User Management**: Approve, edit, and manage system users
- **Dashboard Analytics**: Real-time statistics and metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Google OAuth 2.0
- **Deployment**: Render Static Site

## Live URLs

- **Frontend**: [https://leads-admin-frontend-new.onrender.com](https://leads-admin-frontend-new.onrender.com)
- **Backend API**: [https://leads-system-v2.onrender.com](https://leads-system-v2.onrender.com)
- **API Docs**: [https://leads-system-v2.onrender.com/docs](https://leads-system-v2.onrender.com/docs)

## Setup

### 1. Google OAuth Configuration

Follow the detailed guide in [OAUTH_SETUP.md](./OAUTH_SETUP.md) to:
1. Create a Google Cloud Project
2. Enable OAuth API
3. Configure OAuth consent screen
4. Create OAuth credentials
5. Update environment variables

### 2. Helper Scripts

The project includes automation scripts to simplify configuration and deployment:

#### Configure OAuth (Recommended)

Automatically configure your Google OAuth Client ID:

```bash
# Interactive mode (prompts for Client ID)
node configure-oauth.js

# Direct mode (provide Client ID as argument)
node configure-oauth.js your-client-id.apps.googleusercontent.com
```

This script will:
- Validate your Client ID format
- Update `.env.production`
- Show a preview of changes
- Commit and push to GitHub
- Trigger automatic deployment

#### Verify Configuration

Check that everything is properly configured before deployment:

```bash
node verify-config.js
```

This script checks:
- Environment variables
- File structure
- Git repository status
- Backend API connectivity
- Package configuration

### 3. Environment Variables

Update `.env.production` with your Google OAuth Client ID:

```env
NEXT_PUBLIC_API_URL=https://leads-system-v2.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Note:** You can use the `configure-oauth.js` script to automate this step.

### 4. Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm start
```

The app will be available at `http://localhost:3000`

## Project Structure

```
leads-admin-frontend/
├── app/                        # Next.js app directory
│   ├── dashboard/             # Protected dashboard pages
│   │   ├── page.tsx          # Dashboard home
│   │   ├── leads/            # Lead management
│   │   ├── users/            # User management
│   │   └── approvals/        # Pending approvals (admin only)
│   ├── login/                # Login page
│   └── layout.tsx            # Root layout
├── components/               # Reusable components
│   └── auth/                # Authentication components
│       └── route-guard.tsx  # Protected route wrapper
├── lib/                     # Utilities and configurations
│   ├── api/                 # API client and endpoints
│   ├── store/              # Zustand state management
│   └── types.ts            # TypeScript type definitions
├── public/                  # Static assets
└── OAUTH_SETUP.md          # OAuth configuration guide
```

## User Roles & Permissions

### User
- View dashboard statistics
- View, create, update, and delete leads
- Update own profile

### Manager
- All User permissions
- View and manage all users
- Assign roles (except Admin)
- Enable/disable user management permissions

### Admin
- All Manager permissions
- Approve new user registrations
- Assign Admin role
- Access pending approvals page

## Authentication Flow

1. User clicks "Sign in with Google"
2. Google OAuth consent screen appears
3. User grants permissions
4. Backend validates Google token
5. If new user:
   - Account created with `is_approved: false`
   - User sees "Pending Approval" message
   - Admin must approve before access
6. If approved user:
   - Session created with JWT token
   - User redirected to dashboard

## API Integration

The frontend integrates with the Leads System V2 backend API:

### Authentication Endpoints
- `POST /api/v1/auth/google` - Google OAuth login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Lead Endpoints
- `GET /api/v1/leads` - List leads (paginated)
- `POST /api/v1/leads` - Create lead
- `GET /api/v1/leads/{id}` - Get lead details
- `PUT /api/v1/leads/{id}` - Update lead
- `DELETE /api/v1/leads/{id}` - Delete lead

### User Management Endpoints (Manager/Admin)
- `GET /api/v1/users` - List users (paginated)
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user
- `GET /api/v1/users/pending` - List pending approvals (Admin only)

## Deployment

The application is deployed on Render as a static site with automatic deployments from the `main` branch.

### Deployment Process
1. Push changes to GitHub main branch
2. Render automatically detects changes
3. Runs `npm install && npm run build`
4. Serves static files from `out` directory

### Environment Configuration
Environment variables are baked into the build at deployment time:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth Client ID

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Use functional components with hooks
- Follow Next.js 16 conventions (App Router)
- Tailwind CSS for styling
- Mobile-first responsive design

### State Management
- **Authentication**: Zustand store (`lib/store/auth.ts`)
- **Server State**: TanStack Query for API data
- **Form State**: React state hooks

### Type Safety
All API responses and entities are fully typed in `lib/types.ts`:
- `User` - User entity
- `Lead` - Lead entity
- `LeadStatus` - Lead status enum
- API request/response types

## Troubleshooting

### OAuth Issues
- Verify redirect URIs match exactly in Google Cloud Console
- Check Client ID is correctly set in `.env.production`
- Ensure HTTPS is used (required by Google)
- See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed troubleshooting

### Build Errors
- Run `npm run build` locally to catch TypeScript errors
- Check that all types match backend models
- Verify all imports are correct

### API Connection Issues
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running and accessible
- Review browser console for CORS errors
- Check network tab for failed requests

## Contributing

1. Create a feature branch
2. Make changes
3. Test locally with `npm run build`
4. Commit with descriptive message
5. Push and create pull request

## License

Copyright © 2025 Leads System V2. All rights reserved.

## Support

For issues or questions:
1. Check [OAUTH_SETUP.md](./OAUTH_SETUP.md) for OAuth issues
2. Review browser console for errors
3. Check backend API documentation at `/docs`
4. Contact system administrator
