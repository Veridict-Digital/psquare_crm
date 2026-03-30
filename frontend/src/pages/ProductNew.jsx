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
  Edit,
  Trash2,
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
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [showNewGSTRateForm, setShowNewGSTRateForm] = useState(false);
  const [showEditGSTRateForm, setShowEditGSTRateForm] = useState(false);
  const [selectedGSTRate, setSelectedGSTRate] = useState(null);
  const [newGSTRate, setNewGSTRate] = useState({
    name: "",
    rate: "",
    description: "",
  });

  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showNewCategory1Form, setShowNewCategory1Form] = useState(false);
  const [showNewCategory2Form, setShowNewCategory2Form] = useState(false);
  const [showNewCategory3Form, setShowNewCategory3Form] = useState(false);
  
  const [showEditCategoryForm, setShowEditCategoryForm] = useState(false);
  const [showEditCategory1Form, setShowEditCategory1Form] = useState(false);
  const [showEditCategory2Form, setShowEditCategory2Form] = useState(false);
  const [showEditCategory3Form, setShowEditCategory3Form] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryLevel, setSelectedCategoryLevel] = useState(null);
  
  const [newCategory, setNewCategory] = useState({ name: "", description: "", parent: null });
  const [newCategory1, setNewCategory1] = useState({ name: "", description: "", parent: null });
  const [newCategory2, setNewCategory2] = useState({ name: "", description: "", parent: null });
  const [newCategory3, setNewCategory3] = useState({ name: "", description: "", parent: null });

  const [showNewUnitForm, setShowNewUnitForm] = useState(false);
  const [showEditUnitForm, setShowEditUnitForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

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

  const { data: categories1, refetch: refetchCategories1, isError: categories1Error, error: categories1ErrorMsg } = useQuery({
    enabled: !!parseInt(formData.category),
    queryKey: ["categories1", parseInt(formData.category) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories2, refetch: refetchCategories2, isError: categories2Error, error: categories2ErrorMsg } = useQuery({
    enabled: !!parseInt(formData.category1),
    queryKey: ["categories2", parseInt(formData.category1) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category1);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories3, refetch: refetchCategories3, isError: categories3Error, error: categories3ErrorMsg } = useQuery({
    enabled: !!parseInt(formData.category2),
    queryKey: ["categories3", parseInt(formData.category2) || 0],
    queryFn: async () => {
      const parentId = parseInt(formData.category2);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
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
      
      Object.keys(data).forEach((key) => {
        const value = data[key];
        
        if (key !== 'image' && value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, String(value));
          console.log(`Appended ${key}:`, String(value));
        }
      });
      
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

  // GST Rate CRUD operations
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
    onSuccess: (data, variables) => {
      refetchGSTRates();
      setShowNewGSTRateForm(false);
      setShowEditGSTRateForm(false);
      setNewGSTRate({ name: "", rate: "", description: "" });
      setSelectedGSTRate(null);
      if (variables.method === 'POST') {
        toast.success("GST Rate added successfully");
      } else if (variables.method === 'PUT') {
        toast.success("GST Rate updated successfully");
      } else if (variables.method === 'DELETE') {
        toast.success("GST Rate deleted successfully");
      }
    },
    onError: (error) => {
      toast.error("Failed to process GST Rate");
      console.error("Error processing GST Rate:", error);
    },
  });

  // Category CRUD operations
  const categoryMutation = useMutation({
    mutationFn: async ({ id, data, method, categoryType }) => {
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
    onSuccess: (data, variables) => {
      refetchCategories();
      refetchCategories1();
      refetchCategories2();
      refetchCategories3();
      
      setShowNewCategoryForm(false);
      setShowNewCategory1Form(false);
      setShowNewCategory2Form(false);
      setShowNewCategory3Form(false);
      setShowEditCategoryForm(false);
      setShowEditCategory1Form(false);
      setShowEditCategory2Form(false);
      setShowEditCategory3Form(false);
      
      setNewCategory({ name: "", description: "", parent: null });
      setNewCategory1({ name: "", description: "", parent: null });
      setNewCategory2({ name: "", description: "", parent: null });
      setNewCategory3({ name: "", description: "", parent: null });
      setSelectedCategory(null);
      
      if (variables.method === 'POST') {
        toast.success("Category added successfully");
      } else if (variables.method === 'PUT') {
        toast.success("Category updated successfully");
      } else if (variables.method === 'DELETE') {
        toast.success("Category deleted successfully");
      }
    },
    onError: (error) => {
      toast.error("Failed to process Category");
      console.error("Error processing Category:", error);
    },
  });

  // Unit CRUD operations
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
    onSuccess: (data, variables) => {
      refetchUnits();
      setShowNewUnitForm(false);
      setShowEditUnitForm(false);
      setNewUnit({ name: "", description: "" });
      setSelectedUnit(null);
      if (variables.method === 'POST') {
        toast.success("Unit added successfully");
      } else if (variables.method === 'PUT') {
        toast.success("Unit updated successfully");
      } else if (variables.method === 'DELETE') {
        toast.success("Unit deleted successfully");
      }
    },
    onError: (error) => {
      toast.error("Failed to process Unit");
      console.error("Error processing Unit:", error);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    console.log(`handleChange - ${name}:`, { type, value, files: files?.length });
    
    if (type === "file") {
      if (files && files.length > 0) {
        const file = files[0];
        console.log("File selected details:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        });
        
        const fileObj = new File([file], file.name, { type: file.type });
        
        setFormData(prev => ({ 
          ...prev, 
          [name]: fileObj 
        }));
        
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
      setFormData(prev => ({ 
        ...prev, 
        [name]: value === "" ? "" : parseFloat(value) || 0 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
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
    
    categoryMutation.mutate({ data: dataToSubmit, method: 'POST', categoryType });
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
    }
    
    categoryMutation.mutate({ 
      id: selectedCategory.id, 
      data: dataToSubmit, 
      method: 'PUT',
      categoryType: level
    });
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm("Are you sure you want to delete this Category? This will also delete all sub-categories.")) {
      categoryMutation.mutate({ id, method: 'DELETE' });
    }
  };

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

  const removeImage = () => {
    console.log("Removing image");
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Helper component for select with edit/delete buttons
  const SelectWithActions = ({ label, name, value, options, onChange, required, onAdd, onEdit, onDelete, showAdd = true }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required={required}
        >
          <option value="">Select {label}</option>
          {options?.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name} {option.rate && `(${option.rate}%)`}
            </option>
          ))}
        </select>
        {showAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            title={`Add New ${label}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      {value && options && (
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => {
              const selected = options.find(opt => opt.id === parseInt(value));
              if (selected) onEdit(selected);
            }}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              const selected = options.find(opt => opt.id === parseInt(value));
              if (selected && window.confirm(`Are you sure you want to delete this ${label}?`)) {
                onDelete(selected.id);
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
  );

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
        <div className="bg-white rounded-2xl shadow-xl md:p-8">
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
              
              

              <div className="space-y-2 md:col-span-4">
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
              {/* Main Category */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        if (selected && window.confirm("Are you sure you want to delete this Category? This will also delete all sub-categories.")) {
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
                    title="Add New Category 1"
                    disabled={!formData.category}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {categories1Error && (
                  <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {categories1ErrorMsg?.message || 'Failed to load categories'}
                  </div>
                )}
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
                    value={formData.category2}
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
                    title="Add New Category 2"
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
                    value={formData.category3}
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
                    title="Add New Category 3"
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

              {/* Stock Quantity */}
              {/* <div className="space-y-2">
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
              </div> */}

              {/* Unit */}
              {/* <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Unit
                </label>
                <div className="flex gap-2">
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    title="Add New Unit"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.unit && units && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = units.find(u => u.id === parseInt(formData.unit));
                        if (selected) handleEditUnit(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = units.find(u => u.id === parseInt(formData.unit));
                        if (selected && window.confirm("Are you sure you want to delete this Unit?")) {
                          handleDeleteUnit(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div> */}

              {/* GST Rate */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  GST Rate <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="gst_rate"
                    value={formData.gst_rate}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select GST Rate</option>
                    {gstRates?.map((rate) => (
                      <option key={rate.id} value={rate.id}>
                        {rate.name} ({rate.rate}%)
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

            {/* Rest of the form remains the same */}
            {/* Pricing Section */}
            {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
            </div> */}

            {/* Product Details */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            </div> */}

            {/* Brand & Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

            {/* Media Gallery */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Product Media Gallery
              </label>
              
              <div className="space-y-4">
                {/* 4 Image Uploads */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Image {i}
                      </label>
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors h-32 flex flex-col items-center justify-center ${
                        formData[`image${i}`] ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                      }`}>
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
                              src={URL.createObjectURL(formData[`image${i}`])} 
                              alt={`Preview ${i}`}
                              className="w-full h-20 object-cover rounded-lg mb-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, [`image${i}`]: null }));
                                document.getElementById(`image${i}-upload`).value = '';
                              }}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Remove
                            </button>
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
                  ))}
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

      {/* Edit GST Rate Modal */}
      {showEditGSTRateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Percent className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit GST Rate</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditGSTRateForm(false);
                    setNewGSTRate({ name: "", rate: "", description: "" });
                    setSelectedGSTRate(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpdateGSTRate} className="space-y-4">
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
                      setShowEditGSTRateForm(false);
                      setNewGSTRate({ name: "", rate: "", description: "" });
                      setSelectedGSTRate(null);
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
                    {gstRateMutation.isLoading ? "Updating..." : "Update Rate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add New Category Modal (Main Category) */}
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
                    setNewCategory({ name: "", description: "", parent: null });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleCategorySubmit(e, 'main')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory.name}
                    onChange={(e) => handleCategoryChange(e, 'main')}
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
                    onChange={(e) => handleCategoryChange(e, 'main')}
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
                      setNewCategory({ name: "", description: "", parent: null });
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

      {/* Add New Category 1 Modal */}
      {showNewCategory1Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 1</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewCategory1Form(false);
                    setNewCategory1({ name: "", description: "", parent: null });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleCategorySubmit(e, 'level1')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory1.name}
                    onChange={(e) => handleCategoryChange(e, 'level1')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mobile Phones"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory1.description}
                    onChange={(e) => handleCategoryChange(e, 'level1')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the category..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory1Form(false);
                      setNewCategory1({ name: "", description: "", parent: null });
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

      {/* Add New Category 2 Modal */}
      {showNewCategory2Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 2</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewCategory2Form(false);
                    setNewCategory2({ name: "", description: "", parent: null });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleCategorySubmit(e, 'level2')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory2.name}
                    onChange={(e) => handleCategoryChange(e, 'level2')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Smartphones"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory2.description}
                    onChange={(e) => handleCategoryChange(e, 'level2')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the category..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory2Form(false);
                      setNewCategory2({ name: "", description: "", parent: null });
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

      {/* Add New Category 3 Modal */}
      {showNewCategory3Form && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Tag className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Add Category 3</h2>
                </div>
                <button
                  onClick={() => {
                    setShowNewCategory3Form(false);
                    setNewCategory3({ name: "", description: "", parent: null });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleCategorySubmit(e, 'level3')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCategory3.name}
                    onChange={(e) => handleCategoryChange(e, 'level3')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Android Phones"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newCategory3.description}
                    onChange={(e) => handleCategoryChange(e, 'level3')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the category..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory3Form(false);
                      setNewCategory3({ name: "", description: "", parent: null });
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

      {/* Edit Category Modal */}
      {showEditCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditCategoryForm(false);
                    setNewCategory({ name: "", description: "", parent: null });
                    setSelectedCategory(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleUpdateCategory(e, 'main')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCategoryForm(false);
                      setNewCategory({ name: "", description: "", parent: null });
                      setSelectedCategory(null);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 1</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditCategory1Form(false);
                    setNewCategory1({ name: "", description: "", parent: null });
                    setSelectedCategory(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleUpdateCategory(e, 'level1')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCategory1Form(false);
                      setNewCategory1({ name: "", description: "", parent: null });
                      setSelectedCategory(null);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 2</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditCategory2Form(false);
                    setNewCategory2({ name: "", description: "", parent: null });
                    setSelectedCategory(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleUpdateCategory(e, 'level2')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCategory2Form(false);
                      setNewCategory2({ name: "", description: "", parent: null });
                      setSelectedCategory(null);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category 3</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditCategory3Form(false);
                    setNewCategory3({ name: "", description: "", parent: null });
                    setSelectedCategory(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={(e) => handleUpdateCategory(e, 'level3')} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
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
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCategory3Form(false);
                      setNewCategory3({ name: "", description: "", parent: null });
                      setSelectedCategory(null);
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
                    {categoryMutation.isLoading ? "Updating..." : "Update Category"}
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

      {/* Edit Unit Modal */}
      {showEditUnitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Edit className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Unit</h2>
                </div>
                <button
                  onClick={() => {
                    setShowEditUnitForm(false);
                    setNewUnit({ name: "", description: "" });
                    setSelectedUnit(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleUpdateUnit} className="space-y-4">
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
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUnitForm(false);
                      setNewUnit({ name: "", description: "" });
                      setSelectedUnit(null);
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
                    {unitMutation.isLoading ? "Updating..." : "Update Unit"}
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