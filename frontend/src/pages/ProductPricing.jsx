import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
  Percent,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import { toast } from "react-hot-toast";

// Constants
const COLUMN_WIDTHS = {
  SKU: 120,
  PRODUCT: 150,
  SALE_RATE: 100,
  PRICING_DETAILS: 100,
  PRODUCT_DETAILS: 100,
  COST_COMPONENTS_1: 100,
  COST_COMPONENTS_2: 100,
  ADDITIONAL_COSTS: 120,
};

const STICKY_POSITIONS = {
  SKU: 0,
  PRODUCT: COLUMN_WIDTHS.SKU,
  SALE_RATE: COLUMN_WIDTHS.SKU + COLUMN_WIDTHS.PRODUCT,
  PRICING_DETAILS:
    COLUMN_WIDTHS.SKU + COLUMN_WIDTHS.PRODUCT + COLUMN_WIDTHS.SALE_RATE,
  PRODUCT_DETAILS:
    COLUMN_WIDTHS.SKU +
    COLUMN_WIDTHS.PRODUCT +
    COLUMN_WIDTHS.SALE_RATE +
    COLUMN_WIDTHS.PRICING_DETAILS,
  COST_COMPONENTS_1:
    COLUMN_WIDTHS.SKU +
    COLUMN_WIDTHS.PRODUCT +
    COLUMN_WIDTHS.SALE_RATE +
    COLUMN_WIDTHS.PRICING_DETAILS +
    COLUMN_WIDTHS.PRODUCT_DETAILS,
  COST_COMPONENTS_2:
    COLUMN_WIDTHS.SKU +
    COLUMN_WIDTHS.PRODUCT +
    COLUMN_WIDTHS.SALE_RATE +
    COLUMN_WIDTHS.PRICING_DETAILS +
    COLUMN_WIDTHS.PRODUCT_DETAILS +
    COLUMN_WIDTHS.COST_COMPONENTS_1,
  ADDITIONAL_COSTS:
    COLUMN_WIDTHS.SKU +
    COLUMN_WIDTHS.PRODUCT +
    COLUMN_WIDTHS.SALE_RATE +
    COLUMN_WIDTHS.PRICING_DETAILS +
    COLUMN_WIDTHS.PRODUCT_DETAILS +
    COLUMN_WIDTHS.COST_COMPONENTS_1 +
    COLUMN_WIDTHS.COST_COMPONENTS_2,
};

const EDITABLE_FIELDS = [
  { key: "sale_rate", group: "sale", label: "Sale Rate", type: "currency" },
  {
    key: "landing_rate",
    group: "pricingDetails",
    label: "Landing Rate",
    readonly: true,
    type: "currency",
  },
  {
    key: "company_margin_value",
    group: "pricingDetails",
    label: "Margin",
    type: "percentage",
  },
  {
    key: "calculated_rate",
    group: "pricingDetails",
    label: "Calculated Rate",
    readonly: true,
    type: "currency",
  },
  { key: "mrp", group: "productDetails", label: "MRP", type: "currency" },
  { key: "stock_qty", group: "productDetails", label: "Stock", type: "integer" },
  { key: "batch_no", group: "productDetails", label: "Batch No", type: "text" },
  { key: "mfg_date", group: "productDetails", label: "MFG Date", type: "date" },
  {
    key: "purchase_value",
    group: "costComponents1",
    label: "Purchase",
    type: "currency_percentage",
  },
  {
    key: "transport_value",
    group: "costComponents1",
    label: "Transport",
    type: "currency_percentage",
  },
  {
    key: "labor_value",
    group: "costComponents1",
    label: "Labor",
    type: "currency_percentage",
  },
  {
    key: "handling_value",
    group: "costComponents1",
    label: "Handling",
    type: "currency_percentage",
  },
  {
    key: "godown_value",
    group: "costComponents2",
    label: "Godown",
    type: "currency_percentage",
  },
  {
    key: "delivery_value",
    group: "costComponents2",
    label: "Delivery",
    type: "currency_percentage",
  },
  {
    key: "packaging_value",
    group: "costComponents2",
    label: "Packaging",
    type: "currency_percentage",
  },
  {
    key: "extra1_value",
    group: "additionalCosts",
    label: "Extra 1",
    type: "currency_percentage",
  },
  {
    key: "extra2_value",
    group: "additionalCosts",
    label: "Extra 2",
    type: "currency_percentage",
  },
];

const GROUP_CONFIG = {
  pricingDetails: {
    fields: ["landing_rate", "company_margin_value", "calculated_rate"],
    position: STICKY_POSITIONS.PRICING_DETAILS,
    label: "Pricing Details",
  },
  productDetails: {
    fields: ["mrp", "stock_qty", "batch_no", "mfg_date"],
    position: STICKY_POSITIONS.PRODUCT_DETAILS,
    label: "Product Details",
  },
  costComponents1: {
    fields: [
      "purchase_value",
      "transport_value",
      "labor_value",
      "handling_value",
    ],
    position: STICKY_POSITIONS.COST_COMPONENTS_1,
    label: "Cost Components 1",
  },
  costComponents2: {
    fields: ["godown_value", "delivery_value", "packaging_value"],
    position: STICKY_POSITIONS.COST_COMPONENTS_2,
    label: "Cost Components 2",
  },
  additionalCosts: {
    fields: ["extra1_value", "extra2_value"],
    position: STICKY_POSITIONS.ADDITIONAL_COSTS,
    label: "Additional Costs",
  },
};

