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
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

const ProductNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    sku: "",
    hsn: "",
    title: "",
    category: null,
    category1: null,
    category2: null,
    category3: null,
    category4: null,
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
    brand: null,
    brand_category: null,
    flavour: "",
    residual: "",
    image: null,
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    video_link: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [image1Preview, setImage1Preview] = useState(null);
  const [image2Preview, setImage2Preview] = useState(null);
  const [image3Preview, setImage3Preview] = useState(null);
  const [image4Preview, setImage4Preview] = useState(null);
  
  // GST Rate States
  const [showNewGSTRateForm, setShowNewGSTRateForm] = useState(false);
  const [showEditGSTRateForm, setShowEditGSTRateForm] = useState(false);
  const [selectedGSTRate, setSelectedGSTRate] = useState(null);
  const [newGSTRate, setNewGSTRate] = useState({
    name: "",
    rate: "",
    description: "",
  });

  // Category States
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showNewCategory1Form, setShowNewCategory1Form] = useState(false);
  const [showNewCategory2Form, setShowNewCategory2Form] = useState(false);
  const [showNewCategory3Form, setShowNewCategory3Form] = useState(false);
  const [showNewCategory4Form, setShowNewCategory4Form] = useState(false);
  
  // Edit Category Modals
  const [showEditCategoryForm, setShowEditCategoryForm] = useState(false);
  const [showEditCategory1Form, setShowEditCategory1Form] = useState(false);
  const [showEditCategory2Form, setShowEditCategory2Form] = useState(false);
  const [showEditCategory3Form, setShowEditCategory3Form] = useState(false);
  const [showEditCategory4Form, setShowEditCategory4Form] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryLevel, setSelectedCategoryLevel] = useState(null);
  
  // Category form data
  const [newCategory, setNewCategory] = useState({ name: "", description: "", parent: null });
  const [newCategory1, setNewCategory1] = useState({ name: "", description: "", parent: null });
  const [newCategory2, setNewCategory2] = useState({ name: "", description: "", parent: null });
  const [newCategory3, setNewCategory3] = useState({ name: "", description: "", parent: null });
  const [newCategory4, setNewCategory4] = useState({ name: "", description: "", parent: null });

  // Brand States
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [showEditBrandForm, setShowEditBrandForm] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [newBrand, setNewBrand] = useState({ name: "", description: "" });

  // Brand Category States
  const [showNewBrandCategoryForm, setShowNewBrandCategoryForm] = useState(false);
  const [showEditBrandCategoryForm, setShowEditBrandCategoryForm] = useState(false);
  const [selectedBrandCategory, setSelectedBrandCategory] = useState(null);
  const [newBrandCategory, setNewBrandCategory] = useState({ name: "", description: "" });

  // Unit States
  const [showNewUnitForm, setShowNewUnitForm] = useState(false);
  const [showEditUnitForm, setShowEditUnitForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

  // ========== QUERIES ==========
  
  const { data: gstRates, refetch: refetchGSTRates } = useQuery({
    queryKey: ["gstRates"],
    queryFn: async () => {
      const response = await axios.get("/api/gstrates/");
      return response.data;
    },
  });

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await axios.get("/api/categories/");
      return response.data;
    },
  });

  const { data: units, refetch: refetchUnits } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const response = await axios.get("/api/units/");
      return response.data;
    },
  });

  const { data: brands, refetch: refetchBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await axios.get("/api/brands/");
      return response.data;
    },
  });

  const { data: brandCategories, refetch: refetchBrandCategories } = useQuery({
    queryKey: ["brandCategories"],
    queryFn: async () => {
      const response = await axios.get("/api/brand-categories/");
      return response.data;
    },
  });

  const { data: categories1, refetch: refetchCategories1 } = useQuery({
    enabled: !!parseInt(formData.category),
    queryKey: ["categories1", parseInt(formData.category) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories2, refetch: refetchCategories2 } = useQuery({
    enabled: !!parseInt(formData.category1),
    queryKey: ["categories2", parseInt(formData.category1) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category1);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories3, refetch: refetchCategories3 } = useQuery({
    enabled: !!parseInt(formData.category2),
    queryKey: ["categories3", parseInt(formData.category2) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category2);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories4, refetch: refetchCategories4 } = useQuery({
    enabled: !!parseInt(formData.category3),
    queryKey: ["categories4", parseInt(formData.category3) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category3);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  // ========== MUTATIONS ==========
  
  const gstRateMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === 'POST') {
        const response = await axios.post("/api/gstrates/", data);
        return response.data;
      } else if (method === 'PUT') {
        const response = await axios.put(`/api/gstrates/${id}/`, data);
        return response.data;
      } else if (method === 'DELETE') {
        const response = await axios.delete(`/api/gstrates/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchGSTRates();
      setShowNewGSTRateForm(false);
      setShowEditGSTRateForm(false);
      setNewGSTRate({ name: "", rate: "", description: "" });
      setSelectedGSTRate(null);
      toast.success("GST Rate processed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process GST Rate");
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === 'POST') {
        const response = await axios.post("/api/categories/", data);
        return response.data;
      } else if (method === 'PUT') {
        const response = await axios.put(`/api/categories/${id}/`, data);
        return response.data;
      } else if (method === 'DELETE') {
        const response = await axios.delete(`/api/categories/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchCategories();
      refetchCategories1();
      refetchCategories2();
      refetchCategories3();
      refetchCategories4?.();
      
      setShowNewCategoryForm(false);
      setShowNewCategory1Form(false);
      setShowNewCategory2Form(false);
      setShowNewCategory3Form(false);
      setShowNewCategory4Form(false);
      setShowEditCategoryForm(false);
      setShowEditCategory1Form(false);
      setShowEditCategory2Form(false);
      setShowEditCategory3Form(false);
      setShowEditCategory4Form(false);
      
      setNewCategory({ name: "", description: "", parent: null });
      setNewCategory1({ name: "", description: "", parent: null });
      setNewCategory2({ name: "", description: "", parent: null });
      setNewCategory3({ name: "", description: "", parent: null });
      setNewCategory4({ name: "", description: "", parent: null });
      setSelectedCategory(null);
      
      toast.success("Category processed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process Category");
    },
  });

  const brandMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === 'POST') {
        const response = await axios.post("/api/brands/", data);
        return response.data;
      } else if (method === 'PUT') {
        const response = await axios.put(`/api/brands/${id}/`, data);
        return response.data;
      } else if (method === 'DELETE') {
        const response = await axios.delete(`/api/brands/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchBrands();
      setShowNewBrandForm(false);
      setShowEditBrandForm(false);
      setNewBrand({ name: "", description: "" });
      setSelectedBrand(null);
      toast.success("Brand processed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process Brand");
    },
  });

  const brandCategoryMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === 'POST') {
        const response = await axios.post("/api/brand-categories/", data);
        return response.data;
      } else if (method === 'PUT') {
        const response = await axios.put(`/api/brand-categories/${id}/`, data);
        return response.data;
      } else if (method === 'DELETE') {
        const response = await axios.delete(`/api/brand-categories/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchBrandCategories();
      setShowNewBrandCategoryForm(false);
      setShowEditBrandCategoryForm(false);
      setNewBrandCategory({ name: "", description: "" });
      setSelectedBrandCategory(null);
      toast.success("Brand Category processed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process Brand Category");
    },
  });

  const unitMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === 'POST') {
        const response = await axios.post("/api/units/", data);
        return response.data;
      } else if (method === 'PUT') {
        const response = await axios.put(`/api/units/${id}/`, data);
        return response.data;
      } else if (method === 'DELETE') {
        const response = await axios.delete(`/api/units/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchUnits();
      setShowNewUnitForm(false);
      setShowEditUnitForm(false);
      setNewUnit({ name: "", description: "" });
      setSelectedUnit(null);
      toast.success("Unit processed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process Unit");
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();
      
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (!key.startsWith('image') && key !== 'video_link') {
          if (value !== null && value !== undefined && value !== '') {
            formDataToSend.append(key, String(value));
          }
        }
      });
      
      if (data.video_link && data.video_link !== '') {
        formDataToSend.append('video_link', data.video_link);
      }
      
      const imageFields = ['image', 'image1', 'image2', 'image3', 'image4'];
      imageFields.forEach((imgKey) => {
        if (data[imgKey] instanceof File) {
          formDataToSend.append(imgKey, data[imgKey]);
        }
      });
      
      const response = await axios({
        method: 'post',
        url: '/api/products/',
        data: formDataToSend,
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created successfully!");
      navigate("/products");
    },
    onError: (error) => {
      console.error("Error creating product:", error);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to create product");
    },
  });

  // ========== HANDLERS ==========
  
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file" && name.startsWith('image')) {
      if (files && files.length > 0) {
        const file = files[0];
        setFormData((prev) => ({ ...prev, [name]: file }));
        
        const reader = new FileReader();
        reader.onloadend = () => {
          switch (name) {
            case "image": setImagePreview(reader.result); break;
            case "image1": setImage1Preview(reader.result); break;
            case "image2": setImage2Preview(reader.result); break;
            case "image3": setImage3Preview(reader.result); break;
            case "image4": setImage4Preview(reader.result); break;
            default: break;
          }
        };
        reader.readAsDataURL(file);
      } else {
        setFormData((prev) => ({ ...prev, [name]: null }));
        switch (name) {
          case "image": setImagePreview(null); break;
          case "image1": setImage1Preview(null); break;
          case "image2": setImage2Preview(null); break;
          case "image3": setImage3Preview(null); break;
          case "image4": setImage4Preview(null); break;
          default: break;
        }
      }
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.sku || !formData.title) {
      toast.error("Please fill in SKU and Product Name");
      return;
    }
    
    mutation.mutate(formData);
  };

  const removeImage = (imageName) => {
    setFormData(prev => ({ ...prev, [imageName]: null }));
    switch (imageName) {
      case "image": setImagePreview(null); break;
      case "image1": setImage1Preview(null); break;
      case "image2": setImage2Preview(null); break;
      case "image3": setImage3Preview(null); break;
      case "image4": setImage4Preview(null); break;
      default: break;
    }
    const fileInput = document.getElementById(`${imageName}-upload`);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // GST Rate Handlers
  const handleGSTRateChange = (e) => {
    setNewGSTRate({ ...newGSTRate, [e.target.name]: e.target.value });
  };

  const handleGSTRateSubmit = (e) => {
    e.preventDefault();
    gstRateMutation.mutate({ data: newGSTRate, method: 'POST' });
  };

  const handleEditGSTRate = (rate) => {
    setSelectedGSTRate(rate);
    setNewGSTRate({
      name: rate.name,
      rate: rate.rate,
      description: rate.description || "",
    });
    setShowEditGSTRateForm(true);
  };

  const handleUpdateGSTRate = (e) => {
    e.preventDefault();
    gstRateMutation.mutate({ 
      id: selectedGSTRate.id, 
      data: newGSTRate, 
      method: 'PUT' 
    });
  };

  const handleDeleteGSTRate = (id) => {
    if (window.confirm("Are you sure you want to delete this GST Rate?")) {
      gstRateMutation.mutate({ id, method: 'DELETE' });
    }
  };

  // Category Handlers
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
    } else if (categoryType === 'level4') {
      setNewCategory4({ ...newCategory4, [name]: value });
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
    } else if (categoryType === 'level4') {
      dataToSubmit = { ...newCategory4, parent: formData.category3 };
    }
    
    categoryMutation.mutate({ data: dataToSubmit, method: 'POST' });
  };

  const handleEditCategory = (category, level) => {
    setSelectedCategory(category);
    setSelectedCategoryLevel(level);
    
    if (level === 'main') {
      setNewCategory({ name: category.name, description: category.description || "", parent: category.parent });
      setShowEditCategoryForm(true);
    } else if (level === 'level1') {
      setNewCategory1({ name: category.name, description: category.description || "", parent: category.parent });
      setShowEditCategory1Form(true);
    } else if (level === 'level2') {
      setNewCategory2({ name: category.name, description: category.description || "", parent: category.parent });
      setShowEditCategory2Form(true);
    } else if (level === 'level3') {
      setNewCategory3({ name: category.name, description: category.description || "", parent: category.parent });
      setShowEditCategory3Form(true);
    } else if (level === 'level4') {
      setNewCategory4({ name: category.name, description: category.description || "", parent: category.parent });
      setShowEditCategory4Form(true);
    }
  };

  const handleUpdateCategory = (e, level) => {
    e.preventDefault();
    let dataToSubmit = {};
    
    if (level === 'main') {
      dataToSubmit = newCategory;
    } else if (level === 'level1') {
      dataToSubmit = { ...newCategory1, parent: formData.category };
    } else if (level === 'level2') {
      dataToSubmit = { ...newCategory2, parent: formData.category1 };
    } else if (level === 'level3') {
      dataToSubmit = { ...newCategory3, parent: formData.category2 };
    } else if (level === 'level4') {
      dataToSubmit = { ...newCategory4, parent: formData.category3 };
    }
    
    categoryMutation.mutate({ 
      id: selectedCategory.id, 
      data: dataToSubmit, 
      method: 'PUT' 
    });
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Are you sure you want to delete this Category? This will also delete all sub-categories.")) {
      categoryMutation.mutate({ id, method: 'DELETE' });
    }
  };

  // Brand Handlers
  const handleBrandChange = (e) => {
    setNewBrand({ ...newBrand, [e.target.name]: e.target.value });
  };

  const handleBrandSubmit = (e) => {
    e.preventDefault();
    brandMutation.mutate({ data: newBrand, method: 'POST' });
  };

  const handleEditBrand = (brand) => {
    setSelectedBrand(brand);
    setNewBrand({ name: brand.name, description: brand.description || "" });
    setShowEditBrandForm(true);
  };

  const handleUpdateBrand = (e) => {
    e.preventDefault();
    brandMutation.mutate({ 
      id: selectedBrand.id, 
      data: newBrand, 
      method: 'PUT' 
    });
  };

  const handleDeleteBrand = (id) => {
    if (window.confirm("Are you sure you want to delete this Brand?")) {
      brandMutation.mutate({ id, method: 'DELETE' });
    }
  };

  // Brand Category Handlers
  const handleBrandCategoryChange = (e) => {
    setNewBrandCategory({ ...newBrandCategory, [e.target.name]: e.target.value });
  };

  const handleBrandCategorySubmit = (e) => {
    e.preventDefault();
    brandCategoryMutation.mutate({ data: newBrandCategory, method: 'POST' });
  };

  const handleEditBrandCategory = (category) => {
    setSelectedBrandCategory(category);
    setNewBrandCategory({ name: category.name, description: category.description || "" });
    setShowEditBrandCategoryForm(true);
  };

  const handleUpdateBrandCategory = (e) => {
    e.preventDefault();
    brandCategoryMutation.mutate({ 
      id: selectedBrandCategory.id, 
      data: newBrandCategory, 
      method: 'PUT' 
    });
  };

  const handleDeleteBrandCategory = (id) => {
    if (window.confirm("Are you sure you want to delete this Brand Category?")) {
      brandCategoryMutation.mutate({ id, method: 'DELETE' });
    }
  };

  // Unit Handlers
  const handleUnitChange = (e) => {
    setNewUnit({ ...newUnit, [e.target.name]: e.target.value });
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    unitMutation.mutate({ data: newUnit, method: 'POST' });
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setNewUnit({ name: unit.name, description: unit.description || "" });
    setShowEditUnitForm(true);
  };

  const handleUpdateUnit = (e) => {
    e.preventDefault();
    unitMutation.mutate({ 
      id: selectedUnit.id, 
      data: newUnit, 
      method: 'PUT' 
    });
  };

  const handleDeleteUnit = (id) => {
    if (window.confirm("Are you sure you want to delete this Unit?")) {
      unitMutation.mutate({ id, method: 'DELETE' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Create New Product
              </h1>
              <p className="text-gray-600 mt-1">Fill in the product details below</p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter SKU code"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Product Name <span className="text-red-500">*</span>
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

            {/* Category Section */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {/* Main Category */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    
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
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    title="Add New Category"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.category && categories && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories.find(cat => cat.id === parseInt(formData.category));
                        if (selected) handleEditCategory(selected, 'main');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories.find(cat => cat.id === parseInt(formData.category));
                        if (selected && window.confirm("Are you sure you want to delete this Category?")) {
                          handleDeleteCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Category 1 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 1
                </label>
                <div className="flex gap-2">
                  <select
                    name="category1"
                    value={formData.category1 || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.category}
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
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.category}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.category1 && categories1 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories1.find(cat => cat.id === parseInt(formData.category1));
                        if (selected) handleEditCategory(selected, 'level1');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories1.find(cat => cat.id === parseInt(formData.category1));
                        if (selected && window.confirm("Are you sure you want to delete this Category?")) {
                          handleDeleteCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Category 2 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 2
                </label>
                <div className="flex gap-2">
                  <select
                    name="category2"
                    value={formData.category2 || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.category1}
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
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.category1}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.category2 && categories2 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories2.find(cat => cat.id === parseInt(formData.category2));
                        if (selected) handleEditCategory(selected, 'level2');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories2.find(cat => cat.id === parseInt(formData.category2));
                        if (selected && window.confirm("Are you sure you want to delete this Category?")) {
                          handleDeleteCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Category 3 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 3
                </label>
                <div className="flex gap-2">
                  <select
                    name="category3"
                    value={formData.category3 || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.category2}
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
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.category2}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.category3 && categories3 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories3.find(cat => cat.id === parseInt(formData.category3));
                        if (selected) handleEditCategory(selected, 'level3');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories3.find(cat => cat.id === parseInt(formData.category3));
                        if (selected && window.confirm("Are you sure you want to delete this Category?")) {
                          handleDeleteCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Category 4 */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category 4
                </label>
                <div className="flex gap-2">
                  <select
                    name="category4"
                    value={formData.category4 || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.category3}
                  >
                    <option value="">Select Category 4</option>
                    {categories4?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory4Form(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!formData.category3}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.category4 && categories4 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories4.find(cat => cat.id === parseInt(formData.category4));
                        if (selected) handleEditCategory(selected, 'level4');
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories4.find(cat => cat.id === parseInt(formData.category4));
                        if (selected && window.confirm("Are you sure you want to delete this Category?")) {
                          handleDeleteCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Brand Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Name
                </label>
                <div className="flex gap-2">
                  <select
                    name="brand"
                    value={formData.brand || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Brand</option>
                    {brands?.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    title="Add New Brand"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.brand && brands && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brands.find(b => b.id === parseInt(formData.brand));
                        if (selected) handleEditBrand(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brands.find(b => b.id === parseInt(formData.brand));
                        if (selected && window.confirm("Are you sure you want to delete this Brand?")) {
                          handleDeleteBrand(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Brand Category */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Category
                </label>
                <div className="flex gap-2">
                  <select
                    name="brand_category"
                    value={formData.brand_category || ''}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Brand Category</option>
                    {brandCategories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandCategoryForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    title="Add New Brand Category"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.brand_category && brandCategories && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brandCategories.find(c => c.id === parseInt(formData.brand_category));
                        if (selected) handleEditBrandCategory(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brandCategories.find(c => c.id === parseInt(formData.brand_category));
                        if (selected && window.confirm("Are you sure you want to delete this Brand Category?")) {
                          handleDeleteBrandCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            

            {/* Product Details */}
            
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  HSN No
                </label>
                <input
                  type="text"
                  name="hsn"
                  value={formData.hsn}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter HSN no"
                  
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  GST Rate
                </label>
                <div className="flex gap-2">
                  <select
                    name="gst_rate"
                    value={formData.gst_rate}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    
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
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    title="Add New GST Rate"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.gst_rate && gstRates && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = gstRates.find(r => r.id === parseInt(formData.gst_rate));
                        if (selected) handleEditGSTRate(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = gstRates.find(r => r.id === parseInt(formData.gst_rate));
                        if (selected && window.confirm("Are you sure you want to delete this GST Rate?")) {
                          handleDeleteGSTRate(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
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

            {/* Use Case */}
            

            {/* Media Gallery */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Main Image
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors h-32 flex flex-col items-center justify-center cursor-pointer ${
                    formData.image ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                  }`} onClick={() => document.getElementById('image-upload').click()}>
                    <input
                      type="file"
                      id="image-upload"
                      name="image"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                    {formData.image ? (
                      <>
                        <img 
                          src={imagePreview} 
                          alt="Main Preview"
                          className="max-h-24 object-contain rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage('image');
                          }}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Click to upload</p>
                      </>
                    )}
                  </div>
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Image {i}
                    </label>
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors h-32 flex flex-col items-center justify-center cursor-pointer ${
                      formData[`image${i}`] ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                    }`} onClick={() => document.getElementById(`image${i}-upload`).click()}>
                      <input
                        type="file"
                        id={`image${i}-upload`}
                        name={`image${i}`}
                        onChange={handleChange}
                        className="hidden"
                        accept="image/*"
                      />
                      {formData[`image${i}`] ? (
                        <>
                          <img 
                            src={i === 1 ? image1Preview : i === 2 ? image2Preview : i === 3 ? image3Preview : image4Preview} 
                            alt={`Gallery ${i}`}
                            className="max-h-20 object-contain rounded-lg mb-1"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(`image${i}`);
                            }}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">Click to upload</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Video Link */}
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Video Link
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
                    className="text-blue-600 hover:text-blue-800 text-sm underline inline-flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Video Link
                  </a>
                )}
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

      {/* ========== MODALS ========== */}
      
      {/* GST Rate Modals */}
      {showNewGSTRateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewGSTRateForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Percent className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add GST Rate</h2>
                </div>
                <button onClick={() => setShowNewGSTRateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleGSTRateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newGSTRate.name}
                    onChange={handleGSTRateChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newGSTRate.description}
                    onChange={handleGSTRateChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewGSTRateForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={gstRateMutation.isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {gstRateMutation.isLoading ? "Adding..." : "Add Rate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditGSTRateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditGSTRateForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Edit className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit GST Rate</h2>
                </div>
                <button onClick={() => setShowEditGSTRateForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateGSTRate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newGSTRate.name}
                    onChange={handleGSTRateChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newGSTRate.description}
                    onChange={handleGSTRateChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditGSTRateForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={gstRateMutation.isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {gstRateMutation.isLoading ? "Updating..." : "Update Rate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Main Modal */}
      {showNewCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCategoryForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category</h2>
                </div>
                <button onClick={() => setShowNewCategoryForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleCategorySubmit(e, 'main')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={(e) => handleCategoryChange(e, 'main')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory.description}
                    onChange={(e) => handleCategoryChange(e, 'main')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewCategoryForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category 1 Modal - Add */}
      {showNewCategory1Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCategory1Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 1</h2>
                </div>
                <button onClick={() => setShowNewCategory1Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleCategorySubmit(e, 'level1')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory1.name}
                    onChange={(e) => handleCategoryChange(e, 'level1')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory1.description}
                    onChange={(e) => handleCategoryChange(e, 'level1')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewCategory1Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category 2 Modal - Add */}
      {showNewCategory2Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCategory2Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 2</h2>
                </div>
                <button onClick={() => setShowNewCategory2Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleCategorySubmit(e, 'level2')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory2.name}
                    onChange={(e) => handleCategoryChange(e, 'level2')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory2.description}
                    onChange={(e) => handleCategoryChange(e, 'level2')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewCategory2Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category 3 Modal - Add */}
      {showNewCategory3Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCategory3Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 3</h2>
                </div>
                <button onClick={() => setShowNewCategory3Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleCategorySubmit(e, 'level3')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory3.name}
                    onChange={(e) => handleCategoryChange(e, 'level3')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory3.description}
                    onChange={(e) => handleCategoryChange(e, 'level3')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewCategory3Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category 4 Modal - Add */}
      {showNewCategory4Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewCategory4Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 4</h2>
                </div>
                <button onClick={() => setShowNewCategory4Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleCategorySubmit(e, 'level4')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory4.name}
                    onChange={(e) => handleCategoryChange(e, 'level4')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory4.description}
                    onChange={(e) => handleCategoryChange(e, 'level4')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewCategory4Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Main Modal */}
      {showEditCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditCategoryForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
                </div>
                <button onClick={() => setShowEditCategoryForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleUpdateCategory(e, 'main')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={(e) => handleCategoryChange(e, 'main')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory.description}
                    onChange={(e) => handleCategoryChange(e, 'main')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditCategoryForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category 1 Modal */}
      {showEditCategory1Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditCategory1Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 1</h2>
                </div>
                <button onClick={() => setShowEditCategory1Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleUpdateCategory(e, 'level1')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory1.name}
                    onChange={(e) => handleCategoryChange(e, 'level1')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory1.description}
                    onChange={(e) => handleCategoryChange(e, 'level1')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditCategory1Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category 2 Modal */}
      {showEditCategory2Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditCategory2Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 2</h2>
                </div>
                <button onClick={() => setShowEditCategory2Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleUpdateCategory(e, 'level2')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory2.name}
                    onChange={(e) => handleCategoryChange(e, 'level2')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory2.description}
                    onChange={(e) => handleCategoryChange(e, 'level2')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditCategory2Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category 3 Modal */}
      {showEditCategory3Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditCategory3Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 3</h2>
                </div>
                <button onClick={() => setShowEditCategory3Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleUpdateCategory(e, 'level3')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory3.name}
                    onChange={(e) => handleCategoryChange(e, 'level3')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory3.description}
                    onChange={(e) => handleCategoryChange(e, 'level3')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditCategory3Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category 4 Modal */}
      {showEditCategory4Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditCategory4Form(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 4</h2>
                </div>
                <button onClick={() => setShowEditCategory4Form(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={(e) => handleUpdateCategory(e, 'level4')} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory4.name}
                    onChange={(e) => handleCategoryChange(e, 'level4')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory4.description}
                    onChange={(e) => handleCategoryChange(e, 'level4')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditCategory4Form(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={categoryMutation.isLoading} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {categoryMutation.isLoading ? "Updating..." : "Update Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Brand Modal - Add */}
      {showNewBrandForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewBrandForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Brand</h2>
                </div>
                <button onClick={() => setShowNewBrandForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleBrandSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newBrand.name}
                    onChange={handleBrandChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newBrand.description}
                    onChange={handleBrandChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewBrandForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={brandMutation.isLoading} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {brandMutation.isLoading ? "Adding..." : "Add Brand"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Brand Modal - Edit */}
      {showEditBrandForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditBrandForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Edit className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Brand</h2>
                </div>
                <button onClick={() => setShowEditBrandForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateBrand} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newBrand.name}
                    onChange={handleBrandChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newBrand.description}
                    onChange={handleBrandChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditBrandForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={brandMutation.isLoading} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {brandMutation.isLoading ? "Updating..." : "Update Brand"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Brand Category Modal - Add */}
      {showNewBrandCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewBrandCategoryForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Tag className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Brand Category</h2>
                </div>
                <button onClick={() => setShowNewBrandCategoryForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleBrandCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newBrandCategory.name}
                    onChange={handleBrandCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newBrandCategory.description}
                    onChange={handleBrandCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewBrandCategoryForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={brandCategoryMutation.isLoading} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {brandCategoryMutation.isLoading ? "Adding..." : "Add Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Brand Category Modal - Edit */}
      {showEditBrandCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditBrandCategoryForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Edit className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Brand Category</h2>
                </div>
                <button onClick={() => setShowEditBrandCategoryForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateBrandCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newBrandCategory.name}
                    onChange={handleBrandCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newBrandCategory.description}
                    onChange={handleBrandCategoryChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditBrandCategoryForm(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={brandCategoryMutation.isLoading} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50">
                    {brandCategoryMutation.isLoading ? "Updating..." : "Update Category"}
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