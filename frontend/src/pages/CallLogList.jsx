import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Phone, CheckCircle, Clock, TrendingUp, Users, Calendar, Filter, Search, Grid, List, PhoneCall, User, MessageSquare } from 'lucide-react';

const CallLogList = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterOrderPlaced, setFilterOrderPlaced] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCallLog, setSelectedCallLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: callLogsData, isLoading, error, refetch, isError } = useQuery({
    queryKey: ['callLogs', filterStatus, filterEmployee, filterOrderPlaced, search, currentPage],
    queryFn: async () => {
      const params = {
        page: currentPage,
        search: search
      };
      if (filterStatus) params.status = filterStatus;
      if (filterEmployee) params.employee = filterEmployee;
      if (filterOrderPlaced) params.order_placed = filterOrderPlaced;

      console.log('Fetching call logs with params:', params); // Debug log
      const response = await axios.get('/api/calllogs/', { params });
      console.log('API Response:', response); // Debug log
      return response.data;
    },
    retry: 1,
  });

  // Fetch statistics from server for KPIs (uses all data, not paginated)
  const { data: statisticsData } = useQuery({
    queryKey: ['callLogsStatistics', filterStatus, filterEmployee, filterOrderPlaced, search],
    queryFn: async () => {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterEmployee) params.employee = filterEmployee;
      if (filterOrderPlaced) params.order_placed = filterOrderPlaced;
      if (search) params.search = search;

      const response = await axios.get('/api/calllogs/statistics/', { params });
      return response.data;
    },
    retry: 1,
  });

  const callLogs = callLogsData?.results || [];
  const totalCount = callLogsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 15); // Assuming page_size is 15

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/calllogs/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['callLogs']);
    },
  });

  const filteredCallLogs = callLogs?.filter(callLog =>
    callLog.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle 500 error specifically
  if (isError) {
    console.error('Error details:', error); // Debug log

    // Check if it's a 500 error
    if (error.response?.status === 500) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <h2 className="font-bold text-lg mb-2">Server Error (500)</h2>
            <p className="mb-2">There's an issue with the Django backend server.</p>
            <p className="mb-4 text-sm">Check your Django terminal logs for the exact error.</p>

            <div className="bg-gray-800 text-white p-4 rounded-md text-sm font-mono overflow-x-auto">
              <p>Common causes:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Database connection issues</li>
                <li>Missing model or serializer</li>
                <li>Syntax error in views.py or serializers.py</li>
                <li>Permission/authentication issues</li>
              </ul>
            </div>

            <button
              onClick={() => refetch()}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-red-500 text-center">
        Error loading call logs: {error.message}
      </div>
    );
  }

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );

  // Calculate KPIs from server statistics (all data, not paginated)
  const totalCalls = statisticsData?.total_calls || 0;
  const completedCalls = statisticsData?.completed_calls || 0;
  const pendingCalls = statisticsData?.pending_calls || 0;
  const ordersPlaced = statisticsData?.orders_placed || 0;
  const conversionRate = statisticsData?.conversion_rate || 0;
  // For average duration from server, show in min:sec format
  const avgDurationSec = statisticsData?.avg_duration_seconds || 0;
  const avgDuration = avgDurationSec >= 60
    ? `${Math.floor(avgDurationSec / 60)} min ${Math.round(avgDurationSec % 60)} sec`
    : `${Math.round(avgDurationSec)} sec`;

  // Helper to format duration
  const formatDuration = (durationMinutes) => {
    if (!durationMinutes && durationMinutes !== 0) return '-';
    const totalSec = Math.round(durationMinutes * 60);
    if (totalSec < 60) return `${totalSec} sec`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min} min${sec > 0 ? ` ${sec} sec` : ''}`;
  };

  // Get unique employees for filter
  const uniqueEmployees = [...new Set(callLogs?.map(call => call.employee_name).filter(Boolean))];

  // Apply all filters
  const finalFilteredCallLogs = filteredCallLogs?.filter(callLog => {
    if (filterEmployee && callLog.employee_name !== filterEmployee) return false;
    if (filterOrderPlaced && callLog.order_placed !== filterOrderPlaced) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-full">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-3xl font-bold text-gray-900">{totalCalls}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <PhoneCall className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Calls</p>
                <p className="text-3xl font-bold text-green-600">{completedCalls}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-purple-600">{conversionRate}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-3xl font-bold text-orange-600">{avgDuration}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                >
                  <option value="">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Employee Filter */}
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
              >
                <option value="">All Employees</option>
                {uniqueEmployees.map(employee => (
                  <option key={employee} value={employee}>{employee}</option>
                ))}
              </select>

              {/* Order Placed Filter */}
              <select
                value={filterOrderPlaced}
                onChange={(e) => setFilterOrderPlaced(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
              >
                <option value="">All Orders</option>
                <option value="Yes">Order Placed</option>
                <option value="No">No Order</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${viewMode === 'table'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm font-medium">Table</span>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${viewMode === 'card'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm font-medium">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finalFilteredCallLogs?.length > 0 ? (
                    finalFilteredCallLogs.map(callLog => (
                      <tr key={callLog.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-900">{callLog.call_id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{callLog.customer_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{callLog.employee_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(callLog.duration_minutes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(callLog.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${callLog.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {callLog.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {callLog.order_id ? (
                            <Link
                              to={`/orders/${callLog.order_pk}`}
                              className="text-blue-600 hover:text-blue-900 font-medium transition-colors duration-200"
                            >
                              {callLog.order_id}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedCallLog(callLog);
                                setShowNotesModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                              title="View Notes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* <button
                              onClick={() => navigate(`/calllogs/${callLog.id}/edit`)}
                              className="text-green-600 hover:text-green-900 transition-colors duration-200"
                              title="Edit"
                            >
                              Edit
                            </button> */}
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this call log?')) {
                                  deleteMutation.mutate(callLog.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <PhoneCall className="w-12 h-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No call logs found</h3>
                          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalFilteredCallLogs?.length > 0 ? (
              finalFilteredCallLogs.map(callLog => (
                <div key={callLog.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <PhoneCall className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{callLog.customer_name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{callLog.call_id}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${callLog.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {callLog.status}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Employee:</span>
                      <span className="text-sm font-medium text-gray-900">{callLog.employee_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Duration:</span>
                      <span className="text-sm font-medium text-gray-900">{formatDuration(callLog.duration_minutes)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Date:</span>
                      <span className="text-sm font-medium text-gray-900">{new Date(callLog.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Order:</span>
                      {callLog.order_id ? (
                        <Link
                          to={`/orders/${callLog.order_pk}`}
                          className="text-blue-600 hover:text-blue-900 font-medium transition-colors duration-200"
                        >
                          {callLog.order_id}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">No order</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedCallLog(callLog);
                        setShowNotesModal(true);
                      }}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-900 transition-colors duration-200"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-sm font-medium">Notes</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/calllogs/${callLog.id}/edit`)}
                        className="text-green-600 hover:text-green-900 transition-colors duration-200"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this call log?')) {
                            deleteMutation.mutate(callLog.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <PhoneCall className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No call logs found</h3>
                <p className="text-gray-500 text-center">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 15) + 1} to {Math.min(currentPage * 15, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === pageNum
                          ? 'text-blue-600 bg-blue-50 border border-blue-500'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && selectedCallLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full relative border border-gray-200 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    setSelectedCallLog(null);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <span className="text-2xl font-bold">&times;</span>
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Call Details</h2>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Customer</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{selectedCallLog.customer_name}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <PhoneCall className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Call ID</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{selectedCallLog.call_id}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Employee</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{selectedCallLog.employee_name}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Date</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{new Date(selectedCallLog.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Call Notes</label>
                  <div className="w-full p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[120px] whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
                    {selectedCallLog.note || 'No notes available for this call.'}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowNotesModal(false);
                      setSelectedCallLog(null);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                  >
                    Close
                  </button>
                  {/* <button
                    onClick={() => {
                      navigate(`/calllogs/${selectedCallLog.id}/edit`);
                      setShowNotesModal(false);
                      setSelectedCallLog(null);
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    Edit Call Log
                  </button> */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallLogList;
