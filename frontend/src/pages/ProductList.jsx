import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Hash
} from 'lucide-react';

const ProductList = () => {
  // Helper to get absolute image URL
  const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${axios.defaults.baseURL?.replace(/\/$/, '')}${image.startsWith('/') ? image : '/' + image}`;
  };
  const [search, setSearch] = useState('');
  const [filterSKU, setFilterSKU] = useState('');
  const [filterTitle, setFilterTitle] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCategory1, setFilterCategory1] = useState('');
  const [filterCategory2, setFilterCategory2] = useState('');
  const [filterCategory3, setFilterCategory3] = useState('');
  const [filterCategory4, setFilterCategory4] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterBrandCategory, setFilterBrandCategory] = useState('');
  const [filterHSN, setFilterHSN] = useState('');

  // Category filter selected IDs for dependent dropdowns
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedCategory1Id, setSelectedCategory1Id] = useState('');
  const [selectedCategory2Id, setSelectedCategory2Id] = useState('');
  const [selectedCategory3Id, setSelectedCategory3Id] = useState('');

  const [filterFlavour, setFilterFlavour] = useState('');
  const [filterResidual, setFilterResidual] = useState('');
  const [filterBrandCategory1, setFilterBrandCategory1] = useState('');
  const [filterGST, setFilterGST] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterMinWeight, setFilterMinWeight] = useState('');
  const [filterMaxWeight, setFilterMaxWeight] = useState('');
  const [filterMinPackingWeight, setFilterMinPackingWeight] = useState('');
  const [filterMaxPackingWeight, setFilterMaxPackingWeight] = useState('');
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [titleSuggestionIndex, setTitleSuggestionIndex] = useState(-1);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);
  const [skuSuggestionIndex, setSkuSuggestionIndex] = useState(-1);

  // Price range filters
  const [filterPriceType, setFilterPriceType] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  // Active filters state - only applied when user clicks Apply button
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    filterSKU: '',
    filterTitle: '',
    filterCategory: '',
    filterCategory1: '',
    filterCategory2: '',
    filterCategory3: '',
    filterCategory4: '',
    filterBrand: '',
    filterBrandCategory: '',
    filterHSN: '',
    filterFlavour: '',
    filterResidual: '',
    filterBrandCategory1: '',
    filterGST: '',
    filterUnit: '',
    filterMinWeight: '',
    filterMaxWeight: '',
    filterMinPackingWeight: '',
    filterMaxPackingWeight: '',
    filterPriceType: '',
    filterMinPrice: '',
    filterMaxPrice: '',
  });

  // Queries for filters
  const { data: flavours } = useQuery({
    queryKey: ['flavours'],
    queryFn: async () => (await axios.get('/api/flavours/')).data,
  });

  const { data: residuals } = useQuery({
    queryKey: ['residuals'],
    queryFn: async () => (await axios.get('/api/residuals/')).data,
  });

  const { data: brandCategories1 } = useQuery({
    queryKey: ['brandCategories1'],
    queryFn: async () => (await axios.get('/api/brand-categories-1/')).data,
  });

  const { data: gstRates } = useQuery({
    queryKey: ['gstRates'],
    queryFn: async () => (await axios.get('/api/gstrates/')).data,
  });

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => (await axios.get('/api/units/')).data,
  });

  // --- DROPDOWN DATA WITH DEPENDENT QUERIES ---
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await axios.get('/api/categories/')).data,
  });

  const { data: categories1 } = useQuery({
    enabled: !!parseInt(selectedCategoryId),
    queryKey: ['categories1', parseInt(selectedCategoryId) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategoryId);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories2 } = useQuery({
    enabled: !!parseInt(selectedCategory1Id),
    queryKey: ['categories2', parseInt(selectedCategory1Id) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategory1Id);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories3 } = useQuery({
    enabled: !!parseInt(selectedCategory2Id),
    queryKey: ['categories3', parseInt(selectedCategory2Id) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategory2Id);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: categories4 } = useQuery({
    enabled: !!parseInt(selectedCategory3Id),
    queryKey: ['categories4', parseInt(selectedCategory3Id) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategory3Id);
      const response = await axios.get(`/api/categories/?parent_id=${parentId}`);
      return response.data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => (await axios.get('/api/brands/')).data,
  });

  const { data: brandCategories } = useQuery({
    queryKey: ['brandCategories'],
    queryFn: async () => (await axios.get('/api/brand-categories/')).data,
  });

  const [editingStock, setEditingStock] = useState(null);
  const [stockValue, setStockValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const queryClient = useQueryClient();

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(
        '/api/products/bulk-import/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      console.log('Bulk import response:', response.status, response.data);
      return response.data;

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['products']);
      setShowImportModal(false);
      setImportFile(null);
    },
    onError: (error) => {},
  });

  const handleImport = () => {
    if (!importFile) return;
    setImporting(true);
    importMutation.mutate(importFile);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportFile(file);
    } else {
      e.target.value = '';
    }
  };

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await axios.get('api/products/');
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
    },
    onError: (error) => {
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
      setEditingStock(null);
    },
    onError: (error) => {
      console.error('Update stock error:', error);
    }
  });

  // Filter and search products using activeFilters (only applied on button click)
  const filteredProducts = useMemo(() => {
    if (!productsData) return [];
    const {
      search: activeSearch,
      filterSKU: activeSKU,
      filterTitle: activeTitle,
      filterCategory: activeCategory,
      filterCategory1: activeCategory1,
      filterCategory2: activeCategory2,
      filterCategory3: activeCategory3,
      filterCategory4: activeCategory4,
      filterBrand: activeBrand,
      filterBrandCategory: activeBrandCategory,
      filterHSN: activeHSN,
      filterFlavour: activeFlavour,
      filterResidual: activeResidual,
      filterBrandCategory1: activeBrandCategory1,
      filterGST: activeGST,
      filterUnit: activeUnit,
      filterMinWeight: activeMinWeight,
      filterMaxWeight: activeMaxWeight,
      filterMinPackingWeight: activeMinPackingWeight,
      filterMaxPackingWeight: activeMaxPackingWeight,
      filterPriceType: activePriceType,
      filterMinPrice: activeMinPrice,
      filterMaxPrice: activeMaxPrice,
    } = activeFilters;

    return productsData.filter((product) => {
      const searchMatch =
        !activeSearch ||
        product.title?.toLowerCase().includes(activeSearch.toLowerCase()) ||
        product.sku?.toLowerCase().includes(activeSearch.toLowerCase()) ||
        product.id?.toString().includes(activeSearch) ||
        product.pid?.toString().includes(activeSearch);

      const skuMatch =
        !activeSKU || product.sku?.toLowerCase().includes(activeSKU.toLowerCase());
      const titleMatch =
        !activeTitle || product.title?.toLowerCase().includes(activeTitle.toLowerCase());
      const hsnMatch =
        !activeHSN || product.hsn?.toLowerCase().includes(activeHSN.toLowerCase());

      const categoryMatch =
        !activeCategory || product.category?.toString() === activeCategory;
      const category1Match =
        !activeCategory1 || product.category1?.toString() === activeCategory1;
      const category2Match =
        !activeCategory2 || product.category2?.toString() === activeCategory2;
      const category3Match =
        !activeCategory3 || product.category3?.toString() === activeCategory3;
      const category4Match =
        !activeCategory4 || product.category4?.toString() === activeCategory4;

      const brandMatch =
        !activeBrand ||
        product.brand_display?.toString() === activeBrand ||
        product.brand?.toString() === activeBrand;

      const brandCategoryMatch =
        !activeBrandCategory ||
        product.brand_category_display?.toString() === activeBrandCategory ||
        product.brand_category?.toString() === activeBrandCategory;

      const brandCategory1Match =
        !activeBrandCategory1 ||
        product.brand_category1_display?.toString() === activeBrandCategory1 ||
        product.brand_category1?.toString() === activeBrandCategory1;

      const flavourMatch =
        !activeFlavour ||
        product.flavour_display === activeFlavour ||
        product.flavour === activeFlavour;

      const residualMatch =
        !activeResidual ||
        product.residual_display === activeResidual ||
        product.residual === activeResidual;

      const gstMatch =
        !activeGST ||
        String(product.gst_rate) === String(activeGST) ||
        String(product.gst_rate_display).includes(activeGST);

      const unitMatch =
        !activeUnit ||
        product.unit_display === activeUnit ||
        product.unit === activeUnit;

      const productWeight = parseFloat(product.volume || product.weight || product.product_weight) || 0;
      const minWeightMatch =
        !activeMinWeight || productWeight >= parseFloat(activeMinWeight);
      const maxWeightMatch =
        !activeMaxWeight || productWeight <= parseFloat(activeMaxWeight);

      const packingWeight = parseFloat(product.packing_weight) || 0;
      const minPackingWeightMatch =
        !activeMinPackingWeight ||
        packingWeight >= parseFloat(activeMinPackingWeight);
      const maxPackingWeightMatch =
        !activeMaxPackingWeight ||
        packingWeight <= parseFloat(activeMaxPackingWeight);

      // Price range filters
      let priceVal = parseFloat(product.price) || 0;
      if (activePriceType === 'mrp') {
        priceVal = parseFloat(product.mrp) || 0;
      } else if (activePriceType === 'landing_rate') {
        priceVal = parseFloat(product.landing_rate) || 0;
      } else if (activePriceType === 'purchase_price' || activePriceType === 'cost') {
        priceVal = parseFloat(product.purchase_price || product.cost) || 0;
      } else if (activePriceType === 'calculated_rate') {
        priceVal = parseFloat(product.calculated_rate || product.calculated_price) || 0;
      }

      const minPriceMatch = !activeMinPrice || priceVal >= parseFloat(activeMinPrice);
      const maxPriceMatch = !activeMaxPrice || priceVal <= parseFloat(activeMaxPrice);

      return (
        searchMatch &&
        skuMatch &&
        titleMatch &&
        hsnMatch &&
        categoryMatch &&
        category1Match &&
        category2Match &&
        category3Match &&
        category4Match &&
        brandMatch &&
        brandCategoryMatch &&
        brandCategory1Match &&
        flavourMatch &&
        residualMatch &&
        gstMatch &&
        unitMatch &&
        minWeightMatch &&
        maxWeightMatch &&
        minPackingWeightMatch &&
        maxPackingWeightMatch &&
        minPriceMatch &&
        maxPriceMatch
      );
    });
  }, [productsData, activeFilters]);

  // Product title searchable suggestions using useMemo
  const productTitleSuggestions = useMemo(() => {
    const searchText = filterTitle.trim().toLowerCase();
    if (!searchText || !productsData) return [];

    const seen = new Set();
    return productsData
      .map((item) => item.title)
      .filter(Boolean)
      .filter((title) => title.toLowerCase().includes(searchText))
      .filter((title) => {
        const normalized = title.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(searchText);
        const bStarts = b.toLowerCase().startsWith(searchText);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [filterTitle, productsData]);

  // Product SKU searchable suggestions using useMemo
  const productSkuSuggestions = useMemo(() => {
    const searchText = filterSKU.trim().toLowerCase();
    if (!searchText || !productsData) return [];

    const seen = new Set();
    return productsData
      .map((item) => item.sku)
      .filter(Boolean)
      .filter((sku) => sku.toLowerCase().includes(searchText))
      .filter((sku) => {
        const normalized = sku.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(searchText);
        const bStarts = b.toLowerCase().startsWith(searchText);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.localeCompare(b);
      })
      .slice(0, 8);
  }, [filterSKU, productsData]);

  // Apply filters handler - copies draft filters to active filters
  const handleApplyFilters = useCallback(() => {
    setActiveFilters({
      search,
      filterSKU,
      filterTitle,
      filterCategory,
      filterCategory1,
      filterCategory2,
      filterCategory3,
      filterCategory4,
      filterBrand,
      filterBrandCategory,
      filterHSN,
      filterFlavour,
      filterResidual,
      filterBrandCategory1,
      filterGST,
      filterUnit,
      filterMinWeight,
      filterMaxWeight,
      filterMinPackingWeight,
      filterMaxPackingWeight,
      filterPriceType,
      filterMinPrice,
      filterMaxPrice,
    });
    setCurrentPage(1);
  }, [
    search,
    filterSKU,
    filterTitle,
    filterCategory,
    filterCategory1,
    filterCategory2,
    filterCategory3,
    filterCategory4,
    filterBrand,
    filterBrandCategory,
    filterHSN,
    filterFlavour,
    filterResidual,
    filterBrandCategory1,
    filterGST,
    filterUnit,
    filterMinWeight,
    filterMaxWeight,
    filterMinPackingWeight,
    filterMaxPackingWeight,
    filterPriceType,
    filterMinPrice,
    filterMaxPrice,
  ]);

  // Clear all filters handler
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFilterSKU("");
    setFilterTitle("");
    setShowSkuSuggestions(false);
    setSkuSuggestionIndex(-1);
    setShowTitleSuggestions(false);
    setTitleSuggestionIndex(-1);
    setSelectedCategoryId("");
    setSelectedCategory1Id("");
    setSelectedCategory2Id("");
    setSelectedCategory3Id("");
    setFilterCategory("");
    setFilterCategory1("");
    setFilterCategory2("");
    setFilterCategory3("");
    setFilterCategory4("");
    setFilterBrand("");
    setFilterBrandCategory("");
    setFilterBrandCategory1("");
    setFilterFlavour("");
    setFilterResidual("");
    setFilterGST("");
    setFilterUnit("");
    setFilterHSN("");
    setFilterMinWeight("");
    setFilterMaxWeight("");
    setFilterMinPackingWeight("");
    setFilterMaxPackingWeight("");
    setFilterPriceType("");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setActiveFilters({
      search: "",
      filterSKU: "",
      filterTitle: "",
      filterCategory: "",
      filterCategory1: "",
      filterCategory2: "",
      filterCategory3: "",
      filterCategory4: "",
      filterBrand: "",
      filterBrandCategory: "",
      filterHSN: "",
      filterFlavour: "",
      filterResidual: "",
      filterBrandCategory1: "",
      filterGST: "",
      filterUnit: "",
      filterMinWeight: "",
      filterMaxWeight: "",
      filterMinPackingWeight: "",
      filterMaxPackingWeight: "",
      filterPriceType: "",
      filterMinPrice: "",
      filterMaxPrice: "",
    });
    setCurrentPage(1);
  }, []);

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
        <div className="mb-2">
          {/* FILTER BAR WITH DEPENDENT CATEGORY DROPDOWNS */}
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApplyFilters();
              }
            }}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
          >
            {/* Row 1: Basic Product Info & Weight Range */}
            <div className="grid grid-cols-12 gap-3 mb-4">
              <div className="col-span-2 relative">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  SKU
                </label>
                <input
                  type="text"
                  value={filterSKU}
                  onChange={(e) => {
                    setFilterSKU(e.target.value);
                    setShowSkuSuggestions(true);
                    setSkuSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowSkuSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowSkuSuggestions(false), 150)
                  }
                  onKeyDown={(e) => {
                    if (
                      !showSkuSuggestions ||
                      productSkuSuggestions.length === 0
                    ) {
                      return;
                    }

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSkuSuggestionIndex((prev) =>
                        prev < productSkuSuggestions.length - 1
                          ? prev + 1
                          : 0
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSkuSuggestionIndex((prev) =>
                        prev > 0
                          ? prev - 1
                          : productSkuSuggestions.length - 1
                      );
                    } else if (e.key === "Enter") {
                      if (
                        skuSuggestionIndex >= 0 &&
                        productSkuSuggestions[skuSuggestionIndex]
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilterSKU(
                          productSkuSuggestions[skuSuggestionIndex]
                        );
                        setShowSkuSuggestions(false);
                        setSkuSuggestionIndex(-1);
                      }
                    } else if (e.key === "Escape") {
                      setShowSkuSuggestions(false);
                      setSkuSuggestionIndex(-1);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter SKU"
                />
                {showSkuSuggestions && productSkuSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto z-50">
                    {productSkuSuggestions.map((sku, index) => (
                      <button
                        key={sku}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFilterSKU(sku);
                          setShowSkuSuggestions(false);
                          setSkuSuggestionIndex(-1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${index === skuSuggestionIndex
                          ? "bg-blue-500 text-white"
                          : "hover:bg-blue-50 focus:bg-blue-50"
                          }`}
                      >
                        {sku}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-4 relative">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={filterTitle}
                  onChange={(e) => {
                    setFilterTitle(e.target.value);
                    setShowTitleSuggestions(true);
                    setTitleSuggestionIndex(-1);
                  }}
                  onFocus={() => setShowTitleSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowTitleSuggestions(false), 150)
                  }
                  onKeyDown={(e) => {
                    if (
                      !showTitleSuggestions ||
                      productTitleSuggestions.length === 0
                    ) {
                      return;
                    }

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setTitleSuggestionIndex((prev) =>
                        prev < productTitleSuggestions.length - 1
                          ? prev + 1
                          : 0
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setTitleSuggestionIndex((prev) =>
                        prev > 0
                          ? prev - 1
                          : productTitleSuggestions.length - 1
                      );
                    } else if (e.key === "Enter") {
                      if (
                        titleSuggestionIndex >= 0 &&
                        productTitleSuggestions[titleSuggestionIndex]
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilterTitle(
                          productTitleSuggestions[titleSuggestionIndex]
                        );
                        setShowTitleSuggestions(false);
                        setTitleSuggestionIndex(-1);
                      }
                    } else if (e.key === "Escape") {
                      setShowTitleSuggestions(false);
                      setTitleSuggestionIndex(-1);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter product name"
                />
                {showTitleSuggestions && productTitleSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto z-50">
                    {productTitleSuggestions.map((title, index) => (
                      <button
                        key={title}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFilterTitle(title);
                          setShowTitleSuggestions(false);
                          setTitleSuggestionIndex(-1);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${index === titleSuggestionIndex
                          ? "bg-blue-500 text-white"
                          : "hover:bg-blue-50 focus:bg-blue-50"
                          }`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={filterHSN}
                  onChange={(e) => setFilterHSN(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="HSN code"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" title="Min Weight (kg)">
                  Min Wt
                </label>
                <input
                  type="number"
                  value={filterMinWeight}
                  onChange={(e) => setFilterMinWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Min kg"
                  step="0.01"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" title="Max Weight (kg)">
                  Max Wt
                </label>
                <input
                  type="number"
                  value={filterMaxWeight}
                  onChange={(e) => setFilterMaxWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Max kg"
                  step="0.01"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" title="Min Packing Weight (kg)">
                  Min Pkg
                </label>
                <input
                  type="number"
                  value={filterMinPackingWeight}
                  onChange={(e) => setFilterMinPackingWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Min kg"
                  step="0.01"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5" title="Max Packing Weight (kg)">
                  Max Pkg
                </label>
                <input
                  type="number"
                  value={filterMaxPackingWeight}
                  onChange={(e) => setFilterMaxPackingWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Max kg"
                  step="0.01"
                />
              </div>
            </div>

            {/* Row 2: Price Type & Min/Max Price & Unit & GST */}
            <div className="grid grid-cols-12 gap-3 mb-4">
              <div className="col-span-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Price Type
                </label>
                <select
                  value={filterPriceType}
                  onChange={(e) => setFilterPriceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">Sale Price</option>
                  <option value="mrp">MRP</option>
                  <option value="landing_rate">Landing Rate</option>
                  <option value="purchase_price">Purchase Price</option>
                  <option value="calculated_rate">Calculated Price</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Min Price
                </label>
                <input
                  type="number"
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Min"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Max"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Unit
                </label>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Units</option>
                  {units?.map((unit) => (
                    <option key={unit.id} value={unit.name}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  GST Rate
                </label>
                <select
                  value={filterGST}
                  onChange={(e) => setFilterGST(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Rates</option>
                  {gstRates?.map((rate) => (
                    <option key={rate.id} value={String(rate.id)}>
                      {rate.rate}%
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Cascading Category Selector */}
            <div className="grid grid-cols-10 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategoryId(value);
                    setSelectedCategory1Id("");
                    setSelectedCategory2Id("");
                    setSelectedCategory3Id("");
                    const selectedCat = categories?.find((c) => c.id == value);
                    setFilterCategory(selectedCat?.name || "");
                    setFilterCategory1("");
                    setFilterCategory2("");
                    setFilterCategory3("");
                    setFilterCategory4("");
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Categories</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cat 1
                </label>
                <select
                  value={selectedCategory1Id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory1Id(value);
                    setSelectedCategory2Id("");
                    setSelectedCategory3Id("");
                    const selectedCat = categories1?.find((c) => c.id == value);
                    setFilterCategory1(selectedCat?.name || "");
                    setFilterCategory2("");
                    setFilterCategory3("");
                    setFilterCategory4("");
                  }}
                  disabled={!selectedCategoryId}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!selectedCategoryId ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                >
                  <option value="">All</option>
                  {categories1?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cat 2
                </label>
                <select
                  value={selectedCategory2Id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory2Id(value);
                    setSelectedCategory3Id("");
                    const selectedCat = categories2?.find((c) => c.id == value);
                    setFilterCategory2(selectedCat?.name || "");
                    setFilterCategory3("");
                    setFilterCategory4("");
                  }}
                  disabled={!selectedCategory1Id}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!selectedCategory1Id ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                >
                  <option value="">All</option>
                  {categories2?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cat 3
                </label>
                <select
                  value={selectedCategory3Id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategory3Id(value);
                    const selectedCat = categories3?.find((c) => c.id == value);
                    setFilterCategory3(selectedCat?.name || "");
                    setFilterCategory4("");
                  }}
                  disabled={!selectedCategory2Id}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!selectedCategory2Id ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                >
                  <option value="">All</option>
                  {categories3?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cat 4
                </label>
                <select
                  value={filterCategory4}
                  onChange={(e) => setFilterCategory4(e.target.value)}
                  disabled={!selectedCategory3Id}
                  className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!selectedCategory3Id ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                >
                  <option value="">All</option>
                  {categories4?.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Brand & Other Attributes */}
            <div className="grid grid-cols-10 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Brand
                </label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Brands</option>
                  {brands?.map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Brand Category
                </label>
                <select
                  value={filterBrandCategory}
                  onChange={(e) => setFilterBrandCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Categories</option>
                  {brandCategories?.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Brand Cat 1
                </label>
                <select
                  value={filterBrandCategory1}
                  onChange={(e) => setFilterBrandCategory1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All</option>
                  {brandCategories1?.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Flavour
                </label>
                <select
                  value={filterFlavour}
                  onChange={(e) => setFilterFlavour(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Flavours</option>
                  {flavours?.map((flavour) => (
                    <option key={flavour.id} value={flavour.name}>
                      {flavour.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Residual
                </label>
                <select
                  value={filterResidual}
                  onChange={(e) => setFilterResidual(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">All Residuals</option>
                  {residuals?.map((residual) => (
                    <option key={residual.id} value={residual.name}>
                      {residual.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Actions Bar containing KPI & Action Buttons */}
            <div className="border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Total Products KPI as a small premium button/badge */}
                <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs border border-blue-100 shadow-sm">
                  <Package className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                  Total Products: <span className="ml-1 text-blue-900 font-bold">{filteredProducts.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleClearFilters}
                  className="px-3.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <X className="h-3.5 w-3.5 text-gray-400" />
                  Clear Filters
                </button>

                <button
                  onClick={handleApplyFilters}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Apply Filters
                </button>

                <Link
                  to="/products/new"
                  className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition duration-200 shadow-sm text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Product
                </Link>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-violet-700 transition duration-200 shadow-sm text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Import Bulk
                </button>
              </div>
            </div>

            {/* Active Filters Badges - Shows currently applied filters */}
            {(activeFilters.search ||
              activeFilters.filterSKU ||
              activeFilters.filterTitle ||
              activeFilters.filterBrand ||
              activeFilters.filterFlavour ||
              activeFilters.filterResidual ||
              activeFilters.filterGST ||
              activeFilters.filterUnit ||
              activeFilters.filterHSN ||
              activeFilters.filterCategory ||
              activeFilters.filterCategory1 ||
              activeFilters.filterCategory2 ||
              activeFilters.filterCategory3 ||
              activeFilters.filterCategory4 ||
              activeFilters.filterBrandCategory ||
              activeFilters.filterBrandCategory1 ||
              activeFilters.filterMinWeight ||
              activeFilters.filterMaxWeight ||
              activeFilters.filterMinPackingWeight ||
              activeFilters.filterMaxPackingWeight ||
              activeFilters.filterMinPrice ||
              activeFilters.filterMaxPrice) && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2 animate-fadeIn">
                  <span className="text-xs text-gray-500 font-semibold mr-2 self-center">
                    Active Filters:
                  </span>
                  {activeFilters.search && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium border border-purple-100 shadow-sm">
                      Search: {activeFilters.search}
                      <button
                        onClick={() => {
                          setSearch("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            search: "",
                          }));
                        }}
                        className="hover:text-purple-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterSKU && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      SKU: {activeFilters.filterSKU}
                      <button
                        onClick={() => {
                          setFilterSKU("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterSKU: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterTitle && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Product: {activeFilters.filterTitle}
                      <button
                        onClick={() => {
                          setFilterTitle("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterTitle: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterHSN && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      HSN: {activeFilters.filterHSN}
                      <button
                        onClick={() => {
                          setFilterHSN("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterHSN: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Category: {activeFilters.filterCategory}
                      <button
                        onClick={() => {
                          setSelectedCategoryId("");
                          setSelectedCategory1Id("");
                          setSelectedCategory2Id("");
                          setSelectedCategory3Id("");
                          setFilterCategory("");
                          setFilterCategory1("");
                          setFilterCategory2("");
                          setFilterCategory3("");
                          setFilterCategory4("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterCategory: "",
                            filterCategory1: "",
                            filterCategory2: "",
                            filterCategory3: "",
                            filterCategory4: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterCategory1 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Cat 1: {activeFilters.filterCategory1}
                      <button
                        onClick={() => {
                          setSelectedCategory1Id("");
                          setSelectedCategory2Id("");
                          setSelectedCategory3Id("");
                          setFilterCategory1("");
                          setFilterCategory2("");
                          setFilterCategory3("");
                          setFilterCategory4("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterCategory1: "",
                            filterCategory2: "",
                            filterCategory3: "",
                            filterCategory4: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterCategory2 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Cat 2: {activeFilters.filterCategory2}
                      <button
                        onClick={() => {
                          setSelectedCategory2Id("");
                          setSelectedCategory3Id("");
                          setFilterCategory2("");
                          setFilterCategory3("");
                          setFilterCategory4("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterCategory2: "",
                            filterCategory3: "",
                            filterCategory4: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterCategory3 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Cat 3: {activeFilters.filterCategory3}
                      <button
                        onClick={() => {
                          setSelectedCategory3Id("");
                          setFilterCategory3("");
                          setFilterCategory4("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterCategory3: "",
                            filterCategory4: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterCategory4 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Cat 4: {activeFilters.filterCategory4}
                      <button
                        onClick={() => {
                          setFilterCategory4("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterCategory4: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterBrand && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Brand: {activeFilters.filterBrand}
                      <button
                        onClick={() => {
                          setFilterBrand("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterBrand: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterBrandCategory && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Brand Cat: {activeFilters.filterBrandCategory}
                      <button
                        onClick={() => {
                          setFilterBrandCategory("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterBrandCategory: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterBrandCategory1 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Brand Cat 1: {activeFilters.filterBrandCategory1}
                      <button
                        onClick={() => {
                          setFilterBrandCategory1("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterBrandCategory1: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterFlavour && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Flavour: {activeFilters.filterFlavour}
                      <button
                        onClick={() => {
                          setFilterFlavour("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterFlavour: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterResidual && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Residual: {activeFilters.filterResidual}
                      <button
                        onClick={() => {
                          setFilterResidual("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterResidual: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterGST && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      GST: {gstRates?.find(r => String(r.id) === String(activeFilters.filterGST))?.rate}%
                      <button
                        onClick={() => {
                          setFilterGST("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterGST: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {activeFilters.filterUnit && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Unit: {activeFilters.filterUnit}
                      <button
                        onClick={() => {
                          setFilterUnit("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterUnit: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {(activeFilters.filterMinWeight || activeFilters.filterMaxWeight) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Weight: {activeFilters.filterMinWeight || "0"} - {activeFilters.filterMaxWeight || "∞"} kg
                      <button
                        onClick={() => {
                          setFilterMinWeight("");
                          setFilterMaxWeight("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterMinWeight: "",
                            filterMaxWeight: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {(activeFilters.filterMinPackingWeight || activeFilters.filterMaxPackingWeight) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100 shadow-sm">
                      Packing Weight: {activeFilters.filterMinPackingWeight || "0"} - {activeFilters.filterMaxPackingWeight || "∞"} kg
                      <button
                        onClick={() => {
                          setFilterMinPackingWeight("");
                          setFilterMaxPackingWeight("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterMinPackingWeight: "",
                            filterMaxPackingWeight: "",
                          }));
                        }}
                        className="hover:text-blue-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {(activeFilters.filterMinPrice || activeFilters.filterMaxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100 shadow-sm">
                      {activeFilters.filterPriceType ? activeFilters.filterPriceType.toUpperCase().replace("_", " ") : "PRICE"}: ₹{activeFilters.filterMinPrice || "0"} - ₹{activeFilters.filterMaxPrice || "∞"}
                      <button
                        onClick={() => {
                          setFilterMinPrice("");
                          setFilterMaxPrice("");
                          setActiveFilters((prev) => ({
                            ...prev,
                            filterMinPrice: "",
                            filterMaxPrice: "",
                          }));
                        }}
                        className="hover:text-green-900 transition-colors font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#1a2332] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Category & GST
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Pricing Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Profit Margin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
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
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.category_display || 'Uncategorized'}
                        </span>
                        {product.category1_display && (
                          <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {product.category1_display}
                          </span>
                        )}
                        {product.category2_display && (
                          <span className="inline-block text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                            {product.category2_display}
                          </span>
                        )}
                        {product.category3_display && (
                          <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            {product.category3_display}
                          </span>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">GST:</span> {product.gst_rate_display || 'N/A'}
                        </div>
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
          {filteredProducts.length > 0 && totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-xl">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Go to page:</span>
                  <input
                    type="text"
                    placeholder={`1-${totalPages}`}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                          e.target.value = "";
                        } else {
                          alert(`Please enter a valid page number between 1 and ${totalPages}`);
                        }
                      }
                    }}
                    className="h-8 w-14 text-center text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">
                      {Math.min(startIndex + itemsPerPage, filteredProducts.length)}
                    </span>{' '}
                    of <span className="font-semibold text-gray-900">{filteredProducts.length}</span> products
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 2,
                      )
                      .map((page, index, array) => (
                        <span key={page} className="inline-flex">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-3 py-1.5 border border-gray-200 bg-white text-gray-500 text-sm">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-3 py-1.5 border text-sm font-medium transition-colors ${page === currentPage
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                              }`}
                          >
                            {page}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>

                  {/* Jump to specific page input */}
                  <div className="flex items-center gap-1.5 h-8">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Go to page:</span>
                    <input
                      type="text"
                      placeholder={`1-${totalPages}`}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, "");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= totalPages) {
                            setCurrentPage(val);
                            e.target.value = ""; // Clear on submit
                          } else {
                            alert(`Please enter a valid page number between 1 and ${totalPages}`);
                          }
                        }
                      }}
                      className="h-8 w-16 text-center text-sm border border-gray-200 rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Import Products</h2>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select CSV or Excel file
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition duration-200">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 border border-indigo-200 inline-block transition duration-200"
                    >
                      Choose File
                    </label>
                    {importFile && (
                      <p className="mt-4 text-sm text-gray-600 truncate max-w-[250px]">
                        {importFile.name}
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Supports CSV/Excel. Columns: sku (required), title (required), stock_qty, price, category, category1,2,3, etc.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importing}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Import File
                      </>
                    )}
                  </button>
                  <a
                    href="/static/sample_products_template.csv"
                    download="sample_products_template.csv"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Download Template
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;