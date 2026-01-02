import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { useState } from 'react';
import { useCallPopup } from '../context/CallPopupContext';
import { Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp,
  Users,
  Building,
  AlertCircle
} from 'lucide-react';

const CustomerList = () => {
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'table' or 'card'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { openPopup } = useCallPopup();

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await axios.get('api/customers/');
      return response.data;
    },
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Extract unique agents for filter
  const agents = [...new Set(data?.map(customer => customer.agent_name).filter(Boolean))];

  // Filter and search customers
  const filteredCustomers = data?.filter(customer =>
    customer.name?.toLowerCase().includes(search.toLowerCase()) ||
    customer.email?.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone?.includes(search) ||
    customer.id?.toString().includes(search)
  ).filter(customer =>
    !filterAgent || customer.agent_name === filterAgent
  ) || [];

  // Calculate stats
  const totalCustomers = filteredCustomers.length;
  const totalOrderValue = filteredCustomers.reduce((sum, customer) => sum + (customer.total_order_value || 0), 0);
  const activeAgents = new Set(filteredCustomers.map(customer => customer.agent_name).filter(Boolean)).size;
  const avgOrderValue = totalCustomers > 0 ? totalOrderValue / totalCustomers : 0;

  const handleCall = (customer) => {
    setSelectedCustomer(customer);
    openPopup(customer);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading customers...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Error Loading Customers</h2>
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
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link to="/customers/new" className="bg-green-500 text-white px-4 py-2 rounded">
          Add New Customer
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          {/* Agent Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Order Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalOrderValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">{activeAgents}</p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Order Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(avgOrderValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Value</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link
                              to={`/customers/${customer.id}`}
                              className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition duration-200"
                            >
                              {customer.name}
                            </Link>
                            <div className="text-xs text-gray-500">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.email || 'No email'}
                          </div>
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {customer.pincode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <User className="h-3 w-3 mr-1" />
                          {customer.agent_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(customer.total_order_value)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/customers/edit/${customer.id}`}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                            title="Edit Customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleCall(customer)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition duration-200"
                            title="Call Customer"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {filteredCustomers.length === 0 && (
              <div className="py-16 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <Link
                  to="/customers/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                {/* Card Header with Avatar */}
                <div className="bg-white p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-white font-bold text-xl">
                        {customer.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                      <p className="text-gray-600 text-sm">ID: {customer.id}</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="truncate">{customer.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                        <span>{customer.pincode}</span>
                      </div>
                    </div>

                    {/* Agent Badge */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <User className="h-3 w-3 mr-1" />
                        {customer.agent_name || 'Unassigned'}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(customer.total_order_value)}
                      </span>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-2" />
                      Joined {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-2">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                    <Link
                      to={`/customers/edit/${customer.id}`}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </div>

                  {/* Call Button */}
                  <button
                    onClick={() => handleCall(customer)}
                    className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Phone className="h-4 w-4" />
                    Call Now
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State for Cards */}
            {filteredCustomers.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                <Link
                  to="/customers/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Link>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default CustomerList;
