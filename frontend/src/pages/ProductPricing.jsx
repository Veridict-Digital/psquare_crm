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
  // Pricing Details (grouped column)
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
  // Product Details (grouped column)
  { key: "mrp", group: "productDetails", label: "MRP", type: "currency" },
  { key: "batch_no", group: "productDetails", label: "Batch No", type: "text" },
  { key: "mfg_date", group: "productDetails", label: "MFG Date", type: "date" },
  // Cost Components 1 (grouped column)
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
  // Cost Components 2 (grouped column)
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
  // Additional Costs (grouped column)
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
    fields: ["mrp", "batch_no", "mfg_date"],
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
  const [search, setSearch] = useState("");
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
        return {
          id: pricing?.id || null,
          product: product.id,
          sku: product.sku || "",
          title: product.title || "",
          category:
            product.category_display ||
            product.category?.name ||
            product.category1_display ||
            product.category1?.name ||
            "",
          unit: product.unit || "",
          product_weight: product.product_weight || "",
          hsn: product.hsn || "",
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
          mfg_date: pricing?.mfg_date ?? null,
          batch_no: pricing?.batch_no ?? "",
          isNew: !pricing?.id,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!pricingData) return [];
    return pricingData.filter(
      (item) =>
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [pricingData, search]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Calculate pricing in real-time with edited values
  const calculateRealtimePricing = useCallback((row, currentEditedValues) => {
    // Helper to get value (edited value takes priority)
    const getValue = (field) => {
      const key = `${row.product}_${field}`;
      if (currentEditedValues[key] !== undefined) {
        return currentEditedValues[key];
      }
      return row[field];
    };

    // Helper to get type (edited type takes priority)
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

    base += calculateCost(base, getType("transport"), getValue("transport_value"));
    base += calculateCost(base, getType("labor"), getValue("labor_value"));
    base += calculateCost(base, getType("handling"), getValue("handling_value"));
    base += calculateCost(base, getType("godown"), getValue("godown_value"));
    base += calculateCost(base, getType("delivery"), getValue("delivery_value"));
    base += calculateCost(base, getType("packaging"), getValue("packaging_value"));
    base += calculateCost(base, getType("extra1"), getValue("extra1_value"));
    base += calculateCost(base, getType("extra2"), getValue("extra2_value"));

    const landing_rate = base;
    base += calculateCost(base, getType("landing"), getValue("landing_value"));
    const calculated_rate = base;

    return { landing_rate, calculated_rate };
  }, []);

  // Calculate pricing locally with memoization (for backward compatibility)
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
    base += calculateCost(base, row.landing_type, row.landing_value);
    const calculated_rate = base;

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

        if (item.isNew) {
          return axios.post("/api/productpricings/", dataToSend);
        } else {
          return axios.put(`/api/productpricings/${item.id}/`, dataToSend);
        }
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

  // Validation function
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
    if (type === "date" && value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) return "Invalid date format";
    }
    if (type === "text" && value && value.length > 100) {
      return "Text too long (max 100 characters)";
    }
    return null;
  }, []);

  // Navigation handler
  const navigateCell = useCallback(
    (currentRowIndex, currentFieldKey, direction) => {
      const totalRows = paginatedData.length;
      
      const navigableFields = EDITABLE_FIELDS.filter(f => !f.readonly);
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

  // Handle cell edit with validation
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

  // Handle cell double click
  const handleCellDoubleClick = useCallback((rowIndex, field) => {
    setEditingCell({ rowIndex, field });
  }, []);

  // Handle cell blur
  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Get current value
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

  // Get type value
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

  // Handle type toggle
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

  // Prepare data for save
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

  // Save all changes
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

  // Export to CSV
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

  // Render group cell
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
                const bgColor = "bg-gray-100";

                return (
                  <div
                    key={fieldKey}
                    className={`px-4 py-2 ${bgColor} flex justify-between items-center`}
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
          <p className="text-gray-600">Loading product pricing...</p>
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
        {/* Header */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Product Calculator
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Double-click any cell to edit. Use arrow keys to navigate. Press
              Enter to save, Esc to cancel.
            </p>
          </div>

          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || Object.keys(editedValues).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Saving..."
                : `Save Changes (${Object.keys(editedValues).length})`}
            </button>
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
    background-color: #f3f4f6;
    z-index: 20;
    border-right: 2px solid #e5e7eb !important;
    border-bottom: 2px solid #d1d5db !important;
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
              <thead className="bg-gray-100">
                <tr>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: STICKY_POSITIONS.SKU,
                      minWidth: COLUMN_WIDTHS.SKU,
                      zIndex: 21,
                    }}
                  >
                    SKU
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: STICKY_POSITIONS.PRODUCT,
                      minWidth: COLUMN_WIDTHS.PRODUCT,
                      zIndex: 21,
                    }}
                  >
                    Product
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: STICKY_POSITIONS.SALE_RATE,
                      minWidth: COLUMN_WIDTHS.SALE_RATE,
                      zIndex: 21,
                    }}
                  >
                    Sale Rate
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: GROUP_CONFIG.pricingDetails.position,
                      minWidth: COLUMN_WIDTHS.PRICING_DETAILS,
                      zIndex: 21,
                    }}
                  >
                    Pricing Details
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: GROUP_CONFIG.productDetails.position,
                      minWidth: COLUMN_WIDTHS.PRODUCT_DETAILS,
                      zIndex: 21,
                    }}
                  >
                    Product Details
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: GROUP_CONFIG.costComponents1.position,
                      minWidth: COLUMN_WIDTHS.COST_COMPONENTS_1,
                      zIndex: 21,
                    }}
                  >
                    Cost Components 1
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: GROUP_CONFIG.costComponents2.position,
                      minWidth: COLUMN_WIDTHS.COST_COMPONENTS_2,
                      zIndex: 21,
                    }}
                  >
                    Cost Components 2
                  </th>
                  <th
                    className="sticky-col-header px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{
                      left: GROUP_CONFIG.additionalCosts.position,
                      minWidth: COLUMN_WIDTHS.ADDITIONAL_COSTS,
                      zIndex: 21,
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

          {/* Pagination */}
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
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-200"
                        }`}
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
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-200 transition-colors"
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

// Excel-like Editable Cell Component
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

    useEffect(() => {
      if (isEditing) {
        setInputValue(value);
        setFocusOnToggle(false);
      }
    }, [value, isEditing]);

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

    useEffect(() => {
      if (focusOnToggle && toggleRef.current) {
        toggleRef.current.focus();
      }
    }, [focusOnToggle]);

    const handleChange = useCallback(
      (e) => {
        setInputValue(e.target.value);
        if (type === "date") {
          onEdit(e.target.value);
          setTimeout(() => {
            if (inputRef?.current) inputRef.current.blur();
            if (localRef.current) localRef.current.blur();
          }, 50);
        }
      },
      [type, onEdit, inputRef],
    );

    const handleKeyDown = useCallback(
      (e) => {
        if (!focusOnToggle) {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            if (onTypeToggle) {
              setFocusOnToggle(true);
            } else {
              onBlur();
              setTimeout(() => onKeyDown(e), 10);
            }
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (type !== "date") {
              const numValue = parseFloat(inputValue);
              if (!isNaN(numValue)) {
                onEdit(numValue);
              } else if (type === "text") {
                onEdit(inputValue);
              }
            }
            onBlur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setInputValue(value);
            onBlur();
          } else if (
            ["ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)
          ) {
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
              onBlur();
              setTimeout(() => onKeyDown(e), 10);
            } else {
              onKeyDown(e);
            }
          } else {
            onKeyDown(e);
          }
        }
      },
      [focusOnToggle, onTypeToggle, onBlur, onKeyDown, inputValue, type, onEdit, value]
    );

    const handleToggleKeyDown = useCallback(
      (e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          onTypeToggle();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          setFocusOnToggle(false);
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
          onBlur();
        }
      },
      [onTypeToggle, onBlur, onKeyDown, inputRef]
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

    return (
      <div
        className="relative"
        style={{
          minHeight: "34px",
          height: "34px",
          width: "100%",
        }}
      >
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
              onBlur={() => {
                if (!focusOnToggle) {
                  onBlur();
                }
              }}
              onKeyDown={handleKeyDown}
              onDoubleClick={e => {
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
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => {
                if (!focusOnToggle) {
                  onEdit(inputValue);
                  onBlur();
                }
              }}
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
                onChange={handleChange}
                onBlur={() => {
                  if (!focusOnToggle) {
                    const numValue = parseFloat(inputValue);
                    if (!isNaN(numValue)) {
                      onEdit(numValue);
                    }
                    onBlur();
                  }
                }}
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