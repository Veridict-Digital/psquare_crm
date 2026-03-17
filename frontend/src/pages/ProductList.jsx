import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Tag,
  DollarSign,
  Percent,
  AlertCircle,
  Check,
  X,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductList = () => {
    // Helper to get absolute image URL
    const getImageUrl = (image) => {
      if (!image) return null;
      if (image.startsWith('http')) return image;
      return `${axios.defaults.baseURL?.replace(/\/$/, '')}${image.startsWith('/') ? image : '/' + image}`;
    };
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const queryClient = useQueryClient();

  // Fetch products
  const { 
    data: productsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['products', filterCategory],
    queryFn: async () => {
      const params = {};
      if (filterCategory) params.category = filterCategory;
      const response = await axios.get('api/products/', { params });
      return response.data;
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await axios.delete(`api/products/${productId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product');
      console.error('Delete error:', error);
    }
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stockQty }) => {
      const response = await axios.patch(`api/products/${productId}/`, {
        stock_qty: parseInt(stockQty)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Stock updated successfully');
      setEditingStock(null);
    },
    onError: (error) => {
      toast.error('Failed to update stock');
      console.error('Update stock error:', error);
    }
  });

  // Extract categories for filter
  const categories = [...new Set(productsData?.map(product => product.category).filter(Boolean))];

  // Filter and search products
  const filteredProducts = productsData?.filter(product =>
    product.title?.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase()) ||
    product.id?.toString().includes(search) ||
    product.pid?.toString().includes(search)
  ) || [];

  // Calculate profit for each product
  const calculateProfit = (product) => {
    if (!product.price || !product.cost) return 0;
    return ((product.price - product.cost) / product.cost * 100).toFixed(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Handle delete
  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteMutation.mutate(productId);
    }
  };

  // Handle stock edit
  const handleStockEdit = (productId, currentStock) => {
    setEditingStock(productId);
    setStockValue(currentStock.toString());
  };

  const handleStockSave = () => {
    if (stockValue && !isNaN(stockValue)) {
      updateStockMutation.mutate({
        productId: editingStock,
        stockQty: parseInt(stockValue)
      });
    }
  };

  const handleStockCancel = () => {
    setEditingStock(null);
    setStockValue('');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Error Loading Products</h2>
        <p className="text-gray-600 text-center mb-6">{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Inventory</h1>
              <p className="text-gray-600">Manage and track your products efficiently</p>
            </div>
            <Link 
              to="/products/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 shadow-lg shadow-green-500/25"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Product
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{filteredProducts.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(filteredProducts.reduce((sum, p) => sum + (p.price * p.stock_qty), 0))}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Margin</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {filteredProducts.length > 0 
                      ? `${(filteredProducts.reduce((sum, p) => sum + parseFloat(calculateProfit(p)), 0) / filteredProducts.length).toFixed(1)}%`
                      : '0%'
                    }
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {filteredProducts.filter(p => p.stock_qty < 10).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200">
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category & GST
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock & Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Pricing Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Profit Margin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition duration-150">
                    {/* Product Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={getImageUrl(product.image)}
                              alt={product.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <Package className="h-6 w-6 text-blue-600" style={{ display: product.image ? 'none' : 'block' }} />
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/products/${product.id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition duration-200"
                          >
                            {product.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Hash className="h-3 w-3 mr-1" />
                              PID: {product.pid || product.id}
                            </span>
                            <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                            <span className="text-xs text-gray-500">HSN: {product.hsn || 'N/A'}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Unit: {product.unit || 'N/A'} | Volume: {product.volume || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & GST */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.category_display || 'Uncategorized'}
                        </span>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">GST:</span> {product.gst_rate_display || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Stock & Status */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {editingStock === product.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={stockValue}
                              onChange={(e) => setStockValue(e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={handleStockSave}
                              disabled={updateStockMutation.isLoading}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleStockCancel}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`text-sm font-medium ${product.stock_qty < 10 ? 'text-red-600' : product.stock_qty < 50 ? 'text-yellow-600' : 'text-gray-900'}`}>
                                {product.stock_qty} units
                              </span>
                              {product.stock_qty < 10 && (
                                <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
                              )}
                              {product.stock_qty >= 10 && product.stock_qty < 50 && (
                                <AlertCircle className="h-4 w-4 text-yellow-500 ml-1" />
                              )}
                            </div>
                            <button
                              onClick={() => handleStockEdit(product.id, product.stock_qty)}
                              className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Pricing Details */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-900">
                          MRP: {formatCurrency(product.mrp || 0)}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          price: {formatCurrency(product.price || 0)}
                        </div>
                      </div>
                    </td>

                    {/* Profit Margin */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${calculateProfit(product) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {calculateProfit(product)}%
                          </span>
                          {calculateProfit(product) > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Profit: {formatCurrency((product.price - product.purchase_price) * product.stock_qty)}
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate" title={product.description}>
                          {product.description || 'No description'}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-gray-500 mt-1">
                            Brand: {product.brand}
                          </p>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/products/${product.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/products/edit/${product.id}`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteMutation.isLoading}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200 disabled:opacity-50"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="py-16 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <Link
                to="/products/new"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Link>
            </div>
          )}

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                <span className="font-semibold">
                  {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                </span>{' '}
                of <span className="font-semibold">{filteredProducts.length}</span> products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-1 rounded-lg transition duration-200 ${
                      currentPage === idx + 1
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition duration-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;