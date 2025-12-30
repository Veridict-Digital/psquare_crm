import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const OrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await axios.get(`/api/orders/${id}/`);
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    customer: '',
    agent: '',
    total_amount: 0,
    paid_amount: 0,
    status: 'Placed',
    payment_status: 'Paid',
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customer: order.customer || '',
        agent: order.agent || '',
        total_amount: order.total_amount || 0,
        paid_amount: order.paid_amount || 0,
        status: order.status || 'Placed',
        payment_status: order.payment_status || 'Paid',
      });
    }
  }, [order]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(`/api/orders/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      navigate('/orders');
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center">Error loading order: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Order</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Customer ID</label>
          <input
            type="text"
            name="customer"
            value={formData.customer}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Agent ID</label>
          <input
            type="text"
            name="agent"
            value={formData.agent}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Total Amount</label>
          <input
            type="number"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Paid Amount</label>
          <input
            type="number"
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="Placed">Placed</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Payment Status</label>
          <select
            name="payment_status"
            value={formData.payment_status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          >
            <option value="Paid">Paid</option>
            <option value="Credit">Credit</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'Updating...' : 'Update Order'}
        </button>
      </form>
    </div>
  );
};

export default OrderEdit;
