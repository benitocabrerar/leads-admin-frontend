/**
 * Pending Approvals Page
 * List and approve users awaiting approval
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { User, UserRole } from '@/lib/types';
import { RouteGuard } from '@/components/auth/route-guard';

export default function ApprovalsPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pending-users', page],
    queryFn: () => usersApi.listUsers({ page, page_size: 20 }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      usersApi.approveUser(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => usersApi.rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
  });

  const handleApprove = async (userId: number, role: UserRole) => {
    if (confirm(`Approve this user with role ${role}?`)) {
      await approveMutation.mutateAsync({ userId, role });
    }
  };

  const handleReject = async (userId: number) => {
    if (confirm('Reject this user? They will not be able to access the system.')) {
      await rejectMutation.mutateAsync(userId);
    }
  };

  // Filter to show only pending approval users
  const pendingUsers = data?.items.filter((user: User) => !user.is_approved) || [];

  if (isLoading) {
    return (
      <RouteGuard requireAdmin>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard requireAdmin>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load pending approvals. Please try again.</p>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAdmin>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and approve users awaiting access to the system
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              {pendingUsers.length} Pending
            </span>
          </div>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-1 text-sm text-gray-500">
              All users have been reviewed. New registrations will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.map((user: User) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avatar_url}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Pending Approval
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <div className="relative group">
                            <button className="text-green-600 hover:text-green-900 font-medium">
                              Approve as ▼
                            </button>
                            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => handleApprove(user.id, UserRole.VIEWER)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <span className="font-semibold">Viewer</span>
                                  <p className="text-xs text-gray-500">Read-only access</p>
                                </button>
                                <button
                                  onClick={() => handleApprove(user.id, UserRole.MANAGER)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <span className="font-semibold">Manager</span>
                                  <p className="text-xs text-gray-500">Can view and edit</p>
                                </button>
                                <button
                                  onClick={() => handleApprove(user.id, UserRole.ADMIN)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <span className="font-semibold">Admin</span>
                                  <p className="text-xs text-gray-500">Full access</p>
                                </button>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleReject(user.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
