import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';

const CallLogList = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: callLogs, isLoading, error, refetch, isError } = useQuery({
    queryKey: ['callLogs', filterStatus],
    queryFn: async () => {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      console.log('Fetching call logs with params:', params); // Debug log
      const response = await axios.get('/api/calllogs/', { params });
      console.log('API Response:', response); // Debug log
      return response.data;
    },
    retry: 1,
  });

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <h1 className="text-3xl font-bold mb-6">Call Logs</h1>
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search call logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full md:w-auto"
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="px-4 py-2 border rounded-lg w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (min)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Placed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCallLogs?.length > 0 ? (
              filteredCallLogs.map(callLog => (
                <tr key={callLog.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{callLog.call_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{callLog.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{callLog.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{callLog.employee_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{callLog.duration_minutes?.toFixed(2)} min</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(callLog.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      callLog.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {callLog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      callLog.order_placed === 'Yes'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {callLog.order_placed}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                    {callLog.order_id ? (
                      <Link to={`/orders/${callLog.order_pk}`} className="text-blue-600 hover:text-blue-900">
                        {callLog.order_id}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/calllogs/${callLog.id}/edit`)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this call log?')) {
                          deleteMutation.mutate(callLog.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                  No call logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CallLogList;