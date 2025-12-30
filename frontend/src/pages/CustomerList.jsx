import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { useState } from 'react';
import { useCallPopup } from '../context/CallPopupContext';
import { Link } from 'react-router-dom';

const CustomerList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await axios.get('api/customers/');
      return response.data;
    },
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const { openPopup } = useCallPopup();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading customers</div>;

  const handleCall = (customer) => {
    setSelectedCustomer(customer);
    openPopup(customer);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link to="/customers/new" className="bg-green-500 text-white px-4 py-2 rounded">
          Add New Customer
        </Link>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Table View
        </button>
        <button
          onClick={() => setViewMode('card')}
          className={`px-4 py-2 rounded ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Card View
        </button>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                    {customer.id ? (
                      <Link to={`/customers/${customer.id}`} className="font-medium">
                        {customer.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{customer.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.agent_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {customer.id && (
                        <Link to={`/customers/edit/${customer.id}`} className="text-blue-600 hover:text-blue-900">
                          Edit
                        </Link>
                      )}
                      <button
                        onClick={() => handleCall(customer)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Call Now
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((customer) => (
                <div key={customer.id || Math.random()} className="bg-white p-4 rounded shadow hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-semibold text-gray-900">{customer.name}</h2>
              <p className="text-gray-600">{customer.email}</p>
              <p className="text-gray-600">{customer.phone}</p>
              <p className="text-gray-600 text-sm">Agent: {customer.agent_name}</p>
              <div className="mt-2 flex gap-2">
                {customer.id && (
                  <Link to={`/customers/edit/${customer.id}`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Edit
                  </Link>
                )}
                <button
                  onClick={() => handleCall(customer)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Call Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerList;
