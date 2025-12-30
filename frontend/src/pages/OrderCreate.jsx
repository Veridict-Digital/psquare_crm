import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

const OrderCreate = () => {
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    quantity: 1,
    total_amount: 0,
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/orders/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      alert('Order created successfully!');
    },
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-full">
      <h1 className="text-2xl font-bold mb-4">Create Order</h1>
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
          <label className="block text-sm font-medium">Product ID</label>
          <input
            type="text"
            name="product"
            value={formData.product}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
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
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'Creating...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
};

export default OrderCreate;
