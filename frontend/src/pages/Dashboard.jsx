import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout, api, API } = useAuth();
  const normalizedRole = String(user?.role || '').trim().toUpperCase();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [pendingLandlords, setPendingLandlords] = useState([]);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD', 'LISTINGS', 'SETTINGS'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feedError, setFeedError] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Property Form State
  const [propertyData, setPropertyData] = useState({
    title: '',
    description: '',
    price: '',
    location: ''
  });
  const [images, setImages] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPropertyData({ ...propertyData, [name]: value });
  };

  useEffect(() => {
    const loadProperties = async () => {
      // Allow all roles to load properties into the feed
      if (!['TENANT', 'LANDLORD', 'ADMIN'].includes(normalizedRole)) return;

      setDiscoveryLoading(true);
      setFeedError('');

      try {
        if (!api) throw new Error('API client not available (AuthContext missing api)');
        const response = await api.get('/properties');
        setProperties(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setFeedError(`Discovery Error: ${err.response?.data?.message || err.message || 'Unable to connect'}`);
      } finally {
        setDiscoveryLoading(false);
      }
    };

    loadProperties();
  }, [api, normalizedRole]);

  useEffect(() => {
    const loadAdminData = async () => {
      if (normalizedRole !== 'ADMIN') return;
      setAdminLoading(true);
      setAdminError('');
      setAdminSuccess('');
      try {
        const [pendingRes, usersRes] = await Promise.all([
          api.get('/admin/pending-landlords'),
          api.get('/admin/users')
        ]);
        setPendingLandlords(Array.isArray(pendingRes.data) ? pendingRes.data : []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (err) {
        setAdminError(`Admin Fetch Error: ${err.response?.data?.message || err.message || 'Connection refused'}`);
      } finally {
        setAdminLoading(false);
      }
    };
    loadAdminData();
  }, [api, normalizedRole]);

  const handleGlobalRefresh = async () => {
    setRefreshing(true);
    setAdminError('');
    setAdminSuccess('');
    try {
      if (normalizedRole === 'TENANT') {
        const res = await api.get('/properties');
        setProperties(Array.isArray(res.data) ? res.data : []);
      } else if (normalizedRole === 'LANDLORD') {
        const res = await api.get('/properties');
        setProperties(Array.isArray(res.data) ? res.data : []);
      } else if (normalizedRole === 'ADMIN') {
        const [pRes, uRes, lRes] = await Promise.all([
          api.get('/properties'),
          api.get('/admin/users'),
          api.get('/admin/pending-landlords')
        ]);
        setProperties(Array.isArray(pRes.data) ? pRes.data : []);
        setUsers(Array.isArray(uRes.data) ? uRes.data : []);
        setPendingLandlords(Array.isArray(lRes.data) ? lRes.data : []);
      }
    } catch (err) {
      setAdminError(`Refresh failed: ${err.response?.data?.message || err.message || 'Unable to refresh data'}`);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      setAdminError('');
      setAdminSuccess('');
      await api.put(`/admin/users/${userId}`, data);
      setAdminSuccess('User updated successfully');
      await handleGlobalRefresh();
      setIsUserModalOpen(false);
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      setAdminError('');
      setAdminSuccess('');
      await api.delete(`/admin/users/${userId}`);
      setAdminSuccess('User removed from database');
      await handleGlobalRefresh();
    } catch (err) {
      setAdminError(err.response?.data?.message || 'Deletion failed');
    }
  };

  const UserEditModal = () => {
    if (!editingUser) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Modify User Dossier</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Display Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={editingUser.name}
                onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Workspace Role</label>
              <select 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
              >
                <option value="TENANT">TENANT</option>
                <option value="LANDLORD">LANDLORD</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input 
                type="checkbox" 
                id="isApproved"
                checked={editingUser.isApproved}
                onChange={(e) => setEditingUser({...editingUser, isApproved: e.target.checked})}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isApproved" className="text-sm font-semibold text-slate-700">Database Approval Status</label>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button 
              onClick={() => handleUpdateUser(editingUser.id, editingUser)}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
            <button 
              onClick={() => setIsUserModalOpen(false)}
              className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const filteredUsers = users.filter(u => {
    if (userFilter === 'ALL') return true;
    return u.role === userFilter;
  });

  const formatPrice = (value) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 'Price unavailable';
    }

    return `${numericValue.toLocaleString('en-US')} ETB / month`;
  };

  const DiscoverySpinner = () => (
    <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-slate-200 bg-white/70">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        <p className="text-sm font-medium">Loading available properties...</p>
      </div>
    </div>
  );

  const TenantDiscoveryGrid = () => {
    if (discoveryLoading) {
      return <DiscoverySpinner />;
    }

    if (feedError) {
      return (
        <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-5 text-sm font-medium text-red-700">
          {feedError}
        </div>
      );
    }

    if (properties.length === 0) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
            🏘️
          </div>
          <h3 className="text-lg font-bold text-slate-900">No published listings yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Check back soon. New verified properties will appear here once landlords publish them.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {properties.map((property) => (
          <article
            key={property.id}
            className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
          >
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100">
              <div className="absolute inset-0 flex items-center justify-center text-5xl text-slate-300 transition-transform duration-300 group-hover:scale-105">
                🏠
              </div>
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/30 to-transparent" />
            </div>

            <div className="space-y-3 p-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">{property.title}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-blue-700">{property.location}</p>
                  {property.landlord?.name && (
                    <span className="text-xs text-slate-400">• Hosted by {property.landlord.name}</span>
                  )}
                </div>
              </div>

              <p className="line-clamp-3 text-sm leading-6 text-slate-500">
                {property.description}
              </p>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Monthly Rent
                </span>
                <span className="text-lg font-black text-slate-900">
                  {formatPrice(property.price)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  };

  const refreshPendingLandlords = async () => {
    if (!api || normalizedRole !== 'ADMIN') return;

    const response = await api.get('/admin/pending-landlords');
    setPendingLandlords(Array.isArray(response.data) ? response.data : []);
  };

  const handleApproveLandlord = async (landlordId) => {
    setAdminLoading(true);
    setAdminError('');
    setAdminSuccess('');

    try {
      if (!api) throw new Error('API client not available (AuthContext missing api)');
      await api.put(`/admin/approve-landlord/${landlordId}`);
      setAdminSuccess('Landlord approved successfully.');
      await refreshPendingLandlords();
    } catch (err) {
      setAdminError(err.response?.data?.message || err.message || 'Failed to approve landlord.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!API) throw new Error('API client not available (AuthContext missing API)');
      // Create a multipart form payload just like we did in Thunder Client
      const formData = new FormData();
      formData.append('title', propertyData.title);
      formData.append('description', propertyData.description);
      formData.append('price', propertyData.price);
      formData.append('location', propertyData.location);
      images.forEach((image) => formData.append('images', image));

      // Hit our backend API via the pre-configured Axios instance from AuthContext
      // Let the browser set the multipart boundary header; Axios will forward it correctly
      const response = await API.post('/properties', formData);

      if (response.status === 201) {
        setSuccess('Property listed beautifully and saved to Supabase! 🎉');
        // Clear the form fields and close the view panel
        setPropertyData({ title: '', description: '', price: '', location: '' });
        setImages([]);
        setIsFormOpen(false);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to publish listing. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50 font-sans antialiased">
      {/* 1. STICKY LEFT SIDEBAR MENU */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white flex flex-col justify-between p-5 sm:p-6 lg:p-8 z-50 lg:h-screen lg:sticky lg:top-0">
        <div className="flex items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🏠</span>
            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              PropertyHub
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <div className={`${isMenuOpen ? 'block' : 'hidden'} lg:block space-y-10`}>
          {/* Navigation Link Stack */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setIsMenuOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === 'DASHBOARD' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('LISTINGS');
                setIsMenuOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === 'LISTINGS' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>🏢</span>
              <span>Listings View</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('SETTINGS');
                setIsMenuOpen(false);
              }}
              className={`w-full text-left flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                activeTab === 'SETTINGS' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>👤</span>
              <span>Account Settings</span>
            </button>
          </nav>
        </div>

        <div className="mt-6 lg:mt-0 space-y-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Active Scope</p>
            <p className="text-xs font-bold text-blue-400 truncate">{normalizedRole} WORKSPACE</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3.5 text-sm font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. FLEXIBLE MAIN CONTENT PANEL */}
      <main className="flex-1 min-h-screen overflow-y-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        {/* Custom Header with REFRESH BUTTON */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome Back, {user?.name}!
            </h2>
            <p className="text-slate-500 mt-1 font-medium italic">
              Cluster Status: Operational ✅
            </p>
          </div>
          
          <button 
            onClick={handleGlobalRefresh}
            disabled={refreshing}
            className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50 group"
            title="Refresh Workspace Data"
          >
            <svg 
              className={`w-6 h-6 ${refreshing ? 'animate-spin text-blue-600' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {isUserModalOpen && <UserEditModal />}

        <div className="space-y-10">
          {/* Alert Handlers */}
          {error && <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-sm font-medium">Critical: {error}</div>}
          {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-sm font-medium">{success}</div>}
          {adminError && <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-sm font-medium">Admin: {adminError}</div>}
          {adminSuccess && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-sm font-medium">{adminSuccess}</div>}

          {activeTab === 'DASHBOARD' ? (
            <>
              {/* Conditional Multi-Tenant Workspace Render */}
          {normalizedRole === 'TENANT' ? (
            <div className="space-y-8">
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-xl shadow-indigo-950/20">
                <div className="max-w-3xl space-y-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-300">
                    Verified Discovery Feed
                  </p>
                  <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                    Discover active rental listings curated for your next move.
                  </h3>
                  <p className="text-sm leading-7 text-slate-300 sm:text-base">
                    Browse published homes, compare neighborhoods, and review pricing in real time from the landlord network.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Available Properties</h3>
                    <p className="text-sm text-slate-500">Only published listings are shown here.</p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                    {properties.length} listings
                  </span>
                </div>

                <TenantDiscoveryGrid />
              </div>
            </div>
          ) : normalizedRole === 'LANDLORD' || normalizedRole === 'ADMIN' ? (
            <div>
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/20 mb-8">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <span>⚙️</span> Management Suite Fully Active
                </h3>
                <p className="text-slate-300 text-sm max-w-2xl mb-6">
                  You possess absolute permissions to anchor new rental units, map geographical footprints around Arba Minch, and upload media assets into our multi-tenant cloud storage.
                </p>
                
                {!isFormOpen && (
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  >
                    + Create New Property Listing
                  </button>
                )}
              </div>

              {/* Dynamic Property Form Canvas */}
              {isFormOpen && (
                <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 transition-all duration-300 animation-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold text-slate-800">New Listing Blueprints</h4>
                    <button 
                      onClick={() => setIsFormOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleCreateProperty} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Property Title</label>
                        <input
                          type="text"
                          name="title"
                          required
                          value={propertyData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Luxury Penthouse Suite"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Monthly Rent Price (ETB)</label>
                        <input
                          type="number"
                          name="price"
                          required
                          value={propertyData.price}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., 25000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location Coordinates / Neighborhood</label>
                      <input
                        type="text"
                        name="location"
                        required
                        value={propertyData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="e.g., Arba Minch, Ethiopia"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Property Images
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setImages(Array.from(e.target.files || []))}
                        className="w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        Upload one or more listing photos before writing the description.
                      </p>
                      <label className="mt-6 block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Detailed Description</label>
                      <textarea
                        name="description"
                        required
                        rows="4"
                        value={propertyData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Describe the unit layout, nearby features, amenities..."
                      ></textarea>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-200/60">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 transition-colors duration-200 cursor-pointer"
                      >
                        {loading ? 'Publishing to Database...' : 'Publish Listing'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* View Catalog Section for Landlords & Admins */}
              <div className="mt-12">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Property Catalog</h3>
                    <p className="text-sm text-slate-500">
                      {normalizedRole === 'ADMIN' 
                        ? 'Master overview of all listings in the platform cluster.' 
                        : 'Review your portfolio and other active listings.'}
                    </p>
                  </div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                    {properties.length} listings
                  </span>
                </div>
                
                <TenantDiscoveryGrid />
              </div>

              {normalizedRole === 'ADMIN' && (
                <div className="space-y-8">
                  {/* ADMIN USER MANAGEMENT PANEL */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 mt-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900">User Administration</h3>
                        <p className="text-slate-500 text-sm font-medium">Manage cross-tenant identities and permission levels.</p>
                      </div>
                      
                      {/* FILTER BUTTONS */}
                      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        {['ALL', 'TENANT', 'LANDLORD'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setUserFilter(f)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              userFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {f === 'ALL' ? 'Show All' : `${f}s Only`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            <th className="px-6 pb-2">User details</th>
                            <th className="px-6 pb-2">Role</th>
                            <th className="px-6 pb-2">Approval</th>
                            <th className="px-6 pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => (
                            <tr key={u.id} className="bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-5 first:rounded-l-2xl">
                                <p className="font-bold text-slate-900">{u.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ring-1 ring-inset ${
                                  u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 ring-purple-200' :
                                  u.role === 'LANDLORD' ? 'bg-indigo-50 text-indigo-700 ring-indigo-200' :
                                  'bg-blue-50 text-blue-700 ring-blue-200'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`flex items-center gap-1.5 text-xs font-bold ${u.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.isApproved ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                                  {u.isApproved ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-5 last:rounded-r-2xl text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                                    title="Edit Profile"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    disabled={u.id === user?.id}
                                    className={`p-2 rounded-lg transition-colors ${u.id === user?.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:bg-red-50 text-red-600'}`}
                                    title={u.id === user?.id ? 'Cannot delete your own account' : 'Delete User'}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PENDING LANDLORDS SECTION */}
                  <div className="mt-8 rounded-3xl border border-amber-100 bg-amber-50/70 p-6 sm:p-8 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Admin Approval Panel</h4>
                      <p className="text-sm text-slate-600">Approve pending landlord registrations before they can log in.</p>
                    </div>
                    <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                      {pendingLandlords.length} pending
                    </span>
                  </div>

                  {adminLoading && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-600">
                      Loading approval queue...
                    </div>
                  )}

                  {!adminLoading && pendingLandlords.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                      No pending landlord accounts at the moment.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {pendingLandlords.map((landlord) => (
                        <div
                          key={landlord.id}
                          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <h5 className="font-bold text-slate-900">{landlord.name}</h5>
                            <p className="text-sm text-slate-500">{landlord.email}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-amber-700">Pending approval</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApproveLandlord(landlord.id)}
                            disabled={adminLoading}
                            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl text-center">
              <p className="text-slate-500 font-medium font-sans">Verifying specific workspace permissions...</p>
            </div>
          )}
          </>
        ) : activeTab === 'LISTINGS' ? (
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Global Property Catalog</h3>
              <p className="text-slate-500 mb-8">Full access to verified real estate assets.</p>
              <TenantDiscoveryGrid />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Account Settings</h3>
              <p className="text-slate-500 mb-8">Manage your profile and security credentials.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated As</p>
                   <p className="text-lg font-bold text-slate-900">{user?.name}</p>
                   <p className="text-sm text-slate-500">{user?.email}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Access Level</p>
                   <p className="text-lg font-bold text-blue-600">{normalizedRole}</p>
                   <p className="text-sm text-slate-500">Security Clearance Verified</p>
                 </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}