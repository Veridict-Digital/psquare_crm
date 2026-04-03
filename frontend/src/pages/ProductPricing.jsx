import React, { useState, useEffect, useMemo, useRef } from "react";
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

const ProductPricing = () => {
  const [search, setSearch] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const tableContainerRef = useRef(null);
  const queryClient = useQueryClient();

  // Define editable fields in order for navigation - STARTING FROM SALE RATE TO MARGIN
  const editableFields = [
    { key: "sale_rate", type: null, label: "Sale Rate" },
    { key: "mrp", type: null, label: "MRP" },
    { key: "mfg_date", type: "date", label: "MFG Date" },
    { key: "batch_no", type: "text", label: "Batch No" },
    { key: "purchase_value", type: "purchase", label: "Purchase" },
    { key: "transport_value", type: "transport", label: "Transport" },
    { key: "labor_value", type: "labor", label: "Labor" },
    { key: "handling_value", type: "handling", label: "Handling" },
    { key: "godown_value", type: "godown", label: "Godown" },
    { key: "delivery_value", type: "delivery", label: "Delivery" },
    { key: "packaging_value", type: "packaging", label: "Packaging" },
    { key: "extra1_value", type: "extra1", label: "Extra 1" },
    { key: "extra2_value", type: "extra2", label: "Extra 2" },
    { key: "company_margin_value", type: "company_margin", label: "Margin" },
  ];

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
          sku: product.sku,
          title: product.title,
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

  // Calculate pricing locally
  const calculatePricing = (row) => {
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
  };

  // Navigation handler with auto-scroll for frozen columns
  const navigateCell = (currentRowIndex, currentFieldKey, direction) => {
    const totalRows = paginatedData.length;
    const currentFieldIndex = editableFields.findIndex(
      (f) => f.key === currentFieldKey,
    );

    let newRowIndex = currentRowIndex;
    let newFieldIndex = currentFieldIndex;

    switch (direction) {
      case "ArrowRight":
        if (currentFieldIndex < editableFields.length - 1) {
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
          newFieldIndex = editableFields.length - 1;
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
      const newField = editableFields[newFieldIndex];
      setEditingCell({ rowIndex: newRowIndex, field: newField.key });

      // Auto-scroll to the new cell
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 50);
    }
  };

  // Handle cell edit
  const handleCellEdit = (rowIndex, field, value) => {
    const row = paginatedData[rowIndex];
    const key = `${row.product}_${field}`;

    // Format date properly if it's a date field
    let processedValue = value;
    if (field === "mfg_date" && value) {
      // Ensure date is in YYYY-MM-DD format
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        processedValue = date.toISOString().split("T")[0];
      }
    }

    setEditedValues((prev) => ({
      ...prev,
      [key]: processedValue,
    }));
  };

  // Handle cell double click to start editing
  const handleCellDoubleClick = (rowIndex, field) => {
    setEditingCell({ rowIndex, field });
  };

  // Handle cell blur (save and exit edit mode)
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // Get current value (considering edited values)
  const getCellValue = (row, rowIndex, field) => {
    const key = `${row.product}_${field}`;
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    return row[field];
  };

  // Handle type toggle
  const toggleType = (rowIndex, fieldType) => {
    const row = paginatedData[rowIndex];
    const currentType = getType(row, rowIndex, fieldType);
    const newType = currentType === "percent" ? "rupees" : "percent";

    const typeKey = `${row.product}_${fieldType}_type`;

    setEditedValues((prev) => ({
      ...prev,
      [typeKey]: newType,
    }));
  };

  // Get type value
  const getType = (row, rowIndex, fieldType) => {
    const key = `${row.product}_${fieldType}_type`;
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    return row[`${fieldType}_type`] || "rupees";
  };

  // Prepare data for save
  const prepareSaveData = () => {
    const updates = [];

    paginatedData.forEach((row) => {
      const updatedRow = { ...row };
      let hasChanges = false;

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
        "landing_value",
        "landing_type",
        "company_margin_value",
        "company_margin_type",
        "sale_rate",
        "mrp",
        "mfg_date",
        "batch_no",
      ];

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
  };

  // Save all changes
  const handleSaveAll = async () => {
    const updates = prepareSaveData();

    if (updates.length === 0) {
      toast("No changes to save");
      return;
    }

    setSaving(true);
    saveMutation.mutate(updates);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "SKU",
      "Title",
      "Category",
      "Unit",
      "Weight",
      "HSN",
      "Purchase (₹/%)",
      "Transport (₹/%)",
      "Labor (₹/%)",
      "Handling (₹/%)",
      "Godown (₹/%)",
      "Delivery (₹/%)",
      "Packaging (₹/%)",
      "Extra1 (₹/%)",
      "Extra2 (₹/%)",
      "Landing Rate",
      "Calculated Rate",
      "Sale Rate",
      "MRP",
    ];

    const rows = filteredData.map((row) => {
      const computed = calculatePricing(row);
      const purchaseDisplay = `${row.purchase_value}${row.purchase_type === "percent" ? "%" : "₹"}`;
      const transportDisplay = `${row.transport_value}${row.transport_type === "percent" ? "%" : "₹"}`;
      const laborDisplay = `${row.labor_value}${row.labor_type === "percent" ? "%" : "₹"}`;
      const handlingDisplay = `${row.handling_value}${row.handling_type === "percent" ? "%" : "₹"}`;
      const godownDisplay = `${row.godown_value}${row.godown_type === "percent" ? "%" : "₹"}`;
      const deliveryDisplay = `${row.delivery_value}${row.delivery_type === "percent" ? "%" : "₹"}`;
      const packagingDisplay = `${row.packaging_value}${row.packaging_type === "percent" ? "%" : "₹"}`;
      const extra1Display = `${row.extra1_value}${row.extra1_type === "percent" ? "%" : "₹"}`;
      const extra2Display = `${row.extra2_value}${row.extra2_type === "percent" ? "%" : "₹"}`;
      const marginDisplay = `${row.company_margin_value}${row.company_margin_type === "percent" ? "%" : "₹"}`;

      return [
        row.sku || "",
        row.title || "",
        row.category || "",
        row.unit || "",
        row.product_weight || "",
        row.hsn || "",
        purchaseDisplay,
        transportDisplay,
        laborDisplay,
        handlingDisplay,
        godownDisplay,
        deliveryDisplay,
        packagingDisplay,
        extra1Display,
        extra2Display,
        marginDisplay,
        computed.landing_rate.toFixed(2),
        computed.calculated_rate.toFixed(2),
        Number(row.sale_rate).toFixed(2),
        Number(row.mrp).toFixed(2),
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
    link.setAttribute("download", "product_pricing.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product pricing...</p>
        </div>
      </div>
    );

  if (error)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Product Pricing
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Double-click any cell to edit. Use arrow keys to navigate.
            </p>
          </div>

          {/* Search bar */}
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || Object.keys(editedValues).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Saving..."
                : `Save Changes (${Object.keys(editedValues).length})`}
            </button>
          </div>
        </div>

        {/* Table with frozen columns */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div 
            ref={tableContainerRef}
            className="overflow-x-auto overflow-y-auto" 
            
          >
            <style>
              {`
                .pricing-table {
                  border-collapse: separate;
                  border-spacing: 0;
                  min-width: 100%;
                }
                
                .pricing-table th,
                .pricing-table td {
                  border: 1px solid #e5e7eb;
                  padding: 0.75rem 1rem;
                }
                
                .sticky-col {
                  position: sticky;
                  background-color: inherit;
                  z-index: 10;
                  border-right: 1px solid #e5e7eb !important;
                }
                
                .sticky-col-header {
                  position: sticky;
                  background-color: #f3f4f6;
                  z-index: 20;
                  border-right: 1px solid #e5e7eb !important;
                  border-bottom: 2px solid #d1d5db !important;
                }
                
                /* Ensure borders are visible on sticky columns */
                .sticky-col,
                .sticky-col-header {
                  box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1);
                }
                
                /* Fix for alternating row backgrounds */
                .sticky-col.bg-white {
                  background-color: white;
                }
                
                .sticky-col.bg-gray-50 {
                  background-color: #f9fafb;
                }
                
                /* Ensure all cells have proper borders */
                .pricing-table td {
                  border: 1px solid #e5e7eb;
                }
                
                /* Remove duplicate borders between sticky and non-sticky cells */
                .pricing-table td.sticky-col + td {
                  border-left: none;
                }
              `}
            </style>
            <table className="pricing-table">
              <thead className="bg-gray-100">
                <tr>
                  {/* Frozen columns */}
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: 0, minWidth: '120px', zIndex: 21 }}>SKU</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '120px', minWidth: '200px', zIndex: 21 }}>Product</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '320px', minWidth: '120px', zIndex: 21 }}>Landing Rate</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '440px', minWidth: '120px', zIndex: 21 }}>Calculated Rate</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '560px', minWidth: '100px', zIndex: 21 }}>Sale Rate</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '660px', minWidth: '100px', zIndex: 21 }}>MRP</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '760px', minWidth: '110px', zIndex: 21 }}>MFG Date</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '870px', minWidth: '140px', zIndex: 21 }}>Batch No</th>
                  <th className="sticky-col-header border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ left: '1010px', minWidth: '100px', zIndex: 21 }}>Purchase</th>
                  
                  {/* Scrollable columns */}
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Transport</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Labor</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Handling</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Godown</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Delivery</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Packaging</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Extra 1</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Extra 2</th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ minWidth: '100px' }}>Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {paginatedData.map((row, rowIndex) => {
                  const computed = calculatePricing(row);
                  const isEvenRow = rowIndex % 2 === 0;
                  const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-50";

                  return (
                    <tr key={row.product} className={rowBgClass}>
                      {/* Frozen columns */}
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3 text-sm text-gray-900 font-medium`}
                        style={{ left: 0, minWidth: "120px" }}
                      >
                        {row.sku}
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3 text-sm text-gray-900`}
                        style={{ left: "120px", minWidth: "200px" }}
                      >
                        {row.title}
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900 bg-blue-50`}
                        style={{ left: "320px", minWidth: "120px" }}
                      >
                        ₹{computed.landing_rate.toFixed(2)}
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-900 bg-green-50`}
                        style={{ left: "440px", minWidth: "120px" }}
                      >
                        ₹{computed.calculated_rate.toFixed(2)}
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3`}
                        style={{ left: "560px", minWidth: "100px" }}
                      >
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "sale_rate")}
                          type="rupees"
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "sale_rate", value)
                          }
                          onTypeToggle={null}
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
                        />
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3`}
                        style={{ left: "660px", minWidth: "100px" }}
                      >
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "mrp")}
                          type="rupees"
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "mrp", value)
                          }
                          onTypeToggle={null}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "mrp")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "mrp", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "mrp"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "mrp"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3 text-center`}
                        style={{ left: "760px", minWidth: "110px" }}
                      >
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "mfg_date")}
                          type="date"
                          placeholder="DD/MM/YYYY" // ADD THIS LINE
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "mfg_date", value)
                          }
                          onTypeToggle={null}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "mfg_date")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "mfg_date", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "mfg_date"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "mfg_date"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3`}
                        style={{ left: "870px", minWidth: "140px" }}
                      >
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "batch_no")}
                          type="text"
                          placeholder="batch no" // ADD THIS LINE
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "batch_no", value)
                          }
                          onTypeToggle={null}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "batch_no")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "batch_no", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "batch_no"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "batch_no"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td
                        className={`sticky-col ${rowBgClass} border border-gray-300 px-4 py-3`}
                        style={{ left: "1010px", minWidth: "100px" }}
                      >
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "purchase_value")}
                          type={getType(row, rowIndex, "purchase")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "purchase_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "purchase")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "purchase_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "purchase_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "purchase_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "purchase_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>

                      {/* Scrollable columns */}
                      <td className="scrollable-cell border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "transport_value")}
                          type={getType(row, rowIndex, "transport")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "transport_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "transport")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "transport_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "transport_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "transport_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "transport_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "labor_value")}
                          type={getType(row, rowIndex, "labor")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "labor_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "labor")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "labor_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "labor_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "labor_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "labor_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "handling_value")}
                          type={getType(row, rowIndex, "handling")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "handling_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "handling")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "handling_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "handling_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "handling_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "handling_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "godown_value")}
                          type={getType(row, rowIndex, "godown")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "godown_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "godown")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "godown_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "godown_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "godown_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "godown_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "delivery_value")}
                          type={getType(row, rowIndex, "delivery")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "delivery_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "delivery")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "delivery_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "delivery_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "delivery_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "delivery_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "packaging_value")}
                          type={getType(row, rowIndex, "packaging")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "packaging_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "packaging")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "packaging_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "packaging_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "packaging_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "packaging_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "extra1_value")}
                          type={getType(row, rowIndex, "extra1")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "extra1_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "extra1")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "extra1_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "extra1_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "extra1_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "extra1_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(row, rowIndex, "extra2_value")}
                          type={getType(row, rowIndex, "extra2")}
                          onEdit={(value) =>
                            handleCellEdit(rowIndex, "extra2_value", value)
                          }
                          onTypeToggle={() => toggleType(rowIndex, "extra2")}
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(rowIndex, "extra2_value")
                          }
                          onKeyDown={(e) =>
                            navigateCell(rowIndex, "extra2_value", e.key)
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "extra2_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "extra2_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <ExcelCell
                          value={getCellValue(
                            row,
                            rowIndex,
                            "company_margin_value",
                          )}
                          type={getType(row, rowIndex, "company_margin")}
                          onEdit={(value) =>
                            handleCellEdit(
                              rowIndex,
                              "company_margin_value",
                              value,
                            )
                          }
                          onTypeToggle={() =>
                            toggleType(rowIndex, "company_margin")
                          }
                          onBlur={handleCellBlur}
                          onDoubleClick={() =>
                            handleCellDoubleClick(
                              rowIndex,
                              "company_margin_value",
                            )
                          }
                          onKeyDown={(e) =>
                            navigateCell(
                              rowIndex,
                              "company_margin_value",
                              e.key,
                            )
                          }
                          isEditing={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "company_margin_value"
                          }
                          inputRef={
                            editingCell?.rowIndex === rowIndex &&
                            editingCell?.field === "company_margin_value"
                              ? inputRef
                              : null
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
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
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
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

// Excel-like Editable Cell Component
const ExcelCell = ({
  value,
  type,
  onEdit,
  placeholder,
  onTypeToggle,
  onBlur,
  onDoubleClick,
  onKeyDown,
  isEditing,
  inputRef,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const localRef = useRef(null);

  useEffect(() => {
    setInputValue(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && (inputRef || localRef)) {
      const refToUse = inputRef || localRef;
      if (refToUse && refToUse.current) {
        refToUse.current.focus();
        if (type === "date") {
          // Try to open the date picker if supported
          if (typeof refToUse.current.showPicker === "function") {
            refToUse.current.showPicker();
          }
        } else {
          refToUse.current.select && refToUse.current.select();
        }
      }
    }
  }, [isEditing, inputRef, type]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (type === "date") {
      onEdit(e.target.value);
      // Blur immediately to close calendar
      setTimeout(() => {
        if (inputRef && inputRef.current) inputRef.current.blur();
        if (localRef && localRef.current) localRef.current.blur();
      }, 50);
    }
  };

  const handleKeyDown = (e) => {
    if (type === "date") {
      if (e.key === "Escape") {
        e.preventDefault();
        setInputValue(value);
        onBlur();
      }
      // Prevent Enter from submitting form
      if (e.key === "Enter") {
        e.preventDefault();
        onBlur();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue(value);
      onBlur();
    } else if (
      ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)
    ) {
      e.preventDefault();
      handleSave();
      onKeyDown(e);
    } else {
      onKeyDown(e);
    }
  };

  const handleSave = () => {
    if (type === "date") {
      onBlur();
      return;
    }
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onEdit(numValue);
    }
    onBlur();
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onTypeToggle();
    setTimeout(() => {
      const refToUse = inputRef || localRef;
      if (refToUse && refToUse.current) {
        refToUse.current.focus();
      }
    }, 10);
  };

  if (isEditing) {
    if (type === "date") {
      return (
        <input
          ref={(node) => {
            if (inputRef) inputRef.current = node;
            localRef.current = node;
          }}
          type="date"
          value={inputValue || ""}
          onChange={handleChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-32 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      );
    }
    if (type === "text") {
      return (
        <input
          ref={(node) => {
            if (inputRef) {
              inputRef.current = node;
            }
            localRef.current = node;
          }}
          type="text"
          value={inputValue || ""}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            onEdit(inputValue);
            onBlur();
          }}
          onKeyDown={handleKeyDown}
          className="w-32 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      );
    }
    return (
      <div className="flex items-center gap-1">
        <input
          ref={(node) => {
            if (inputRef) {
              inputRef.current = node;
            }
            localRef.current = node;
          }}
          type="number"
          step="0.01"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-24 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {onTypeToggle && (
          <button
            onClick={handleToggleClick}
            onMouseDown={(e) => e.preventDefault()}
            className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1 transition-colors min-w-[32px] justify-center border border-gray-300"
            title={
              type === "percent" ? "Switch to rupees" : "Switch to percentage"
            }
            type="button"
          >
            {type === "percent" ? <Percent className="h-3 w-3" /> : "₹"}
          </button>
        )}
      </div>
    );
  }

  // Helper function to get display value with placeholder
  const getDisplayValue = () => {
    // Check if value exists and is not empty
    const hasValue = value !== undefined && value !== null && value !== "";

    if (hasValue) {
      if (type === "percent") {
        return `${Number(value).toFixed(2)}%`;
      } else if (type === "rupees") {
        return `₹${Number(value).toFixed(2)}`;
      } else if (type === "date") {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
          }
          return value;
        } catch {
          return value;
        }
      } else if (type === "text") {
        return value;
      } else if (!isNaN(Number(value))) {
        return Number(value).toString();
      }
    }

    // Return placeholder for empty values
    if (placeholder) {
      return <span className="text-gray-400 italic">{placeholder}</span>;
    }
    return "";
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      className="cursor-pointer px-2 py-1 hover:bg-blue-50 rounded min-w-[100px] flex items-center justify-between gap-2 transition-colors"
    >
      <span className="text-sm font-medium">{getDisplayValue()}</span>
      {onTypeToggle && (type === 'percent' || type === 'rupees') && (
      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
        {type === 'percent' ? '%' : '₹'}
      </span>
    )}
    </div>
  );
};

export default ProductPricing;
