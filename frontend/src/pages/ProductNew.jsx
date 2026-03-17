import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Plus,
  X,
  Upload,
  Package,
  Tag,
  Percent,
  Briefcase,
  Image as ImageIcon,
  Save,
  ArrowLeft,
} from "lucide-react";

const ProductNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    sku: "",
    hsn: "",
    title: "",
    category: "",
    stock_qty: 0,
    mrp: 0,
    b2c_price: 0,
    b2b_price: 0,
    price: 0,
    purchase_price: 0,
    product_volume: 0,
    unit: "",
    product_weight: 0,
    gst_rate: "",
    gst_calculated_amount: 0,
    use_case: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [showNewGSTRateForm, setShowNewGSTRateForm] = useState(false);
  const [newGSTRate, setNewGSTRate] = useState({
    name: "",
    rate: "",
    description: "",
  });

  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  const [showNewUnitForm, setShowNewUnitForm] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

  const { data: gstRates } = useQuery({
    queryKey: ["gstRates"],
    queryFn: async () => {
      const response = await axios.get("/api/gstrates/");
      return response.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categories/");
      return response.data;
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await axios.get("/api/units/");
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log("===== MUTATION START =====");
      console.log("Raw data received:", JSON.stringify(data, (key, value) => {
        if (key === 'image') {
          return value instanceof File ? `File: ${value.name}` : value;
        }
        return value;
      }, 2));
      
      const formDataToSend = new FormData();
      
      // IMPORTANT: Append fields in a specific order
      // First append all non-file fields
      Object.keys(data).forEach((key) => {
        const value = data[key];
        
        if (key !== 'image' && value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, String(value));
          console.log(`Appended ${key}:`, String(value));
        }
      });
      
      // Then append the image file LAST (important!)
      if (data.image instanceof File) {
        console.log("✅ Appending image file:", {
          name: data.image.name,
          size: data.image.size,
          type: data.image.type
        });
        formDataToSend.append('image', data.image);
      } else {
        console.log("❌ No valid image file to append");
      }
      
      // Log final FormData contents
      console.log("===== FINAL FORMDATA CONTENTS =====");
      for (let pair of formDataToSend.entries()) {
        if (pair[0] === 'image') {
          const file = pair[1];
          console.log(`image: [FILE] ${file.name} (${file.size} bytes, ${file.type})`);
        } else {
          console.log(`${pair[0]}:`, pair[1]);
        }
      }
      
      try {
        console.log("===== SENDING REQUEST =====");
        
        // Create a new axios instance for this request to avoid any interceptors issues
        const response = await axios({
          method: 'post',
          url: '/api/products/',
          data: formDataToSend,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log("Response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created successfully!");
      navigate("/products");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error(error.response?.data?.message || "Failed to create product");
    },
  });

  const gstRateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/gstrates/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["gstRates"]);
      setShowNewGSTRateForm(false);
      setNewGSTRate({ name: "", rate: "", description: "" });
      toast.success("GST Rate added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add GST Rate");
      console.error("Error adding GST Rate:", error);
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/categories/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setShowNewCategoryForm(false);
      setNewCategory({ name: "", description: "" });
      toast.success("Category added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add Category");
      console.error("Error adding Category:", error);
    },
  });

  const unitMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/units/", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["units"]);
      setShowNewUnitForm(false);
      setNewUnit({ name: "", description: "" });
      toast.success("Unit added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add Unit");
      console.error("Error adding Unit:", error);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    console.log(`handleChange - ${name}:`, { type, value, files: files?.length });
    
    if (type === "file") {
      // Handle file input
      if (files && files.length > 0) {
        const file = files[0];
        console.log("File selected details:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });
        
        // IMPORTANT: Create a new File object to ensure it's preserved
        const fileObj = new File([file], file.name, { type: file.type });
        
        setFormData(prev => ({ 
          ...prev, 
          [name]: fileObj 
        }));
        
        // Create image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log("Image preview created");
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        console.log("No file selected");
        setFormData(prev => ({ ...prev, [name]: null }));
        setImagePreview(null);
      }
    } else if (type === "number") {
      // Handle number inputs
      setFormData(prev => ({ 
        ...prev, 
        [name]: value === "" ? "" : parseFloat(value) || 0 
      }));
    } else {
      // Handle text inputs
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.sku || !formData.hsn || !formData.title || !formData.category || !formData.gst_rate) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    console.log("===== SUBMITTING FORM =====");
    console.log("Form data being submitted:", {
      ...formData,
      image: formData.image instanceof File ? 
        `File: ${formData.image.name} (${formData.image.size} bytes)` : 
        formData.image
    });
    
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

  const handleUnitChange = (e) => {
    setNewUnit({ ...newUnit, [e.target.name]: e.target.value });
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    unitMutation.mutate(newUnit);
  };

  const removeImage = () => {
    console.log("Removing image");
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-2">
      {/* Header */}
      <div className="max-w-full mx-auto">
        <div className="mb-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-xl font-bold text-gray-900">
                Create New Product
              </h1>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-2 md:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <Tag className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-800">
              Product Information
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  SKU Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SKU code"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  HSN No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hsn"
                  value={formData.hsn}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter HSN no"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                  required
                />
              </div>
            </div>

            {/* Category, Stock, Unit, GST */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Category
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock_qty"
                  value={formData.stock_qty}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Unit</option>
                  {units?.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewUnitForm(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Unit
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  GST Rate <span className="text-red-500">*</span>
                </label>
                <select
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select GST Rate</option>
                  {gstRates?.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.rate}%
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewGSTRateForm(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New GST Rate
                </button>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  MRP
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  B2C Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="b2c_price"
                    value={formData.b2c_price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  B2B Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="b2b_price"
                    value={formData.b2b_price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Product Volume
                </label>
                <input
                  type="number"
                  name="product_volume"
                  value={formData.product_volume}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Product Weight
                </label>
                <input
                  type="number"
                  name="product_weight"
                  value={formData.product_weight}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 1.5"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Use Case
                </label>
                <textarea
                  name="use_case"
                  value={formData.use_case}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="1"
                  placeholder="Describe product usage scenarios..."
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Product Image
              </label>
              <div className={`border-2 border-dashed rounded-2xl p-2 text-center transition-colors ${
                imagePreview ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input
                  type="file"
                  id="image-upload"
                  name="image"
                  onChange={handleChange}
                  className="hidden"
                  accept="image/*"
                />
                
                <div className="flex flex-col items-center justify-center gap-4">
                  {imagePreview ? (
                    <>
                      <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-green-300">
                        <img 
                          src={imagePreview} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formData.image?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(formData.image?.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Click to upload product image
                      </p>
                      <p className="text-xs text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </>
                  )}
                  
                  <div className="flex gap-3">
                    <label 
                      htmlFor="image-upload"
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
                    >
                      <Upload className="w-5 h-5" />
                      {imagePreview ? 'Change Image' : 'Choose File'}
                    </label>
                    
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Remove
                      </button>
                    )}
                  </div>
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

      {/* Add New GST Rate Modal */}
      {showNewGSTRateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-2">
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
                    setNewGSTRate({ name: "", rate: "", description: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleGSTRateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Rate Name <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="rate"
                      value={newGSTRate.rate}
                      onChange={handleGSTRateChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="18.00"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
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
                      setNewGSTRate({ name: "", rate: "", description: "" });
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
                    {gstRateMutation.isLoading ? "Adding..." : "Add Rate"}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-2">
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
                    setNewCategory({ name: "", description: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
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
                      setNewCategory({ name: "", description: "" });
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
                    {categoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add New Unit Modal */}
      {showNewUnitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Unit</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewUnitForm(false);
                    setNewUnit({ name: "", description: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUnitSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newUnit.name}
                    onChange={handleUnitChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., kg, liter, piece"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newUnit.description}
                    onChange={handleUnitChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the unit..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewUnitForm(false);
                      setNewUnit({ name: "", description: "" });
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={unitMutation.isLoading}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium px-4 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unitMutation.isLoading ? "Adding..." : "Add Unit"}
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