const ProductPricing = () => {
  // --- FILTER STATES ---
  const [search, setSearch] = useState("");
  const [filterSKU, setFilterSKU] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCategory1, setFilterCategory1] = useState("");
  const [filterCategory2, setFilterCategory2] = useState("");
  const [filterCategory3, setFilterCategory3] = useState("");
  const [filterCategory4, setFilterCategory4] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterBrandCategory, setFilterBrandCategory] = useState("");
  const [filterHSN, setFilterHSN] = useState("");

  // Category filter selected IDs for dependent dropdowns
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategory1Id, setSelectedCategory1Id] = useState("");
  const [selectedCategory2Id, setSelectedCategory2Id] = useState("");
  const [selectedCategory3Id, setSelectedCategory3Id] = useState("");
  // Add these state variables at the top of your ProductPricing component (after other filter states)

  const [filterFlavour, setFilterFlavour] = useState("");
  const [filterResidual, setFilterResidual] = useState("");
  const [filterBrandCategory1, setFilterBrandCategory1] = useState("");
  const [filterGST, setFilterGST] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterMinWeight, setFilterMinWeight] = useState("");
  const [filterMaxWeight, setFilterMaxWeight] = useState("");
  const [filterMinPackingWeight, setFilterMinPackingWeight] = useState("");
  const [filterMaxPackingWeight, setFilterMaxPackingWeight] = useState("");
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [titleSuggestionIndex, setTitleSuggestionIndex] = useState(-1);

  // Active filters state - only applied when user clicks Apply button
  const [activeFilters, setActiveFilters] = useState({
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
  });

  // Add these queries (add with your existing queries)

  const { data: flavours } = useQuery({
    queryKey: ["flavours"],
    queryFn: async () => (await axios.get("/api/flavours/")).data,
  });

  const { data: residuals } = useQuery({
    queryKey: ["residuals"],
    queryFn: async () => (await axios.get("/api/residuals/")).data,
  });

  const { data: brandCategories1 } = useQuery({
    queryKey: ["brandCategories1"],
    queryFn: async () => (await axios.get("/api/brand-categories-1/")).data,
  });

  const { data: gstRates } = useQuery({
    queryKey: ["gstRates"],
    queryFn: async () => (await axios.get("/api/gstrates/")).data,
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => (await axios.get("/api/units/")).data,
  });

  // --- DROPDOWN DATA WITH DEPENDENT QUERIES ---
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await axios.get("/api/categories/")).data,
  });

  const { data: categories1, refetch: refetchCategories1 } = useQuery({
    enabled: !!parseInt(selectedCategoryId),
    queryKey: ["categories1", parseInt(selectedCategoryId) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategoryId);
      const response = await axios.get(
        `/api/categories/?parent_id=${parentId}`,
      );
      return response.data;
    },
  });

  const { data: categories2, refetch: refetchCategories2 } = useQuery({
    enabled: !!parseInt(selectedCategory1Id),
    queryKey: ["categories2", parseInt(selectedCategory1Id) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategory1Id);
      const response = await axios.get(
        `/api/categories/?parent_id=${parentId}`,
      );
      return response.data;
    },
  });

  const { data: categories3, refetch: refetchCategories3 } = useQuery({
    enabled: !!parseInt(selectedCategory2Id),
    queryKey: ["categories3", parseInt(selectedCategory2Id) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategory2Id);
      const response = await axios.get(
        `/api/categories/?parent_id=${parentId}`,
      );
      return response.data;
    },
  });

  const { data: categories4, refetch: refetchCategories4 } = useQuery({
    enabled: !!parseInt(selectedCategory3Id),
    queryKey: ["categories4", parseInt(selectedCategory3Id) || 0],
    queryFn: async () => {
      const parentId = parseInt(selectedCategory3Id);
      const response = await axios.get(
        `/api/categories/?parent_id=${parentId}`,
      );
      return response.data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => (await axios.get("/api/brands/")).data,
  });

  const { data: brandCategories } = useQuery({
    queryKey: ["brandCategories"],
    queryFn: async () => (await axios.get("/api/brand-categories/")).data,
  });

  const [editingCell, setEditingCell] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const inputRef = useRef(null);
  const tableContainerRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch all products with their pricings
  // Fetch all products with their pricings
  const {
    data: pricingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["productPricings"],
    queryFn: async () => {
      const [productsRes, pricingsRes] = await Promise.all([
        axios.get("/api/products/"),
        axios.get("/api/productpricings/"),
      ]);

      const products = productsRes.data;
      const pricings = pricingsRes.data;

      return products.map((product) => {
        const pricing = pricings.find((p) => p.product === product.id);

        // Get the actual values from the product object
        // Flavour could be an object with id and name, or just the name string
        let flavourName = "";
        if (product.flavour) {
          if (typeof product.flavour === "object") {
            flavourName = product.flavour.name || "";
          } else if (typeof product.flavour === "string") {
            flavourName = product.flavour;
          }
        }

        // Residual
        let residualName = "";
        if (product.residual) {
          if (typeof product.residual === "object") {
            residualName = product.residual.name || "";
          } else if (typeof product.residual === "string") {
            residualName = product.residual;
          }
        }

        // Brand Category 1
        let brandCategory1Name = "";
        if (product.brand_category1) {
          if (typeof product.brand_category1 === "object") {
            brandCategory1Name = product.brand_category1.name || "";
          } else if (typeof product.brand_category1 === "string") {
            brandCategory1Name = product.brand_category1;
          }
        }

        // GST Rate - get the rate value and id
        let gstRateId = "";
        let gstRateDisplay = "";
        if (product.gst_rate) {
          if (typeof product.gst_rate === "object") {
            gstRateId = product.gst_rate.id?.toString() || "";
            gstRateDisplay = product.gst_rate.rate
              ? `${product.gst_rate.rate}%`
              : "";
          } else if (typeof product.gst_rate === "string") {
            gstRateId = product.gst_rate;
            gstRateDisplay = product.gst_rate;
          }
        }

        // Unit - get unit name
        let unitName = "";
        if (product.unit) {
          if (typeof product.unit === "object") {
            unitName = product.unit.name || "";
          } else if (typeof product.unit === "string") {
            unitName = product.unit;
          }
        }

        return {
          id: pricing?.id || null,
          product: product.id,
          sku: product.sku || "",
          title: product.title || "",
          category: product.category_display || product.category?.name || "",
          category1: product.category1_display || product.category1?.name || "",
          category2: product.category2_display || product.category2?.name || "",
          category3: product.category3_display || product.category3?.name || "",
          category4: product.category4_display || product.category4?.name || "",
          brand_display: product.brand_display || product.brand?.name || "",
          brand_category_display:
            product.brand_category_display ||
            product.brand_category?.name ||
            "",

          flavour_display:
            product.flavour_display ||
            (typeof product.flavour === "object"
              ? product.flavour?.name
              : product.flavour) ||
            "",
          residual_display:
            product.residual_display ||
            (typeof product.residual === "object"
              ? product.residual?.name
              : product.residual) ||
            "",
          brand_category1_display:
            product.brand_category1_display ||
            (typeof product.brand_category1 === "object"
              ? product.brand_category1?.name
              : product.brand_category1) ||
            "",
          gst_rate_display:
            product.gst_rate_display ||
            (typeof product.gst_rate === "object"
              ? `${product.gst_rate?.rate}%`
              : product.gst_rate) ||
            "",
          unit_display:
            product.unit_display ||
            (typeof product.unit === "object"
              ? product.unit?.name
              : product.unit) ||
            "",

          // Also keep the raw values for other uses
          flavour:
            product.flavour_display ||
            (typeof product.flavour === "object"
              ? product.flavour?.name
              : product.flavour) ||
            "",
          residual:
            product.residual_display ||
            (typeof product.residual === "object"
              ? product.residual?.name
              : product.residual) ||
            "",
          brand_category1:
            product.brand_category1_display ||
            (typeof product.brand_category1 === "object"
              ? product.brand_category1?.name
              : product.brand_category1) ||
            "",
          gst_rate: String(
            typeof product.gst_rate === "object"
              ? product.gst_rate?.id || ""
              : product.gst_rate || "",
          ),
          gst_rate_display:
            product.gst_rate_display ||
            (typeof product.gst_rate === "object"
              ? `${product.gst_rate?.rate}%`
              : product.gst_rate) ||
            "",
          unit:
            product.unit_display ||
            (typeof product.unit === "object"
              ? product.unit?.name
              : product.unit) ||
            "",
          product_weight: product.product_weight || "",
          packing_weight: product.packing_weight || "",
          hsn: product.hsn || "",

          // ... rest of your pricing fields
          purchase_value: pricing?.purchase_value ?? 0,
          purchase_type: pricing?.purchase_type ?? "rupees",
          transport_value: pricing?.transport_value ?? 0,
          transport_type: pricing?.transport_type ?? "rupees",
          labor_value: pricing?.labor_value ?? 0,
          labor_type: pricing?.labor_type ?? "rupees",
          handling_value: pricing?.handling_value ?? 0,
          handling_type: pricing?.handling_type ?? "rupees",
          godown_value: pricing?.godown_value ?? 0,
          godown_type: pricing?.godown_type ?? "rupees",
          delivery_value: pricing?.delivery_value ?? 0,
          delivery_type: pricing?.delivery_type ?? "rupees",
          packaging_value: pricing?.packaging_value ?? 0,
          packaging_type: pricing?.packaging_type ?? "rupees",
          extra1_value: pricing?.extra1_value ?? 0,
          extra1_type: pricing?.extra1_type ?? "rupees",
          extra2_value: pricing?.extra2_value ?? 0,
          extra2_type: pricing?.extra2_type ?? "rupees",
          landing_value: pricing?.landing_value ?? 0,
          landing_type: pricing?.landing_type ?? "rupees",
          company_margin_value: pricing?.company_margin_value ?? 0,
          company_margin_type: pricing?.company_margin_type ?? "percent",
          landing_rate: pricing?.landing_rate ?? 0,
          calculated_rate: pricing?.calculated_rate ?? 0,
          sale_rate: pricing?.sale_rate ?? 0,
          mrp: pricing?.mrp ?? 0,
          stock_qty: product.stock_qty || 0,
          mfg_date: pricing?.mfg_date ?? null,
          batch_no: pricing?.batch_no ?? "",
          isNew: !pricing?.id,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter and search data using activeFilters (only applied on button click)
  const filteredData = useMemo(() => {
    if (!pricingData) return [];
    const {
      search: activeSearch,
      filterSKU: activeSKU,
      filterTitle: activeTitle,
      filterHSN: activeHSN,
      filterCategory: activeCategory,
      filterCategory1: activeCategory1,
      filterCategory2: activeCategory2,
      filterCategory3: activeCategory3,
      filterCategory4: activeCategory4,
      filterBrand: activeBrand,
      filterBrandCategory: activeBrandCategory,
      filterFlavour: activeFlavour,
      filterResidual: activeResidual,
      filterBrandCategory1: activeBrandCategory1,
      filterGST: activeGST,
      filterUnit: activeUnit,
      filterMinWeight: activeMinWeight,
      filterMaxWeight: activeMaxWeight,
      filterMinPackingWeight: activeMinPackingWeight,
      filterMaxPackingWeight: activeMaxPackingWeight,
    } = activeFilters;

    return pricingData.filter((item) => {
      const searchMatch =
        !activeSearch ||
        item.title?.toLowerCase().includes(activeSearch.toLowerCase()) ||
        item.sku?.toLowerCase().includes(activeSearch.toLowerCase());

      const skuMatch =
        !activeSKU || item.sku?.toLowerCase().includes(activeSKU.toLowerCase());
      const titleMatch =
        !activeTitle ||
        item.title?.toLowerCase().includes(activeTitle.toLowerCase());
      const hsnMatch =
        !activeHSN || item.hsn?.toLowerCase().includes(activeHSN.toLowerCase());

      const categoryMatch =
        !activeCategory || item.category?.toString() === activeCategory;
      const category1Match =
        !activeCategory1 || item.category1?.toString() === activeCategory1;
      const category2Match =
        !activeCategory2 || item.category2?.toString() === activeCategory2;
      const category3Match =
        !activeCategory3 || item.category3?.toString() === activeCategory3;
      const category4Match =
        !activeCategory4 || item.category4?.toString() === activeCategory4;

      const brandMatch =
        !activeBrand || item.brand_display?.toString() === activeBrand;
      const brandCategoryMatch =
        !activeBrandCategory ||
        item.brand_category_display?.toString() === activeBrandCategory;

      const flavourMatch =
        !activeFlavour || item.flavour_display === activeFlavour;
      const residualMatch =
        !activeResidual || item.residual_display === activeResidual;
      const brandCategory1Match =
        !activeBrandCategory1 ||
        item.brand_category1_display === activeBrandCategory1;
      const gstMatch =
        !activeGST || String(item.gst_rate) === String(activeGST);
      const unitMatch = !activeUnit || item.unit_display === activeUnit;

      const productWeight = parseFloat(item.product_weight) || 0;
      const minWeightMatch =
        !activeMinWeight || productWeight >= parseFloat(activeMinWeight);
      const maxWeightMatch =
        !activeMaxWeight || productWeight <= parseFloat(activeMaxWeight);

      const packingWeight = parseFloat(item.packing_weight) || 0;
      const minPackingWeightMatch =
        !activeMinPackingWeight ||
        packingWeight >= parseFloat(activeMinPackingWeight);
      const maxPackingWeightMatch =
        !activeMaxPackingWeight ||
        packingWeight <= parseFloat(activeMaxPackingWeight);

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
        flavourMatch &&
        residualMatch &&
        brandCategory1Match &&
        gstMatch &&
        unitMatch &&
        minWeightMatch &&
        maxWeightMatch &&
        minPackingWeightMatch &&
        maxPackingWeightMatch
      );
    });
  }, [pricingData, activeFilters]);

  const productTitleSuggestions = useMemo(() => {
    const searchText = filterTitle.trim().toLowerCase();
    if (!searchText || !pricingData) return [];

    const seen = new Set();
    return pricingData
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
  }, [filterTitle, pricingData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredData, currentPage, itemsPerPage]);

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
    });
    setCurrentPage(1);
    toast.success("Filters applied");
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
  ]);

  // Clear all filters handler
  const handleClearFilters = useCallback(() => {
    setSearch("");
    setFilterSKU("");
    setFilterTitle("");
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
    });
    setCurrentPage(1);
  }, []);

  // Calculate pricing in real-time with edited values
  const calculateRealtimePricing = useCallback((row, currentEditedValues) => {
    const getValue = (field) => {
      const key = `${row.product}_${field}`;
      if (currentEditedValues[key] !== undefined) {
        return currentEditedValues[key];
      }
      return row[field];
    };

    const getType = (fieldType) => {
      const key = `${row.product}_${fieldType}_type`;
      if (currentEditedValues[key] !== undefined) {
        return currentEditedValues[key];
      }
      return row[`${fieldType}_type`] || "rupees";
    };

    let base = Number(getValue("purchase_value")) || 0;

    const calculateCost = (baseAmount, type, value) => {
      if (type === "percent") {
        return baseAmount * (Number(value) / 100);
      }
      return Number(value);
    };

    base += calculateCost(
      base,
      getType("transport"),
      getValue("transport_value"),
    );
    base += calculateCost(base, getType("labor"), getValue("labor_value"));
    base += calculateCost(
      base,
      getType("handling"),
      getValue("handling_value"),
    );
    base += calculateCost(base, getType("godown"), getValue("godown_value"));
    base += calculateCost(
      base,
      getType("delivery"),
      getValue("delivery_value"),
    );
    base += calculateCost(
      base,
      getType("packaging"),
      getValue("packaging_value"),
    );
    base += calculateCost(base, getType("extra1"), getValue("extra1_value"));
    base += calculateCost(base, getType("extra2"), getValue("extra2_value"));

    const landing_rate = base;
    base += calculateCost(base, getType("landing"), getValue("landing_value"));

    const marginValue = Number(getValue("company_margin_value")) || 0;
    const marginType = getType("company_margin");

    let marginAmount = 0;
    if (marginType === "percent") {
      marginAmount = base * (marginValue / 100);
    } else {
      marginAmount = marginValue;
    }

    const calculated_rate = base + marginAmount;

    return { landing_rate, calculated_rate };
  }, []);

  const calculatePricing = useCallback((row) => {
    let base = Number(row.purchase_value) || 0;

    const calculateCost = (baseAmount, type, value) => {
      if (type === "percent") {
        return baseAmount * (Number(value) / 100);
      }
      return Number(value);
    };

    base += calculateCost(base, row.transport_type, row.transport_value);
    base += calculateCost(base, row.labor_type, row.labor_value);
    base += calculateCost(base, row.handling_type, row.handling_value);
    base += calculateCost(base, row.godown_type, row.godown_value);
    base += calculateCost(base, row.delivery_type, row.delivery_value);
    base += calculateCost(base, row.packaging_type, row.packaging_value);
    base += calculateCost(base, row.extra1_type, row.extra1_value);
    base += calculateCost(base, row.extra2_type, row.extra2_value);

    const landing_rate = base;

    // Add landing value if any
    base += calculateCost(base, row.landing_type, row.landing_value);

    // Add company margin
    const marginValue = Number(row.company_margin_value) || 0;
    const marginType = row.company_margin_type || "percent";

    let marginAmount = 0;
    if (marginType === "percent") {
      marginAmount = base * (marginValue / 100);
    } else {
      marginAmount = marginValue;
    }

    const calculated_rate = base + marginAmount;

    return { landing_rate, calculated_rate };
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map((item) => {
        const dataToSend = {
          product: item.product,
          purchase_value: Number(item.purchase_value),
          purchase_type: item.purchase_type,
          transport_value: Number(item.transport_value),
          transport_type: item.transport_type,
          labor_value: Number(item.labor_value),
          labor_type: item.labor_type,
          handling_value: Number(item.handling_value),
          handling_type: item.handling_type,
          godown_value: Number(item.godown_value),
          godown_type: item.godown_type,
          delivery_value: Number(item.delivery_value),
          delivery_type: item.delivery_type,
          packaging_value: Number(item.packaging_value),
          packaging_type: item.packaging_type,
          extra1_value: Number(item.extra1_value),
          extra1_type: item.extra1_type,
          extra2_value: Number(item.extra2_value),
          extra2_type: item.extra2_type,
          landing_value: Number(item.landing_value),
          landing_type: item.landing_type,
          company_margin_value: Number(item.company_margin_value),
          company_margin_type: item.company_margin_type,
          sale_rate: Number(item.sale_rate) || 0,
          mrp: Number(item.mrp) || 0,
          mfg_date: item.mfg_date || null,
          batch_no: item.batch_no || "",
        };

        const pricingPromise = item.isNew
          ? axios.post("/api/productpricings/", dataToSend)
          : axios.put(`/api/productpricings/${item.id}/`, dataToSend);

        const stockKey = `${item.product}_stock_qty`;
        if (editedValues[stockKey] !== undefined) {
          const productPromise = axios.patch(`/api/products/${item.product}/`, {
            stock_qty: parseInt(editedValues[stockKey]) || 0
          });
          return Promise.all([pricingPromise, productPromise]);
        }

        return pricingPromise;
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Pricing saved successfully!");
      setEditedValues({});
      setEditingCell(null);
      setValidationErrors({});
      queryClient.invalidateQueries({ queryKey: ["productPricings"] });
      setSaving(false);
    },
    onError: (error) => {
      console.error("Save error:", error);
      const errorMessage =
        error.response?.data?.product?.[0] ||
        error.response?.data?.message ||
        error.message;
      toast.error(`Save failed: ${errorMessage}`);
      setSaving(false);
    },
  });

  const validateValue = useCallback((field, value, type) => {
    if (
      type === "currency" ||
      type === "currency_percentage" ||
      type === "percentage"
    ) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return "Must be a valid number";
      if (numValue < 0) return "Must be greater than or equal to 0";
      if (numValue > 999999999) return "Value too large";
    }
    if (type === "integer") {
      const numValue = parseInt(value);
      if (isNaN(numValue)) return "Must be a valid integer";
      if (numValue < 0) return "Must be greater than or equal to 0";
    }
    if (type === "date" && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "Invalid date format";
    }
    if (type === "text" && value && value.length > 100) {
      return "Text too long (max 100 characters)";
    }
    return null;
  }, []);

  const navigateCell = useCallback(
    (currentRowIndex, currentFieldKey, direction) => {
      const totalRows = paginatedData.length;
      const navigableFields = EDITABLE_FIELDS.filter((f) => !f.readonly);
      const currentFieldIndex = navigableFields.findIndex(
        (f) => f.key === currentFieldKey,
      );

      let newRowIndex = currentRowIndex;
      let newFieldIndex = currentFieldIndex;

      switch (direction) {
        case "ArrowRight":
          if (currentFieldIndex < navigableFields.length - 1) {
            newFieldIndex = currentFieldIndex + 1;
          } else if (currentRowIndex < totalRows - 1) {
            newRowIndex = currentRowIndex + 1;
            newFieldIndex = 0;
          }
          break;
        case "ArrowLeft":
          if (currentFieldIndex > 0) {
            newFieldIndex = currentFieldIndex - 1;
          } else if (currentRowIndex > 0) {
            newRowIndex = currentRowIndex - 1;
            newFieldIndex = navigableFields.length - 1;
          }
          break;
        case "ArrowDown":
          if (currentRowIndex < totalRows - 1) {
            newRowIndex = currentRowIndex + 1;
            newFieldIndex = currentFieldIndex;
          }
          break;
        case "ArrowUp":
          if (currentRowIndex > 0) {
            newRowIndex = currentRowIndex - 1;
            newFieldIndex = currentFieldIndex;
          }
          break;
        default:
          return;
      }

      if (
        newRowIndex !== currentRowIndex ||
        newFieldIndex !== currentFieldIndex
      ) {
        const newField = navigableFields[newFieldIndex];
        setEditingCell({ rowIndex: newRowIndex, field: newField.key });

        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.scrollIntoView({
              behavior: "auto",
              block: "nearest",
            });
          }
        }, 50);
      }
    },
    [paginatedData],
  );

  const handleCellEdit = useCallback(
    (rowIndex, field, value) => {
      const row = paginatedData[rowIndex];
      const fieldConfig = EDITABLE_FIELDS.find((f) => f.key === field);
      const key = `${row.product}_${field}`;

      let processedValue = value;
      if (field === "mfg_date" && value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          processedValue = date.toISOString().split("T")[0];
        }
      }

      const error = validateValue(field, processedValue, fieldConfig?.type);
      if (error) {
        setValidationErrors((prev) => ({ ...prev, [key]: error }));
        toast.error(error);
        return;
      }

      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });

      setEditedValues((prev) => ({
        ...prev,
        [key]: processedValue,
      }));
    },
    [paginatedData, validateValue],
  );

  const handleCellDoubleClick = useCallback((rowIndex, field) => {
    setEditingCell({ rowIndex, field });
  }, []);

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  const getCellValue = useCallback(
    (row, rowIndex, field) => {
      const key = `${row.product}_${field}`;
      if (editedValues[key] !== undefined) {
        return editedValues[key];
      }
      return row[field];
    },
    [editedValues],
  );

  const getType = useCallback(
    (row, rowIndex, fieldType) => {
      const key = `${row.product}_${fieldType}_type`;
      if (editedValues[key] !== undefined) {
        return editedValues[key];
      }
      return row[`${fieldType}_type`] || "rupees";
    },
    [editedValues],
  );

  const toggleType = useCallback(
    (rowIndex, fieldType) => {
      const row = paginatedData[rowIndex];
      const currentType = getType(row, rowIndex, fieldType);
      const newType = currentType === "percent" ? "rupees" : "percent";
      const typeKey = `${row.product}_${fieldType}_type`;

      setEditedValues((prev) => ({
        ...prev,
        [typeKey]: newType,
      }));
    },
    [paginatedData, getType],
  );

  const prepareSaveData = useCallback(() => {
    const updates = [];
    const allFields = [
      "purchase_value",
      "purchase_type",
      "transport_value",
      "transport_type",
      "labor_value",
      "labor_type",
      "handling_value",
      "handling_type",
      "godown_value",
      "godown_type",
      "delivery_value",
      "delivery_type",
      "packaging_value",
      "packaging_type",
      "extra1_value",
      "extra1_type",
      "extra2_value",
      "extra2_type",
      "company_margin_value",
      "company_margin_type",
      "sale_rate",
      "mrp",
      "stock_qty",
      "mfg_date",
      "batch_no",
    ];

    paginatedData.forEach((row) => {
      const updatedRow = { ...row };
      let hasChanges = false;

      allFields.forEach((field) => {
        const key = `${row.product}_${field}`;
        if (editedValues[key] !== undefined) {
          updatedRow[field] = editedValues[key];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        updates.push(updatedRow);
      }
    });

    return updates;
  }, [paginatedData, editedValues]);

  const handleSaveAll = useCallback(async () => {
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    const updates = prepareSaveData();
    if (updates.length === 0) {
      toast("No changes to save");
      return;
    }

    setSaving(true);
    saveMutation.mutate(updates);
  }, [prepareSaveData, validationErrors, saveMutation]);

  const handleExportCSV = useCallback(() => {
    const headers = [
      "SKU",
      "Title",
      "Category",
      "Unit",
      "Weight",
      "HSN",
      "Sale Rate",
      "Landing Rate",
      "Margin",
      "Calculated Rate",
      "MRP",
      "MFG Date",
      "Batch No",
      "Purchase",
      "Transport",
      "Labor",
      "Handling",
      "Godown",
      "Delivery",
      "Packaging",
      "Extra 1",
      "Extra 2",
    ];

    const rows = filteredData.map((row) => {
      const computed = calculateRealtimePricing(row, editedValues);
      const getValue = (field) => {
        const key = `${row.product}_${field}`;
        if (editedValues[key] !== undefined) {
          return editedValues[key];
        }
        return row[field];
      };
      const getTypeValue = (fieldType) => {
        const key = `${row.product}_${fieldType}_type`;
        if (editedValues[key] !== undefined) {
          return editedValues[key];
        }
        return row[`${fieldType}_type`] || "rupees";
      };

      return [
        row.sku || "",
        row.title || "",
        row.category || "",
        row.unit || "",
        row.product_weight || "",
        row.hsn || "",
        Number(getValue("sale_rate")).toFixed(2),
        computed.landing_rate.toFixed(2),
        `${getValue("company_margin_value")}${getTypeValue("company_margin") === "percent" ? "%" : "₹"}`,
        computed.calculated_rate.toFixed(2),
        Number(getValue("mrp")).toFixed(2),
        getValue("mfg_date") || "",
        getValue("batch_no") || "",
        `${getValue("purchase_value")}${getTypeValue("purchase") === "percent" ? "%" : "₹"}`,
        `${getValue("transport_value")}${getTypeValue("transport") === "percent" ? "%" : "₹"}`,
        `${getValue("labor_value")}${getTypeValue("labor") === "percent" ? "%" : "₹"}`,
        `${getValue("handling_value")}${getTypeValue("handling") === "percent" ? "%" : "₹"}`,
        `${getValue("godown_value")}${getTypeValue("godown") === "percent" ? "%" : "₹"}`,
        `${getValue("delivery_value")}${getTypeValue("delivery") === "percent" ? "%" : "₹"}`,
        `${getValue("packaging_value")}${getTypeValue("packaging") === "percent" ? "%" : "₹"}`,
        `${getValue("extra1_value")}${getTypeValue("extra1") === "percent" ? "%" : "₹"}`,
        `${getValue("extra2_value")}${getTypeValue("extra2") === "percent" ? "%" : "₹"}`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `product_pricing_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export successful!");
  }, [filteredData, calculateRealtimePricing, editedValues]);

  const renderGroupCell = useCallback(
    (row, rowIndex, groupKey) => {
      const group = GROUP_CONFIG[groupKey];
      const isEvenRow = rowIndex % 2 === 0;
      const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-50";

      return (
        <td
          className={`sticky-col ${rowBgClass} border border-gray-300 p-0`}
          style={{
            left: group.position,
            minWidth: COLUMN_WIDTHS[groupKey.toUpperCase()],
          }}
        >
          <div className="flex flex-col">
            {group.fields.map((fieldKey) => {
              const fieldConfig = EDITABLE_FIELDS.find(
                (f) => f.key === fieldKey,
              );
              if (!fieldConfig) return null;

              const isEditing =
                editingCell?.rowIndex === rowIndex &&
                editingCell?.field === fieldKey;
              const errorKey = `${row.product}_${fieldKey}`;
              const hasError = validationErrors[errorKey];

              if (fieldConfig.readonly) {
                const computed = calculateRealtimePricing(row, editedValues);
                const value =
                  fieldKey === "landing_rate"
                    ? computed.landing_rate
                    : computed.calculated_rate;

                return (
                  <div
                    key={fieldKey}
                    className={`px-4 py-2 bg-gray-100 flex justify-between items-center`}
                  >
                    <span className="text-xs text-gray-600 font-medium">
                      {fieldConfig.label}:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{value.toFixed(2)}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={fieldKey}
                  className={`px-4 py-2 flex justify-between items-center gap-2 border-b border-gray-200 last:border-b-0 ${hasError ? "bg-red-50" : ""}`}
                >
                  <span className="text-xs text-gray-600 font-medium w-20">
                    {fieldConfig.label}:
                  </span>
                  <div className="flex-1">
                    <ExcelCell
                      value={getCellValue(row, rowIndex, fieldKey)}
                      type={fieldConfig.type}
                      currentType={
                        fieldConfig.type === "currency_percentage"
                          ? getType(
                              row,
                              rowIndex,
                              fieldKey.replace("_value", ""),
                            )
                          : undefined
                      }
                      onEdit={(value) =>
                        handleCellEdit(rowIndex, fieldKey, value)
                      }
                      onTypeToggle={
                        fieldConfig.type === "currency_percentage"
                          ? () =>
                              toggleType(
                                rowIndex,
                                fieldKey.replace("_value", ""),
                              )
                          : null
                      }
                      onBlur={handleCellBlur}
                      onDoubleClick={() =>
                        handleCellDoubleClick(rowIndex, fieldKey)
                      }
                      onKeyDown={(e) => navigateCell(rowIndex, fieldKey, e.key)}
                      isEditing={isEditing}
                      inputRef={isEditing ? inputRef : null}
                      placeholder={
                        fieldConfig.type === "date"
                          ? "YYYY-MM-DD"
                          : fieldConfig.type === "text"
                            ? "Enter number"
                            : "0.00"
                      }
                      hasError={hasError}
                      errorMessage={validationErrors[errorKey]}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </td>
      );
    },
    [
      editingCell,
      validationErrors,
      calculateRealtimePricing,
      editedValues,
      getCellValue,
      getType,
      handleCellEdit,
      toggleType,
      handleCellBlur,
      handleCellDoubleClick,
      navigateCell,
    ],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading Calculator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="mb-2 flex flex-col gap-2">
          {/* FILTER BAR WITH DEPENDENT CATEGORY DROPDOWNS */}
          <div
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleApplyFilters();
              }
            }}
            className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            {/* Row 1: Basic Product Info */}
            <div className="grid grid-cols-12 gap-2 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  SKU
                </label>
                <input
                  type="text"
                  value={filterSKU}
                  onChange={(e) => setFilterSKU(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Enter SKU"
                />
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
                          : 0,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setTitleSuggestionIndex((prev) =>
                        prev > 0
                          ? prev - 1
                          : productTitleSuggestions.length - 1,
                      );
                    } else if (e.key === "Enter") {
                      if (
                        titleSuggestionIndex >= 0 &&
                        productTitleSuggestions[titleSuggestionIndex]
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        setFilterTitle(
                          productTitleSuggestions[titleSuggestionIndex],
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
                        className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${
                          index === titleSuggestionIndex
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
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Min Weight (kg)
                </label>
                <input
                  type="number"
                  value={filterMinWeight}
                  onChange={(e) => setFilterMinWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Min"
                  step="0.01"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Max Weight (kg)
                </label>
                <input
                  type="number"
                  value={filterMaxWeight}
                  onChange={(e) => setFilterMaxWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Max"
                  step="0.01"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Min Packing (kg)
                </label>
                <input
                  type="number"
                  value={filterMinPackingWeight}
                  onChange={(e) => setFilterMinPackingWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Min"
                  step="0.01"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Max Packing (kg)
                </label>
                <input
                  type="number"
                  value={filterMaxPackingWeight}
                  onChange={(e) => setFilterMaxPackingWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  placeholder="Max"
                  step="0.01"
                />
              </div>
            </div>

            {/* Row 2: Unit & Weight Filters */}
            <div className="grid grid-cols-12 gap-3 mb-4">
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

              <div className="col-span-2">
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

            {/* Row 3: Brand & Product Attributes with Actions */}
            <div className="grid grid-cols-12 gap-3 mb-4">
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

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Actions
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={handleClearFilters}
                    className="px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear
                  </button>

                  <button
                    onClick={handleApplyFilters}
                    className="px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Search className="h-4 w-4" />
                    Apply
                  </button>

                  <button
                    onClick={handleSaveAll}
                    disabled={saving || Object.keys(editedValues).length === 0}
                    className="px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving
                      ? "Saving..."
                      : `Save (${Object.keys(editedValues).length})`}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Badges - Shows currently applied filters */}
            {(activeFilters.filterSKU ||
              activeFilters.filterTitle ||
              activeFilters.filterBrand ||
              activeFilters.filterFlavour ||
              activeFilters.filterResidual ||
              activeFilters.filterGST ||
              activeFilters.filterUnit ||
              activeFilters.filterHSN ||
              activeFilters.filterCategory ||
              activeFilters.filterBrandCategory ||
              activeFilters.filterBrandCategory1 ||
              activeFilters.filterMinWeight ||
              activeFilters.filterMaxWeight ||
              activeFilters.filterMinPackingWeight ||
              activeFilters.filterMaxPackingWeight) && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 font-medium mr-2">
                  Active Filters:
                </span>
                {activeFilters.filterSKU && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    SKU: {activeFilters.filterSKU}
                    <button
                      onClick={() => {
                        setFilterSKU("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterSKU: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterTitle && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Product: {activeFilters.filterTitle}
                    <button
                      onClick={() => {
                        setFilterTitle("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterTitle: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterHSN && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    HSN: {activeFilters.filterHSN}
                    <button
                      onClick={() => {
                        setFilterHSN("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterHSN: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterCategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Category: {activeFilters.filterCategory}
                    <button
                      onClick={() => {
                        setFilterCategory("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterCategory: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterBrand && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Brand: {activeFilters.filterBrand}
                    <button
                      onClick={() => {
                        setFilterBrand("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterBrand: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterBrandCategory && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Brand Cat: {activeFilters.filterBrandCategory}
                    <button
                      onClick={() => {
                        setFilterBrandCategory("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterBrandCategory: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterBrandCategory1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Brand Cat 1: {activeFilters.filterBrandCategory1}
                    <button
                      onClick={() => {
                        setFilterBrandCategory1("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterBrandCategory1: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterFlavour && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Flavour: {activeFilters.filterFlavour}
                    <button
                      onClick={() => {
                        setFilterFlavour("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterFlavour: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterResidual && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Residual: {activeFilters.filterResidual}
                    <button
                      onClick={() => {
                        setFilterResidual("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterResidual: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterGST && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    GST:{" "}
                    {
                      gstRates?.find((r) => r.id == activeFilters.filterGST)
                        ?.rate
                    }
                    %
                    <button
                      onClick={() => {
                        setFilterGST("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterGST: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterUnit && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Unit: {activeFilters.filterUnit}
                    <button
                      onClick={() => {
                        setFilterUnit("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterUnit: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterMinWeight && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Min Wt: {activeFilters.filterMinWeight}
                    <button
                      onClick={() => {
                        setFilterMinWeight("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterMinWeight: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterMaxWeight && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Max Wt: {activeFilters.filterMaxWeight}
                    <button
                      onClick={() => {
                        setFilterMaxWeight("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterMaxWeight: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterMinPackingWeight && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Min Pack: {activeFilters.filterMinPackingWeight}
                    <button
                      onClick={() => {
                        setFilterMinPackingWeight("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterMinPackingWeight: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterMaxPackingWeight && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Max Pack: {activeFilters.filterMaxPackingWeight}
                    <button
                      onClick={() => {
                        setFilterMaxPackingWeight("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterMaxPackingWeight: "",
                        }));
                      }}
                      className="hover:text-blue-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div
            ref={tableContainerRef}
            className="overflow-x-auto overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            <style>{`
      .pricing-table { 
        border-collapse: separate; 
        border-spacing: 0; 
        min-width: 100%;
      }
      .pricing-table th, 
      .pricing-table td { 
        border: 1px solid #e5e7eb; 
      }
      .sticky-col { 
        position: sticky; 
        background-color: inherit; 
        z-index: 10; 
        border-right: 2px solid #e5e7eb !important; 
      }
      .sticky-col-header { 
        position: sticky; 
        top: 0;  /* This is crucial for freezing the header row */
        background-color: #1a2332; 
        color: #ffffff;
        z-index: 20; 
        border-right: 2px solid #e5e7eb !important; 
        border-bottom: 2px solid #d1d5db !important; 
      }
      /* Ensure sticky columns also have correct z-index when header is sticky */
      .sticky-col-header.sticky-col {
        z-index: 25;
      }
      .sticky-col.bg-white { 
        background-color: white; 
      }
      .sticky-col.bg-gray-50 { 
        background-color: #f9fafb; 
      }
      input[type="number"]::-webkit-inner-spin-button, 
      input[type="number"]::-webkit-outer-spin-button { 
        -webkit-appearance: none; 
        margin: 0; 
      }
      input[type="number"] { 
        -moz-appearance: textfield; 
        appearance: textfield; 
      }
    `}</style>

            <table className="pricing-table">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: STICKY_POSITIONS.SKU,
                      minWidth: COLUMN_WIDTHS.SKU,
                      zIndex: 25,
                    }}
                  >
                    SKU
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: STICKY_POSITIONS.PRODUCT,
                      minWidth: COLUMN_WIDTHS.PRODUCT,
                      zIndex: 25,
                    }}
                  >
                    Product
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: STICKY_POSITIONS.SALE_RATE,
                      minWidth: COLUMN_WIDTHS.SALE_RATE,
                      zIndex: 25,
                    }}
                  >
                    Sale Rate
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: GROUP_CONFIG.pricingDetails.position,
                      minWidth: COLUMN_WIDTHS.PRICING_DETAILS,
                      zIndex: 25,
                    }}
                  >
                    Pricing Details
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: GROUP_CONFIG.productDetails.position,
                      minWidth: COLUMN_WIDTHS.PRODUCT_DETAILS,
                      zIndex: 25,
                    }}
                  >
                    Product Details
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: GROUP_CONFIG.costComponents1.position,
                      minWidth: COLUMN_WIDTHS.COST_COMPONENTS_1,
                      zIndex: 25,
                    }}
                  >
                    Cost Components 1
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: GROUP_CONFIG.costComponents2.position,
                      minWidth: COLUMN_WIDTHS.COST_COMPONENTS_2,
                      zIndex: 25,
                    }}
                  >
                    Cost Components 2
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold"
                    style={{
                      left: GROUP_CONFIG.additionalCosts.position,
                      minWidth: COLUMN_WIDTHS.ADDITIONAL_COSTS,
                      zIndex: 25,
                    }}
                  >
                    Additional Costs
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => {
                  const isEvenRow = rowIndex % 2 === 0;
                  const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-50";

                  return (
                    <tr key={row.product} className={rowBgClass}>
                      <td
                        className={`sticky-col ${rowBgClass} px-4 py-3 text-sm text-gray-900 font-medium`}
                        style={{
                          left: STICKY_POSITIONS.SKU,
                          minWidth: COLUMN_WIDTHS.SKU,
                        }}
                      >
                        {row.sku}
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} px-4 py-3 text-sm text-gray-900`}
                        style={{
                          left: STICKY_POSITIONS.PRODUCT,
                          minWidth: COLUMN_WIDTHS.PRODUCT,
                        }}
                      >
                        <div>
                          <div className="font-medium">{row.title}</div>
                          <div className="text-xs text-gray-500">
                            {row.category}
                          </div>
                        </div>
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} px-4 py-3`}
                        style={{
                          left: STICKY_POSITIONS.SALE_RATE,
                          minWidth: COLUMN_WIDTHS.SALE_RATE,
                        }}
                      >
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "sale_rate")}
                          type="currency"
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "sale_rate", value)
                          }
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "sale_rate")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "sale_rate", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "sale_rate"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "sale_rate"
                              ? inputRef
                              : null
                          }
                          placeholder="0.00"
                        />
                      </td>
                      {renderGroupCell(row, rowIndex, "pricingDetails")}
                      {renderGroupCell(row, rowIndex, "productDetails")}
                      {renderGroupCell(row, rowIndex, "costComponents1")}
                      {renderGroupCell(row, rowIndex, "costComponents2")}
                      {renderGroupCell(row, rowIndex, "additionalCosts")}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Excel-like Editable Cell Component (same as before, keeping it short)
const ExcelCell = React.memo(
  ({
    value,
    type,
    currentType,
    onEdit,
    placeholder,
    onTypeToggle,
    onBlur,
    onDoubleClick,
    onKeyDown,
    isEditing,
    inputRef,
    hasError,
    errorMessage,
  }) => {
    const [inputValue, setInputValue] = useState(value);
    const [focusOnToggle, setFocusOnToggle] = useState(false);
    const localRef = useRef(null);
    const toggleRef = useRef(null);
    const isFirstRender = useRef(true);
    const hasSavedRef = useRef(false);

    // Sync input value when editing starts
    useEffect(() => {
      if (isEditing) {
        setInputValue(value);
        setFocusOnToggle(false);
        hasSavedRef.current = false;
      }
    }, [value, isEditing]);

    // Handle focus when editing starts
    useEffect(() => {
      if (isEditing && !isFirstRender.current && !focusOnToggle) {
        const refToUse = inputRef || localRef;
        if (refToUse?.current) {
          requestAnimationFrame(() => {
            refToUse.current.focus();
            if (
              type === "currency" ||
              type === "currency_percentage" ||
              type === "percentage"
            ) {
              refToUse.current.select();
            }
          });
        }
      }
      isFirstRender.current = false;
    }, [isEditing, inputRef, type, focusOnToggle]);

    // Focus on toggle button when needed
    useEffect(() => {
      if (focusOnToggle && toggleRef.current) {
        toggleRef.current.focus();
      }
    }, [focusOnToggle]);

    // Save the current value
    const saveCurrentValue = useCallback(() => {
      if (!hasSavedRef.current) {
        if (type === "date") {
          // Date is already saved via onChange
          hasSavedRef.current = true;
        } else if (type === "text") {
          onEdit(inputValue);
          hasSavedRef.current = true;
        } else {
          const numValue = parseFloat(inputValue);
          if (!isNaN(numValue)) {
            onEdit(numValue);
            hasSavedRef.current = true;
          } else if (
            inputValue === "" ||
            inputValue === null ||
            inputValue === undefined
          ) {
            onEdit(0);
            hasSavedRef.current = true;
          }
        }
      }
    }, [inputValue, type, onEdit]);

    const handleChange = useCallback(
      (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        hasSavedRef.current = false;

        if (type === "date") {
          // Auto-save date immediately
          onEdit(newValue);
          hasSavedRef.current = true;
        }
      },
      [type, onEdit],
    );

    const handleKeyDown = useCallback(
      (e) => {
        if (!focusOnToggle) {
          // NEW: Allow toggling with Arrow Up/Down from input when Ctrl is pressed
          if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === "ArrowUp" || e.key === "ArrowDown")
          ) {
            e.preventDefault();
            if (onTypeToggle) {
              onTypeToggle();
              // Keep focus in input after toggling
              setTimeout(() => {
                const refToUse = inputRef || localRef;
                if (refToUse?.current) {
                  refToUse.current.focus();
                }
              }, 10);
            }
            return;
          }

          // Save value when navigating away with arrow keys
          if (
            ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            e.preventDefault();
            saveCurrentValue();
            onBlur();
            setTimeout(() => onKeyDown(e), 10);
          } else if (e.key === "Enter") {
            e.preventDefault();
            saveCurrentValue();
            onBlur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setInputValue(value);
            onBlur();
          } else if (e.key === "Tab") {
            // Let Tab work normally but save first
            saveCurrentValue();
            onBlur();
            setTimeout(() => onKeyDown(e), 10);
          } else {
            onKeyDown(e);
          }
        }
      },
      [
        focusOnToggle,
        saveCurrentValue,
        onBlur,
        onKeyDown,
        value,
        onTypeToggle,
        inputRef,
        type,
        inputValue,
        onEdit,
      ],
    );

    const handleBlur = useCallback(() => {
      if (!focusOnToggle) {
        saveCurrentValue();
        onBlur();
      }
    }, [focusOnToggle, saveCurrentValue, onBlur]);

    const handleToggleKeyDown = useCallback(
      (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          onTypeToggle();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setFocusOnToggle(false);
          saveCurrentValue();
          onBlur();
          setTimeout(() => onKeyDown(e), 10);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setFocusOnToggle(false);
          setTimeout(() => {
            const refToUse = inputRef || localRef;
            if (refToUse?.current) {
              refToUse.current.focus();
            }
          }, 10);
        } else if (e.key === "Enter") {
          e.preventDefault();
          onTypeToggle();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setFocusOnToggle(false);
          setInputValue(value);
          onBlur();
        }
      },
      [onTypeToggle, saveCurrentValue, onBlur, onKeyDown, inputRef, value],
    );

    const handleToggleClick = useCallback(
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        onTypeToggle();
        setTimeout(() => {
          if (toggleRef.current) {
            toggleRef.current.focus();
          }
        }, 10);
      },
      [onTypeToggle],
    );

    const getDisplayValue = useCallback(() => {
      if (value === undefined || value === null || value === "") {
        return placeholder ? (
          <span className="text-gray-400 italic">{placeholder}</span>
        ) : (
          ""
        );
      }

      switch (type) {
        case "percentage":
          return `${Number(value).toFixed(2)}%`;
        case "currency":
          return `₹${Number(value).toFixed(2)}`;
        case "currency_percentage":
          if (currentType === "percent") {
            return `${Number(value).toFixed(2)}%`;
          }
          return `₹${Number(value).toFixed(2)}`;
        case "date":
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString("en-GB");
            }
            return value;
          } catch {
            return value;
          }
        case "text":
          return value;
        default:
          return Number(value).toString();
      }
    }, [value, type, currentType, placeholder]);

    // Display mode - non-editing
    if (!isEditing) {
      return (
        <div
          onDoubleClick={onDoubleClick}
          className={`cursor-pointer px-2 py-1 rounded min-w-[100px] flex items-center justify-between gap-2 ${
            hasError ? "bg-red-50" : "hover:bg-blue-50"
          }`}
          style={{
            minHeight: "34px",
            height: "34px",
            transition: "none",
          }}
        >
          <span
            className={`text-sm font-medium truncate ${
              hasError ? "text-red-600" : "text-gray-900"
            }`}
          >
            {getDisplayValue()}
          </span>
          {onTypeToggle &&
            (currentType === "percent" || currentType === "rupees") && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex-shrink-0">
                {currentType === "percent" ? "%" : "₹"}
              </span>
            )}
        </div>
      );
    }

    // Editing mode
    return (
      <div
        className="relative"
        style={{
          minHeight: "34px",
          height: "34px",
          width: "100%",
        }}
      >
        {/* Invisible placeholder */}
        <div
          className="px-2 py-1 invisible"
          style={{
            minHeight: "34px",
            height: "34px",
            visibility: "hidden",
            width: "100%",
          }}
        >
          <span className="text-sm">{getDisplayValue()}</span>
        </div>

        {/* Absolute positioned input and toggle */}
        <div
          className="absolute inset-0 flex items-center gap-1"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {type === "date" ? (
            <input
              ref={(node) => {
                if (inputRef) inputRef.current = node;
                localRef.current = node;
              }}
              type="date"
              value={inputValue || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onDoubleClick={(e) => {
                if (e.target.showPicker) e.target.showPicker();
              }}
              className={`px-2 py-1 rounded focus:outline-none focus:ring-2 text-sm ${
                hasError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-blue-500 focus:ring-blue-500"
              }`}
              style={{
                width: "100%",
                minWidth: "80px",
                maxWidth: "100%",
                height: "30px",
                borderWidth: "2px",
                boxSizing: "border-box",
              }}
            />
          ) : type === "text" ? (
            <input
              ref={(node) => {
                if (inputRef) inputRef.current = node;
                localRef.current = node;
              }}
              type="text"
              value={inputValue || ""}
              onChange={(e) => {
                setInputValue(e.target.value);
                hasSavedRef.current = false;
              }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`px-2 py-1 rounded focus:outline-none focus:ring-2 text-sm ${
                hasError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-blue-500 focus:ring-blue-500"
              }`}
              style={{
                width: "100%",
                minWidth: "80px",
                maxWidth: "100%",
                height: "30px",
                borderWidth: "2px",
                boxSizing: "border-box",
              }}
            />
          ) : (
            <>
              <input
                ref={(node) => {
                  if (inputRef) inputRef.current = node;
                  localRef.current = node;
                }}
                type="number"
                step="0.01"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  hasSavedRef.current = false;
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`px-2 py-1 rounded focus:outline-none focus:ring-2 text-sm ${
                  hasError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-blue-500 focus:ring-blue-500"
                }`}
                style={{
                  width: "100%",
                  minWidth: "80px",
                  maxWidth: "100%",
                  height: "30px",
                  borderWidth: "2px",
                  boxSizing: "border-box",
                }}
              />
              {onTypeToggle && (
                <button
                  ref={toggleRef}
                  onClick={handleToggleClick}
                  onKeyDown={handleToggleKeyDown}
                  onBlur={() => {
                    if (focusOnToggle) {
                      setFocusOnToggle(false);
                      saveCurrentValue();
                      onBlur();
                    }
                  }}
                  className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1 transition-colors justify-center border border-gray-300 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    height: "30px",
                    minWidth: "32px",
                    width: "32px",
                  }}
                  title={
                    currentType === "percent"
                      ? "Switch to rupees (use ↑/↓ arrows)"
                      : "Switch to percentage (use ↑/↓ arrows)"
                  }
                  type="button"
                >
                  {currentType === "percent" ? (
                    <Percent className="h-3 w-3" />
                  ) : (
                    "₹"
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Error message tooltip */}
        {hasError && errorMessage && (
          <div className="absolute z-10 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded whitespace-nowrap">
            {errorMessage}
          </div>
        )}
      </div>
    );
  },
);

ExcelCell.displayName = "ExcelCell";

export default ProductPricing;
