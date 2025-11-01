/**
 * Leads Management Page
 * List, filter, search, and manage leads
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Lead, LeadStatus } from '@/lib/types';
import { RouteGuard } from '@/components/auth/route-guard';

// Lead creation form data type
interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  source: string;
  status: LeadStatus;
  notes: string;
  estimated_value: string;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  QUALIFIED: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-indigo-100 text-indigo-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    created: number;
    total_rows: number;
    errors?: Array<{ row: number; error: string }>;
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    source: '',
    status: LeadStatus.NEW,
    notes: '',
    estimated_value: '',
  });
  const [editFormData, setEditFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    source: '',
    status: LeadStatus.NEW,
    notes: '',
    estimated_value: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads', page, search, statusFilter, sourceFilter],
    queryFn: () =>
      leadsApi.listLeads({
        page,
        page_size: 20,
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        source: sourceFilter || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (leadId: number) => leadsApi.deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        source: '',
        status: LeadStatus.NEW,
        notes: '',
        estimated_value: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ leadId, data }: { leadId: number; data: Partial<Lead> }) =>
      leadsApi.updateLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditModalOpen(false);
      setSelectedLead(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => leadsApi.importLeads(file),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setImportResult(result);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      setImportResult({
        success: false,
        created: 0,
        total_rows: 0,
        message: error.response?.data?.detail || 'Failed to import leads',
      });
    },
  });

  const handleDelete = async (leadId: number, leadName: string) => {
    if (confirm(`Delete lead "${leadName}"? This action cannot be undone.`)) {
      await deleteMutation.mutateAsync(leadId);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare lead data
    const leadData: Partial<Lead> = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      zip_code: formData.zip_code.trim() || undefined,
      source: formData.source.trim(),
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
    };

    await createMutation.mutateAsync(leadData);
  };

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setEditFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      zip_code: lead.zip_code || '',
      source: lead.source || '',
      status: lead.status,
      notes: lead.notes || '',
      estimated_value: lead.estimated_value?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    // Prepare lead data
    const leadData: Partial<Lead> = {
      name: editFormData.name.trim(),
      email: editFormData.email.trim() || undefined,
      phone: editFormData.phone.trim() || undefined,
      address: editFormData.address.trim() || undefined,
      city: editFormData.city.trim() || undefined,
      state: editFormData.state.trim() || undefined,
      zip_code: editFormData.zip_code.trim() || undefined,
      source: editFormData.source.trim(),
      status: editFormData.status,
      notes: editFormData.notes.trim() || undefined,
      estimated_value: editFormData.estimated_value ? parseFloat(editFormData.estimated_value) : undefined,
    };

    await updateMutation.mutateAsync({ leadId: selectedLead.id, data: leadData });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    await importMutation.mutateAsync(selectedFile);
  };

  const handleImportClose = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
    setImportResult(null);
  };

  if (isLoading) {
    return (
      <RouteGuard requireApproval>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard requireApproval>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Failed to load leads. Please try again.</p>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireApproval>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage all leads in the system
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import Excel
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Lead
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, or company..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as LeadStatus | 'ALL');
                  setPage(1);
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
                <option value="NURTURE">Nurture</option>
              </select>
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <input
                type="text"
                id="source"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by source..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </form>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                      <dd className="text-lg font-semibold text-gray-900">{data.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">New</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {data.items.filter((l: Lead) => l.status === 'NEW').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Won</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {data.items.filter((l: Lead) => l.status === 'WON').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {data.items.filter((l: Lead) =>
                          ['CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION'].includes(l.status)
                        ).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {search || statusFilter !== 'ALL' || sourceFilter
                            ? 'Try adjusting your filters'
                            : 'Get started by creating a new lead'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.items.map((lead: Lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                            {lead.name?.charAt(0) || lead.email?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lead.name}
                            </div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                            {lead.phone && (
                              <div className="text-sm text-gray-500">{lead.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.city || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{lead.source || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.estimated_value
                            ? `$${lead.estimated_value.toLocaleString()}`
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(lead)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(lead)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id, lead.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > data.page_size && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * data.page_size >= data.total}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(page - 1) * data.page_size + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * data.page_size, data.total)}
                    </span>{' '}
                    of <span className="font-medium">{data.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * data.page_size >= data.total}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Lead Modal */}
        {isCreateModalOpen && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsCreateModalOpen(false)}
                aria-hidden="true"
              ></div>

              {/* Center modal vertically */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
                <form onSubmit={handleCreateSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New Lead</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">State</label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Zip</label>
                          <input
                            type="text"
                            value={formData.zip_code}
                            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Source *</label>
                        <input
                          type="text"
                          required
                          value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          placeholder="e.g., Website, Referral, Door-to-door"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status *</label>
                        <select
                          required
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={LeadStatus.NEW}>New</option>
                          <option value={LeadStatus.CONTACTED}>Contacted</option>
                          <option value={LeadStatus.QUALIFIED}>Qualified</option>
                          <option value={LeadStatus.PROPOSAL}>Proposal</option>
                          <option value={LeadStatus.NEGOTIATION}>Negotiation</option>
                          <option value={LeadStatus.WON}>Won</option>
                          <option value={LeadStatus.LOST}>Lost</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Value ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.estimated_value}
                          onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          rows={3}
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {createMutation.isPending ? 'Creating...' : 'Create Lead'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={createMutation.isPending}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Lead Details Modal */}
        {isViewModalOpen && selectedLead && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsViewModalOpen(false)}
                aria-hidden="true"
              ></div>

              {/* Center modal vertically */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <div className="sm:flex sm:items-start sm:justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Lead Details</h3>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[selectedLead.status]}`}>
                      {selectedLead.status}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedLead.name}</dd>
                        </div>
                        {selectedLead.email && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLead.email}</dd>
                          </div>
                        )}
                        {selectedLead.phone && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLead.phone}</dd>
                          </div>
                        )}
                        {selectedLead.source && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Source</dt>
                            <dd className="mt-1 text-sm text-gray-900">{selectedLead.source}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Address Information */}
                    {(selectedLead.address || selectedLead.city || selectedLead.state || selectedLead.zip_code) && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Address</h4>
                        <div className="text-sm text-gray-900">
                          {selectedLead.address && <div>{selectedLead.address}</div>}
                          <div>
                            {[selectedLead.city, selectedLead.state, selectedLead.zip_code]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lead Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Lead Details</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        {selectedLead.estimated_value && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Estimated Value</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              ${selectedLead.estimated_value.toLocaleString()}
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(selectedLead.created_at).toLocaleString()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(selectedLead.updated_at).toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Notes */}
                    {selectedLead.notes && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Notes</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLead.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Lead Modal */}
        {isEditModalOpen && selectedLead && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsEditModalOpen(false)}
                aria-hidden="true"
              ></div>

              {/* Center modal vertically */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative">
                <form onSubmit={handleEditSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Lead</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">City</label>
                          <input
                            type="text"
                            value={editFormData.city}
                            onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">State</label>
                          <input
                            type="text"
                            value={editFormData.state}
                            onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Zip</label>
                          <input
                            type="text"
                            value={editFormData.zip_code}
                            onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Source *</label>
                        <input
                          type="text"
                          required
                          value={editFormData.source}
                          onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                          placeholder="e.g., Website, Referral, Door-to-door"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status *</label>
                        <select
                          required
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as LeadStatus })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={LeadStatus.NEW}>New</option>
                          <option value={LeadStatus.CONTACTED}>Contacted</option>
                          <option value={LeadStatus.QUALIFIED}>Qualified</option>
                          <option value={LeadStatus.PROPOSAL}>Proposal</option>
                          <option value={LeadStatus.NEGOTIATION}>Negotiation</option>
                          <option value={LeadStatus.WON}>Won</option>
                          <option value={LeadStatus.LOST}>Lost</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Value ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.estimated_value}
                          onChange={(e) => setEditFormData({ ...editFormData, estimated_value: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          rows={3}
                          value={editFormData.notes}
                          onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={updateMutation.isPending}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Import Excel Modal */}
        {isImportModalOpen && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={handleImportClose}
                aria-hidden="true"
              ></div>

              {/* Center modal vertically */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Import Leads from Excel</h3>

                  {!importResult ? (
                    <form onSubmit={handleImportSubmit}>
                      <div className="space-y-4">
                        {/* Expected columns info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">Expected Excel Columns:</h4>
                          <div className="text-xs text-blue-800 grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>• address</div>
                            <div>• city</div>
                            <div>• state</div>
                            <div>• zip</div>
                            <div>• email_1</div>
                            <div>• email_2</div>
                            <div>• phone_1, phone_2, phone_3, phone_4</div>
                            <div>• landline_1, landline_2, landline_3, landline_4</div>
                            <div>• mailing_address</div>
                            <div>• mailing_city, mailing_state, mailing_zip</div>
                            <div>• owner_1_first_name, owner_1_last_name</div>
                            <div>• owner_2_first_name, owner_2_last_name</div>
                            <div>• source_file</div>
                          </div>
                        </div>

                        {/* File input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Excel File (.xlsx or .xls) *
                          </label>
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            required
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          {selectedFile && (
                            <p className="mt-2 text-sm text-gray-600">
                              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={!selectedFile || importMutation.isPending}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {importMutation.isPending ? 'Importing...' : 'Import Leads'}
                        </button>
                        <button
                          type="button"
                          onClick={handleImportClose}
                          disabled={importMutation.isPending}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Import results */
                    <div className="space-y-4">
                      {/* Success/Error banner */}
                      <div className={`rounded-md p-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex">
                          <div className="flex-shrink-0">
                            {importResult.success ? (
                              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className={`text-sm font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                              {importResult.message}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Import statistics */}
                      {importResult.success && (
                        <div className="bg-gray-50 rounded-md p-4">
                          <dl className="grid grid-cols-2 gap-4">
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Total Rows</dt>
                              <dd className="text-2xl font-semibold text-gray-900">{importResult.total_rows}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Successfully Created</dt>
                              <dd className="text-2xl font-semibold text-green-600">{importResult.created}</dd>
                            </div>
                          </dl>
                        </div>
                      )}

                      {/* Errors list */}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                            Errors ({importResult.errors.length}):
                          </h4>
                          <div className="max-h-60 overflow-y-auto">
                            <ul className="text-xs text-yellow-800 space-y-1">
                              {importResult.errors.map((error, idx) => (
                                <li key={idx}>
                                  <strong>Row {error.row}:</strong> {error.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleImportClose}
                          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
