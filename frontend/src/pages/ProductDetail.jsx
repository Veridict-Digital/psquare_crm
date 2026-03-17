import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  Tag, 
  Package, 
  DollarSign, 
  BarChart3, 
  Grid3X3,
  Hash,
  Percent,
  Image as ImageIcon,
  Edit,
  ArrowLeft,
  Layers,
  Info,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await axios.get(`api/products/${id}/`);
      return response.data;
    },
  });

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading product details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Error Loading Product</h2>
        <p className="text-gray-600 text-center mb-6">{error.message}</p>
        <Link 
          to="/products" 
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 text-center"
        >
          Back to Products
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <Link 
            to={`/products/edit/${product?.id}`}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200 shadow-lg shadow-blue-500/25"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Product
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Product Image */}
            <div className="md:w-1/3 flex items-center justify-center">
              {product?.image ? (
                <img
                  src={product.image.startsWith('http') ? product.image : `${axios.defaults.baseURL.replace(/\/$/, '')}${product.image}`}
                  alt={product.title}
                  className="w-40 h-40 object-contain rounded-lg border"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 w-40 bg-gray-100 rounded-lg">
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-gray-500 text-sm">No image</span>
                </div>
              )}
            </div>
            {/* Product Info Table */}
            <div className="md:w-2/3">
              <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">Product Name</td>
                    <td className="px-4 py-3 border-b border-gray-200">{product?.title}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">Product ID</td>
                    <td className="px-4 py-3 border-b border-gray-200">{product?.pid || product?.id}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">SKU</td>
                    <td className="px-4 py-3 border-b border-gray-200">{product?.sku}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">Category</td>
                    <td className="px-4 py-3 border-b border-gray-200">{product?.category_display || product?.category || 'Uncategorized'}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">Stock Quantity</td>
                    <td className="px-4 py-3 border-b border-gray-200">{product?.stock_qty}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">MRP</td>
                    <td className="px-4 py-3 border-b border-gray-200">{formatCurrency(product?.mrp)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="font-semibold px-4 py-3 border-b border-gray-200">Price</td>
                    <td className="px-4 py-3 border-b border-gray-200">{formatCurrency(product?.price)}</td>
                  </tr>
                </tbody>
              </table>
              {product?.use_case && (
                <div className="mt-6">
                  <div className="font-semibold text-gray-700 mb-1">Use Case</div>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-800 whitespace-pre-wrap text-sm">{product.use_case}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;