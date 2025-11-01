'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CitiesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cities' | 'states'>('cities');
  const [sortBy, setSortBy] = useState<'leads' | 'name'>('leads');

  // Fetch geographic stats
  const { data: geoData, isLoading, error } = useQuery({
    queryKey: ['geographic-stats'],
    queryFn: () => leadsApi.getGeographicStats(),
  });

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!geoData?.data) return [];

    const data = viewMode === 'cities' ? geoData.data.cities : geoData.data.states;

    let filtered = data.filter((item: any) => {
      const matchesSearch = searchTerm === '' ||
        item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.state?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = selectedState === 'ALL' || item.state === selectedState;

      return matchesSearch && matchesState;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'leads') {
        return b.total_leads - a.total_leads;
      } else {
        const nameA = viewMode === 'cities' ? a.city : a.state;
        const nameB = viewMode === 'cities' ? b.city : b.state;
        return nameA.localeCompare(nameB);
      }
    });

    return filtered;
  }, [geoData, searchTerm, selectedState, viewMode, sortBy]);

  // Get unique states for filter
  const states = useMemo(() => {
    if (!geoData?.data?.states) return [];
    return geoData.data.states.map((s: any) => s.state).sort();
  }, [geoData]);

  // Navigate to leads filtered by city
  const handleCityClick = (city: string, state: string) => {
    const searchQuery = `${city}, ${state}`;
    router.push(`/dashboard/leads?search=${encodeURIComponent(searchQuery)}`);
  };

  // Navigate to leads filtered by state
  const handleStateClick = (state: string) => {
    router.push(`/dashboard/leads?search=${encodeURIComponent(state)}`);
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'NEW': 'bg-blue-100 text-blue-800',
      'CONTACTED': 'bg-yellow-100 text-yellow-800',
      'QUALIFIED': 'bg-purple-100 text-purple-800',
      'PROPOSAL': 'bg-indigo-100 text-indigo-800',
      'NEGOTIATION': 'bg-orange-100 text-orange-800',
      'WON': 'bg-green-100 text-green-800',
      'LOST': 'bg-red-100 text-red-800',
      'ON_HOLD': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">Loading geographic data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-red-200">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">Failed to load geographic statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">🗺️ Geographic Intelligence</h1>
          <p className="text-indigo-100 text-lg">Explore leads by location with interactive visual insights</p>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="text-white/80 text-sm font-medium">Total Leads</div>
              <div className="text-3xl font-bold mt-1">{geoData?.data.total_leads.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="text-white/80 text-sm font-medium">States</div>
              <div className="text-3xl font-bold mt-1">{geoData?.data.total_states}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <div className="text-white/80 text-sm font-medium">Cities</div>
              <div className="text-3xl font-bold mt-1">{geoData?.data.total_cities}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 Search Location
              </label>
              <input
                type="text"
                placeholder="Search by city or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Filter by State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="ALL">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⬇️ Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'leads' | 'name')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="leads">Most Leads</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setViewMode('cities')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                viewMode === 'cities'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏙️ Cities View
            </button>
            <button
              onClick={() => setViewMode('states')}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                viewMode === 'states'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🗺️ States View
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <p className="text-gray-600 font-medium">
          Showing {filteredData.length} {viewMode === 'cities' ? 'cities' : 'states'}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item: any, index: number) => {
            const isCity = viewMode === 'cities';
            const topStatus = Object.entries(item.statuses).sort((a: any, b: any) => b[1] - a[1])[0];

            return (
              <div
                key={index}
                onClick={() => isCity ? handleCityClick(item.city, item.state) : handleStateClick(item.state)}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-gray-100 hover:border-indigo-300 hover:-translate-y-1"
              >
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">
                        {isCity ? item.city : item.state}
                      </h3>
                      {isCity && (
                        <p className="text-indigo-100 text-sm">{item.state}</p>
                      )}
                    </div>
                    <div className="text-5xl opacity-20">
                      {isCity ? '🏙️' : '🗺️'}
                    </div>
                  </div>

                  {/* Lead Count */}
                  <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3">
                    <div className="text-white/80 text-xs font-medium">Total Leads</div>
                    <div className="text-3xl font-bold">{item.total_leads.toLocaleString()}</div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Top Status */}
                  {topStatus && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 mb-2">TOP STATUS</div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(topStatus[0])}`}>
                          {topStatus[0].replace('_', ' ')}
                        </span>
                        <span className="text-lg font-bold text-gray-900">{topStatus[1]}</span>
                      </div>
                    </div>
                  )}

                  {/* Status Breakdown */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 mb-2">STATUS BREAKDOWN</div>
                    <div className="space-y-1">
                      {Object.entries(item.statuses)
                        .slice(0, 3)
                        .map(([status, count]: [string, any]) => (
                          <div key={status} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{status.replace('_', ' ')}</span>
                            <span className="font-semibold text-gray-900">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Additional Info for Cities */}
                  {isCity && item.avg_priority > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">AVG PRIORITY</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < Math.round(item.avg_priority) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Click Hint */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-indigo-600 font-medium group-hover:text-indigo-700">
                      <span>View All Leads</span>
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Locations Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
