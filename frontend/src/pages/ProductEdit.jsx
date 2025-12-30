import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await axios.get(`/api/products/${id}/`);
      return response.data;
    },
  });

  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    category: '',
    stock_qty: 0,
    price: 0,
    cost: 0,
    gst_rate: 0,
    image: null,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        title: product.title || '',
        category: product.category || '',
        stock_qty: product.stock_qty || 0,
        price: product.price || 0,
        cost: product.cost || 0,
        gst_rate: product.gst_rate || 0,
        image: null,
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      const response = await axios.put(`/api/products/${id}/`, formData, {
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
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center">Error loading product: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
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
          {mutation.isLoading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductEdit;
