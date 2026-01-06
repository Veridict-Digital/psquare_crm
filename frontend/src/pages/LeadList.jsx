import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useState } from 'react';
import { useCallPopup } from '../context/CallPopupContext';
import {
  Search,
  Plus,
  Phone,
  Mail,
  User,
  Calendar,
  Eye,
  Edit,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
  Check,
  X
} from 'lucide-react';

const LeadList = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({ phone: '', name: '', email: '' });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentValue, setAppointmentValue] = useState('');
  const { openPopup } = useCallPopup();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await axios.get('api/leads/');
      return response.data;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (leadData) => {
      const response = await axios.post('api/leads/', leadData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setNewLead({ phone: '', name: '', email: '' });
      setShowAddForm(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.phone?.[0] || error.message;
      alert('Error creating lead: ' + errorMessage);
    },
  });

  const convertToCustomerMutation = useMutation({
    mutationFn: async (leadId) => {
      const response = await axios.post(`api/leads/${leadId}/convert_to_customer/`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['customers']);
      alert('Lead converted to customer successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      alert('Error converting lead to customer: ' + errorMessage);
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ leadId, appointmentDate }) => {
      const response = await axios.patch(`api/leads/${leadId}/`, { appointment_date: appointmentDate });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setEditingAppointment(null);
      setAppointmentValue('');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.response?.data?.appointment_date?.[0] || error.message;
      alert('Error updating appointment date: ' + errorMessage);
    },
  });

  // Extract unique statuses for filter
  const statuses = [...new Set(data?.map(lead => lead.status).filter(Boolean))];

  // Filter and search leads
  const filteredLeads = data?.filter(lead =>
    lead.name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.email?.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone?.includes(search) ||
    lead.id?.toString().includes(search)
  ).filter(lead =>
    !filterStatus || lead.status === filterStatus
  ) || [];

  // Calculate stats
  const totalLeads = filteredLeads.length;
  const newLeads = filteredLeads.filter(lead => lead.status === 'New').length;
  const contactedLeads = filteredLeads.filter(lead => lead.status === 'Contacted').length;
  const convertedLeads = filteredLeads.filter(lead => lead.status === 'Converted').length;

  const handleCall = (lead) => {
    setSelectedLead(lead);
    openPopup(lead);
  };

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.phone.trim()) {
      alert('Phone number is required');
      return;
    }
    createLeadMutation.mutate(newLead);
  };

  const handleEditAppointment = (leadId, currentDate) => {
    setEditingAppointment(leadId);
    setAppointmentValue(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');
  };

  const handleSaveAppointment = (leadId) => {
    if (!appointmentValue.trim()) {
      alert('Please select a valid date');
      return;
    }
    updateAppointmentMutation.mutate({ leadId, appointmentDate: appointmentValue });
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
    setAppointmentValue('');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'New':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Contacted':
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      case 'Qualified':
        return <Star className="h-4 w-4 text-purple-500" />;
      case 'Converted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Lost':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Qualified':
        return 'bg-purple-100 text-purple-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading leads...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Error Loading Leads</h2>
        <p className="text-gray-600 text-center mb-6">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition duration-200 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add New Lead
        </button>
      </div>

      {/* Add Lead Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Lead</h2>
          <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                value={newLead.phone}
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name (Optional)</label>
              <input
                type="text"
                value={newLead.name}
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
              <input
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
              />
            </div>
            <div className="md:col-span-3 flex gap-4">
              <button
                type="submit"
                disabled={createLeadMutation.isLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-50"
              >
                {createLeadMutation.isLoading ? 'Adding...' : 'Add Lead'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search leads by name, email, phone, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-3 rounded-lg transition duration-200 ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Table View"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-3 rounded-lg transition duration-200 ${
                viewMode === 'card'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Card View"
            >
              <Grid className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Leads</p>
                <p className="text-2xl font-bold text-blue-900">{totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">New Leads</p>
                <p className="text-2xl font-bold text-green-900">{newLeads}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Contacted</p>
                <p className="text-2xl font-bold text-yellow-900">{contactedLeads}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Converted</p>
                <p className="text-2xl font-bold text-purple-900">{convertedLeads}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Appointment Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition duration-150 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {lead.name?.charAt(0)?.toUpperCase() || 'L'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {lead.name || 'Unknown Lead'}
                          </div>
                          <div className="text-xs text-gray-500">ID: {lead.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusIcon(lead.status)}
                        <span className="ml-1">{lead.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {editingAppointment === lead.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={appointmentValue}
                            onChange={(e) => setAppointmentValue(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleSaveAppointment(lead.id)}
                            disabled={updateAppointmentMutation.isLoading}
                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>
                            {lead.appointment_date ? new Date(lead.appointment_date).toLocaleDateString() : new Date(lead.created_at).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleEditAppointment(lead.id, lead.appointment_date)}
                            className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit appointment date"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleCall(lead)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                          title="Call Lead"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => convertToCustomerMutation.mutate(lead.id)}
                          disabled={convertToCustomerMutation.isLoading}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition duration-200 disabled:opacity-50"
                          title="Convert to Customer"
                        >
                          <User className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="Edit Lead"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredLeads.length === 0 && (
            <div className="py-16 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lead
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
              {/* Card Header with Avatar */}
              <div className="bg-white p-6 text-black">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <span className="text-black font-bold text-xl">
                      {lead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{lead.name || 'Unknown Lead'}</h3>
                    <p className="text-gray-600 text-sm">ID: {lead.id}</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="font-medium">{lead.phone}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {getStatusIcon(lead.status)}
                      <span className="ml-1">{lead.status}</span>
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-2" />
                    Created {new Date(lead.created_at).toLocaleDateString()}
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <p className="line-clamp-2">{lead.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleCall(lead)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Phone className="h-5 w-5" />
                    Call Now
                  </button>
                  <button
                    onClick={() => convertToCustomerMutation.mutate(lead.id)}
                    disabled={convertToCustomerMutation.isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <User className="h-5 w-5" />
                    Convert to Customer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State for Cards */}
          {filteredLeads.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lead
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadList;
