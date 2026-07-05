import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Shield, Users, Plus, Trash2, Check, X, Settings, LayoutDashboard, Calendar, Package, ShoppingBag, Phone, User, Info } from 'lucide-react';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Roles states
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const queryClient = useQueryClient();

  // Load user directory
  const { data: users, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['users', filterRole],
    queryFn: async () => {
      const params = {};
      if (filterRole) params.role = filterRole;
      const response = await axios.get('/api/users/', { params });
      return response.data;
    },
  });

  // Load roles list
  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/roles/');
      setRoles(response.data);
      if (response.data.length > 0 && !selectedRole) {
        setSelectedRole(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch permissions for selected role
  useEffect(() => {
    if (selectedRole) {
      axios.get(`/api/role-permissions/${selectedRole.id}/permissions/`)
        .then(res => {
          setRolePermissions(res.data.enabled_features || []);
        })
        .catch(err => {
          console.error('Error loading permissions:', err);
        });
    }
  }, [selectedRole]);

  // Filtered users calculation
  const roleOrder = { 'Admin': 0, 'Employee': 1, 'Telecaller': 2 };
  let filteredUsers = users?.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole ? user.role === filterRole : true;
    return matchesSearch && matchesRole;
  })?.slice().sort((a, b) => {
    const aOrder = roleOrder[a.role] ?? 99;
    const bOrder = roleOrder[b.role] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.username.localeCompare(b.username);
  });

  // Handle role deletion
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm(`Are you sure you want to delete the role "${selectedRole.name}"? Users assigned to this role may lose access.`)) {
      return;
    }
    try {
      await axios.delete(`/api/roles/${roleId}/`);
      const updatedRoles = roles.filter(r => r.id !== roleId);
      setRoles(updatedRoles);
      setSelectedRole(updatedRoles[0] || null);
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Failed to delete role.');
    }
  };

  // Handle new role creation
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsCreatingRole(true);
    try {
      const response = await axios.post('/api/roles/', {
        name: newRoleName,
        description: newRoleDesc
      });
      setRoles([...roles, response.data]);
      setSelectedRole(response.data);
      setNewRoleName('');
      setNewRoleDesc('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating role:', err);
      alert(err.response?.data?.name?.[0] || 'Failed to create role.');
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Handle feature permission toggling
  const handleTogglePermission = async (featureKey) => {
    if (!selectedRole) return;
    const isCurrentlyEnabled = rolePermissions.includes(featureKey);
    const newEnabledState = !isCurrentlyEnabled;

    // Optimistic UI update
    if (newEnabledState) {
      setRolePermissions([...rolePermissions, featureKey]);
    } else {
      setRolePermissions(rolePermissions.filter(k => k !== featureKey));
    }

    try {
      await axios.post(`/api/role-permissions/${selectedRole.id}/toggle/`, {
        feature_key: featureKey,
        is_enabled: newEnabledState
      });
    } catch (err) {
      console.error('Error updating permission:', err);
      // Rollback optimistic update
      if (isCurrentlyEnabled) {
        setRolePermissions([...rolePermissions, featureKey]);
      } else {
        setRolePermissions(rolePermissions.filter(k => k !== featureKey));
      }
      alert('Failed to update permission status.');
    }
  };

  // Define structured feature categories
  const featureCategories = [
    {
      title: '📊 Dashboard & Analytics',
      features: [
        { key: 'view_dashboard', label: 'View Dashboard Analytics & KPIs', desc: 'Accesses dashboard charts, counter cards, and agent performance reports.' }
      ]
    },
    {
      title: '👥 Lead & Customer Directory',
      features: [
        { key: 'view_customers', label: 'View Customers / Leads list', desc: 'Displays lead directories, customers table view, search and filter options.' },
        { key: 'create_customer', label: 'Create New Leads/Customers', desc: 'Allows access to add new profile/company details.' },
        { key: 'edit_customer', label: 'Edit Customer Profiles', desc: 'Allows modification of addresses, contact details, and pincode territories.' },
        { key: 'delete_customer', label: 'Delete Customers/Leads', desc: 'Provides authority to clean/delete accounts from DB.' },
        { key: 'reassign_customers', label: 'Reassign Customer Agents', desc: 'Provides bulk reassignment operations of telecallers/employees.' },
        { key: 'manage_appointments', label: 'Book & Reschedule Appointments', desc: 'Grants ability to book dates and followups on lead lists.' }
      ]
    },
    {
      title: '📞 Telecalling Activity',
      features: [
        { key: 'make_calls', label: 'Dial Calls & Log Conversation notes', desc: 'Controls call dialog log popups, notes entry, and duration details.' },
        { key: 'view_call_history', label: 'View Call Logs and History Feed', desc: 'Allows viewing past timelines, call notes, and agent followups.' }
      ]
    },
    {
      title: '🛒 Order Management',
      features: [
        { key: 'view_orders', label: 'Access Order Details', desc: 'Allows viewing of billing, tax invoice views, and receipt entries.' },
        { key: 'create_order', label: 'Create/Draft New Orders', desc: 'Grants access to compile items cart, combo discounts, and place orders.' },
        { key: 'edit_order', label: 'Edit Unprocessed Orders', desc: 'Allows modifications to items quantities, and payment structures.' },
        { key: 'delete_order', label: 'Cancel & Delete Orders', desc: 'Enables deletion/voiding of orders from history.' },
        { key: 'update_payment', label: 'Log Installments / Payment status', desc: 'Allows triggering popup to record partial and due amounts.' },
        { key: 'export_orders', label: 'Export Orders to Excel', desc: 'Grants permission to download spreadsheet data including GST bifurcations.' }
      ]
    },
    {
      title: '📦 Product Catalog & Combo Bundles',
      features: [
        { key: 'view_products', label: 'View Products List', desc: 'Grants read access to categories, MRP rates, and item codes.' },
        { key: 'manage_products', label: 'Manage Products (Create/Edit/Delete)', desc: 'Full product configuration capabilities including pricing tiers.' },
        { key: 'manage_combos', label: 'Configure Combo Packs & Rewards', desc: 'Setup combos requirements, free items, and incentive configurations.' }
      ]
    },
    {
      title: '⚙️ Administration Settings',
      features: [
        { key: 'manage_users', label: 'Manage Users/Employees', desc: 'Add new staff logins, update employee credentials, and set territorial pincodes.' },
        { key: 'manage_roles', label: 'Configure Roles & Feature Allocation', desc: 'Control panel access to toggle dynamic features on custom roles.' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 px-4 md:px-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Staff & Roles Directory</h1>
            <p className="text-gray-500 mt-1">Manage system logins and dynamically allocate feature access across custom roles.</p>
          </div>
          {activeTab === 'users' && (
            <Link
              to="/users/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Add New User
            </Link>
          )}
          {activeTab === 'roles' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Create Custom Role
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            Users Directory
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Shield className="h-4 w-4" />
            Roles & Feature Matrix
          </button>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="w-full sm:w-64">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm bg-white"
                >
                  <option value="">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : usersError ? (
              <div className="text-center text-red-500 py-10 bg-red-50 rounded-xl border border-red-200">
                Error loading users: {usersError.message}
              </div>
            ) : filteredUsers?.length === 0 ? (
              <div className="text-center text-gray-500 py-20">
                No users matching search filters found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers?.map(user => (
                      <tr key={user.id} className="hover:bg-gray-55/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{user.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                            user.role === 'Admin' 
                              ? 'bg-blue-100 text-blue-800' 
                              : user.role === 'Telecaller'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/users/edit/${user.id}`} 
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg mr-2 font-bold transition-all inline-block"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Roles Selection Panel */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Select Role</h2>
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between text-left p-4 rounded-xl border transition-all ${
                    selectedRole?.id === role.id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/15 font-bold scale-[1.02]'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">{role.name}</div>
                    <div className={`text-xs mt-1 max-w-[200px] truncate ${
                      selectedRole?.id === role.id ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {role.description || 'No description provided'}
                    </div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Permissions Matrix Detail Panel */}
            <div className="lg:col-span-3">
              {selectedRole ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                  {/* Selected Role Meta */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-6 mb-6 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                          <Shield className="h-5 w-5" />
                        </span>
                        <h2 className="text-xl font-bold text-gray-900">{selectedRole.name} Role Settings</h2>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{selectedRole.description || 'Manage dynamic capabilities below.'}</p>
                    </div>

                    {/* Exclude default roles from deletion */}
                    {!['Admin', 'Employee', 'Telecaller'].includes(selectedRole.name) && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 border border-red-100 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Role
                      </button>
                    )}
                  </div>

                  {/* Warning banner for Admins */}
                  {selectedRole.name === 'Admin' && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">System Guard Bypass</div>
                        <div className="text-xs text-blue-700 mt-0.5">
                          Users with the role <strong>Admin</strong> possess full administrative access and bypass feature checks by default. Permissions for Admin are locked.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feature categories list */}
                  <div className="space-y-6">
                    {featureCategories.map((category) => (
                      <div key={category.title} className="border border-gray-100 rounded-xl p-4 bg-gray-50/20">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{category.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {category.features.map((feat) => {
                            const isEnabled = rolePermissions.includes(feat.key);
                            const isDisabled = selectedRole.name === 'Admin';
                            return (
                              <div
                                key={feat.key}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                  isEnabled 
                                    ? 'bg-emerald-50/20 border-emerald-100/50' 
                                    : 'bg-white border-gray-100'
                                }`}
                              >
                                <div className="flex items-center h-5 mt-0.5">
                                  <input
                                    id={`check-${feat.key}`}
                                    type="checkbox"
                                    checked={isEnabled}
                                    disabled={isDisabled}
                                    onChange={() => handleTogglePermission(feat.key)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`check-${feat.key}`}
                                    className={`text-sm font-bold cursor-pointer select-none ${
                                      isDisabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-900'
                                    }`}
                                  >
                                    {feat.label}
                                  </label>
                                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{feat.desc}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center text-gray-500">
                  Please select or create a role to view feature allocations.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE ROLE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Create Custom Role</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Entry, Manager"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
                <textarea
                  placeholder="Summarize the core duties of this role..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-sm text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isCreatingRole ? 'Saving...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper chevron icon
const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
  </svg>
);

export default UserManagement;
