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
  Trash2,
  AlertCircle,
} from "lucide-react";

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await axios.get(`/api/products/${id}/`);
      return response.data;
    },
  });

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
    product_weight: "",
    gst_rate: "",
    gst_calculated_amount: 0,
    use_case: "",
    brand: null,
    brand_category: null,
    brand_category1: null,
    flavour: "",
    residual: "",
    image: null,
    image1: null,
    image2: null,
    image3: null,
    image4: null,
    video_link: "",
    // Add these 5 pointer fields
    pointer1: "",
    pointer2: "",
    pointer3: "",
    pointer4: "",
    pointer5: "",
    length_cm: "",
    breadth_cm: "",
    height_cm: "",
    packing_weight: "",
    packing_weight_unit: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [image1Preview, setImage1Preview] = useState(null);
  const [image2Preview, setImage2Preview] = useState(null);
  const [image3Preview, setImage3Preview] = useState(null);
  const [image4Preview, setImage4Preview] = useState(null);

  const [existingImages, setExistingImages] = useState({});

  // GST Rate States
  const [showNewGSTRateForm, setShowNewGSTRateForm] = useState(false);
  const [showEditGSTRateForm, setShowEditGSTRateForm] = useState(false);
  const [selectedGSTRate, setSelectedGSTRate] = useState(null);
  const [newGSTRate, setNewGSTRate] = useState({
    name: "",
    rate: "",
    description: "",
  });

  // Searchable GST Rate States
  const [gstRateSearch, setGstRateSearch] = useState("");
  const [gstRateDropdownOpen, setGstRateDropdownOpen] = useState(false);
  const [selectedGSTRateName, setSelectedGSTRateName] = useState("");
  const [gstRateHighlightIndex, setGstRateHighlightIndex] = useState(-1);

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

  // Searchable Category States
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(-1);

  // Searchable Category1 States
  const [category1Search, setCategory1Search] = useState("");
  const [category1DropdownOpen, setCategory1DropdownOpen] = useState(false);
  const [selectedCategory1Name, setSelectedCategory1Name] = useState("");
  const [category1HighlightIndex, setCategory1HighlightIndex] = useState(-1);

  // Searchable Category2 States
  const [category2Search, setCategory2Search] = useState("");
  const [category2DropdownOpen, setCategory2DropdownOpen] = useState(false);
  const [selectedCategory2Name, setSelectedCategory2Name] = useState("");
  const [category2HighlightIndex, setCategory2HighlightIndex] = useState(-1);

  // Searchable Category3 States
  const [category3Search, setCategory3Search] = useState("");
  const [category3DropdownOpen, setCategory3DropdownOpen] = useState(false);
  const [selectedCategory3Name, setSelectedCategory3Name] = useState("");
  const [category3HighlightIndex, setCategory3HighlightIndex] = useState(-1);

  // Searchable Category4 States
  const [category4Search, setCategory4Search] = useState("");
  const [category4DropdownOpen, setCategory4DropdownOpen] = useState(false);
  const [selectedCategory4Name, setSelectedCategory4Name] = useState("");
  const [category4HighlightIndex, setCategory4HighlightIndex] = useState(-1);

  // Searchable Brand States
  const [brandSearch, setBrandSearch] = useState("");
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [selectedBrandName, setSelectedBrandName] = useState("");
  const [brandHighlightIndex, setBrandHighlightIndex] = useState(-1);

  // Searchable Brand Category States
  const [brandCategorySearch, setBrandCategorySearch] = useState("");
  const [brandCategoryDropdownOpen, setBrandCategoryDropdownOpen] =
    useState(false);
  const [selectedBrandCategoryName, setSelectedBrandCategoryName] =
    useState("");
  const [brandCategoryHighlightIndex, setBrandCategoryHighlightIndex] =
    useState(-1);

  // Searchable Brand Category 1 States
  const [brandCategory1Search, setBrandCategory1Search] = useState("");
  const [brandCategory1DropdownOpen, setBrandCategory1DropdownOpen] =
    useState(false);
  const [selectedBrandCategory1Name, setSelectedBrandCategory1Name] =
    useState("");
  const [brandCategory1HighlightIndex, setBrandCategory1HighlightIndex] =
    useState(-1);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parent: null,
  });
  const [newCategory1, setNewCategory1] = useState({
    name: "",
    description: "",
    parent: null,
  });
  const [newCategory2, setNewCategory2] = useState({
    name: "",
    description: "",
    parent: null,
  });
  const [newCategory3, setNewCategory3] = useState({
    name: "",
    description: "",
    parent: null,
  });
  const [newCategory4, setNewCategory4] = useState({
    name: "",
    description: "",
    parent: null,
  });

  // Brand States
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [showEditBrandForm, setShowEditBrandForm] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [newBrand, setNewBrand] = useState({ name: "", description: "" });

  // Brand Category States
  const [showNewBrandCategoryForm, setShowNewBrandCategoryForm] =
    useState(false);
  const [showEditBrandCategoryForm, setShowEditBrandCategoryForm] =
    useState(false);
  const [selectedBrandCategory, setSelectedBrandCategory] = useState(null);
  const [newBrandCategory, setNewBrandCategory] = useState({
    name: "",
    description: "",
  });

  // Unit States
  const [showNewUnitForm, setShowNewUnitForm] = useState(false);
  const [showEditUnitForm, setShowEditUnitForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [newUnit, setNewUnit] = useState({ name: "", description: "" });

  // Searchable Unit States
  const [unitSearch, setUnitSearch] = useState("");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [selectedUnitName, setSelectedUnitName] = useState("");
  const [unitHighlightIndex, setUnitHighlightIndex] = useState(-1);

  // Searchable Packing Unit States
  const [packingUnitSearch, setPackingUnitSearch] = useState("");
  const [packingUnitDropdownOpen, setPackingUnitDropdownOpen] = useState(false);
  const [selectedPackingUnitName, setSelectedPackingUnitName] = useState("");
  const [packingUnitHighlightIndex, setPackingUnitHighlightIndex] =
    useState(-1);

  // NEW: Packing Weight Unit States
  const [showNewPackingUnitForm, setShowNewPackingUnitForm] = useState(false);
  const [showEditPackingUnitForm, setShowEditPackingUnitForm] = useState(false);
  const [selectedPackingUnit, setSelectedPackingUnit] = useState(null);
  const [newPackingUnit, setNewPackingUnit] = useState({
    name: "",
    description: "",
  });

  // Flavour States
  const [showNewFlavourForm, setShowNewFlavourForm] = useState(false);
  const [showEditFlavourForm, setShowEditFlavourForm] = useState(false);
  const [selectedFlavour, setSelectedFlavour] = useState(null);
  const [newFlavour, setNewFlavour] = useState({ name: "", description: "" });

  // Searchable Flavour States
  const [flavourSearch, setFlavourSearch] = useState("");
  const [flavourDropdownOpen, setFlavourDropdownOpen] = useState(false);
  const [selectedFlavourName, setSelectedFlavourName] = useState("");
  const [flavourHighlightIndex, setFlavourHighlightIndex] = useState(-1);

  // Residual States
  const [showNewResidualForm, setShowNewResidualForm] = useState(false);
  const [showEditResidualForm, setShowEditResidualForm] = useState(false);
  const [selectedResidual, setSelectedResidual] = useState(null);
  const [newResidual, setNewResidual] = useState({ name: "", description: "" });

  // Searchable Residual States
  const [residualSearch, setResidualSearch] = useState("");
  const [residualDropdownOpen, setResidualDropdownOpen] = useState(false);
  const [selectedResidualName, setSelectedResidualName] = useState("");
  const [residualHighlightIndex, setResidualHighlightIndex] = useState(-1);

  // Brand Category 1 States
  const [showNewBrandCategory1Form, setShowNewBrandCategory1Form] =
    useState(false);
  const [showEditBrandCategory1Form, setShowEditBrandCategory1Form] =
    useState(false);
  const [selectedBrandCategory1, setSelectedBrandCategory1] = useState(null);
  const [newBrandCategory1, setNewBrandCategory1] = useState({
    name: "",
    description: "",
    parent: null,
  });

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

  const { data: packingUnits, refetch: refetchPackingUnits } = useQuery({
    queryKey: ["packingUnits"],
    queryFn: async () => {
      const response = await axios.get("/api/packing-units/");
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

  const { data: flavours, refetch: refetchFlavours } = useQuery({
    queryKey: ["flavours"],
    queryFn: async () => {
      const response = await axios.get("/api/flavours/");
      return response.data;
    },
  });

  const { data: residuals, refetch: refetchResiduals } = useQuery({
    queryKey: ["residuals"],
    queryFn: async () => {
      const response = await axios.get("/api/residuals/");
      return response.data;
    },
  });

  const { data: brandCategories1, refetch: refetchBrandCategories1 } = useQuery(
    {
      queryKey: ["brandCategories1"],
      queryFn: async () => {
        const response = await axios.get("/api/brand-categories-1/");
        return response.data;
      },
    },
  );

  const { data: categories1, refetch: refetchCategories1 } = useQuery({
    enabled: !!formData.category,
    queryKey: ["categories1", formData.category],
    queryFn: async () => {
      const response = await axios.get(
        `/api/categories/?parent_id=${formData.category}`,
      );
      return response.data;
    },
  });

  const { data: categories2, refetch: refetchCategories2 } = useQuery({
    enabled: !!formData.category1,
    queryKey: ["categories2", formData.category1],
    queryFn: async () => {
      const response = await axios.get(
        `/api/categories/?parent_id=${formData.category1}`,
      );
      return response.data;
    },
  });

  const { data: categories3, refetch: refetchCategories3 } = useQuery({
    enabled: !!formData.category2,
    queryKey: ["categories3", formData.category2],
    queryFn: async () => {
      const response = await axios.get(
        `/api/categories/?parent_id=${formData.category2}`,
      );
      return response.data;
    },
  });

  const { data: categories4, refetch: refetchCategories4 } = useQuery({
    enabled: !!formData.category3,
    queryKey: ["categories4", formData.category3],
    queryFn: async () => {
      const response = await axios.get(
        `/api/categories/?parent_id=${formData.category3}`,
      );
      return response.data;
    },
  });

  // ========== MUTATIONS ==========

  const gstRateMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/gstrates/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/gstrates/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
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
      toast.error(
        error.response?.data?.message || "Failed to process GST Rate",
      );
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/categories/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/categories/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
        const response = await axios.delete(`/api/categories/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchCategories();
      refetchCategories1();
      refetchCategories2();
      refetchCategories3();
      refetchCategories4();

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
      toast.error(
        error.response?.data?.message || "Failed to process Category",
      );
    },
  });

  const brandMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/brands/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/brands/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
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
      if (method === "POST") {
        const response = await axios.post("/api/brand-categories/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/brand-categories/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
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
      toast.error(
        error.response?.data?.message || "Failed to process Brand Category",
      );
    },
  });

  const unitMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/units/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/units/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
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

  // NEW: Packing Unit Mutation
  const packingUnitMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/units/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/units/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
        const response = await axios.delete(`/api/units/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchPackingUnits();
      setShowNewPackingUnitForm(false);
      setShowEditPackingUnitForm(false);
      setNewPackingUnit({ name: "", description: "" });
      setSelectedPackingUnit(null);
      toast.success("Packing Unit processed successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to process Packing Unit",
      );
    },
  });

  const flavourMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/flavours/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/flavours/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
        const response = await axios.delete(`/api/flavours/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchFlavours();
      setShowNewFlavourForm(false);
      setShowEditFlavourForm(false);
      setNewFlavour({ name: "", description: "" });
      setSelectedFlavour(null);
      toast.success("Flavour processed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process Flavour");
    },
  });

  const residualMutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/residuals/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(`/api/residuals/${id}/`, data);
        return response.data;
      } else if (method === "DELETE") {
        const response = await axios.delete(`/api/residuals/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchResiduals();
      setShowNewResidualForm(false);
      setShowEditResidualForm(false);
      setNewResidual({ name: "", description: "" });
      setSelectedResidual(null);
      toast.success("Residual processed successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to process Residual",
      );
    },
  });

  const brandCategory1Mutation = useMutation({
    mutationFn: async ({ id, data, method }) => {
      if (method === "POST") {
        const response = await axios.post("/api/brand-categories-1/", data);
        return response.data;
      } else if (method === "PUT") {
        const response = await axios.put(
          `/api/brand-categories-1/${id}/`,
          data,
        );
        return response.data;
      } else if (method === "DELETE") {
        const response = await axios.delete(`/api/brand-categories-1/${id}/`);
        return response.data;
      }
    },
    onSuccess: () => {
      refetchBrandCategories1();
      setShowNewBrandCategory1Form(false);
      setShowEditBrandCategory1Form(false);
      setNewBrandCategory1({ name: "", description: "", parent: null });
      setSelectedBrandCategory1(null);
      toast.success("Brand Category 1 processed successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to process Brand Category 1",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();
      const nullableFields = new Set([
        "category1",
        "category2",
        "category3",
        "category4",
      ]);

      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (!key.startsWith("image") && key !== "video_link") {
          if (value !== null && value !== undefined && value !== "") {
            formDataToSend.append(key, String(value));
          } else if (nullableFields.has(key)) {
            // Explicitly send cleared child categories so the backend removes
            // the old relationship instead of keeping the previous value.
            formDataToSend.append(key, "");
          }
        }
      });

      if (data.video_link && data.video_link !== "") {
        formDataToSend.append("video_link", data.video_link);
      }

      const imageFields = ["image", "image1", "image2", "image3", "image4"];
      imageFields.forEach((imgKey) => {
        if (data[imgKey] instanceof File) {
          formDataToSend.append(imgKey, data[imgKey]);
        }
      });

      const response = await axios({
        method: "put",
        url: `/api/products/${id}/`,
        data: formDataToSend,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["product", id]);
      toast.success("Product updated successfully!");
      navigate("/products");
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to update product",
      );
    },
  });

  // ========== FILTERED ARRAYS ==========

  // Filter gstRates based on search text
  const filteredGSTRates =
    gstRates?.filter((gst) =>
      `${gst.name} ${gst.rate}`
        .toLowerCase()
        .includes(String(gstRateSearch).toLowerCase()),
    ) || [];

  const filterByName = (items, search) =>
    items?.filter((item) =>
      item.name.toLowerCase().includes(String(search).toLowerCase()),
    ) || [];

  const sortBySearchRelevance = (items, search) => {
    const normalizedSearch = String(search).trim().toLowerCase();
    return [...items].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStartsWith = normalizedSearch
        ? aName.startsWith(normalizedSearch)
        : false;
      const bStartsWith = normalizedSearch
        ? bName.startsWith(normalizedSearch)
        : false;

      if (aStartsWith !== bStartsWith) {
        return aStartsWith ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
  };

  const filteredCategories = filterByName(categories, categorySearch);
  const filteredCategories1 = filterByName(categories1, category1Search);
  const filteredCategories2 = filterByName(categories2, category2Search);
  const filteredCategories3 = filterByName(categories3, category3Search);
  const filteredCategories4 = filterByName(categories4, category4Search);
  const filteredBrands = filterByName(brands, brandSearch);
  const filteredBrandCategories = filterByName(
    brandCategories,
    brandCategorySearch,
  );
  const filteredBrandCategories1 = filterByName(
    brandCategories1,
    brandCategory1Search,
  );
  const filteredUnits = filterByName(units, unitSearch);
  const filteredPackingUnits = filterByName(
    packingUnits,
    packingUnitSearch,
  );

  const filteredFlavours =
    filterByName(flavours, flavourSearch);

  const filteredResiduals =
    filterByName(residuals, residualSearch);

  // Load product data into form
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || "",
        hsn: product.hsn || "",
        title: product.title || "",
        category: product.category || null,
        category1: product.category1 || null,
        category2: product.category2 || null,
        category3: product.category3 || null,
        category4: product.category4 || null,
        stock_qty: product.stock_qty || 0,
        mrp: product.mrp || 0,
        b2c_price: product.b2c_price || 0,
        b2b_price: product.b2b_price || 0,
        price: product.price || 0,
        purchase_price: product.purchase_price || 0,
        product_volume: product.product_volume || 0,
        unit: product.unit || null,
        product_weight: product.product_weight || "",
        gst_rate: product.gst_rate || "",
        gst_calculated_amount: product.gst_calculated_amount || 0,
        use_case: product.use_case || "",
        brand: product.brand || null,
        brand_category: product.brand_category || null,
        brand_category1: product.brand_category1 || null,
        flavour: product.flavour || "",
        residual: product.residual || "",
        image: null,
        image1: null,
        image2: null,
        image3: null,
        image4: null,
        video_link: product.video_link || "",
        // Add these 5 pointer fields
        pointer1: product.pointer1 || "",
        pointer2: product.pointer2 || "",
        pointer3: product.pointer3 || "",
        pointer4: product.pointer4 || "",
        pointer5: product.pointer5 || "",
        length_cm: product.length_cm || "",
        breadth_cm: product.breadth_cm || "",
        height_cm: product.height_cm || "",
        packing_weight: product.packing_weight || "",
        packing_weight_unit: product.packing_weight_unit || null,
      });

      setExistingImages({
        image: product.image,
        image1: product.image1,
        image2: product.image2,
        image3: product.image3,
        image4: product.image4,
      });

      if (product.image1) setImage1Preview(product.image1);
      if (product.image2) setImage2Preview(product.image2);
      if (product.image3) setImage3Preview(product.image3);
      if (product.image4) setImage4Preview(product.image4);
      if (product.image) setImagePreview(product.image);

      // Set search states
      if (product.flavour) {
        setFlavourSearch(product.flavour);
        setSelectedFlavourName(product.flavour);
      }
      if (product.residual) {
        setResidualSearch(product.residual);
        setSelectedResidualName(product.residual);
      }
      if (product.gst_rate && gstRates) {
        const selectedGst = gstRates.find(
          (r) => r.id === parseInt(product.gst_rate),
        );
        if (selectedGst) {
          setGstRateSearch(selectedGst.rate + "%");
          setSelectedGSTRateName(selectedGst.rate + "%");
        }
      }
    }
  }, [product, gstRates]);

  // Update selectedUnitName when formData.unit changes
  useEffect(() => {
    if (formData.unit && units) {
      const selected = units.find((u) => u.id === parseInt(formData.unit));
      if (selected) {
        setSelectedUnitName(selected.name);
        setUnitSearch(selected.name);
      }
    } else if (!formData.unit) {
      setSelectedUnitName("");
      setUnitSearch("");
    }
  }, [formData.unit, units]);

  // Update selectedPackingUnitName when formData.packing_weight_unit changes
  useEffect(() => {
    if (formData.packing_weight_unit && packingUnits) {
      const selected = packingUnits.find(
        (u) => u.id === parseInt(formData.packing_weight_unit),
      );
      if (selected) {
        setSelectedPackingUnitName(selected.name);
        setPackingUnitSearch(selected.name);
      }
    } else if (!formData.packing_weight_unit) {
      setSelectedPackingUnitName("");
      setPackingUnitSearch("");
    }
  }, [formData.packing_weight_unit, packingUnits]);

  // Update selectedCategoryName when formData.category changes
  useEffect(() => {
    if (formData.category && categories) {
      const selected = categories.find(
        (c) => c.id === parseInt(formData.category),
      );
      if (selected) {
        setSelectedCategoryName(selected.name);
        setCategorySearch(selected.name);
      }
    }
  }, [formData.category, categories]);

  // Update selectedCategory1Name when formData.category1 changes
  useEffect(() => {
    if (formData.category1 && categories1) {
      const selected = categories1.find(
        (c) => c.id === parseInt(formData.category1),
      );
      if (selected) {
        setSelectedCategory1Name(selected.name);
        setCategory1Search(selected.name);
      }
    }
  }, [formData.category1, categories1]);

  // Update selectedCategory2Name when formData.category2 changes
  useEffect(() => {
    if (formData.category2 && categories2) {
      const selected = categories2.find(
        (c) => c.id === parseInt(formData.category2),
      );
      if (selected) {
        setSelectedCategory2Name(selected.name);
        setCategory2Search(selected.name);
      }
    }
  }, [formData.category2, categories2]);

  // Update selectedCategory3Name when formData.category3 changes
  useEffect(() => {
    if (formData.category3 && categories3) {
      const selected = categories3.find(
        (c) => c.id === parseInt(formData.category3),
      );
      if (selected) {
        setSelectedCategory3Name(selected.name);
        setCategory3Search(selected.name);
      }
    }
  }, [formData.category3, categories3]);

  // Update selectedCategory4Name when formData.category4 changes
  useEffect(() => {
    if (formData.category4 && categories4) {
      const selected = categories4.find(
        (c) => c.id === parseInt(formData.category4),
      );
      if (selected) {
        setSelectedCategory4Name(selected.name);
        setCategory4Search(selected.name);
      }
    }
  }, [formData.category4, categories4]);

  // Update selectedBrandName when formData.brand changes
  useEffect(() => {
    if (formData.brand && brands) {
      const selected = brands.find((b) => b.id === parseInt(formData.brand));
      if (selected) {
        setSelectedBrandName(selected.name);
        setBrandSearch(selected.name);
      }
    }
  }, [formData.brand, brands]);

  // Update selectedBrandCategoryName when formData.brand_category changes
  useEffect(() => {
    if (formData.brand_category && brandCategories) {
      const selected = brandCategories.find(
        (b) => b.id === parseInt(formData.brand_category),
      );
      if (selected) {
        setSelectedBrandCategoryName(selected.name);
        setBrandCategorySearch(selected.name);
      }
    }
  }, [formData.brand_category, brandCategories]);

  // Update selectedBrandCategory1Name when formData.brand_category1 changes
  useEffect(() => {
    if (formData.brand_category1 && brandCategories1) {
      const selected = brandCategories1.find(
        (b) => b.id === parseInt(formData.brand_category1),
      );
      if (selected) {
        setSelectedBrandCategory1Name(selected.name);
        setBrandCategory1Search(selected.name);
      }
    }
  }, [formData.brand_category1, brandCategories1]);

  useEffect(() => {
    if (!formData.flavour) {
      setSelectedFlavourName("");
      setFlavourSearch("");
      return;
    }

    const selected = flavours?.find(
      (flavour) => flavour.id === parseInt(formData.flavour),
    );
    if (selected) {
      setSelectedFlavourName(selected.name);
      setFlavourSearch(selected.name);
    }
  }, [formData.flavour, flavours]);

  useEffect(() => {
    if (!formData.residual) {
      setSelectedResidualName("");
      setResidualSearch("");
      return;
    }

    const selected = residuals?.find(
      (residual) => residual.id === parseInt(formData.residual),
    );
    if (selected) {
      setSelectedResidualName(selected.name);
      setResidualSearch(selected.name);
    }
  }, [formData.residual, residuals]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".category-input-container")) {
        setCategoryDropdownOpen(false);
        setCategoryHighlightIndex(-1);
      }
      if (!event.target.closest(".category1-input-container")) {
        setCategory1DropdownOpen(false);
        setCategory1HighlightIndex(-1);
      }
      if (!event.target.closest(".category2-input-container")) {
        setCategory2DropdownOpen(false);
        setCategory2HighlightIndex(-1);
      }
      if (!event.target.closest(".category3-input-container")) {
        setCategory3DropdownOpen(false);
        setCategory3HighlightIndex(-1);
      }
      if (!event.target.closest(".category4-input-container")) {
        setCategory4DropdownOpen(false);
        setCategory4HighlightIndex(-1);
      }
      if (!event.target.closest(".unit-input-container")) {
        setUnitDropdownOpen(false);
        setUnitHighlightIndex(-1);
      }
      if (!event.target.closest(".packing-unit-input-container")) {
        setPackingUnitDropdownOpen(false);
        setPackingUnitHighlightIndex(-1);
      }
      if (!event.target.closest(".brand-input-container")) {
        setBrandDropdownOpen(false);
        setBrandHighlightIndex(-1);
      }
      if (!event.target.closest(".brand-category-input-container")) {
        setBrandCategoryDropdownOpen(false);
        setBrandCategoryHighlightIndex(-1);
      }
      if (!event.target.closest(".brand-category1-input-container")) {
        setBrandCategory1DropdownOpen(false);
        setBrandCategory1HighlightIndex(-1);
      }
      if (!event.target.closest(".flavour-input-container")) {
        setFlavourDropdownOpen(false);
        setFlavourHighlightIndex(-1);
      }
      if (!event.target.closest(".residual-input-container")) {
        setResidualDropdownOpen(false);
        setResidualHighlightIndex(-1);
      }
      if (!event.target.closest(".gst-rate-input-container")) {
        setGstRateDropdownOpen(false);
        setGstRateHighlightIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [
    categoryDropdownOpen,
    category1DropdownOpen,
    category2DropdownOpen,
    category3DropdownOpen,
    category4DropdownOpen,
    unitDropdownOpen,
    packingUnitDropdownOpen,
    brandDropdownOpen,
    brandCategoryDropdownOpen,
    brandCategory1DropdownOpen,
    flavourDropdownOpen,
    residualDropdownOpen,
    gstRateDropdownOpen,
  ]);

  // ========== HANDLERS ==========

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && name.startsWith("image")) {
      if (files && files.length > 0) {
        const file = files[0];
        setFormData((prev) => ({ ...prev, [name]: file }));

        const reader = new FileReader();
        reader.onloadend = () => {
          switch (name) {
            case "image":
              setImagePreview(reader.result);
              break;
            case "image1":
              setImage1Preview(reader.result);
              break;
            case "image2":
              setImage2Preview(reader.result);
              break;
            case "image3":
              setImage3Preview(reader.result);
              break;
            case "image4":
              setImage4Preview(reader.result);
              break;
            default:
              break;
          }
        };
        reader.readAsDataURL(file);
      } else {
        setFormData((prev) => ({ ...prev, [name]: null }));
      }
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseFloat(value) || 0,
      }));
    } else if (name === "unit") {
      // Product unit - store NAME (as before)
      const selectedUnit = units?.find((unit) => unit.id == value);
      setFormData((prev) => ({
        ...prev,
        unit: selectedUnit ? selectedUnit.name : value || "",
      }));
    } else if (name === "packing_weight_unit") {
      // Packing unit - store ID (Foreign Key expects ID)
      setFormData((prev) => ({
        ...prev,
        packing_weight_unit: value || null,
      }));
    } else if (name === "category") {
      // When category changes, clear all dependent categories
      setFormData((prev) => ({
        ...prev,
        category: value || null,
        category1: null,
        category2: null,
        category3: null,
        category4: null,
      }));
      // Reset search states
      setCategory1Search("");
      setSelectedCategory1Name("");
      setCategory2Search("");
      setSelectedCategory2Name("");
      setCategory3Search("");
      setSelectedCategory3Name("");
      setCategory4Search("");
      setSelectedCategory4Name("");
    } else if (name === "category1") {
      // When category1 changes, clear dependent categories
      setFormData((prev) => ({
        ...prev,
        category1: value || null,
        category2: null,
        category3: null,
        category4: null,
      }));
      // Reset search states
      setCategory2Search("");
      setSelectedCategory2Name("");
      setCategory3Search("");
      setSelectedCategory3Name("");
      setCategory4Search("");
      setSelectedCategory4Name("");
    } else if (name === "category2") {
      // When category2 changes, clear dependent categories
      setFormData((prev) => ({
        ...prev,
        category2: value || null,
        category3: null,
        category4: null,
      }));
      // Reset search states
      setCategory3Search("");
      setSelectedCategory3Name("");
      setCategory4Search("");
      setSelectedCategory4Name("");
    } else if (name === "category3") {
      // When category3 changes, clear category4
      setFormData((prev) => ({
        ...prev,
        category3: value || null,
        category4: null,
      }));
      // Reset search states
      setCategory4Search("");
      setSelectedCategory4Name("");
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

    updateMutation.mutate(formData);
  };

  const removeImage = (imageName) => {
    setFormData((prev) => ({ ...prev, [imageName]: null }));
    switch (imageName) {
      case "image":
        setImagePreview(null);
        break;
      case "image1":
        setImage1Preview(null);
        break;
      case "image2":
        setImage2Preview(null);
        break;
      case "image3":
        setImage3Preview(null);
        break;
      case "image4":
        setImage4Preview(null);
        break;
      default:
        break;
    }
    const fileInput = document.getElementById(`${imageName}-upload`);
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // GST Rate Handlers (same as ProductNew)
  const handleGSTRateChange = (e) => {
    setNewGSTRate({ ...newGSTRate, [e.target.name]: e.target.value });
  };

  const handleGSTRateSubmit = (e) => {
    e.preventDefault();
    gstRateMutation.mutate({ data: newGSTRate, method: "POST" });
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
      method: "PUT",
    });
  };

  const handleDeleteGSTRate = (id) => {
    if (window.confirm("Are you sure you want to delete this GST Rate?")) {
      gstRateMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Category Handlers
  const handleCategoryChange = (e, categoryType) => {
    const { name, value } = e.target;
    if (categoryType === "main") {
      setNewCategory({ ...newCategory, [name]: value });
    } else if (categoryType === "level1") {
      setNewCategory1({ ...newCategory1, [name]: value });
    } else if (categoryType === "level2") {
      setNewCategory2({ ...newCategory2, [name]: value });
    } else if (categoryType === "level3") {
      setNewCategory3({ ...newCategory3, [name]: value });
    } else if (categoryType === "level4") {
      setNewCategory4({ ...newCategory4, [name]: value });
    }
  };

  const handleCategorySubmit = (e, categoryType) => {
    e.preventDefault();
    let dataToSubmit = {};

    if (categoryType === "main") {
      dataToSubmit = newCategory;
    } else if (categoryType === "level1") {
      dataToSubmit = { ...newCategory1, parent: formData.category };
    } else if (categoryType === "level2") {
      dataToSubmit = { ...newCategory2, parent: formData.category1 };
    } else if (categoryType === "level3") {
      dataToSubmit = { ...newCategory3, parent: formData.category2 };
    } else if (categoryType === "level4") {
      dataToSubmit = { ...newCategory4, parent: formData.category3 };
    }

    categoryMutation.mutate({ data: dataToSubmit, method: "POST" });
  };

  const handleEditCategory = (category, level) => {
    setSelectedCategory(category);
    setSelectedCategoryLevel(level);

    if (level === "main") {
      setNewCategory({
        name: category.name,
        description: category.description || "",
        parent: category.parent,
      });
      setShowEditCategoryForm(true);
    } else if (level === "level1") {
      setNewCategory1({
        name: category.name,
        description: category.description || "",
        parent: category.parent,
      });
      setShowEditCategory1Form(true);
    } else if (level === "level2") {
      setNewCategory2({
        name: category.name,
        description: category.description || "",
        parent: category.parent,
      });
      setShowEditCategory2Form(true);
    } else if (level === "level3") {
      setNewCategory3({
        name: category.name,
        description: category.description || "",
        parent: category.parent,
      });
      setShowEditCategory3Form(true);
    } else if (level === "level4") {
      setNewCategory4({
        name: category.name,
        description: category.description || "",
        parent: category.parent,
      });
      setShowEditCategory4Form(true);
    }
  };

  const handleUpdateCategory = (e, level) => {
    e.preventDefault();
    let dataToSubmit = {};

    if (level === "main") {
      dataToSubmit = newCategory;
    } else if (level === "level1") {
      dataToSubmit = { ...newCategory1, parent: formData.category };
    } else if (level === "level2") {
      dataToSubmit = { ...newCategory2, parent: formData.category1 };
    } else if (level === "level3") {
      dataToSubmit = { ...newCategory3, parent: formData.category2 };
    } else if (level === "level4") {
      dataToSubmit = { ...newCategory4, parent: formData.category3 };
    }

    categoryMutation.mutate({
      id: selectedCategory.id,
      data: dataToSubmit,
      method: "PUT",
    });
  };

  const handleDeleteCategory = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this Category? This will also delete all sub-categories.",
      )
    ) {
      categoryMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Brand Handlers
  const handleBrandChange = (e) => {
    setNewBrand({ ...newBrand, [e.target.name]: e.target.value });
  };

  const handleBrandSubmit = (e) => {
    e.preventDefault();
    brandMutation.mutate({ data: newBrand, method: "POST" });
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
      method: "PUT",
    });
  };

  const handleDeleteBrand = (id) => {
    if (window.confirm("Are you sure you want to delete this Brand?")) {
      brandMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Brand Category Handlers
  const handleBrandCategoryChange = (e) => {
    setNewBrandCategory({
      ...newBrandCategory,
      [e.target.name]: e.target.value,
    });
  };

  const handleBrandCategorySubmit = (e) => {
    e.preventDefault();
    brandCategoryMutation.mutate({ data: newBrandCategory, method: "POST" });
  };

  const handleEditBrandCategory = (category) => {
    setSelectedBrandCategory(category);
    setNewBrandCategory({
      name: category.name,
      description: category.description || "",
    });
    setShowEditBrandCategoryForm(true);
  };

  const handleUpdateBrandCategory = (e) => {
    e.preventDefault();
    brandCategoryMutation.mutate({
      id: selectedBrandCategory.id,
      data: newBrandCategory,
      method: "PUT",
    });
  };

  const handleDeleteBrandCategory = (id) => {
    if (
      window.confirm("Are you sure you want to delete this Brand Category?")
    ) {
      brandCategoryMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Unit Handlers
  const handleUnitChange = (e) => {
    setNewUnit({ ...newUnit, [e.target.name]: e.target.value });
  };

  const handleUnitSubmit = (e) => {
    e.preventDefault();
    unitMutation.mutate({ data: newUnit, method: "POST" });
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
      method: "PUT",
    });
  };

  const handleDeleteUnit = (id) => {
    if (window.confirm("Are you sure you want to delete this Unit?")) {
      unitMutation.mutate({ id, method: "DELETE" });
    }
  };

  // NEW: Packing Unit Handlers
  const handlePackingUnitChange = (e) => {
    setNewPackingUnit({ ...newPackingUnit, [e.target.name]: e.target.value });
  };

  const handlePackingUnitSubmit = (e) => {
    e.preventDefault();
    packingUnitMutation.mutate({
      data: { ...newPackingUnit, unit_type: "packing" },
      method: "POST",
    });
  };

  const handleEditPackingUnit = (unit) => {
    setSelectedPackingUnit(unit);
    setNewPackingUnit({ name: unit.name, description: unit.description || "" });
    setShowEditPackingUnitForm(true);
  };

  const handleUpdatePackingUnit = (e) => {
    e.preventDefault();
    packingUnitMutation.mutate({
      id: selectedPackingUnit.id,
      data: newPackingUnit,
      method: "PUT",
    });
  };

  const handleDeletePackingUnit = (id) => {
    if (window.confirm("Are you sure you want to delete this Packing Unit?")) {
      packingUnitMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Flavour Handlers
  const handleFlavourChange = (e) => {
    setNewFlavour({ ...newFlavour, [e.target.name]: e.target.value });
  };

  const handleFlavourSubmit = (e) => {
    e.preventDefault();
    flavourMutation.mutate({ data: newFlavour, method: "POST" });
  };

  const handleEditFlavour = (flavour) => {
    setSelectedFlavour(flavour);
    setNewFlavour({
      name: flavour.name,
      description: flavour.description || "",
    });
    setShowEditFlavourForm(true);
  };

  const handleUpdateFlavour = (e) => {
    e.preventDefault();
    flavourMutation.mutate({
      id: selectedFlavour.id,
      data: newFlavour,
      method: "PUT",
    });
  };

  const handleDeleteFlavour = (id) => {
    if (window.confirm("Are you sure you want to delete this Flavour?")) {
      flavourMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Residual Handlers
  const handleResidualChange = (e) => {
    setNewResidual({ ...newResidual, [e.target.name]: e.target.value });
  };

  const handleResidualSubmit = (e) => {
    e.preventDefault();
    residualMutation.mutate({ data: newResidual, method: "POST" });
  };

  const handleEditResidual = (residual) => {
    setSelectedResidual(residual);
    setNewResidual({
      name: residual.name,
      description: residual.description || "",
    });
    setShowEditResidualForm(true);
  };

  const handleUpdateResidual = (e) => {
    e.preventDefault();
    residualMutation.mutate({
      id: selectedResidual.id,
      data: newResidual,
      method: "PUT",
    });
  };

  const handleDeleteResidual = (id) => {
    if (window.confirm("Are you sure you want to delete this Residual?")) {
      residualMutation.mutate({ id, method: "DELETE" });
    }
  };

  // Brand Category 1 Handlers
  const handleBrandCategory1Change = (e) => {
    setNewBrandCategory1({
      ...newBrandCategory1,
      [e.target.name]: e.target.value,
    });
  };

  const handleBrandCategory1Submit = (e) => {
    e.preventDefault();
    brandCategory1Mutation.mutate({ data: newBrandCategory1, method: "POST" });
  };

  const handleEditBrandCategory1 = (category) => {
    setSelectedBrandCategory1(category);
    setNewBrandCategory1({
      name: category.name,
      description: category.description || "",
      parent: category.parent,
    });
    setShowEditBrandCategory1Form(true);
  };

  const handleUpdateBrandCategory1 = (e) => {
    e.preventDefault();
    brandCategory1Mutation.mutate({
      id: selectedBrandCategory1.id,
      data: newBrandCategory1,
      method: "PUT",
    });
  };

  const handleDeleteBrandCategory1 = (id) => {
    if (
      window.confirm("Are you sure you want to delete this Brand Category 1?")
    ) {
      brandCategory1Mutation.mutate({ id, method: "DELETE" });
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading product details...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
            Error Loading Product
          </h2>
          <p className="text-gray-600 text-center mb-6">{error.message}</p>
          <button
            onClick={() => navigate("/products")}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        {/* <div className="mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/products")} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Edit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">Update product information</p>
            </div>
          </div>
        </div> */}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
              {/* Main Category */}
              <div className="space-y-2 relative" style={{ zIndex: 15 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Category
                </label>
                <div className="flex gap-2">
                  <div className="category-input-container flex-1 relative">
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setCategoryDropdownOpen(true);
                        setCategoryHighlightIndex(-1);
                      }}
                      onFocus={() => setCategoryDropdownOpen(true)}
                      onClick={() => setCategoryDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setCategoryDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedCategories = [...filteredCategories].sort(
                          (a, b) => a.name.localeCompare(b.name),
                        );
                        if (
                          e.key === "Tab" &&
                          categoryDropdownOpen &&
                          sortedCategories.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            categoryHighlightIndex < sortedCategories.length - 1
                              ? categoryHighlightIndex + 1
                              : 0;
                          setCategoryHighlightIndex(nextIndex);
                          const selected = sortedCategories[nextIndex];
                          setFormData({
                            ...formData,
                            category: selected.id,
                            category1: null,
                            category2: null,
                            category3: null,
                            category4: null,
                          });
                          setCategorySearch(selected.name);
                          setSelectedCategoryName(selected.name);
                          setCategory1Search("");
                          setSelectedCategory1Name("");
                          setCategory2Search("");
                          setSelectedCategory2Name("");
                          setCategory3Search("");
                          setSelectedCategory3Name("");
                          setCategory4Search("");
                          setSelectedCategory4Name("");
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            categoryHighlightIndex >= 0 &&
                            sortedCategories[categoryHighlightIndex]
                          ) {
                            const selected =
                              sortedCategories[categoryHighlightIndex];
                            setFormData({
                              ...formData,
                              category: selected.id,
                              category1: null,
                              category2: null,
                              category3: null,
                              category4: null,
                            });
                            setCategorySearch(selected.name);
                            setSelectedCategoryName(selected.name);
                            setCategory1Search("");
                            setSelectedCategory1Name("");
                            setCategory2Search("");
                            setSelectedCategory2Name("");
                            setCategory3Search("");
                            setSelectedCategory3Name("");
                            setCategory4Search("");
                            setSelectedCategory4Name("");
                          }
                          setCategoryDropdownOpen(false);
                          setCategoryHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setCategoryHighlightIndex((prev) =>
                            prev < sortedCategories.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setCategoryHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedCategories.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setCategoryDropdownOpen(false);
                          setCategoryHighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedCategoryName || "Search or select Category"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {categoryDropdownOpen && categories && (
                      <div
                        className="category-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredCategories.length > 0 ? (
                          [...filteredCategories]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    category: category.id,
                                    category1: null,
                                    category2: null,
                                    category3: null,
                                    category4: null,
                                  });
                                  setCategorySearch(category.name);
                                  setSelectedCategoryName(category.name);
                                  setCategory1Search("");
                                  setSelectedCategory1Name("");
                                  setCategory2Search("");
                                  setSelectedCategory2Name("");
                                  setCategory3Search("");
                                  setSelectedCategory3Name("");
                                  setCategory4Search("");
                                  setSelectedCategory4Name("");
                                  setCategoryDropdownOpen(false);
                                  setCategoryHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === categoryHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        const selected = categories.find(
                          (cat) => cat.id === parseInt(formData.category),
                        );
                        if (selected) handleEditCategory(selected, "main");
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories.find(
                          (cat) => cat.id === parseInt(formData.category),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Category?",
                          )
                        ) {
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
              <div className="space-y-2 relative" style={{ zIndex: 20 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Category 1
                </label>
                <div className="flex gap-2">
                  <div className="category1-input-container flex-1 relative">
                    <input
                      type="text"
                      value={category1Search}
                      onChange={(e) => {
                        setCategory1Search(e.target.value);
                        setCategory1DropdownOpen(true);
                        setCategory1HighlightIndex(-1);
                      }}
                      onFocus={() => setCategory1DropdownOpen(true)}
                      onClick={() => setCategory1DropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setCategory1DropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedCategories = [...filteredCategories1].sort(
                          (a, b) => a.name.localeCompare(b.name),
                        );
                        if (
                          e.key === "Tab" &&
                          category1DropdownOpen &&
                          sortedCategories.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            category1HighlightIndex <
                            sortedCategories.length - 1
                              ? category1HighlightIndex + 1
                              : 0;
                          setCategory1HighlightIndex(nextIndex);
                          const selected = sortedCategories[nextIndex];
                          setFormData({ ...formData, category1: selected.id });
                          setCategory1Search(selected.name);
                          setSelectedCategory1Name(selected.name);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            category1HighlightIndex >= 0 &&
                            sortedCategories[category1HighlightIndex]
                          ) {
                            const selected =
                              sortedCategories[category1HighlightIndex];
                            setFormData({
                              ...formData,
                              category1: selected.id,
                            });
                            setCategory1Search(selected.name);
                            setSelectedCategory1Name(selected.name);
                          }
                          setCategory1DropdownOpen(false);
                          setCategory1HighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setCategory1HighlightIndex((prev) =>
                            prev < sortedCategories.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setCategory1HighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedCategories.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setCategory1DropdownOpen(false);
                          setCategory1HighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedCategory1Name || "Search or select Category 1"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.category}
                    />
                    {category1DropdownOpen && categories1 && (
                      <div
                        className="category1-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredCategories1.length > 0 ? (
                          [...filteredCategories1]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    category1: category.id,
                                    category2: null,
                                    category3: null,
                                    category4: null,
                                  });
                                  setCategory1Search(category.name);
                                  setSelectedCategory1Name(category.name);
                                  setCategory2Search("");
                                  setSelectedCategory2Name("");
                                  setCategory3Search("");
                                  setSelectedCategory3Name("");
                                  setCategory4Search("");
                                  setSelectedCategory4Name("");
                                  setCategory1DropdownOpen(false);
                                  setCategory1HighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === category1HighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        const selected = categories1.find(
                          (cat) => cat.id === parseInt(formData.category1),
                        );
                        if (selected) handleEditCategory(selected, "level1");
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories1.find(
                          (cat) => cat.id === parseInt(formData.category1),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Category?",
                          )
                        ) {
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
              <div className="space-y-2 relative" style={{ zIndex: 20 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Category 2
                </label>
                <div className="flex gap-2">
                  <div className="category2-input-container flex-1 relative">
                    <input
                      type="text"
                      value={category2Search}
                      onChange={(e) => {
                        setCategory2Search(e.target.value);
                        setCategory2DropdownOpen(true);
                        setCategory2HighlightIndex(-1);
                      }}
                      onFocus={() => setCategory2DropdownOpen(true)}
                      onClick={() => setCategory2DropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setCategory2DropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedCategories = [...filteredCategories2].sort(
                          (a, b) => a.name.localeCompare(b.name),
                        );
                        if (
                          e.key === "Tab" &&
                          category2DropdownOpen &&
                          sortedCategories.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            category2HighlightIndex <
                            sortedCategories.length - 1
                              ? category2HighlightIndex + 1
                              : 0;
                          setCategory2HighlightIndex(nextIndex);
                          const selected = sortedCategories[nextIndex];
                          setFormData({ ...formData, category2: selected.id });
                          setCategory2Search(selected.name);
                          setSelectedCategory2Name(selected.name);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            category2HighlightIndex >= 0 &&
                            sortedCategories[category2HighlightIndex]
                          ) {
                            const selected =
                              sortedCategories[category2HighlightIndex];
                            setFormData({
                              ...formData,
                              category2: selected.id,
                            });
                            setCategory2Search(selected.name);
                            setSelectedCategory2Name(selected.name);
                          }
                          setCategory2DropdownOpen(false);
                          setCategory2HighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setCategory2HighlightIndex((prev) =>
                            prev < sortedCategories.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setCategory2HighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedCategories.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setCategory2DropdownOpen(false);
                          setCategory2HighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedCategory2Name || "Search or select Category 2"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.category1}
                    />
                    {category2DropdownOpen && categories2 && (
                      <div
                        className="category2-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredCategories2.length > 0 ? (
                          [...filteredCategories2]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    category2: category.id,
                                    category3: null,
                                    category4: null,
                                  });
                                  setCategory2Search(category.name);
                                  setSelectedCategory2Name(category.name);
                                  setCategory3Search("");
                                  setSelectedCategory3Name("");
                                  setCategory4Search("");
                                  setSelectedCategory4Name("");
                                  setCategory2DropdownOpen(false);
                                  setCategory2HighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === category2HighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        const selected = categories2.find(
                          (cat) => cat.id === parseInt(formData.category2),
                        );
                        if (selected) handleEditCategory(selected, "level2");
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories2.find(
                          (cat) => cat.id === parseInt(formData.category2),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Category?",
                          )
                        ) {
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
              <div className="space-y-2 relative" style={{ zIndex: 15 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Category 3
                </label>
                <div className="flex gap-2">
                  <div className="category3-input-container flex-1 relative">
                    <input
                      type="text"
                      value={category3Search}
                      onChange={(e) => {
                        setCategory3Search(e.target.value);
                        setCategory3DropdownOpen(true);
                        setCategory3HighlightIndex(-1);
                      }}
                      onFocus={() => setCategory3DropdownOpen(true)}
                      onClick={() => setCategory3DropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setCategory3DropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedCategories = [...filteredCategories3].sort(
                          (a, b) => a.name.localeCompare(b.name),
                        );
                        if (
                          e.key === "Tab" &&
                          category3DropdownOpen &&
                          sortedCategories.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            category3HighlightIndex <
                            sortedCategories.length - 1
                              ? category3HighlightIndex + 1
                              : 0;
                          setCategory3HighlightIndex(nextIndex);
                          const selected = sortedCategories[nextIndex];
                          setFormData({ ...formData, category3: selected.id });
                          setCategory3Search(selected.name);
                          setSelectedCategory3Name(selected.name);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            category3HighlightIndex >= 0 &&
                            sortedCategories[category3HighlightIndex]
                          ) {
                            const selected =
                              sortedCategories[category3HighlightIndex];
                            setFormData({
                              ...formData,
                              category3: selected.id,
                            });
                            setCategory3Search(selected.name);
                            setSelectedCategory3Name(selected.name);
                          }
                          setCategory3DropdownOpen(false);
                          setCategory3HighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setCategory3HighlightIndex((prev) =>
                            prev < sortedCategories.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setCategory3HighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedCategories.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setCategory3DropdownOpen(false);
                          setCategory3HighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedCategory3Name || "Search or select Category 3"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.category2}
                    />
                    {category3DropdownOpen && categories3 && (
                      <div
                        className="category3-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredCategories3.length > 0 ? (
                          [...filteredCategories3]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    category3: category.id,
                                    category4: null,
                                  });
                                  setCategory3Search(category.name);
                                  setSelectedCategory3Name(category.name);
                                  setCategory4Search("");
                                  setSelectedCategory4Name("");
                                  setCategory3DropdownOpen(false);
                                  setCategory3HighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === category3HighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        const selected = categories3.find(
                          (cat) => cat.id === parseInt(formData.category3),
                        );
                        if (selected) handleEditCategory(selected, "level3");
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories3.find(
                          (cat) => cat.id === parseInt(formData.category3),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Category?",
                          )
                        ) {
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
              <div className="space-y-2 relative" style={{ zIndex: 15 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Category 4
                </label>
                <div className="flex gap-2">
                  <div className="category4-input-container flex-1 relative">
                    <input
                      type="text"
                      value={category4Search}
                      onChange={(e) => {
                        setCategory4Search(e.target.value);
                        setCategory4DropdownOpen(true);
                        setCategory4HighlightIndex(-1);
                      }}
                      onFocus={() => setCategory4DropdownOpen(true)}
                      onClick={() => setCategory4DropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setCategory4DropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedCategories = [...filteredCategories4].sort(
                          (a, b) => a.name.localeCompare(b.name),
                        );
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            category4HighlightIndex >= 0 &&
                            sortedCategories[category4HighlightIndex]
                          ) {
                            const selected =
                              sortedCategories[category4HighlightIndex];
                            setFormData({
                              ...formData,
                              category4: selected.id,
                            });
                            setCategory4Search(selected.name);
                            setSelectedCategory4Name(selected.name);
                          }
                          setCategory4DropdownOpen(false);
                          setCategory4HighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setCategory4HighlightIndex((prev) =>
                            prev < sortedCategories.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setCategory4HighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedCategories.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setCategory4DropdownOpen(false);
                          setCategory4HighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedCategory4Name || "Search or select Category 4"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.category3}
                    />
                    {category4DropdownOpen && categories4 && (
                      <div
                        className="category4-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredCategories4.length > 0 ? (
                          [...filteredCategories4]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    category4: category.id,
                                  });
                                  setCategory4Search(category.name);
                                  setSelectedCategory4Name(category.name);
                                  setCategory4DropdownOpen(false);
                                  setCategory4HighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === category4HighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        const selected = categories4.find(
                          (cat) => cat.id === parseInt(formData.category4),
                        );
                        if (selected) handleEditCategory(selected, "level4");
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = categories4.find(
                          (cat) => cat.id === parseInt(formData.category4),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Category?",
                          )
                        ) {
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
              {/* Brand Name */}
              <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Name
                </label>
                <div className="flex gap-2">
                  <div className="brand-input-container flex-1 relative">
                    <input
                      type="text"
                      value={brandSearch}
                      onChange={(e) => {
                        setBrandSearch(e.target.value);
                        setBrandDropdownOpen(true);
                        setBrandHighlightIndex(-1);
                      }}
                      onFocus={() => setBrandDropdownOpen(true)}
                      onClick={() => setBrandDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setBrandDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedBrands = [...filteredBrands].sort((a, b) =>
                          a.name.localeCompare(b.name),
                        );
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            brandHighlightIndex >= 0 &&
                            sortedBrands[brandHighlightIndex]
                          ) {
                            const selected = sortedBrands[brandHighlightIndex];
                            setFormData({ ...formData, brand: selected.id });
                            setBrandSearch(selected.name);
                            setSelectedBrandName(selected.name);
                          }
                          setBrandDropdownOpen(false);
                          setBrandHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setBrandHighlightIndex((prev) =>
                            prev < sortedBrands.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setBrandHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedBrands.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setBrandDropdownOpen(false);
                          setBrandHighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedBrandName || "Search or select Brand"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {brandDropdownOpen && brands && (
                      <div
                        className="brand-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredBrands.length > 0 ? (
                          [...filteredBrands]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((brand, index) => (
                              <div
                                key={brand.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    brand: brand.id,
                                  });
                                  setBrandSearch(brand.name);
                                  setSelectedBrandName(brand.name);
                                  setBrandDropdownOpen(false);
                                  setBrandHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === brandHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {brand.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No brands found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                        const selected = brands.find(
                          (b) => b.id === parseInt(formData.brand),
                        );
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
                        const selected = brands.find(
                          (b) => b.id === parseInt(formData.brand),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Brand?",
                          )
                        ) {
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
              <div className="space-y-2 relative" style={{ zIndex: 15 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Category
                </label>
                <div className="flex gap-2">
                  <div className="brand-category-input-container flex-1 relative">
                    <input
                      type="text"
                      value={brandCategorySearch}
                      onChange={(e) => {
                        setBrandCategorySearch(e.target.value);
                        setBrandCategoryDropdownOpen(true);
                        setBrandCategoryHighlightIndex(-1);
                      }}
                      onFocus={() => setBrandCategoryDropdownOpen(true)}
                      onClick={() => setBrandCategoryDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(
                          () => setBrandCategoryDropdownOpen(false),
                          200,
                        )
                      }
                      onKeyDown={(e) => {
                        const sortedBrandCategories = [
                          ...filteredBrandCategories,
                        ].sort((a, b) => a.name.localeCompare(b.name));
                        if (
                          e.key === "Tab" &&
                          brandCategoryDropdownOpen &&
                          sortedBrandCategories.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            brandCategoryHighlightIndex <
                              sortedBrandCategories.length - 1
                              ? brandCategoryHighlightIndex + 1
                              : 0;
                          setBrandCategoryHighlightIndex(nextIndex);
                          const selected =
                            sortedBrandCategories[nextIndex];
                          setFormData({
                            ...formData,
                            brand_category: selected.id,
                          });
                          setBrandCategorySearch(selected.name);
                          setSelectedBrandCategoryName(selected.name);
                        } 
                        else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            brandCategoryHighlightIndex >= 0 &&
                            sortedBrandCategories[brandCategoryHighlightIndex]
                          ) {
                            const selected =
                              sortedBrandCategories[
                                brandCategoryHighlightIndex
                              ];
                            setFormData({
                              ...formData,
                              brand_category: selected.id,
                            });
                            setBrandCategorySearch(selected.name);
                            setSelectedBrandCategoryName(selected.name);
                          }
                          setBrandCategoryDropdownOpen(false);
                          setBrandCategoryHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setBrandCategoryHighlightIndex((prev) =>
                            prev < sortedBrandCategories.length - 1
                              ? prev + 1
                              : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setBrandCategoryHighlightIndex((prev) =>
                            prev > 0
                              ? prev - 1
                              : sortedBrandCategories.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setBrandCategoryDropdownOpen(false);
                          setBrandCategoryHighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedBrandCategoryName ||
                        "Search or select Brand Category"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {brandCategoryDropdownOpen && brandCategories && (
                      <div
                        className="brand-category-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredBrandCategories.length > 0 ? (
                          [...filteredBrandCategories]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    brand_category: category.id,
                                  });
                                  setBrandCategorySearch(category.name);
                                  setSelectedBrandCategoryName(category.name);
                                  setBrandCategoryDropdownOpen(false);
                                  setBrandCategoryHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === brandCategoryHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No brand categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandCategoryForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.brand_category && brandCategories && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brandCategories.find(
                          (c) => c.id === parseInt(formData.brand_category),
                        );
                        if (selected) handleEditBrandCategory(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brandCategories.find(
                          (c) => c.id === parseInt(formData.brand_category),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Brand Category?",
                          )
                        ) {
                          handleDeleteBrandCategory(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Brand Category 1 */}
              <div className="space-y-2 relative" style={{ zIndex: 15 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Brand Category 1
                </label>
                <div className="flex gap-2">
                  <div className="brand-category1-input-container flex-1 relative">
                    <input
                      type="text"
                      value={brandCategory1Search}
                      onChange={(e) => {
                        setBrandCategory1Search(e.target.value);
                        setBrandCategory1DropdownOpen(true);
                        setBrandCategory1HighlightIndex(-1);
                      }}
                      onFocus={() => setBrandCategory1DropdownOpen(true)}
                      onClick={() => setBrandCategory1DropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(
                          () => setBrandCategory1DropdownOpen(false),
                          200,
                        )
                      }
                      onKeyDown={(e) => {
                        const sortedBrandCategories1 = [
                          ...filteredBrandCategories1,
                        ].sort((a, b) => a.name.localeCompare(b.name));
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            brandCategory1HighlightIndex >= 0 &&
                            sortedBrandCategories1[brandCategory1HighlightIndex]
                          ) {
                            const selected =
                              sortedBrandCategories1[
                                brandCategory1HighlightIndex
                              ];
                            setFormData({
                              ...formData,
                              brand_category1: selected.id,
                            });
                            setBrandCategory1Search(selected.name);
                            setSelectedBrandCategory1Name(selected.name);
                          }
                          setBrandCategory1DropdownOpen(false);
                          setBrandCategory1HighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setBrandCategory1HighlightIndex((prev) =>
                            prev < sortedBrandCategories1.length - 1
                              ? prev + 1
                              : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setBrandCategory1HighlightIndex((prev) =>
                            prev > 0
                              ? prev - 1
                              : sortedBrandCategories1.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setBrandCategory1DropdownOpen(false);
                          setBrandCategory1HighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedBrandCategory1Name ||
                        "Search or select Brand Category 1"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {brandCategory1DropdownOpen && brandCategories1 && (
                      <div
                        className="brand-category1-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredBrandCategories1.length > 0 ? (
                          [...filteredBrandCategories1]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category, index) => (
                              <div
                                key={category.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    brand_category1: category.id,
                                  });
                                  setBrandCategory1Search(category.name);
                                  setSelectedBrandCategory1Name(category.name);
                                  setBrandCategory1DropdownOpen(false);
                                  setBrandCategory1HighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === brandCategory1HighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {category.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No brand categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandCategory1Form(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.brand_category1 && brandCategories1 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brandCategories1.find(
                          (c) => c.id === parseInt(formData.brand_category1),
                        );
                        if (selected) handleEditBrandCategory1(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = brandCategories1.find(
                          (c) => c.id === parseInt(formData.brand_category1),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Brand Category 1?",
                          )
                        ) {
                          handleDeleteBrandCategory1(selected.id);
                        }
                      }}
                      className="flex items-center gap-1 text-red-600 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Flavour
                </label>
                <div className="flex gap-2">
                  <div className="flavour-input-container flex-1 relative">
                    <input
                      type="text"
                      value={flavourSearch}
                      onChange={(e) => {
                        setFlavourSearch(e.target.value);
                        setFlavourDropdownOpen(true);
                        setFlavourHighlightIndex(-1);
                      }}
                      onFocus={() => setFlavourDropdownOpen(true)}
                      onClick={() => setFlavourDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setFlavourDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sorted = [...filteredFlavours].sort((a, b) =>
                          a.name.localeCompare(b.name),
                        );
                        if (
                          e.key === "Tab" &&
                          flavourDropdownOpen &&
                          sorted.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            flavourHighlightIndex < sorted.length - 1
                              ? flavourHighlightIndex + 1
                              : 0;
                          setFlavourHighlightIndex(nextIndex);
                          const selected = sorted[nextIndex];
                          setFormData({ ...formData, flavour: selected.id });
                          setFlavourSearch(selected.name);
                          setSelectedFlavourName(selected.name);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            flavourHighlightIndex >= 0 &&
                            sorted[flavourHighlightIndex]
                          ) {
                            const selected = sorted[flavourHighlightIndex];
                            setFormData({ ...formData, flavour: selected.id });
                            setFlavourSearch(selected.name);
                            setSelectedFlavourName(selected.name);
                          }
                          setFlavourDropdownOpen(false);
                          setFlavourHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setFlavourHighlightIndex((prev) =>
                            prev < sorted.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setFlavourHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sorted.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setFlavourDropdownOpen(false);
                          setFlavourHighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedFlavourName || "Search or select Flavour"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {flavourDropdownOpen && flavours && (
                      <div
                        className="flavour-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredFlavours.length > 0 ? (
                          [...filteredFlavours]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((flavour, index) => (
                              <div
                                key={flavour.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    flavour: flavour.id,
                                  });
                                  setFlavourSearch(flavour.name);
                                  setSelectedFlavourName(flavour.name);
                                  setFlavourDropdownOpen(false);
                                  setFlavourHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === flavourHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {flavour.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No flavours found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewFlavourForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.flavour && flavours && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = flavours.find(
                          (f) => f.id === parseInt(formData.flavour),
                        );
                        if (selected) handleEditFlavour(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = flavours.find(
                          (f) => f.id === parseInt(formData.flavour),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Flavour?",
                          )
                        ) {
                          handleDeleteFlavour(selected.id);
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

              <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Residual
                </label>
                <div className="flex gap-2">
                  <div className="residual-input-container flex-1 relative">
                    <input
                      type="text"
                      value={residualSearch}
                      onChange={(e) => {
                        setResidualSearch(e.target.value);
                        setResidualDropdownOpen(true);
                        setResidualHighlightIndex(-1);
                      }}
                      onFocus={() => setResidualDropdownOpen(true)}
                      onClick={() => setResidualDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setResidualDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sortedResiduals = [...filteredResiduals].sort(
                          (a, b) => a.name.localeCompare(b.name),
                        );
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            residualHighlightIndex >= 0 &&
                            sortedResiduals[residualHighlightIndex]
                          ) {
                            const selected =
                              sortedResiduals[residualHighlightIndex];
                            setFormData({
                              ...formData,
                              residual: selected.id,
                            });
                            setResidualSearch(selected.name);
                            setSelectedResidualName(selected.name);
                          }
                          setResidualDropdownOpen(false);
                          setResidualHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setResidualHighlightIndex((prev) =>
                            prev < sortedResiduals.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setResidualHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sortedResiduals.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setResidualDropdownOpen(false);
                          setResidualHighlightIndex(-1);
                        }
                      }}
                      placeholder={
                        selectedResidualName || "Search or select Residual"
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {residualDropdownOpen && residuals && (
                      <div
                        className="residual-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredResiduals.length > 0 ? (
                          [...filteredResiduals]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((residual, index) => (
                              <div
                                key={residual.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    residual: residual.id,
                                  });
                                  setResidualSearch(residual.name);
                                  setSelectedResidualName(residual.name);
                                  setResidualDropdownOpen(false);
                                  setResidualHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === residualHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {residual.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No residuals found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewResidualForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.residual && residuals && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = residuals.find(
                          (r) => r.id === parseInt(formData.residual),
                        );
                        if (selected) handleEditResidual(selected);
                      }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selected = residuals.find(
                          (r) => r.id === parseInt(formData.residual),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this Residual?",
                          )
                        ) {
                          handleDeleteResidual(selected.id);
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

            <div className="grid grid-cols-2 md:grid-cols-12 gap-2 mb-4">
              {/* HSN No */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  HSN No
                </label>
                <input
                  type="text"
                  name="hsn"
                  value={formData.hsn}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="Enter HSN No"
                />
              </div>

              <div className="space-y-2 relative" style={{ zIndex: 10 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  GST
                </label>
                <div className="flex gap-1">
                  <div className="gst-rate-input-container flex-1 relative">
                    <input
                      type="text"
                      value={gstRateSearch}
                      onChange={(e) => {
                        setGstRateSearch(e.target.value);
                        setGstRateDropdownOpen(true);
                        setGstRateHighlightIndex(-1);
                      }}
                      onFocus={() => setGstRateDropdownOpen(true)}
                      onClick={() => setGstRateDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setGstRateDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sorted = [...filteredGSTRates].sort(
                          (a, b) => a.rate - b.rate,
                        );
                        if (
                          e.key === "Tab" &&
                          gstRateDropdownOpen &&
                          sorted.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            gstRateHighlightIndex < sorted.length - 1
                              ? gstRateHighlightIndex + 1
                              : 0;
                          setGstRateHighlightIndex(nextIndex);
                          const selected = sorted[nextIndex];
                          setFormData({ ...formData, gst_rate: selected.id });
                          setGstRateSearch(selected.rate + "%");
                          setSelectedGSTRateName(selected.rate + "%");
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            gstRateHighlightIndex >= 0 &&
                            sorted[gstRateHighlightIndex]
                          ) {
                            const selected = sorted[gstRateHighlightIndex];
                            setFormData({ ...formData, gst_rate: selected.id });
                            setGstRateSearch(selected.rate + "%");
                            setSelectedGSTRateName(selected.rate + "%");
                          }
                          setGstRateDropdownOpen(false);
                          setGstRateHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setGstRateHighlightIndex((prev) =>
                            prev < sorted.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setGstRateHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sorted.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setGstRateDropdownOpen(false);
                          setGstRateHighlightIndex(-1);
                        }
                      }}
                      placeholder={selectedGSTRateName || "Rate"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    {gstRateDropdownOpen && filteredGSTRates && (
                      <div
                        className="gst-rate-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 150 }}
                      >
                        {filteredGSTRates.length > 0 ? (
                          [...filteredGSTRates]
                            .sort((a, b) => a.rate - b.rate)
                            .map((rate, index) => (
                              <div
                                key={rate.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    gst_rate: rate.id,
                                  });
                                  setGstRateSearch(rate.rate + "%");
                                  setSelectedGSTRateName(rate.rate + "%");
                                  setGstRateDropdownOpen(false);
                                  setGstRateHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === gstRateHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {rate.rate}%
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No rates found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewGSTRateForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.gst_rate && gstRates && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selected = gstRates.find(
                          (r) => r.id === parseInt(formData.gst_rate),
                        );
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
                        const selected = gstRates.find(
                          (r) => r.id === parseInt(formData.gst_rate),
                        );
                        if (
                          selected &&
                          window.confirm(
                            "Are you sure you want to delete this GST Rate?",
                          )
                        ) {
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

              {/* Product Weight */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Prod Wt
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="product_weight"
                    value={formData.product_weight || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                    {formData.unit
                      ? units
                          ?.find((u) => u.id === parseInt(formData.unit))
                          ?.name?.substring(0, 2) || "?"
                      : "?"}
                  </span>
                </div>
              </div>

              {/* Product Weight Unit - Independent */}
              <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Prod Unit
                </label>
                <div className="flex gap-1">
                  <div className="unit-input-container flex-1 relative">
                    <input
                      type="text"
                      value={unitSearch}
                      onChange={(e) => {
                        setUnitSearch(e.target.value);
                        setUnitDropdownOpen(true);
                        setUnitHighlightIndex(-1);
                      }}
                      onFocus={() => setUnitDropdownOpen(true)}
                      onClick={() => setUnitDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setUnitDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sorted = sortBySearchRelevance(
                          filteredUnits,
                          unitSearch,
                        );
                        if (
                          e.key === "Tab" &&
                          unitDropdownOpen &&
                          sorted.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            unitHighlightIndex < sorted.length - 1
                              ? unitHighlightIndex + 1
                              : 0;
                          setUnitHighlightIndex(nextIndex);
                          const selected = sorted[nextIndex];
                          setFormData({ ...formData, unit: selected.id });
                          setUnitSearch(selected.name);
                          setSelectedUnitName(selected.name);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            unitHighlightIndex >= 0 &&
                            sorted[unitHighlightIndex]
                          ) {
                            const selected = sorted[unitHighlightIndex];
                            setFormData({ ...formData, unit: selected.id });
                            setUnitSearch(selected.name);
                            setSelectedUnitName(selected.name);
                          }
                          setUnitDropdownOpen(false);
                          setUnitHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setUnitHighlightIndex((prev) =>
                            prev < sorted.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setUnitHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sorted.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setUnitDropdownOpen(false);
                          setUnitHighlightIndex(-1);
                        }
                      }}
                      placeholder={selectedUnitName || "Select"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    {unitDropdownOpen && units && (
                      <div
                        className="unit-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredUnits.length > 0 ? (
                          sortBySearchRelevance(filteredUnits, unitSearch).map(
                            (unit, index) => (
                              <div
                                key={unit.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({ ...formData, unit: unit.id });
                                  setUnitSearch(unit.name);
                                  setSelectedUnitName(unit.name);
                                  setUnitDropdownOpen(false);
                                  setUnitHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === unitHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {unit.name}
                              </div>
                            ),
                          )
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No units found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewUnitForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Packing Weight */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Pkg Wt
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="packing_weight"
                    value={formData.packing_weight || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                    {formData.packing_weight_unit
                      ? packingUnits
                          ?.find((u) => u.id == formData.packing_weight_unit)
                          ?.name?.substring(0, 2) || "?"
                      : "?"}
                  </span>
                </div>
              </div>

              {/* Packing Weight Unit - Independent */}
              <div className="space-y-2 relative" style={{ zIndex: 1 }}>
                <label className="block text-sm font-semibold text-gray-700">
                  Pkg Unit
                </label>
                <div className="flex gap-1">
                  <div className="packing-unit-input-container flex-1 relative">
                    <input
                      type="text"
                      value={packingUnitSearch}
                      onChange={(e) => {
                        setPackingUnitSearch(e.target.value);
                        setPackingUnitDropdownOpen(true);
                        setPackingUnitHighlightIndex(-1);
                      }}
                      onFocus={() => setPackingUnitDropdownOpen(true)}
                      onClick={() => setPackingUnitDropdownOpen(true)}
                      onBlur={() =>
                        setTimeout(() => setPackingUnitDropdownOpen(false), 200)
                      }
                      onKeyDown={(e) => {
                        const sorted = sortBySearchRelevance(
                          filteredPackingUnits,
                          packingUnitSearch,
                        );
                        if (
                          e.key === "Tab" &&
                          packingUnitDropdownOpen &&
                          sorted.length > 0
                        ) {
                          e.preventDefault();
                          const nextIndex =
                            packingUnitHighlightIndex < sorted.length - 1
                              ? packingUnitHighlightIndex + 1
                              : 0;
                          setPackingUnitHighlightIndex(nextIndex);
                          const selected = sorted[nextIndex];
                          setFormData({
                            ...formData,
                            packing_weight_unit: selected.id,
                          });
                          setPackingUnitSearch(selected.name);
                          setSelectedPackingUnitName(selected.name);
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            packingUnitHighlightIndex >= 0 &&
                            sorted[packingUnitHighlightIndex]
                          ) {
                            const selected = sorted[packingUnitHighlightIndex];
                            setFormData({
                              ...formData,
                              packing_weight_unit: selected.id,
                            });
                            setPackingUnitSearch(selected.name);
                            setSelectedPackingUnitName(selected.name);
                          }
                          setPackingUnitDropdownOpen(false);
                          setPackingUnitHighlightIndex(-1);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setPackingUnitHighlightIndex((prev) =>
                            prev < sorted.length - 1 ? prev + 1 : 0,
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setPackingUnitHighlightIndex((prev) =>
                            prev > 0 ? prev - 1 : sorted.length - 1,
                          );
                        } else if (e.key === "Escape") {
                          setPackingUnitDropdownOpen(false);
                          setPackingUnitHighlightIndex(-1);
                        }
                      }}
                      placeholder={selectedPackingUnitName || "Select"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                    {packingUnitDropdownOpen && packingUnits && (
                      <div
                        className="packing-unit-dropdown absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto"
                        style={{ zIndex: 100 }}
                      >
                        {filteredPackingUnits.length > 0 ? (
                          sortBySearchRelevance(
                            filteredPackingUnits,
                            packingUnitSearch,
                          ).map((unit, index) => (
                              <div
                                key={unit.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setFormData({
                                    ...formData,
                                    packing_weight_unit: unit.id,
                                  });
                                  setPackingUnitSearch(unit.name);
                                  setSelectedPackingUnitName(unit.name);
                                  setPackingUnitDropdownOpen(false);
                                  setPackingUnitHighlightIndex(-1);
                                }}
                                className={`px-4 py-2 cursor-pointer ${
                                  index === packingUnitHighlightIndex
                                    ? "bg-blue-500 text-white"
                                    : "hover:bg-blue-50"
                                }`}
                              >
                                {unit.name}
                              </div>
                            ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No units found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewPackingUnitForm(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded-xl"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Length, Breadth, Height, Volume - All in one flex container to remove gaps */}
              <div className="md:col-span-3 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Dimensions (cm)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    name="length_cm"
                    value={formData.length_cm || ""}
                    onChange={handleChange}
                    className="w-20 px-2 py-3 border border-gray-300 rounded-xl text-center"
                    placeholder="L"
                    step="0.01"
                    min="0"
                  />
                  <span className="text-gray-500 font-bold">×</span>
                  <input
                    type="number"
                    name="breadth_cm"
                    value={formData.breadth_cm || ""}
                    onChange={handleChange}
                    className="w-20 px-2 py-3 border border-gray-300 rounded-xl text-center"
                    placeholder="B"
                    step="0.01"
                    min="0"
                  />
                  <span className="text-gray-500 font-bold">×</span>
                  <input
                    type="number"
                    name="height_cm"
                    value={formData.height_cm || ""}
                    onChange={handleChange}
                    className="w-20 px-2 py-3 border border-gray-300 rounded-xl text-center"
                    placeholder="H"
                    step="0.01"
                    min="0"
                  />
                  <span className="text-gray-400 mx-1">=</span>
                  <div className="w-20 px-2 py-3 bg-gray-100 border border-gray-200 rounded-xl text-center text-sm font-semibold">
                    {formData.length_cm &&
                    formData.breadth_cm &&
                    formData.height_cm
                      ? `${(parseFloat(formData.length_cm) * parseFloat(formData.breadth_cm) * parseFloat(formData.height_cm)).toFixed(0)}`
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Video Link */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Video Link
                </label>
                <input
                  type="url"
                  name="video_link"
                  value={formData.video_link || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  placeholder="https://youtube.com/watch?v=..."
                />
                {formData.video_link && (
                  <a
                    href={formData.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline inline-flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open Video Link
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 mb-2">
              {/* Description - 60% on desktop, full width on mobile */}
              <div className="lg:w-[60%] w-full space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  name="use_case"
                  value={formData.use_case}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="9"
                  placeholder="Describe product usage scenarios..."
                />
              </div>

              {/* Pointers - 40% on desktop, full width on mobile */}
              <div className="lg:w-[40%] w-full">
                <div className="flex items-center gap-1 mb-1">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                  </div>
                  <label className="text-sm font-semibold text-gray-700">
                    Product Highlights
                  </label>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-600">
                          {num}
                        </span>
                      </div>
                      <input
                        type="text"
                        name={`pointer${num}`}
                        value={formData[`pointer${num}`] || ""}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder={`Key Feature ${num}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Gallery */}
            <div className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Main Image
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors h-32 flex flex-col items-center justify-center cursor-pointer ${
                      formData.image || existingImages.image
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-blue-400"
                    }`}
                    onClick={() =>
                      document.getElementById("image-upload").click()
                    }
                  >
                    <input
                      type="file"
                      id="image-upload"
                      name="image"
                      onChange={handleChange}
                      className="hidden"
                      accept="image/*"
                    />
                    {formData.image || existingImages.image ? (
                      <>
                        <img
                          src={
                            formData.image ? imagePreview : existingImages.image
                          }
                          alt="Main Preview"
                          className="max-h-24 object-contain rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("image");
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
                    <div
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors h-32 flex flex-col items-center justify-center cursor-pointer ${
                        formData[`image${i}`] || existingImages[`image${i}`]
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                      onClick={() =>
                        document.getElementById(`image${i}-upload`).click()
                      }
                    >
                      <input
                        type="file"
                        id={`image${i}-upload`}
                        name={`image${i}`}
                        onChange={handleChange}
                        className="hidden"
                        accept="image/*"
                      />
                      {formData[`image${i}`] || existingImages[`image${i}`] ? (
                        <>
                          <img
                            src={
                              formData[`image${i}`]
                                ? i === 1
                                  ? image1Preview
                                  : i === 2
                                    ? image2Preview
                                    : i === 3
                                      ? image3Preview
                                      : image4Preview
                                : existingImages[`image${i}`]
                            }
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
                          <p className="text-xs text-gray-500">
                            Click to upload
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Video Link */}
              {/* <div className="space-y-2 mt-4">
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
                    Open Video Link
                  </a>
                )}
              </div> */}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {updateMutation.isLoading ? (
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

        {/* GST Rate Modals */}
        {showNewGSTRateForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewGSTRateForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Percent className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add GST Rate
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewGSTRateForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
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
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
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
                    <button
                      type="button"
                      onClick={() => setShowNewGSTRateForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={gstRateMutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {gstRateMutation.isLoading ? "Adding..." : "Add Rate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditGSTRateForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditGSTRateForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit GST Rate
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditGSTRateForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
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
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
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
                    <button
                      type="button"
                      onClick={() => setShowEditGSTRateForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={gstRateMutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {gstRateMutation.isLoading
                        ? "Updating..."
                        : "Update Rate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Main Modal */}
        {showNewCategoryForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCategoryForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Category
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewCategoryForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleCategorySubmit(e, "main")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory.name}
                      onChange={(e) => handleCategoryChange(e, "main")}
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
                      onChange={(e) => handleCategoryChange(e, "main")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category 1 Modal - Add */}
        {showNewCategory1Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCategory1Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Category 1
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewCategory1Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleCategorySubmit(e, "level1")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory1.name}
                      onChange={(e) => handleCategoryChange(e, "level1")}
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
                      onChange={(e) => handleCategoryChange(e, "level1")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCategory1Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category 2 Modal - Add */}
        {showNewCategory2Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCategory2Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Category 2
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewCategory2Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleCategorySubmit(e, "level2")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory2.name}
                      onChange={(e) => handleCategoryChange(e, "level2")}
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
                      onChange={(e) => handleCategoryChange(e, "level2")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCategory2Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category 3 Modal - Add */}
        {showNewCategory3Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCategory3Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Category 3
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewCategory3Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleCategorySubmit(e, "level3")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory3.name}
                      onChange={(e) => handleCategoryChange(e, "level3")}
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
                      onChange={(e) => handleCategoryChange(e, "level3")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCategory3Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category 4 Modal - Add */}
        {showNewCategory4Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewCategory4Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Tag className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Category 4
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewCategory4Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleCategorySubmit(e, "level4")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory4.name}
                      onChange={(e) => handleCategoryChange(e, "level4")}
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
                      onChange={(e) => handleCategoryChange(e, "level4")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewCategory4Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Main Modal */}
        {showEditCategoryForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditCategoryForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Edit className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Category
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditCategoryForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleUpdateCategory(e, "main")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory.name}
                      onChange={(e) => handleCategoryChange(e, "main")}
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
                      onChange={(e) => handleCategoryChange(e, "main")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCategoryForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category 1 Modal */}
        {showEditCategory1Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditCategory1Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Edit className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Category 1
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditCategory1Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleUpdateCategory(e, "level1")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory1.name}
                      onChange={(e) => handleCategoryChange(e, "level1")}
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
                      onChange={(e) => handleCategoryChange(e, "level1")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCategory1Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category 2 Modal */}
        {showEditCategory2Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditCategory2Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Edit className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Category 2
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditCategory2Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleUpdateCategory(e, "level2")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory2.name}
                      onChange={(e) => handleCategoryChange(e, "level2")}
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
                      onChange={(e) => handleCategoryChange(e, "level2")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCategory2Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category 3 Modal */}
        {showEditCategory3Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditCategory3Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Edit className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Category 3
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditCategory3Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleUpdateCategory(e, "level3")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory3.name}
                      onChange={(e) => handleCategoryChange(e, "level3")}
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
                      onChange={(e) => handleCategoryChange(e, "level3")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCategory3Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category 4 Modal */}
        {showEditCategory4Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditCategory4Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Edit className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Category 4
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditCategory4Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => handleUpdateCategory(e, "level4")}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newCategory4.name}
                      onChange={(e) => handleCategoryChange(e, "level4")}
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
                      onChange={(e) => handleCategoryChange(e, "level4")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditCategory4Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={categoryMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {categoryMutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Brand Modal - Add */}
        {showNewBrandForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewBrandForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Brand
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewBrandForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
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
                    <button
                      type="button"
                      onClick={() => setShowNewBrandForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={brandMutation.isLoading}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditBrandForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Edit className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Brand
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditBrandForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
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
                    <button
                      type="button"
                      onClick={() => setShowEditBrandForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={brandMutation.isLoading}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewBrandCategoryForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Tag className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add Brand Category
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewBrandCategoryForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={handleBrandCategorySubmit}
                  className="space-y-4"
                >
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
                    <button
                      type="button"
                      onClick={() => setShowNewBrandCategoryForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={brandCategoryMutation.isLoading}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {brandCategoryMutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Brand Category Modal - Edit */}
        {showEditBrandCategoryForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditBrandCategoryForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Edit className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Brand Category
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditBrandCategoryForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={handleUpdateBrandCategory}
                  className="space-y-4"
                >
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
                    <button
                      type="button"
                      onClick={() => setShowEditBrandCategoryForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={brandCategoryMutation.isLoading}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {brandCategoryMutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Unit Modal - New */}
        {showNewUnitForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewUnitForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add New Unit
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewUnitForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleUnitSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      onClick={() => setShowNewUnitForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={unitMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {unitMutation.isLoading ? "Adding..." : "Add Unit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Unit Modal - Edit */}
        {showEditUnitForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditUnitForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Unit
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditUnitForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleUpdateUnit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      onClick={() => setShowEditUnitForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={unitMutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {unitMutation.isLoading ? "Updating..." : "Update Unit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Packing Unit Modal - New */}
        {showNewPackingUnitForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewPackingUnitForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add New Packing Unit
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewPackingUnitForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handlePackingUnitSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newPackingUnit.name}
                      onChange={handlePackingUnitChange}
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
                      value={newPackingUnit.description}
                      onChange={handlePackingUnitChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewPackingUnitForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={packingUnitMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {packingUnitMutation.isLoading ? "Adding..." : "Add Unit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Packing Unit Modal - Edit */}
        {showEditPackingUnitForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditPackingUnitForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Packing Unit
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditPackingUnitForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleUpdatePackingUnit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newPackingUnit.name}
                      onChange={handlePackingUnitChange}
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
                      value={newPackingUnit.description}
                      onChange={handlePackingUnitChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditPackingUnitForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={packingUnitMutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {packingUnitMutation.isLoading
                        ? "Updating..."
                        : "Update Unit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Flavour Modal - New */}
        {showNewFlavourForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewFlavourForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add New Flavour
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewFlavourForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleFlavourSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flavour Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newFlavour.name}
                      onChange={handleFlavourChange}
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
                      value={newFlavour.description}
                      onChange={handleFlavourChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewFlavourForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={flavourMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {flavourMutation.isLoading ? "Adding..." : "Add Flavour"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Flavour Modal - Edit */}
        {showEditFlavourForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditFlavourForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Flavour
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditFlavourForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleUpdateFlavour} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flavour Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newFlavour.name}
                      onChange={handleFlavourChange}
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
                      value={newFlavour.description}
                      onChange={handleFlavourChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditFlavourForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={flavourMutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {flavourMutation.isLoading
                        ? "Updating..."
                        : "Update Flavour"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Residual Modal - New */}
        {showNewResidualForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewResidualForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add New Residual
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewResidualForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleResidualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Residual Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newResidual.name}
                      onChange={handleResidualChange}
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
                      value={newResidual.description}
                      onChange={handleResidualChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewResidualForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={residualMutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {residualMutation.isLoading
                        ? "Adding..."
                        : "Add Residual"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Residual Modal - Edit */}
        {showEditResidualForm && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditResidualForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Residual
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditResidualForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleUpdateResidual} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Residual Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newResidual.name}
                      onChange={handleResidualChange}
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
                      value={newResidual.description}
                      onChange={handleResidualChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditResidualForm(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={residualMutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {residualMutation.isLoading
                        ? "Updating..."
                        : "Update Residual"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Brand Category 1 Modal - New */}
        {showNewBrandCategory1Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewBrandCategory1Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Plus className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add New Brand Category 1
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowNewBrandCategory1Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={handleBrandCategory1Submit}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newBrandCategory1.name}
                      onChange={handleBrandCategory1Change}
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
                      value={newBrandCategory1.description}
                      onChange={handleBrandCategory1Change}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewBrandCategory1Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={brandCategory1Mutation.isLoading}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {brandCategory1Mutation.isLoading
                        ? "Adding..."
                        : "Add Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Brand Category 1 Modal - Edit */}
        {showEditBrandCategory1Form && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditBrandCategory1Form(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Brand Category 1
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowEditBrandCategory1Form(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <form
                  onSubmit={handleUpdateBrandCategory1}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newBrandCategory1.name}
                      onChange={handleBrandCategory1Change}
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
                      value={newBrandCategory1.description}
                      onChange={handleBrandCategory1Change}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditBrandCategory1Form(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={brandCategory1Mutation.isLoading}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium px-4 py-3 disabled:opacity-50"
                    >
                      {brandCategory1Mutation.isLoading
                        ? "Updating..."
                        : "Update Category"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductEdit;