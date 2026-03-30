import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Edit,
  X,
  Upload,
  Package,
  Tag,
  Percent,
  Briefcase,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Plus,
} from "lucide-react";

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
    sku: "",
    hsn: "",
    title: "",
    category: "",
    category1: "",
    category2: "",
    category3: "",
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
    brand_name: "",
    brand_category: "",
    flavour: "",
    residual: "",
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    video_link: "",
    image: null, // Keep for compatibility
  });

  const [imageUrls, setImageUrls] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const [showNewGSTRateForm, setShowNewGSTRateForm] = useState(false);
  const [newGSTRate, setNewGSTRate] = useState({
    name: "",
    rate: "",
    description: "",
  });

  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showNewCategory1Form, setShowNewCategory1Form] = useState(false);
  const [showNewCategory2Form, setShowNewCategory2Form] = useState(false);
  const [showNewCategory3Form, setShowNewCategory3Form] = useState(false);
  
  const [newCategory, setNewCategory] = useState({ name: "", description: "", parent: null });
  const [newCategory1, setNewCategory1] = useState({ name: "", description: "", parent: null });
  const [newCategory2, setNewCategory2] = useState({ name: "", description: "", parent: null });
  const [newCategory3, setNewCategory3] = useState({ name: "", description: "", parent: null });

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

  const { data: categories1 } = useQuery({
    enabled: !!formData.category,
    queryKey: ["categories1", formData.category],
    queryFn: async () => {
      const response = await axios.get(`/api/categories/?parent_id=${formData.category}`);
      return response.data;
    },
  });

  const { data: categories2 } = useQuery({
    enabled: !!formData.category1,
    queryKey: ["categories2", formData.category1],
    queryFn: async () => {
      const response = await axios.get(`/api/categories/?parent_id=${formData.category1}`);
      return response.data;
    },
  });

  const { data: categories3 } = useQuery({
    enabled: !!formData.category2,
    queryKey: ["categories3", formData.category2],
    queryFn: async () => {
      const response = await axios.get(`/api/categories/?parent_id=${formData.category2}`);
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


  useEffect(() => {
    if (product) {
      console.log('Product data loaded:', product); // Debug log
        setFormData({
          sku: product.sku || "",
          hsn: product.hsn || "",
          title: product.title || "",
          category: String(product.category || ""),
          category1: String(product.category1 || ""),
          category2: String(product.category2 || ""),
          category3: String(product.category3 || ""),
          stock_qty: product.stock_qty || 0,
          mrp: product.mrp || 0,
          b2c_price: product.b2c_price || 0,
          b2b_price: product.b2b_price || 0,
          price: product.price || 0,
          purchase_price: product.purchase_price || 0,
          product_volume: product.product_volume || 0,
          unit: String(product.unit || ""),
          product_weight: product.product_weight || 0,
          gst_rate: String(product.gst_rate || ""),
          gst_calculated_amount: product.gst_calculated_amount || 0,
          use_case: product.use_case || "",
          brand_name: product.brand_name || "",
          brand_category: product.brand_category || "",
          flavour: product.flavour || "",
          residual: product.residual || "",
          image1: null,
          image2: null,
          image3: null,
          image4: null,
          video_link: product.video_link || "",
          image: null, // Keep for compatibility
        });
        setImageUrls({
          image1: product.image1,
          image2: product.image2,
          image3: product.image3,
          image4: product.image4,
        });
        setCurrentImageUrl(product.image || null);
        setImagePreview(product.image1 || null);
    }
  }, [product]);



  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log("===== EDIT MUTATION START =====");
      console.log("Raw data:", {
        ...data,
        image: data.image instanceof File ? `File: ${data.image.name}` : data.image
      });
      
      const formDataToSend = new FormData();
      

      Object.keys(data).forEach((key) => {
        const value = data[key];
        
        if (key !== 'image' && key.indexOf('image') !== 0 && value !== null && value !== undefined && value !== '') {
          // Convert to string for non-file fields
          formDataToSend.append(key, String(value));
          console.log(`Appended ${key}:`, String(value));
        } else if (key.indexOf('image') === 0 && value instanceof File) {
          // Append raw File objects for gallery images
          console.log(`✅ Appending gallery image ${key}:`, value.name);
          formDataToSend.append(key, value);
        }
      });
      
      // Handle image separately - only append if it's a new file
      if (data.image instanceof File) {
        console.log("✅ Appending new image file:", {
          name: data.image.name,
          size: data.image.size,
          type: data.image.type
        });
        formDataToSend.append('image', data.image);
      } else {
        console.log("ℹ️ No new image file selected, keeping existing image");
        // Don't append image field at all if no new file is selected
        // This will keep the existing image on the server
      }
      
      // Log final FormData contents
      console.log("===== FINAL FORMDATA =====");
      for (let pair of formDataToSend.entries()) {
        if (pair[0] === 'image') {
          const file = pair[1];
          console.log(`image: [FILE] ${file.name} (${file.size} bytes, ${file.type})`);
        } else {
          console.log(`${pair[0]}:`, pair[1]);
        }
      }
      
      try {
        const response = await axios({
          method: 'put',
          url: `/api/products/${id}/`,
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
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['product', id]);
      toast.success("Product updated successfully!");
      navigate('/products');
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error(error.response?.data?.message || "Failed to update product");
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
      queryClient.invalidateQueries(["categories1"]);
      queryClient.invalidateQueries(["categories2"]);
      queryClient.invalidateQueries(["categories3"]);
      setShowNewCategoryForm(false);
      setShowNewCategory1Form(false);
      setShowNewCategory2Form(false);
      setShowNewCategory3Form(false);
      setNewCategory({ name: "", description: "", parent: null });
      setNewCategory1({ name: "", description: "", parent: null });
      setNewCategory2({ name: "", description: "", parent: null });
      setNewCategory3({ name: "", description: "", parent: null });
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
        });
        
        // Create a new File object to ensure it's preserved
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
    
    console.log("===== SUBMITTING EDIT FORM =====");
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

  const handleCategoryChange = (e, categoryType) => {
    const { name, value } = e.target;
    if (categoryType === 'main') {
      setNewCategory({ ...newCategory, [name]: value });
    } else if (categoryType === 'level1') {
      setNewCategory1({ ...newCategory1, [name]: value });
    } else if (categoryType === 'level2') {
      setNewCategory2({ ...newCategory2, [name]: value });
    } else if (categoryType === 'level3') {
      setNewCategory3({ ...newCategory3, [name]: value });
    }
  };

  const handleCategorySubmit = (e, categoryType) => {
    e.preventDefault();
    let dataToSubmit = {};
    
    if (categoryType === 'main') {
      dataToSubmit = newCategory;
    } else if (categoryType === 'level1') {
      dataToSubmit = { ...newCategory1, parent: formData.category };
    } else if (categoryType === 'level2') {
      dataToSubmit = { ...newCategory2, parent: formData.category1 };
    } else if (categoryType === 'level3') {
      dataToSubmit = { ...newCategory3, parent: formData.category2 };
    }
    
    categoryMutation.mutate(dataToSubmit);
  };

  const handleUnitChange = (e) => {
    setNewUnit({ ...newUnit, [e.target.name]: e.target.value });
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    unitMutation.mutate(newUnit);
  };

  const removeImage = () => {
    console.log("Removing image selection");
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading product details...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-red-600 font-medium">Error loading product details</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-xl font-bold text-gray-900">
                Edit Product
              </h1>
              <p className="text-gray-600 mt-1">
                Update product information
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
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
                  placeholder="Enter HSN code"
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

            {/* Sub Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 1
                </label>
                <select
                  name="category1"
                  value={formData.category1}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category 1</option>
                  {categories1?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory1Form(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Category 1
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 2
                </label>
                <select
                  name="category2"
                  value={formData.category2}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category 2</option>
                  {categories2?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory2Form(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Category 2
                </button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 3
                </label>
                <select
                  name="category3"
                  value={formData.category3}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category 3</option>
                  {categories3?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCategory3Form(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New Category 3
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
                  rows="2"
                  placeholder="Describe product usage scenarios..."
                />
              </div>
            </div>

            {/* Brand & Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="brand_name"
                  value={formData.brand_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Coca Cola"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Category
                </label>
                <input
                  type="text"
                  name="brand_category"
                  value={formData.brand_category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Soft Drinks"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Flavour
                </label>
                <input
                  type="text"
                  name="flavour"
                  value={formData.flavour}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Classic"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Residual
                </label>
                <input
                  type="text"
                  name="residual"
                  value={formData.residual}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Carbonated"
                />
              </div>
            </div>

            {/* Media Gallery - 4 Images + Video - Edit Version */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Product Media Gallery
              </label>
              
              <div className="space-y-4">
                {/* 4 Image Uploads */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
{[1,2,3,4].map((i) => {
                    const hasExistingImage = imageUrls[`image${i}`];
                    const hasNewFile = formData[`image${i}`];
                    const previewSrc = hasNewFile 
                      ? URL.createObjectURL(formData[`image${i}`])
                      : hasExistingImage 
                      ? imageUrls[`image${i}`]
                      : null;
                    
                    return (
                      <div key={i} className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-700">
                          Image {i}
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors h-32 flex flex-col items-center justify-center ${
                          previewSrc ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          <input
                            type="file"
                            id={`image${i}-upload`}
                            name={`image${i}`}
                            onChange={handleChange}
                            className="hidden"
                            accept="image/*"
                          />
                          {previewSrc ? (
                            <>
                              <img 
                                src={previewSrc} 
                                alt={`Preview ${i}`}
                                className="w-full h-20 object-cover rounded-lg mb-1"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, [`image${i}`]: null }));
                                    document.getElementById(`image${i}-upload`).value = '';
                                  }}
                                  className="text-xs text-red-500 hover:text-red-600 flex-1"
                                >
                                  Remove
                                </button>
                                {hasExistingImage && !hasNewFile && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // To "remove" existing image, set empty string or handle in backend
                                      setImageUrls(prev => ({ ...prev, [`image${i}`]: null }));
                                    }}
                                    className="text-xs text-orange-500 hover:text-orange-600 flex-1"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                              <p className="text-xs text-gray-500">Upload Image {i}</p>
                            </>
                          )}
                        </div>
                        <label 
                          htmlFor={`image${i}-upload`}
                          className="cursor-pointer block w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded-lg text-center transition-colors"
                        >
                          Choose Image {i}
                        </label>
                      </div>
                    );
                  })}
                </div>

                {/* Video Link */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Video Link (YouTube etc.)
                  </label>
                  <input
                    type="url"
                    name="video_link"
                    value={formData.video_link || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {formData.video_link && (
                    <a 
                      href={formData.video_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline block"
                    >
                      🔗 Open Video Link
                    </a>
                  )}
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
                    Updating Product...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Product
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
            <div className="p-6">
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

export default ProductEdit;