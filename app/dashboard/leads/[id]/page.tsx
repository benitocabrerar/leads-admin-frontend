'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { Lead } from '@/lib/types';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});

  // Fetch lead details
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.getLead(leadId),
    enabled: !isNaN(leadId),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.updateLead(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditing(false);
      setEditedLead({});
    },
  });

  const handleEdit = () => {
    setEditedLead(lead || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedLead({});
  };

  const handleSave = () => {
    updateMutation.mutate(editedLead);
  };

  const handleChange = (field: keyof Lead, value: any) => {
    setEditedLead(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-red-200">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-4">The lead you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/leads')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            ← Back to Leads
          </button>
        </div>
      </div>
    );
  }

  const currentData = isEditing ? editedLead : lead;

  const InfoField = ({ label, value, field, multiline = false }: { label: string; value: any; field?: keyof Lead; multiline?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
      {isEditing && field ? (
        multiline ? (
          <textarea
            value={currentData[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={currentData[field] || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        )
      ) : (
        <p className="text-gray-900 font-medium">{value || '-'}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/dashboard/leads')}
                className="text-indigo-100 hover:text-white mb-2 flex items-center gap-2 transition"
              >
                ← Back to Leads
              </button>
              <h1 className="text-4xl font-bold">{lead.name}</h1>
              <p className="text-indigo-100 mt-1">Lead ID: {lead.id}</p>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-lg"
                >
                  ✏️ Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition shadow-lg disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📞 Primary Contact
            </h2>
            <div className="space-y-4">
              <InfoField label="Name" value={currentData.name} field="name" />
              <InfoField label="Email" value={currentData.email} field="email" />
              <InfoField label="Phone" value={currentData.phone} field="phone" />
              <InfoField label="Company" value={currentData.company} field="company" />
            </div>
          </div>

          {/* Additional Contact Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📱 Additional Contact Details
            </h2>
            <div className="space-y-4">
              <InfoField label="Email 2" value={currentData.email_2} field="email_2" />
              <InfoField label="Phone 2" value={currentData.phone_2} field="phone_2" />
              <InfoField label="Phone 3" value={currentData.phone_3} field="phone_3" />
              <InfoField label="Phone 4" value={currentData.phone_4} field="phone_4" />
            </div>
          </div>

          {/* Landline Numbers */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📞 Landline Numbers
            </h2>
            <div className="space-y-4">
              <InfoField label="Landline 1" value={currentData.landline_1} field="landline_1" />
              <InfoField label="Landline 2" value={currentData.landline_2} field="landline_2" />
              <InfoField label="Landline 3" value={currentData.landline_3} field="landline_3" />
              <InfoField label="Landline 4" value={currentData.landline_4} field="landline_4" />
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              👤 Property Owners
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <p className="text-xs font-medium text-indigo-600 mb-2">OWNER 1</p>
                <div className="space-y-2">
                  <InfoField label="First Name" value={currentData.owner_1_first_name} field="owner_1_first_name" />
                  <InfoField label="Last Name" value={currentData.owner_1_last_name} field="owner_1_last_name" />
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs font-medium text-purple-600 mb-2">OWNER 2</p>
                <div className="space-y-2">
                  <InfoField label="First Name" value={currentData.owner_2_first_name} field="owner_2_first_name" />
                  <InfoField label="Last Name" value={currentData.owner_2_last_name} field="owner_2_last_name" />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Address */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏠 Physical Address
            </h2>
            <div className="space-y-4">
              <InfoField label="Address" value={currentData.address} field="address" multiline />
              <InfoField label="City" value={currentData.city} field="city" />
              <InfoField label="State" value={currentData.state} field="state" />
              <InfoField label="Zip Code" value={currentData.zip_code} field="zip_code" />
              <InfoField label="Country" value={currentData.country} field="country" />
            </div>
          </div>

          {/* Mailing Address */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📬 Mailing Address
            </h2>
            <div className="space-y-4">
              <InfoField label="Mailing Address" value={currentData.mailing_address} field="mailing_address" multiline />
              <InfoField label="Mailing City" value={currentData.mailing_city} field="mailing_city" />
              <InfoField label="Mailing State" value={currentData.mailing_state} field="mailing_state" />
              <InfoField label="Mailing Zip" value={currentData.mailing_zip} field="mailing_zip" />
            </div>
          </div>

          {/* Lead Status & Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 Lead Status & Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                {isEditing ? (
                  <select
                    value={currentData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="NEW">New</option>
                    <option value="CONTACTED">Contacted</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="WON">Won</option>
                    <option value="LOST">Lost</option>
                  </select>
                ) : (
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {currentData.status?.replace('_', ' ')}
                  </span>
                )}
              </div>
              <InfoField label="Source" value={currentData.source} field="source" />
              <InfoField label="Source File" value={currentData.source_file} />
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Priority</label>
                {isEditing ? (
                  <select
                    value={currentData.priority || 3}
                    onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="1">🔴 High (1)</option>
                    <option value="2">🟠 Medium-High (2)</option>
                    <option value="3">🟡 Normal (3)</option>
                    <option value="4">🟢 Medium-Low (4)</option>
                    <option value="5">⚪ Low (5)</option>
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium">
                    {currentData.priority === 1 && '🔴 High'}
                    {currentData.priority === 2 && '🟠 Medium-High'}
                    {currentData.priority === 3 && '🟡 Normal'}
                    {currentData.priority === 4 && '🟢 Medium-Low'}
                    {currentData.priority === 5 && '⚪ Low'}
                    {!currentData.priority && '-'}
                  </p>
                )}
              </div>
              <InfoField label="Assigned To" value={currentData.assigned_to} field="assigned_to" />
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              💼 Business Information
            </h2>
            <div className="space-y-4">
              <InfoField label="Service Interest" value={currentData.service_interest} field="service_interest" />
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Value</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={currentData.estimated_value || ''}
                    onChange={(e) => handleChange('estimated_value', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Amount in dollars"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {currentData.estimated_value ? `$${(currentData.estimated_value / 100).toLocaleString()}` : '-'}
                  </p>
                )}
              </div>
              <InfoField label="Project Timeline" value={currentData.project_timeline} field="project_timeline" />
            </div>
          </div>

          {/* Notes & Additional Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 Notes & Additional Information
            </h2>
            <div className="space-y-4">
              <InfoField label="Notes Summary" value={currentData.notes_summary} field="notes_summary" multiline />
              <InfoField label="Tags" value={currentData.tags} field="tags" />
              <InfoField label="Preferred Contact Method" value={currentData.preferred_contact_method} field="preferred_contact_method" />
              <InfoField label="Preferred Contact Time" value={currentData.preferred_contact_time} field="preferred_contact_time" />
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📅 Important Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <p className="text-gray-900 font-medium">{new Date(lead.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <p className="text-gray-900 font-medium">{new Date(lead.updated_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">First Contact</label>
                <p className="text-gray-900 font-medium">
                  {lead.first_contact_date ? new Date(lead.first_contact_date).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Contact</label>
                <p className="text-gray-900 font-medium">
                  {lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Next Follow-up</label>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={currentData.next_followup_date ? new Date(currentData.next_followup_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('next_followup_date', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {lead.next_followup_date ? new Date(lead.next_followup_date).toLocaleString() : '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
