import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Plus, 
  X, 
  Upload, 
  Package, 
  Tag, 
  BarChart3, 
  DollarSign, 
  Percent,
  Briefcase,
  FileText,
  Image as ImageIcon,
  Save,
  ArrowLeft
} from 'lucide-react';

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
    gst_rate: '',
    gst_calculated_amount: 0,
    use_case: '',
    image: null,
  });

  const [showNewGSTRateForm, setShowNewGSTRateForm] = useState(false);
  const [newGSTRate, setNewGSTRate] = useState({ name: '', rate: '', description: '' });

  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const { data: gstRates, isLoading: gstRatesLoading } = useQuery({
    queryKey: ['gstRates'],
    queryFn: async () => {
      const response = await axios.get('/api/gstrates/');
      return response.data;
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get('/api/categories/');
      return response.data;
    },
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
      toast.success('Product created successfully!');
      navigate('/products');
    },
    onError: (error) => {
      toast.error('Failed to create product');
      console.error('Error creating product:', error);
    },
  });

  const gstRateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/gstrates/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gstRates']);
      setShowNewGSTRateForm(false);
      setNewGSTRate({ name: '', rate: '', description: '' });
      toast.success('GST Rate added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add GST Rate');
      console.error('Error adding GST Rate:', error);
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/categories/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowNewCategoryForm(false);
      setNewCategory({ name: '', description: '' });
      toast.success('Category added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add Category');
      console.error('Error adding Category:', error);
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

  const handleGSTRateChange = (e) => {
    setNewGSTRate({ ...newGSTRate, [e.target.name]: e.target.value });
  };

  const handleGSTRateSubmit = (e) => {
    e.preventDefault();
    gstRateMutation.mutate(newGSTRate);
  };

  const handleCategoryChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    categoryMutation.mutate(newCategory);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Products</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create New Product</h1>
              <p className="text-gray-600 mt-1">Add a new product to your inventory</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-200">
                <Tag className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">Product Information</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      SKU Code
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter SKU code"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                </div>

                {/* Category and Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Category
                    </label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Category
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock_qty"
                      value={formData.stock_qty}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      min="0"
                      required
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="w-6 h-6 text-green-500" />
                    <h3 className="text-lg font-bold text-gray-800">Pricing Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Cost Price
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₹
                        </div>
                        <input
                          type="number"
                          name="cost"
                          value={formData.cost}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        MRP
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₹
                        </div>
                        <input
                          type="number"
                          name="mrp"
                          value={formData.mrp}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* GST and Use Case */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-500" />
                      GST Rate
                    </label>
                    <div className="relative">
                      <select
                        name="gst_rate"
                        value={formData.gst_rate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="">Select GST Rate</option>
                        {gstRates?.map((rate) => (
                          <option key={rate.id} value={rate.id}>
                            {rate.rate}%
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewGSTRateForm(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add New GST Rate
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      Use Case
                    </label>
                    <textarea
                      name="use_case"
                      value={formData.use_case}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows="3"
                      placeholder="Describe product usage scenarios..."
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    Product Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors">
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">
                        {formData.image ? formData.image.name : 'Drag & drop or click to upload'}
                      </p>
                      <label className="cursor-pointer">
                        <span className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Choose File
                        </span>
                        <input
                          type="file"
                          name="image"
                          onChange={handleChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-2">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={mutation.isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {mutation.isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Create Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <BarChart3 className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-bold text-gray-800">Summary</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium">SKU Preview</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">
                    {formData.sku || 'Not set'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">
                      {categories?.find(c => c.id === formData.category)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium">{formData.stock_qty} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">₹{formData.cost || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">MRP:</span>
                    <span className="font-medium">₹{formData.mrp || '0.00'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">GST Rate:</span>
                    <span className="font-medium">
                      {gstRates?.find(g => g.id === formData.gst_rate)?.rate || 'Not selected'}%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">All fields marked with</p>
                    <p className="text-sm text-gray-600">
                      <span className="text-red-500">*</span> are required
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New GST Rate Modal */}
      {showNewGSTRateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Percent className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add GST Rate</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewGSTRateForm(false);
                    setNewGSTRate({ name: '', rate: '', description: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleGSTRateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Rate Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newGSTRate.name}
                    onChange={handleGSTRateChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Standard GST"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="rate"
                      value={newGSTRate.rate}
                      onChange={handleGSTRateChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      step="0.01"
                      placeholder="18.00"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={newGSTRate.description}
                    onChange={handleGSTRateChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewGSTRateForm(false);
                      setNewGSTRate({ name: '', rate: '', description: '' });
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={gstRateMutation.isLoading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gstRateMutation.isLoading ? 'Adding...' : 'Add Rate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal */}
      {showNewCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewCategoryForm(false);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Electronics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={newCategory.description}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the category..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryForm(false);
                      setNewCategory({ name: '', description: '' });
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={categoryMutation.isLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {categoryMutation.isLoading ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductNew;