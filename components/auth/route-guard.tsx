/**
 * Route Guard Component
 * Protects routes that require authentication
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requireApproval?: boolean;
  requireAdmin?: boolean;
  requireManager?: boolean;
}

export function RouteGuard({
  children,
  requireApproval = false,
  requireAdmin = false,
  requireManager = false,
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Requires approval but not approved
      if (requireApproval && !user.is_approved) {
        router.push('/pending-approval');
        return;
      }

      // Requires admin but not admin
      if (requireAdmin && !user.is_admin) {
        router.push('/unauthorized');
        return;
      }

      // Requires manager but not manager or admin
      if (requireManager && !user.can_manage) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, requireApproval, requireAdmin, requireManager, router]);

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authorization
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (requireApproval && !user.is_approved) {
    return null; // Will redirect
  }

  if (requireAdmin && !user.is_admin) {
    return null; // Will redirect
  }

  if (requireManager && !user.can_manage) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
