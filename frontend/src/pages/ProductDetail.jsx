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

  // Calculate profit margin
  const calculateProfitMargin = () => {
    if (!product?.cost || !product?.price) return 0;
    return (((product.price - product.cost) / product.cost) * 100).toFixed(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center text-gray-600 hover:text-blue-600 transition duration-200 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
              <p className="text-gray-600 mt-2">Comprehensive view of product information and metrics</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200 shadow-sm"
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
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Image and Basic Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Product Image */}
                  <div className="lg:w-2/5">
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden aspect-square relative">
                      {product?.image ? (
                        <div className="h-full flex items-center justify-center p-4">
                          {(() => {
                            let imgSrc = '';
                            try {
                              if (product.image.startsWith('data:')) {
                                imgSrc = product.image;
                              } else if (product.image.startsWith('http') || product.image.startsWith('/')) {
                                imgSrc = product.image.startsWith('http') ? product.image : `${axios.defaults.baseURL.replace(/\/$/, '')}${product.image}`;
                              } else {
                                imgSrc = `data:image/jpeg;base64,${product.image}`;
                              }
                            } catch (e) {
                              imgSrc = '';
                            }

                            return (
                              <img
                                src={imgSrc}
                                alt={product.title}
                                className="w-full h-full object-contain rounded-lg"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.parentElement.innerHTML = `
                                    <div class="flex flex-col items-center justify-center h-full p-8">
                                      <ImageIcon class="h-16 w-16 text-gray-400 mb-4" />
                                      <p class="text-gray-500 text-center">Image not available</p>
                                    </div>
                                  `;
                                }}
                              />
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8">
                          <ImageIcon className="h-20 w-20 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-center">No image available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Product Information */}
                  <div className="lg:w-3/5">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <ShoppingBag className="h-6 w-6 text-blue-600" />
                          <h2 className="text-2xl font-bold text-gray-900">{product?.title}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <Tag className="h-3 w-3 mr-1" />
                            {product?.category || 'Uncategorized'}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${product?.stock_qty > 10 ? 'bg-green-100 text-green-800' : product?.stock_qty > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            <Package className="h-3 w-3 mr-1" />
                            {product?.stock_qty} in stock
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <Hash className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Product ID</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{product?.pid || product?.id}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <Grid3X3 className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">SKU</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{product?.sku}</p>
                      </div>
                    </div>

                    {/* Pricing Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                      <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                        <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                        Pricing Overview
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Selling Price</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(product?.price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Cost</p>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(product?.cost)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Margin</p>
                          <p className="text-xl font-bold text-green-600">{calculateProfitMargin()}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Use Case Section */}
            {product?.use_case && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <Info className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-bold text-gray-900">Use Case</h3>
                  </div>
                  <div className="prose prose-blue max-w-none">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{product.use_case}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Detailed Information */}
          <div className="space-y-8">
            {/* Pricing Details Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <DollarSign className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Pricing Details</h3>
                </div>
                <div className="space-y-4">
                  {product?.mrp && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <span className="text-gray-700">MRP</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(product.mrp)}</span>
                    </div>
                  )}
                  {product?.b2c_price && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <span className="text-gray-700">B2C Price</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(product.b2c_price)}</span>
                    </div>
                  )}
                  {product?.b2b_price && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <span className="text-gray-700">B2B Price</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(product.b2b_price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-700">Current Price</span>
                    </div>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(product?.price)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="flex items-center">
                      <span className="text-gray-700">Cost</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(product?.cost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center">
                      <Percent className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-700">GST Rate</span>
                    </div>
                    <span className="font-semibold text-gray-900">{product?.gst_rate}%</span>
                  </div>
                  {product?.gst_calculated_amount && (
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium">GST Amount</span>
                        <span className="font-bold text-blue-700">{formatCurrency(product.gst_calculated_amount)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stock & Metrics Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <BarChart3 className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Stock & Metrics</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Stock Quantity</span>
                      <span className="text-2xl font-bold text-gray-900">{product?.stock_qty}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${product?.stock_qty > 50 ? 'bg-green-500' : product?.stock_qty > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(product?.stock_qty, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">Profit Margin</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{calculateProfitMargin()}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Layers className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800">Category</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900 truncate">{product?.category || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>           
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;