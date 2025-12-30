import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

const ProductNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    category: '',
    stock_qty: 0,
    mrp: 0,
    b2c_price: 0,
    b2b_price: 0,
    price: 0,
    cost: 0,
    gst_rate: 0,
    gst_calculated_amount: 0,
    use_case: '',
    image: null,
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const response = await axios.post('/api/products/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      navigate('/products');
    },
  });

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">SKU</label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Stock Quantity</label>
          <input
            type="number"
            name="stock_qty"
            value={formData.stock_qty}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Cost</label>
          <input
            type="number"
            name="cost"
            value={formData.cost}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">MRP</label>
          <input
            type="number"
            name="mrp"
            value={formData.mrp}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">B2C Price</label>
          <input
            type="number"
            name="b2c_price"
            value={formData.b2c_price}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">B2B Price</label>
          <input
            type="number"
            name="b2b_price"
            value={formData.b2b_price}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">GST Rate</label>
          <input
            type="number"
            name="gst_rate"
            value={formData.gst_rate}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">GST Calculated Amount</label>
          <input
            type="number"
            name="gst_calculated_amount"
            value={formData.gst_calculated_amount}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Use Case</label>
          <textarea
            name="use_case"
            value={formData.use_case}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            rows="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Image</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            accept="image/*"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={mutation.isLoading}
        >
          {mutation.isLoading ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductNew;
