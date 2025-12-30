import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const OrderList = () => {
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', filterAgent, filterDate],
    queryFn: async () => {
      const params = {};
      if (filterAgent) params.agent = filterAgent;
      if (filterDate) params.order_date = filterDate;
      const response = await axios.get('api/orders/', { params });
      return response.data;
    },
  });

  const filteredOrders = orders?.filter(order =>
    (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase())) ||
    (order.order_id && order.order_id.toLowerCase().includes(search.toLowerCase())) ||
    order.id.toString().includes(search)
  );

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center">Error loading orders: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Link to="/orders/new" className="bg-green-500 text-white px-4 py-2 rounded">
          Add New Order
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
        <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="">All Agents</option>
          {/* Add agent options dynamically */}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders?.map(order => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                    {order.order_id || `ORD-${order.id}`}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.agent_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{order.total_amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'Dispatched' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.payment_status}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <>
                    <Link to={`/orders/edit/${order.id}`} className="text-blue-600 hover:text-blue-900 mr-2">Edit</Link>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderList;
