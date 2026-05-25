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
  Plus,
  Trash2,
  Edit,
  X,
  Percent,
  Package,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";
import { toast } from "react-hot-toast";
import { useSidebar } from "../context/SidebarContext";

// Constants for column widths
const COLUMN_WIDTHS = {
  COMBO_NAME: 100,
  PAID_ITEMS: 100,
  FREE_ITEMS: 200,
  CHARGES: 180,
  COST_BREAKDOWN: 280,
};

const STICKY_POSITIONS = {
  COMBO_NAME: 0,
  PAID_ITEMS: COLUMN_WIDTHS.COMBO_NAME,
  FREE_ITEMS: COLUMN_WIDTHS.COMBO_NAME + COLUMN_WIDTHS.PAID_ITEMS,
};

// Define editable fields for the combo table
const EDITABLE_FIELDS = [
  {
    key: "manual_combo_price",
    group: "costBreakdown",
    label: "Manual Price",
    type: "currency",
  },
  {
    key: "parking_charge_value",
    group: "charges",
    label: "Packing",
    type: "currency_percentage",
  },
  {
    key: "transportation_charge_value",
    group: "charges",
    label: "Extra 1",
    type: "currency_percentage",
  },
  {
    key: "handling_charge_value",
    group: "charges",
    label: "Handling",
    type: "currency_percentage",
  },
  {
    key: "delivery_charge_value",
    group: "charges",
    label: "Delivery",
    type: "currency_percentage",
  },
  {
    key: "extra_charge_value",
    group: "charges",
    label: "Extra",
    type: "currency_percentage",
  },
];

const GROUP_CONFIG = {
  charges: {
    fields: [
      "parking_charge_value",
      "transportation_charge_value",
      "handling_charge_value",
      "delivery_charge_value",
      "extra_charge_value",
    ],
    position: STICKY_POSITIONS.CHARGES,
    label: "Charges",
    width: COLUMN_WIDTHS.CHARGES,
  },
  costBreakdown: {
    fields: ["manual_combo_price"],
    position: STICKY_POSITIONS.COST_BREAKDOWN,
    label: "Cost Breakdown",
    width: COLUMN_WIDTHS.COST_BREAKDOWN,
  },
};

// ExcelCell component - defined outside ProductCombinations
const ExcelCell = ({
  value,
  type = "text",
  currentType = "rupees",
  onEdit,
  onTypeToggle,
  onBlur,
  onDoubleClick,
  onKeyDown,
  isEditing,
  inputRef: externalRef,
  placeholder,
  hasError,
  errorMessage,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [focusOnToggle, setFocusOnToggle] = useState(false);
  const localRef = useRef(null);
  const toggleRef = useRef(null);
  const hasSavedRef = useRef(false);
  // Add this with your other state declarations;

  const saveCurrentValue = useCallback(() => {
    if (hasSavedRef.current) return;

    if (type === "text") {
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
  }, [inputValue, type, onEdit]);

  const handleChange = useCallback((e) => {
    setInputValue(e.target.value);
    hasSavedRef.current = false;
  }, []);

  // Handle keyboard navigation for charge fields

  const handleKeyDown = useCallback(
    (e) => {
      if (!focusOnToggle) {
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "ArrowUp" || e.key === "ArrowDown")
        ) {
          e.preventDefault();
          if (onTypeToggle) {
            onTypeToggle();
            setTimeout(() => {
              const refToUse = externalRef || localRef;
              if (refToUse?.current) refToUse.current.focus();
            }, 10);
          }
          return;
        }

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
      externalRef,
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
          const refToUse = externalRef || localRef;
          if (refToUse?.current) refToUse.current.focus();
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
    [onTypeToggle, saveCurrentValue, onBlur, onKeyDown, externalRef, value],
  );

  const handleToggleClick = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      onTypeToggle();
      setTimeout(() => {
        if (toggleRef.current) toggleRef.current.focus();
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
        if (currentType === "percent") return `${Number(value).toFixed(2)}%`;
        return `₹${Number(value).toFixed(2)}`;
      default:
        return value;
    }
  }, [value, type, currentType, placeholder]);

  // Reset input value when editing starts
  useEffect(() => {
    if (isEditing) {
      setInputValue(value);
      hasSavedRef.current = false;
    }
  }, [isEditing, value]);

  // Focus when editing starts
  useEffect(() => {
    if (isEditing) {
      const refToUse = externalRef || localRef;
      setTimeout(() => {
        if (refToUse?.current) {
          refToUse.current.focus();
          refToUse.current.select();
        }
      }, 10);
    }
  }, [isEditing, externalRef]);

  if (!isEditing) {
    return (
      <div
        onDoubleClick={onDoubleClick}
        className={`cursor-pointer px-2 py-1 rounded min-w-[100px] flex items-center justify-between gap-2 ${hasError ? "bg-red-50" : "hover:bg-blue-50"}`}
        style={{ minHeight: "34px", height: "34px", transition: "none" }}
      >
        <span
          className={`text-sm font-medium truncate ${hasError ? "text-red-600" : "text-gray-900"}`}
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
      style={{ minHeight: "34px", height: "34px", width: "100%" }}
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
        {type === "text" ? (
          <input
            ref={(node) => {
              if (externalRef) externalRef.current = node;
              localRef.current = node;
            }}
            type="text"
            value={inputValue || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`px-2 py-1 rounded focus:outline-none focus:ring-2 text-sm ${hasError ? "border-red-500 focus:ring-red-500" : "border-blue-500 focus:ring-blue-500"}`}
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
                if (externalRef) externalRef.current = node;
                localRef.current = node;
              }}
              type="number"
              step="0.01"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`px-2 py-1 rounded focus:outline-none focus:ring-2 text-sm ${hasError ? "border-red-500 focus:ring-red-500" : "border-blue-500 focus:ring-blue-500"}`}
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
                style={{ height: "30px", minWidth: "32px", width: "32px" }}
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
};

ExcelCell.displayName = "ExcelCell";

// Inline editable charge input for Cost Breakdown
const CostBreakdownChargeInput = ({
  chargeKey,
  value,
  typeValue,
  onChange,
  onTypeToggle,
  displayValue,
  onKeyDown,
  onBlur,
  isEditing: externalIsEditing,
  onEditStart,
  onEditEnd,
}) => {
  const [editing, setEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const inputRef = React.useRef(null);
  const buttonRef = React.useRef(null);

  const labelMap = {
    parking: "Packing",
    transportation: "Transport",
    handling: "Handling",
    delivery: "Delivery",
    extra: "Extra",
  };

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue !== value) {
      onChange(numValue);
    } else if (isNaN(numValue) && inputValue !== value) {
      onChange(0);
    }
    if (onEditEnd) onEditEnd();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      setEditing(false);
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue) && numValue !== value) {
        onChange(numValue);
      } else if (isNaN(numValue)) {
        onChange(0);
      }
      if (onKeyDown) {
        setTimeout(() => onKeyDown(e, chargeKey), 10);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
      setInputValue(value);
    } else if (
      e.key === "ArrowRight" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown"
    ) {
      e.preventDefault();
      e.stopPropagation();
      setEditing(false);
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue) && numValue !== value) {
        onChange(numValue);
      } else if (isNaN(numValue)) {
        onChange(0);
      }
      if (onKeyDown) {
        setTimeout(() => onKeyDown(e, chargeKey), 10);
      }
    } else if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "ArrowUp" || e.key === "ArrowDown")
    ) {
      e.preventDefault();
      e.stopPropagation();
      onTypeToggle();
      // Keep focus on input after toggle
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 10);
    }
  };

  const handleTypeToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onTypeToggle();
    // Keep focus on input after toggle if editing
    if (editing) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 10);
    }
  };

  const handleDoubleClick = () => {
    setEditing(true);
    if (onEditStart) onEditStart(chargeKey);
  };

  const getDisplayLabel = () => {
    return (
      labelMap[chargeKey] ||
      chargeKey.charAt(0).toUpperCase() + chargeKey.slice(1)
    );
  };

  const formatValue = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return typeValue === "percent" ? "0%" : "₹0";
    return typeValue === "percent" ? `${numValue}%` : `₹${numValue}`;
  };

  const formatDisplayValue = () => {
    if (displayValue !== undefined && displayValue !== null) {
      return `₹${parseFloat(displayValue).toFixed(2)}`;
    }
    return "₹0.00";
  };

  // If externally controlled editing mode
  if (externalIsEditing !== undefined) {
    if (externalIsEditing && !editing) {
      setEditing(true);
    } else if (!externalIsEditing && editing) {
      setEditing(false);
    }
  }

  return (
    <div
      className="flex justify-between items-center text-xs text-gray-500 group cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        // Allow toggling without entering edit mode first
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "ArrowUp" || e.key === "ArrowDown")
        ) {
          e.preventDefault();
          e.stopPropagation();
          onTypeToggle();
        }
      }}
    >
      <span className="text-gray-600">{getDisplayLabel()}:</span>
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-16 px-1 py-0.5 border border-blue-400 rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              style={{ minWidth: 50 }}
            />
            <button
              type="button"
              ref={buttonRef}
              onClick={handleTypeToggle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTypeToggle(e);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  if (inputRef.current) inputRef.current.focus();
                }
              }}
              className="ml-1 px-1 py-0.5 border rounded text-xs bg-gray-100 hover:bg-gray-200"
              tabIndex={-1}
            >
              {typeValue === "percent" ? "%" : "₹"}
            </button>
          </>
        ) : (
          <>
            <span className="font-semibold text-gray-700">{formatValue()}</span>
            <span className="text-gray-400 text-[10px]">
              {typeValue === "percent" ? "(of net)" : "(fixed)"}
            </span>
            <span className="ml-1 text-blue-600 font-bold">
              {formatDisplayValue()}
            </span>
            <button
              type="button"
              onClick={handleTypeToggle}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTypeToggle(e);
                }
              }}
              className="ml-1 px-1 py-0.5 border rounded text-[10px] bg-gray-100 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
              tabIndex={-1}
            >
              {typeValue === "percent" ? "₹" : "%"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Searchable Product Dropdown Component
const SearchableProductDropdown = ({
  value,
  onChange,
  products,
  placeholder = "Select Product",
  className = "w-36",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Find selected product
  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(value));
  }, [value, products]);

  // Filter products by title or SKU
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const query = search.toLowerCase();
    return products.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      return title.includes(query) || sku.includes(query);
    });
  }, [search, products]);

  // Update fixed position of the dropdown menu
  const updateCoords = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 288; // w-72 is 288px
      let left = rect.left;

      // Auto-align left/right to prevent screen overflow
      if (left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, rect.right - dropdownWidth);
      }

      // Auto-align top/bottom to prevent screen overflow
      const dropdownHeight = 300; // estimated max height
      let top = rect.bottom;
      if (
        top + dropdownHeight > window.innerHeight &&
        rect.top - dropdownHeight > 0
      ) {
        top = rect.top - dropdownHeight;
      }

      setCoords({ top, left });
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [isOpen, updateCoords]);

  // Clear search on close
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (productId) => {
    onChange({ target: { value: productId } });
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-1.5 py-1 border rounded text-xs bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[28px] text-left cursor-pointer transition-colors"
      >
        <span className="truncate">
          {selectedProduct
            ? `${selectedProduct.title} (${selectedProduct.sku})`
            : placeholder}
        </span>
        <span className="ml-1 text-gray-400 flex-shrink-0">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Hidden input for native HTML5 form validation if required */}
      {required && (
        <input
          type="text"
          value={value || ""}
          required
          tabIndex={-1}
          className="absolute opacity-0 pointer-events-none"
          style={{ width: "100%", height: "1px", bottom: 0, left: 0 }}
          onChange={() => { }}
        />
      )}

      {/* Dropdown Menu - rendered with position: fixed to float above overflow-hidden containers */}
      {isOpen && (
        <div
          className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999] border border-gray-200"
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: "288px",
          }}
        >
          <div className="p-2 border-b bg-gray-50 rounded-t-md">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full pl-7 pr-7 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1 text-xs">
            {filteredProducts.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 text-center">
                No products found
              </li>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = String(p.id) === String(value);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(String(p.id))}
                      className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 focus:outline-none focus:bg-blue-50 flex flex-col transition-colors ${isSelected
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "text-gray-700"
                        }`}
                    >
                      <span className="font-medium truncate">{p.title}</span>
                      <span className="text-[10px] text-gray-500 truncate">
                        SKU: {p.sku}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const ProductCombinations = () => {
  // State variables
  const [combinations, setCombinations] = useState([]);
  const [products, setProducts] = useState([]);
  const [productPricings, setProductPricings] = useState({});
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCombination, setEditingCombination] = useState(null);
  const [unitConversionMap, setUnitConversionMap] = useState({});

  // Table editing states
  const [editingCell, setEditingCell] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const inputRef = useRef(null);
  const tableContainerRef = useRef(null);

  // Filter states
  const [filterName, setFilterName] = useState("");
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

  const [filterFlavour, setFilterFlavour] = useState("");
  const [filterResidual, setFilterResidual] = useState("");
  const [filterBrandCategory1, setFilterBrandCategory1] = useState("");
  const [filterGST, setFilterGST] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterMinWeight, setFilterMinWeight] = useState("");
  const [filterMaxWeight, setFilterMaxWeight] = useState("");
  const [filterMinPackingWeight, setFilterMinPackingWeight] = useState("");
  const [filterMaxPackingWeight, setFilterMaxPackingWeight] = useState("");
  const [filterPriceType, setFilterPriceType] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [titleSuggestionIndex, setTitleSuggestionIndex] = useState(-1);
  const [showComboSuggestions, setShowComboSuggestions] = useState(false);
  const [comboSuggestionIndex, setComboSuggestionIndex] = useState(-1);
  const [showSkuSuggestions, setShowSkuSuggestions] = useState(false);
  const [skuSuggestionIndex, setSkuSuggestionIndex] = useState(-1);

  // Active filters state - only applied when user clicks Apply button
  const [activeFilters, setActiveFilters] = useState({
    filterName: "",
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

  // Queries for filters
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

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await axios.get("/api/categories/")).data,
  });

  const { data: categories1 } = useQuery({
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

  const { data: categories2 } = useQuery({
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

  const { data: categories3 } = useQuery({
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

  const { data: categories4 } = useQuery({
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
  const [editingChargeField, setEditingChargeField] = useState(null);
  // Handle keyboard navigation for charge fields
  const handleChargeKeyDown = useCallback((e, currentChargeKey) => {
    const chargeKeys = [
      "parking",
      "transportation",
      "handling",
      "delivery",
      "extra",
    ];
    const currentIndex = chargeKeys.indexOf(currentChargeKey);
    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = currentIndex + 1;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = currentIndex - 1;
        break;
      default:
        return;
    }

    if (nextIndex >= 0 && nextIndex < chargeKeys.length) {
      e.preventDefault();
      setEditingChargeField(chargeKeys[nextIndex]);
    }
  }, []);

  // Form state for create/edit modal
  const [formData, setFormData] = useState({
    name: "",
    combo_weight: "",
    curriar_purchase_point: "",
    curriar_dispatch_point: "",
    description: "",
    is_active: true,
    items: [],
    rewards: [],
    gifts: [],
    parking_charge_type: "rupees",
    parking_charge_value: 0,
    transportation_charge_type: "rupees",
    transportation_charge_value: 0,
    handling_charge_type: "rupees",
    handling_charge_value: 0,
    delivery_charge_type: "rupees",
    delivery_charge_value: 0,
    extra_charge_type: "rupees",
    extra_charge_value: 0,
    manual_combo_price: "",
  });

  const { isOpen } = useSidebar();

  // Fetch data on mount
  useEffect(() => {
    fetchCombinations();
    fetchProducts();
    fetchProductPricings();
    fetchUnits();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.role === "Admin");
  };

  const fetchCombinations = async () => {
    try {
      const response = await axios.get("/api/productcombinations/");
      setCombinations(response.data);
    } catch (error) {
      console.error("Error fetching combinations:", error);
      toast.error("Failed to fetch combinations");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await axios.get("/api/units/");
      console.log("Units fetched:", response.data);
      // Store units with their conversion factors
      setUnits(response.data);
      // Also create a mapping for quick conversion
      const unitConversionMap = {};
      response.data.forEach((unit) => {
        unitConversionMap[unit.id] = {
          name: unit.name,
          conversion_to_kg: parseFloat(unit.conversion_to_kg) || 1,
          conversion_to_g: parseFloat(unit.conversion_to_kg) * 1000 || 1000,
        };
      });
      setUnitConversionMap(unitConversionMap);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  // Helper function to get unit name from unit ID
  const getUnitName = useCallback(
    (unitId) => {
      if (!unitId || !units || units.length === 0) return "kg";
      const unit = units.find((u) => u.id === unitId);
      return unit?.name || "kg";
    },
    [units],
  );

  // Dynamic weight conversion function
  // Dynamic weight conversion function using conversion_to_kg from database
  const convertWeightToUnit = useCallback(
    (weight, fromUnitId, toUnitId = null) => {
      const weightNum = parseFloat(weight) || 0;
      if (!fromUnitId || weightNum === 0) return 0;

      // Find source unit - ensure ID comparison works with both number and string
      const fromUnit = units.find((u) => Number(u.id) === Number(fromUnitId));
      if (!fromUnit) {
        console.warn(`Unit not found for ID: ${fromUnitId}`);
        return weightNum;
      }

      // Get conversion factor from database (handle Decimal from backend)
      const fromConversion = parseFloat(fromUnit.conversion_to_kg) || 1;

      // Convert to kg
      const weightInKg = weightNum * fromConversion;

      // If no target unit specified, return weight in kg
      if (!toUnitId) {
        return weightInKg;
      }

      // Find target unit
      const toUnit = units.find((u) => Number(u.id) === Number(toUnitId));
      if (!toUnit) {
        console.warn(`Target unit not found for ID: ${toUnitId}`);
        return weightInKg;
      }

      // Get target conversion factor
      const toConversion = parseFloat(toUnit.conversion_to_kg) || 1;

      // If target conversion is 0 (for non-weight units like dozen), return 0
      if (toConversion === 0) return 0;

      // Convert from kg to target unit
      return weightInKg / toConversion;
    },
    [units],
  );

  const fetchProductPricings = async () => {
    try {
      const response = await axios.get("/api/productpricings/");
      const pricingsMap = {};
      response.data.forEach((pricing) => {
        pricingsMap[pricing.product] = pricing;
      });
      setProductPricings(pricingsMap);
    } catch (error) {
      console.error("Error fetching product pricings:", error);
    }
  };

  // Searchable Select Component for Products
  const SearchableSelect = ({
    value,
    onChange,
    products,
    placeholder = "Select Product",
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const filteredProducts = products.filter(
      (product) =>
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const selectedProduct = products.find((p) => p.id === parseInt(value));

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (productId) => {
      onChange(productId.toString());
      setIsOpen(false);
      setSearchTerm("");
    };

    return (
      <div className="relative" ref={dropdownRef} style={{ minWidth: "200px" }}>
        <div
          className="w-full px-1.5 py-1 border rounded text-xs cursor-pointer flex justify-between items-center bg-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedProduct ? "text-gray-900" : "text-gray-400"}>
            {selectedProduct
              ? `${selectedProduct.title} (${selectedProduct.sku})`
              : placeholder}
          </span>
          <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white p-1 border-b">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div>
              {filteredProducts.length === 0 ? (
                <div className="px-2 py-2 text-xs text-gray-500 text-center">
                  No products found
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="px-2 py-1.5 hover:bg-blue-50 cursor-pointer text-xs border-b last:border-b-0"
                    onClick={() => handleSelect(product.id)}
                  >
                    <div className="font-medium">{product.title}</div>
                    <div className="text-gray-500 text-[10px]">
                      SKU: {product.sku}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const calculateCharge = (baseAmount, chargeType, chargeValue) => {
    if (!chargeValue || chargeValue === 0) return 0;
    const base = formatNumber(baseAmount);
    const value = formatNumber(chargeValue);
    if (chargeType === "percent") {
      return (base * value) / 100;
    } else {
      return value;
    }
  };

  const calculateChargesBreakdown = (
    baseAmount,
    combination,
    editedVals = {},
  ) => {
    const getValue = (field) => {
      const key = `${combination.id || combination.name}_${field}`;
      if (editedVals[key] !== undefined) return editedVals[key];
      return combination[field] || 0;
    };
    const getType = (fieldType) => {
      const key = `${combination.id || combination.name}_${fieldType}_type`;
      if (editedVals[key] !== undefined) return editedVals[key];
      return combination[`${fieldType}_type`] || "rupees";
    };

    const parking = calculateCharge(
      baseAmount,
      getType("parking_charge"),
      getValue("parking_charge_value"),
    );
    const transportation = calculateCharge(
      baseAmount,
      getType("transportation_charge"),
      getValue("transportation_charge_value"),
    );
    const handling = calculateCharge(
      baseAmount,
      getType("handling_charge"),
      getValue("handling_charge_value"),
    );
    const delivery = calculateCharge(
      baseAmount,
      getType("delivery_charge"),
      getValue("delivery_charge_value"),
    );
    const extra = calculateCharge(
      baseAmount,
      getType("extra_charge"),
      getValue("extra_charge_value"),
    );

    return {
      parking,
      transportation,
      handling,
      delivery,
      extra,
      totalCharges: parking + transportation + handling + delivery + extra,
    };
  };

  const calculateComboTotal = (items, rewards, gifts) => {
    let totalItemsValue = 0;
    let totalRewardsValue = 0;
    let totalGiftsValue = 0;
    let totalMRP = 0;
    let totalSaleRate = 0;
    let totalLandingRate = 0;
    let totalCalculatedRate = 0;

    items.forEach((item) => {
      const product = products.find((p) => p.id === parseInt(item.product));
      if (product) {
        const pricing = productPricings[product.id];
        const saleRate =
          formatNumber(pricing?.sale_rate) || formatNumber(product.price);
        const itemSaleTotal = saleRate * formatNumber(item.quantity_required);
        totalItemsValue += itemSaleTotal;

        totalMRP +=
          (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) *
          formatNumber(item.quantity_required);
        totalSaleRate += saleRate * formatNumber(item.quantity_required);
        totalLandingRate +=
          (formatNumber(pricing?.landing_rate) || 0) *
          formatNumber(item.quantity_required);
        totalCalculatedRate +=
          (formatNumber(pricing?.calculated_rate) ||
            formatNumber(product.price)) * formatNumber(item.quantity_required);
      }
    });

    rewards.forEach((reward) => {
      const product = products.find((p) => p.id === parseInt(reward.product));
      if (product) {
        const pricing = productPricings[product.id];
        const productValue =
          formatNumber(pricing?.sale_rate) || formatNumber(product.price);
        totalRewardsValue += productValue * formatNumber(reward.quantity_free);

        totalMRP +=
          (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) *
          formatNumber(reward.quantity_free);
        totalSaleRate += productValue * formatNumber(reward.quantity_free);
        totalLandingRate +=
          (formatNumber(pricing?.landing_rate) || 0) *
          formatNumber(reward.quantity_free);
        totalCalculatedRate +=
          (formatNumber(pricing?.calculated_rate) ||
            formatNumber(product.price)) * formatNumber(reward.quantity_free);
      }
    });

    gifts.forEach((gift) => {
      const product = products.find((p) => p.id === parseInt(gift.product));
      if (product) {
        const pricing = productPricings[product.id];
        const productValue =
          formatNumber(pricing?.sale_rate) || formatNumber(product.price);
        totalGiftsValue += productValue * (formatNumber(gift.quantity) || 1);

        totalMRP +=
          (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) *
          (formatNumber(gift.quantity) || 1);
        totalSaleRate += productValue * (formatNumber(gift.quantity) || 1);
        totalLandingRate +=
          (formatNumber(pricing?.landing_rate) || 0) *
          (formatNumber(gift.quantity) || 1);
        totalCalculatedRate +=
          (formatNumber(pricing?.calculated_rate) ||
            formatNumber(product.price)) * (formatNumber(gift.quantity) || 1);
      }
    });

    return {
      totalCost: totalItemsValue,
      rewardValue: totalRewardsValue,
      giftValue: totalGiftsValue,
      netCost: totalItemsValue,
      totalMRP: totalMRP,
      totalSaleRate: totalSaleRate,
      totalLandingRate: totalLandingRate,
      totalCalculatedRate: totalCalculatedRate,
    };
  };

  // Get combo calculations for display
  const getComboCalculations = useCallback(
    (combination, editedVals = {}) => {
      const comboTotal = calculateComboTotal(
        combination.items || [],
        combination.rewards || [],
        combination.gifts || [],
      );

      const baseCost = comboTotal.totalLandingRate;

      const chargesBreakdown = calculateChargesBreakdown(
        baseCost,
        combination,
        editedVals,
      );
      const calculatedPriceWithCharges =
        baseCost + chargesBreakdown.totalCharges;

      const getManualPrice = () => {
        const key = `${combination.id || combination.name}_manual_combo_price`;
        if (editedVals[key] !== undefined) return editedVals[key];
        return combination.manual_combo_price || 0;
      };
      const manualPrice = formatNumber(getManualPrice());
      
      const sellingPrice = manualPrice > 0 ? manualPrice : calculatedPriceWithCharges;
      const profitAmount = sellingPrice - baseCost;
      const profitMargin =
        baseCost > 0
          ? (profitAmount / baseCost) * 100
          : 0;

      return {
        netCost: baseCost,
        calculatedPriceWithCharges,
        manualPrice,
        profitMargin,
        profitAmount,
        totalMRP: comboTotal.totalMRP,
        totalSaleRate: comboTotal.totalSaleRate,
        totalLandingRate: comboTotal.totalLandingRate,
        totalCalculatedRate: comboTotal.totalCalculatedRate,
        charges: chargesBreakdown,
      };
    },
    [products, productPricings],
  );

  const getFormCalculations = useCallback(() => {
    // Calculate total landing rate for purchase items
    let totalLandingRate = 0;

    // Calculate purchase items total landing rate
    formData.items.forEach((item) => {
      const product = products.find((p) => p.id === parseInt(item.product));
      if (product) {
        const pricing = productPricings[product.id];
        const landingRate = formatNumber(
          pricing?.landing_rate ?? product?.landing_rate ?? 0,
        );
        const quantity = formatNumber(item.quantity_required);
        totalLandingRate += landingRate * quantity;
      }
    });

    // Calculate rewards and gifts values
    let totalMRP = 0;
    let totalSaleRate = 0;
    let totalLandingRateAll = 0;
    let totalCalculatedRate = 0;

    // Calculate rewards
    formData.rewards.forEach((reward) => {
      const product = products.find((p) => p.id === parseInt(reward.product));
      if (product) {
        const pricing = productPricings[product.id];
        const saleRate =
          formatNumber(pricing?.sale_rate) || formatNumber(product.price);
        const landingRate = formatNumber(pricing?.landing_rate) || 0;

        totalMRP +=
          (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) *
          formatNumber(reward.quantity_free);
        totalSaleRate += saleRate * formatNumber(reward.quantity_free);
        totalLandingRateAll += landingRate * formatNumber(reward.quantity_free);
        totalCalculatedRate +=
          (formatNumber(pricing?.calculated_rate) ||
            formatNumber(product.price)) * formatNumber(reward.quantity_free);
      }
    });

    // Calculate gifts
    formData.gifts.forEach((gift) => {
      const product = products.find((p) => p.id === parseInt(gift.product));
      if (product) {
        const pricing = productPricings[product.id];
        const saleRate =
          formatNumber(pricing?.sale_rate) || formatNumber(product.price);
        const landingRate = formatNumber(pricing?.landing_rate) || 0;

        totalMRP +=
          (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) *
          (formatNumber(gift.quantity) || 1);
        totalSaleRate += saleRate * (formatNumber(gift.quantity) || 1);
        totalLandingRateAll += landingRate * (formatNumber(gift.quantity) || 1);
        totalCalculatedRate +=
          (formatNumber(pricing?.calculated_rate) ||
            formatNumber(product.price)) * (formatNumber(gift.quantity) || 1);
      }
    });

    // Calculate purchase items for MRP, Sale Rate, etc.
    formData.items.forEach((item) => {
      const product = products.find((p) => p.id === parseInt(item.product));
      if (product) {
        const pricing = productPricings[product.id];
        const saleRate =
          formatNumber(pricing?.sale_rate) || formatNumber(product.price);
        const landingRate = formatNumber(pricing?.landing_rate) || 0;

        totalMRP +=
          (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) *
          formatNumber(item.quantity_required);
        totalSaleRate += saleRate * formatNumber(item.quantity_required);
        totalLandingRateAll +=
          landingRate * formatNumber(item.quantity_required);
        totalCalculatedRate +=
          (formatNumber(pricing?.calculated_rate) ||
            formatNumber(product.price)) * formatNumber(item.quantity_required);
      }
    });

    // Calculate charges using the Grand Total Landing Rate of all items as base!
    const parkingCharge = calculateCharge(
      totalLandingRateAll,
      formData.parking_charge_type,
      formData.parking_charge_value,
    );
    const transportationCharge = calculateCharge(
      totalLandingRateAll,
      formData.transportation_charge_type,
      formData.transportation_charge_value,
    );
    const handlingCharge = calculateCharge(
      totalLandingRateAll,
      formData.handling_charge_type,
      formData.handling_charge_value,
    );
    const deliveryCharge = calculateCharge(
      totalLandingRateAll,
      formData.delivery_charge_type,
      formData.delivery_charge_value,
    );
    const extraCharge = calculateCharge(
      totalLandingRateAll,
      formData.extra_charge_type,
      formData.extra_charge_value,
    );

    const totalCharges =
      parkingCharge +
      transportationCharge +
      handlingCharge +
      deliveryCharge +
      extraCharge;
    const calculatedPriceWithCharges = totalLandingRateAll + totalCharges;
    const manualPrice = parseFloat(formData.manual_combo_price) || 0;

    // Determine which price to use for profit calculation
    const sellingPrice =
      manualPrice > 0 ? manualPrice : calculatedPriceWithCharges;

    // Calculate profit based on Grand Total Landing Rate vs Selling Price
    const profitAmount = sellingPrice - totalLandingRateAll;
    const profitMargin =
      totalLandingRateAll > 0 ? (profitAmount / totalLandingRateAll) * 100 : 0;

    return {
      netCost: totalLandingRateAll,
      calculatedPriceWithCharges,
      manualPrice,
      sellingPrice, // The price used for profit calculation
      profitMargin,
      profitAmount,
      totalMRP: totalMRP,
      totalSaleRate: totalSaleRate,
      totalLandingRate: totalLandingRateAll,
      totalCalculatedRate: totalCalculatedRate,
      charges: {
        parking: parkingCharge,
        transportation: transportationCharge,
        handling: handlingCharge,
        delivery: deliveryCharge,
        extra: extraCharge,
        totalCharges: totalCharges,
      },
    };
  }, [formData, products, productPricings]);

  // Filter combinations
  const filteredData = useMemo(() => {
    if (!combinations) return [];
    const {
      filterName: activeName,
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
      filterPriceType: activePriceType,
      filterMinPrice: activeMinPrice,
      filterMaxPrice: activeMaxPrice,
    } = activeFilters;

    // Helper function to check if a specific product ID matches the product filters
    const checkProductMatch = (productId) => {
      if (!productId) return false;
      const product = products.find((p) => p.id === parseInt(productId));
      if (!product) return false;

      // SKU matches
      const skuMatch =
        !activeSKU || product.sku?.toLowerCase().includes(activeSKU.toLowerCase());
      // Title matches
      const titleMatch =
        !activeTitle || product.title?.toLowerCase().includes(activeTitle.toLowerCase());
      // HSN matches
      const hsnMatch =
        !activeHSN || product.hsn?.toLowerCase().includes(activeHSN.toLowerCase());

      // Category matches
      const categoryMatch =
        !activeCategory || (product.category_display || product.category?.name)?.toString() === activeCategory;
      const category1Match =
        !activeCategory1 || (product.category1_display || product.category1?.name)?.toString() === activeCategory1;
      const category2Match =
        !activeCategory2 || (product.category2_display || product.category2?.name)?.toString() === activeCategory2;
      const category3Match =
        !activeCategory3 || (product.category3_display || product.category3?.name)?.toString() === activeCategory3;
      const category4Match =
        !activeCategory4 || (product.category4_display || product.category4?.name)?.toString() === activeCategory4;

      // Brand matches
      const brandMatch =
        !activeBrand || (product.brand_display || product.brand?.name)?.toString() === activeBrand;
      const brandCategoryMatch =
        !activeBrandCategory || (product.brand_category_display || product.brand_category?.name)?.toString() === activeBrandCategory;

      // Flavour, Residual, Brand Category 1 matches
      let flavourName = "";
      if (product.flavour) {
        if (typeof product.flavour === "object") flavourName = product.flavour.name || "";
        else flavourName = String(product.flavour);
      }
      const flavourMatch = !activeFlavour || flavourName === activeFlavour;

      let residualName = "";
      if (product.residual) {
        if (typeof product.residual === "object") residualName = product.residual.name || "";
        else residualName = String(product.residual);
      }
      const residualMatch = !activeResidual || residualName === activeResidual;

      let brandCategory1Name = "";
      if (product.brand_category1) {
        if (typeof product.brand_category1 === "object") brandCategory1Name = product.brand_category1.name || "";
        else brandCategory1Name = String(product.brand_category1);
      }
      const brandCategory1Match = !activeBrandCategory1 || brandCategory1Name === activeBrandCategory1;

      // GST Rate match
      let gstRateId = "";
      if (product.gst_rate) {
        if (typeof product.gst_rate === "object") gstRateId = product.gst_rate.id?.toString() || "";
        else gstRateId = String(product.gst_rate);
      }
      const gstMatch = !activeGST || String(gstRateId) === String(activeGST);

      // Unit match
      let unitName = "";
      if (product.unit) {
        if (typeof product.unit === "object") unitName = product.unit.name || "";
        else unitName = String(product.unit);
      }
      const unitMatch = !activeUnit || unitName === activeUnit;

      // Weight matches
      const productWeight = parseFloat(product.product_weight) || 0;
      const minWeightMatch =
        !activeMinWeight || productWeight >= parseFloat(activeMinWeight);
      const maxWeightMatch =
        !activeMaxWeight || productWeight <= parseFloat(activeMaxWeight);

      const packingWeight = parseFloat(product.packing_weight) || 0;
      const minPackingWeightMatch =
        !activeMinPackingWeight || packingWeight >= parseFloat(activeMinPackingWeight);
      const maxPackingWeightMatch =
        !activeMaxPackingWeight || packingWeight <= parseFloat(activeMaxPackingWeight);

      return (
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
    };

    return combinations.filter((combo) => {
      // Basic combination name filters
      const nameMatch =
        !activeName ||
        combo.name?.toLowerCase().includes(activeName.toLowerCase());

      if (!nameMatch) return false;

      // Real-time spreadsheet pricing filter
      if (activePriceType) {
        const calcs = getComboCalculations(combo, editedValues);
        const priceVal = parseFloat(calcs[activePriceType]) || 0;

        if (activeMinPrice && priceVal < parseFloat(activeMinPrice)) {
          return false;
        }
        if (activeMaxPrice && priceVal > parseFloat(activeMaxPrice)) {
          return false;
        }
      }

      // If no product filters are active, return true immediately
      const hasProductFilters =
        activeSKU ||
        activeTitle ||
        activeHSN ||
        activeCategory ||
        activeCategory1 ||
        activeCategory2 ||
        activeCategory3 ||
        activeCategory4 ||
        activeBrand ||
        activeBrandCategory ||
        activeFlavour ||
        activeResidual ||
        activeBrandCategory1 ||
        activeGST ||
        activeUnit ||
        activeMinWeight ||
        activeMaxWeight ||
        activeMinPackingWeight ||
        activeMaxPackingWeight;

      if (!hasProductFilters) return true;

      // A combination matches product filters if ANY of its items, rewards, or gifts match
      const itemsMatch = combo.items?.some((item) => checkProductMatch(item.product));
      const rewardsMatch = combo.rewards?.some((reward) => checkProductMatch(reward.product));
      const giftsMatch = combo.gifts?.some((gift) => checkProductMatch(gift.product));

      return itemsMatch || rewardsMatch || giftsMatch;
    });
  }, [combinations, products, activeFilters, editedValues, getComboCalculations]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage);
  }, [filteredData, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const productTitleSuggestions = useMemo(() => {
    const searchText = filterTitle.trim().toLowerCase();
    if (!searchText || !products) return [];

    const seen = new Set();
    return products
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
  }, [filterTitle, products]);

  const comboNameSuggestions = useMemo(() => {
    const searchText = filterName.trim().toLowerCase();
    if (!searchText || !combinations) return [];

    const seen = new Set();
    return combinations
      .map((combo) => combo.name)
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(searchText))
      .filter((name) => {
        const normalized = name.toLowerCase();
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
  }, [filterName, combinations]);

  const productSkuSuggestions = useMemo(() => {
    const searchText = filterSKU.trim().toLowerCase();
    if (!searchText || !products) return [];

    const seen = new Set();
    return products
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
  }, [filterSKU, products]);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    setActiveFilters({
      filterName,
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
    toast.success("Filters applied");
  }, [
    filterName,
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

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilterName("");
    setFilterSKU("");
    setFilterTitle("");
    setSelectedCategoryId("");
    setShowComboSuggestions(false);
    setComboSuggestionIndex(-1);
    setShowTitleSuggestions(false);
    setTitleSuggestionIndex(-1);
    setShowSkuSuggestions(false);
    setSkuSuggestionIndex(-1);
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
      filterName: "",
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

  // Validate value
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
    return null;
  }, []);

  // Handle cell edit
  const handleCellEdit = useCallback(
    (row, field, value) => {
      const fieldConfig = EDITABLE_FIELDS.find((f) => f.key === field);
      const key = `${row.id || row.name}_${field}`;

      const error = validateValue(field, value, fieldConfig?.type);
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

      setEditedValues((prev) => ({ ...prev, [key]: value }));
    },
    [validateValue],
  );

  // Get cell value
  const getCellValue = useCallback(
    (row, field) => {
      const key = `${row.id || row.name}_${field}`;
      if (editedValues[key] !== undefined) return editedValues[key];
      return row[field] || 0;
    },
    [editedValues],
  );

  // Get charge type
  const getChargeType = useCallback(
    (row, fieldType) => {
      const key = `${row.id || row.name}_${fieldType}_type`;
      if (editedValues[key] !== undefined) return editedValues[key];
      return row[`${fieldType}_type`] || "rupees";
    },
    [editedValues],
  );

  // Toggle charge type
  const toggleChargeType = useCallback(
    (row, fieldType) => {
      const currentType = getChargeType(row, fieldType);
      const newType = currentType === "percent" ? "rupees" : "percent";
      const typeKey = `${row.id || row.name}_${fieldType}_type`;
      setEditedValues((prev) => ({ ...prev, [typeKey]: newType }));
    },
    [getChargeType],
  );

  // Navigate between cells
  const navigateCell = useCallback(
    (currentRowIndex, currentFieldKey, direction, totalRows) => {
      const navigableFields = EDITABLE_FIELDS;
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
    [],
  );

  const handleCellDoubleClick = useCallback((rowIndex, field) => {
    setEditingCell({ rowIndex, field });
  }, []);

  const handleCellBlur = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Save all changes
  const handleSaveAll = useCallback(async () => {
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    const updates = [];

    for (const row of paginatedData) {
      const updatedRow = { ...row };
      let hasChanges = false;

      // Check for value changes
      for (const field of EDITABLE_FIELDS) {
        const key = `${row.id || row.name}_${field.key}`;
        if (editedValues[key] !== undefined) {
          updatedRow[field.key] = editedValues[key];
          hasChanges = true;
        }
      }

      // Check for type changes
      const chargeFields = [
        "parking_charge",
        "transportation_charge",
        "handling_charge",
        "delivery_charge",
        "extra_charge",
      ];
      for (const chargeField of chargeFields) {
        const typeKey = `${row.id || row.name}_${chargeField}_type`;
        if (editedValues[typeKey] !== undefined) {
          updatedRow[`${chargeField}_type`] = editedValues[typeKey];
          hasChanges = true;
        }
      }

      if (hasChanges && row.id) {
        const dataToSend = {
          id: updatedRow.id,
          name: updatedRow.name,
          combo_weight: updatedRow.combo_weight,
          curriar_purchase_point: updatedRow.curriar_purchase_point,
          curriar_dispatch_point: updatedRow.curriar_dispatch_point,
          description: updatedRow.description,
          is_active: updatedRow.is_active,
          manual_combo_price: updatedRow.manual_combo_price || 0,
          parking_charge_type: updatedRow.parking_charge_type || "rupees",
          parking_charge_value: updatedRow.parking_charge_value || 0,
          transportation_charge_type:
            updatedRow.transportation_charge_type || "rupees",
          transportation_charge_value:
            updatedRow.transportation_charge_value || 0,
          handling_charge_type: updatedRow.handling_charge_type || "rupees",
          handling_charge_value: updatedRow.handling_charge_value || 0,
          delivery_charge_type: updatedRow.delivery_charge_type || "rupees",
          delivery_charge_value: updatedRow.delivery_charge_value || 0,
          extra_charge_type: updatedRow.extra_charge_type || "rupees",
          extra_charge_value: updatedRow.extra_charge_value || 0,
          items: updatedRow.items || [],
          rewards: updatedRow.rewards || [],
          gifts: updatedRow.gifts || [],
        };

        updates.push({ id: row.id, data: dataToSend });
      }
    }

    if (updates.length === 0) {
      toast("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const promises = updates.map(({ id, data }) =>
        axios.put(`/api/productcombinations/${id}/`, data),
      );
      await Promise.all(promises);
      toast.success("Changes saved successfully!");
      setEditedValues({});
      setEditingCell(null);
      setValidationErrors({});
      await fetchCombinations();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [paginatedData, editedValues, validationErrors, fetchCombinations]);

  // Render group cell
  const renderGroupCell = useCallback(
    (row, rowIndex, groupKey) => {
      const group = GROUP_CONFIG[groupKey];
      const isEvenRow = rowIndex % 2 === 0;
      const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-50";
      const calculations = getComboCalculations(row, editedValues);

      if (groupKey === "charges") {
        return (
          <td
            className={`px-2 py-1 ${rowBgClass} border border-gray-300`}
            style={{ minWidth: group.width }}
          >
            <div className="space-y-2">
              {group.fields.map((fieldKey) => {
                const fieldConfig = EDITABLE_FIELDS.find(
                  (f) => f.key === fieldKey,
                );
                const chargeType = fieldKey.replace("_value", "");
                const currentType = getChargeType(row, chargeType);
                const isEditing =
                  editingCell?.rowIndex === rowIndex &&
                  editingCell?.field === fieldKey;
                const errorKey = `${row.id || row.name}_${fieldKey}`;
                const hasError = validationErrors[errorKey];

                return (
                  <div
                    key={fieldKey}
                    className="flex justify-between items-center"
                  >
                    <span className="text-xs text-gray-600">
                      {fieldConfig?.label}:
                    </span>
                    <div className="w-32">
                      <ExcelCell
                        value={getCellValue(row, fieldKey)}
                        type="currency_percentage"
                        currentType={currentType}
                        onEdit={(value) => handleCellEdit(row, fieldKey, value)}
                        onTypeToggle={() => toggleChargeType(row, chargeType)}
                        onBlur={handleCellBlur}
                        onDoubleClick={() =>
                          handleCellDoubleClick(rowIndex, fieldKey)
                        }
                        onKeyDown={(e) =>
                          navigateCell(
                            rowIndex,
                            fieldKey,
                            e.key,
                            paginatedData.length,
                          )
                        }
                        isEditing={isEditing}
                        inputRef={isEditing ? inputRef : null}
                        placeholder="0"
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
      }

      if (groupKey === "costBreakdown") {
        return (
          <td
            className={`px-4 py-2 ${rowBgClass} border border-gray-300`}
            style={{ minWidth: group.width }}
          >
            <div className="space-y-3">
              {/* Calculated Price */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Calculated Price:
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  ₹{calculations.calculatedPriceWithCharges.toFixed(2)}
                </span>
              </div>

              {/* MRP */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">MRP:</span>
                <span className="text-sm">
                  ₹{calculations.totalMRP.toFixed(2)}
                </span>
              </div>

              {/* Sale Rate */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Sale Rate:
                </span>
                <span className="text-sm">
                  ₹{calculations.totalSaleRate.toFixed(2)}
                </span>
              </div>

              {/* Landing Rate */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Landing Rate:
                </span>
                <span className="text-sm">
                  ₹{calculations.totalLandingRate.toFixed(2)}
                </span>
              </div>

              {/* Calculated Rate */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Calculated Rate:
                </span>
                <span className="text-sm">
                  ₹{calculations.totalCalculatedRate.toFixed(2)}
                </span>
              </div>

              {/* Suggested Rate */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Suggested Rate:
                </span>
                <span className="text-sm font-semibold text-purple-600">
                  ₹{calculations.totalSaleRate.toFixed(2)}
                </span>
              </div>

              {/* Manual Price (Editable) */}
              {group.fields.map((fieldKey) => {
                const fieldConfig = EDITABLE_FIELDS.find(
                  (f) => f.key === fieldKey,
                );
                const isEditing =
                  editingCell?.rowIndex === rowIndex &&
                  editingCell?.field === fieldKey;
                const errorKey = `${row.id || row.name}_${fieldKey}`;
                const hasError = validationErrors[errorKey];

                return (
                  <div
                    key={fieldKey}
                    className="flex justify-between items-center"
                  >
                    <span className="text-xs text-gray-500 font-medium">
                      {fieldConfig?.label}:
                    </span>
                    <div className="w-32">
                      <ExcelCell
                        value={getCellValue(row, fieldKey)}
                        type="currency"
                        onEdit={(value) => handleCellEdit(row, fieldKey, value)}
                        onBlur={handleCellBlur}
                        onDoubleClick={() =>
                          handleCellDoubleClick(rowIndex, fieldKey)
                        }
                        onKeyDown={(e) =>
                          navigateCell(
                            rowIndex,
                            fieldKey,
                            e.key,
                            paginatedData.length,
                          )
                        }
                        isEditing={isEditing}
                        inputRef={isEditing ? inputRef : null}
                        placeholder="0.00"
                        hasError={hasError}
                        errorMessage={validationErrors[errorKey]}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Profit Margin */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-xs font-semibold text-gray-700">
                  Profit Margin:
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-bold ${calculations.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {calculations.profitMargin.toFixed(1)}%
                  </span>
                  <span className="text-md text-Black font-medium">
                    ₹{calculations.profitAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </td>
        );
      }
      return null;
    },
    [
      editingCell,
      validationErrors,
      getCellValue,
      getChargeType,
      handleCellEdit,
      toggleChargeType,
      handleCellBlur,
      handleCellDoubleClick,
      navigateCell,
      paginatedData.length,
      getComboCalculations,
    ],
  );

  // Form handlers (create/edit modal)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        combo_weight: formData.combo_weight
          ? parseFloat(formData.combo_weight)
          : null,
        items_data: formData.items.map((item) => ({
          ...item,
          product: parseInt(item.product),
          quantity_required: parseInt(item.quantity_required),
          offer_price: item.offer_price ? parseFloat(item.offer_price) : null,
        })),
        rewards_data: formData.rewards.map((reward) => ({
          ...reward,
          product: parseInt(reward.product),
          quantity_free: parseInt(reward.quantity_free),
        })),
        gifts_data: formData.gifts.map((gift) => ({
          ...gift,
          product: parseInt(gift.product),
          quantity: parseInt(gift.quantity) || 1,
        })),
      };

      if (editingCombination) {
        await axios.put(
          `/api/productcombinations/${editingCombination.id}/`,
          dataToSend,
        );
        toast.success("Combination updated successfully");
      } else {
        await axios.post("/api/productcombinations/", dataToSend);
        toast.success("Combination created successfully");
      }
      fetchCombinations();
      resetForm();
    } catch (error) {
      console.error("Error saving combination:", error);
      toast.error(error.response?.data?.message || "Error saving combination");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      combo_weight: "",
      curriar_purchase_point: "",
      curriar_dispatch_point: "",
      description: "",
      is_active: true,
      items: [],
      rewards: [],
      gifts: [],
      parking_charge_type: "rupees",
      parking_charge_value: 0,
      transportation_charge_type: "rupees",
      transportation_charge_value: 0,
      handling_charge_type: "rupees",
      handling_charge_value: 0,
      delivery_charge_type: "rupees",
      delivery_charge_value: 0,
      extra_charge_type: "rupees",
      extra_charge_value: 0,
      manual_combo_price: "",
    });
    setEditingCombination(null);
    setShowForm(false);
  };

  const handleEdit = (combination) => {
    setFormData({
      name: combination.name,
      combo_weight: combination.combo_weight || "",
      curriar_purchase_point: combination.curriar_purchase_point || "",
      curriar_dispatch_point: combination.curriar_dispatch_point || "",
      description: combination.description || "",
      is_active: combination.is_active,
      items: combination.items || [],
      rewards: combination.rewards || [],
      gifts: combination.gifts || [],
      parking_charge_type: combination.parking_charge_type || "rupees",
      parking_charge_value: combination.parking_charge_value || 0,
      transportation_charge_type:
        combination.transportation_charge_type || "rupees",
      transportation_charge_value: combination.transportation_charge_value || 0,
      handling_charge_type: combination.handling_charge_type || "rupees",
      handling_charge_value: combination.handling_charge_value || 0,
      delivery_charge_type: combination.delivery_charge_type || "rupees",
      delivery_charge_value: combination.delivery_charge_value || 0,
      extra_charge_type: combination.extra_charge_type || "rupees",
      extra_charge_value: combination.extra_charge_value || 0,
      manual_combo_price: combination.manual_combo_price || "",
    });
    setEditingCombination(combination);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this combination?")) {
      try {
        await axios.delete(`/api/productcombinations/${id}/`);
        toast.success("Combination deleted successfully");
        fetchCombinations();
      } catch (error) {
        console.error("Error deleting combination:", error);
        toast.error("Error deleting combination");
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product: "", quantity_required: 0, offer_price: null },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];

    // If field is 'product' and the value is selected (not empty)
    if (field === "product" && value) {
      newItems[index][field] = value;
      // If quantity is 0 or empty, set it to 1
      if (
        !newItems[index].quantity_required ||
        newItems[index].quantity_required === 0
      ) {
        newItems[index].quantity_required = 1;
      }
    } else {
      newItems[index][field] = value;
    }

    setFormData({ ...formData, items: newItems });
  };

  const addReward = () => {
    setFormData({
      ...formData,
      rewards: [...formData.rewards, { product: "", quantity_free: 0 }],
    });
  };

  const removeReward = (index) => {
    const newRewards = formData.rewards.filter((_, i) => i !== index);
    setFormData({ ...formData, rewards: newRewards });
  };

  const updateReward = (index, field, value) => {
    const newRewards = [...formData.rewards];

    if (field === "product" && value) {
      newRewards[index][field] = value;
      if (
        !newRewards[index].quantity_free ||
        newRewards[index].quantity_free === 0
      ) {
        newRewards[index].quantity_free = 1;
      }
    } else {
      newRewards[index][field] = value;
    }

    setFormData({ ...formData, rewards: newRewards });
  };

  const addGift = () => {
    setFormData({
      ...formData,
      gifts: [...formData.gifts, { product: "", quantity: 0 }],
    });
  };

  const removeGift = (index) => {
    const newGifts = formData.gifts.filter((_, i) => i !== index);
    setFormData({ ...formData, gifts: newGifts });
  };

  const updateGift = (index, field, value) => {
    const newGifts = [...formData.gifts];

    if (field === "product" && value) {
      newGifts[index][field] = value;
      if (!newGifts[index].quantity || newGifts[index].quantity === 0) {
        newGifts[index].quantity = 1;
      }
    } else {
      newGifts[index][field] = value;
    }

    setFormData({ ...formData, gifts: newGifts });
  };

  const getProductDetails = (productId) => {
    if (!productId) return null;
    const product = products.find((p) => p.id === parseInt(productId));
    const pricing = productPricings[productId];
    if (!product) return null;
    return {
      ...product,
      sale_rate:
        formatNumber(pricing?.sale_rate) || formatNumber(product.price),
      mrp: formatNumber(pricing?.mrp) || formatNumber(product.mrp),
      calculated_rate:
        formatNumber(pricing?.calculated_rate) || formatNumber(product.price),
      landing_rate: formatNumber(pricing?.landing_rate) || 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading product combinations...</p>
        </div>
      </div>
    );
  }

  const formCalculations = getFormCalculations();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Filter Bar with Replicated Product Filters */}
        <div className="mb-2 w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Row 1: Combo Search and SKU/Title/HSN */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-4 relative">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Combo Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => {
                  setFilterName(e.target.value);
                  setShowComboSuggestions(true);
                  setComboSuggestionIndex(-1);
                }}
                onFocus={() => setShowComboSuggestions(true)}
                onBlur={() =>
                  setTimeout(() => setShowComboSuggestions(false), 150)
                }
                onKeyDown={(e) => {
                  if (
                    !showComboSuggestions ||
                    comboNameSuggestions.length === 0
                  ) {
                    return;
                  }

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setComboSuggestionIndex((prev) =>
                      prev < comboNameSuggestions.length - 1
                        ? prev + 1
                        : 0,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setComboSuggestionIndex((prev) =>
                      prev > 0
                        ? prev - 1
                        : comboNameSuggestions.length - 1,
                    );
                  } else if (e.key === "Enter") {
                    if (
                      comboSuggestionIndex >= 0 &&
                      comboNameSuggestions[comboSuggestionIndex]
                    ) {
                      e.preventDefault();
                      setFilterName(
                        comboNameSuggestions[comboSuggestionIndex],
                      );
                      setShowComboSuggestions(false);
                      setComboSuggestionIndex(-1);
                    }
                  } else if (e.key === "Escape") {
                    setShowComboSuggestions(false);
                    setComboSuggestionIndex(-1);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Filter combinations..."
              />
              {showComboSuggestions && comboNameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto z-50">
                  {comboNameSuggestions.map((name, index) => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFilterName(name);
                        setShowComboSuggestions(false);
                        setComboSuggestionIndex(-1);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${index === comboSuggestionIndex
                          ? "bg-blue-500 text-white"
                          : "hover:bg-blue-50 focus:bg-blue-50"
                        }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2 relative">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
                        : 0,
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSkuSuggestionIndex((prev) =>
                      prev > 0
                        ? prev - 1
                        : productSkuSuggestions.length - 1,
                    );
                  } else if (e.key === "Enter") {
                    if (
                      skuSuggestionIndex >= 0 &&
                      productSkuSuggestions[skuSuggestionIndex]
                    ) {
                      e.preventDefault();
                      setFilterSKU(
                        productSkuSuggestions[skuSuggestionIndex],
                      );
                      setShowSkuSuggestions(false);
                      setSkuSuggestionIndex(-1);
                    }
                  } else if (e.key === "Escape") {
                    setShowSkuSuggestions(false);
                    setSkuSuggestionIndex(-1);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
                      className={`w-full text-left px-3 py-2 text-sm focus:outline-none ${
                        index === skuSuggestionIndex
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                HSN Code
              </label>
              <input
                type="text"
                value={filterHSN}
                onChange={(e) => setFilterHSN(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="HSN code"
              />
            </div>
          </div>

          {/* Row 2: Cascading Category, Unit, GST Filters */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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

          {/* Row 3: Brand & Flavours & Weight Ranges */}
          <div className="grid grid-cols-12 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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

            <div className="col-span-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Flavour
              </label>
              <select
                value={filterFlavour}
                onChange={(e) => setFilterFlavour(e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              >
                <option value="">All Flavours</option>
                {flavours?.map((flavour) => (
                  <option key={flavour.id} value={flavour.name}>
                    {flavour.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Residual
              </label>
              <select
                value={filterResidual}
                onChange={(e) => setFilterResidual(e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              >
                <option value="">All Residuals</option>
                {residuals?.map((residual) => (
                  <option key={residual.id} value={residual.name}>
                    {residual.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Min Wt (kg)
              </label>
              <input
                type="number"
                value={filterMinWeight}
                onChange={(e) => setFilterMinWeight(e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Min"
                step="0.01"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Max Wt (kg)
              </label>
              <input
                type="number"
                value={filterMaxWeight}
                onChange={(e) => setFilterMaxWeight(e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Max"
                step="0.01"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Min Pkg (kg)
              </label>
              <input
                type="number"
                value={filterMinPackingWeight}
                onChange={(e) => setFilterMinPackingWeight(e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Min"
                step="0.01"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Max Pkg (kg)
              </label>
              <input
                type="number"
                value={filterMaxPackingWeight}
                onChange={(e) => setFilterMaxPackingWeight(e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                placeholder="Max"
                step="0.01"
              />
            </div>
          </div>

          {/* Row 4: Price Range Filters & Action Buttons */}
          <div className="grid grid-cols-12 gap-3 mb-2 items-end">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Price Type
              </label>
              <select
                value={filterPriceType}
                onChange={(e) => {
                  setFilterPriceType(e.target.value);
                  if (!e.target.value) {
                    setFilterMinPrice("");
                    setFilterMaxPrice("");
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              >
                <option value="">No Filter</option>
                <option value="totalSaleRate">Sale Rate</option>
                <option value="totalMRP">MRP</option>
                <option value="totalLandingRate">Landing Rate</option>
                <option value="manualPrice">Manual Price</option>
                <option value="calculatedPriceWithCharges">Calculated Price</option>
                <option value="totalCalculatedRate">Calculated Rate</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Min Price (₹)
              </label>
              <input
                type="number"
                value={filterMinPrice}
                onChange={(e) => setFilterMinPrice(e.target.value)}
                disabled={!filterPriceType}
                className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!filterPriceType ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                placeholder={filterPriceType ? "Min" : "Select Type"}
                step="0.01"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Max Price (₹)
              </label>
              <input
                type="number"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                disabled={!filterPriceType}
                className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!filterPriceType ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
                placeholder={filterPriceType ? "Max" : "Select Type"}
                step="0.01"
              />
            </div>

            <div className="col-span-6 flex justify-between items-center gap-2 w-full self-end">
              <div className="flex gap-2">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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
                  Clear Filters
                </button>

                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Search className="h-4 w-4" />
                  Apply Filters
                </button>
              </div>

              <div className="flex gap-2">
                {isAdmin && (
                  <>
                    <button
                      onClick={handleSaveAll}
                      disabled={saving || Object.keys(editedValues).length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      <Save className="h-4 w-4" />
                      {saving
                        ? "Saving..."
                        : `Save Changes (${Object.keys(editedValues).length})`}
                    </button>

                    <button
                      onClick={() => setShowForm(true)}
                      className="px-4 py-2 bg-[#1a2332] text-white rounded-xl hover:bg-[#2d3748] transition-all flex items-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Add Combo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Badges */}
          {(activeFilters.filterName ||
            activeFilters.filterSKU ||
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
            activeFilters.filterMaxPackingWeight ||
            activeFilters.filterPriceType ||
            activeFilters.filterMinPrice ||
            activeFilters.filterMaxPrice) && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 font-medium mr-2 self-center">
                  Active Filters:
                </span>
                {activeFilters.filterName && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    Combo Name: {activeFilters.filterName}
                    <button
                      onClick={() => {
                        setFilterName("");
                        setActiveFilters((prev) => ({ ...prev, filterName: "" }));
                        setShowComboSuggestions(false);
                        setComboSuggestionIndex(-1);
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterSKU && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    SKU: {activeFilters.filterSKU}
                    <button
                      onClick={() => {
                        setFilterSKU("");
                        setActiveFilters((prev) => ({ ...prev, filterSKU: "" }));
                        setShowSkuSuggestions(false);
                        setSkuSuggestionIndex(-1);
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterTitle: "" }));
                        setShowTitleSuggestions(false);
                        setTitleSuggestionIndex(-1);
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterCategory: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterBrand: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterFlavour: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterResidual: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterGST && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                    GST: {activeFilters.filterGST}%
                    <button
                      onClick={() => {
                        setFilterGST("");
                        setActiveFilters((prev) => ({ ...prev, filterGST: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterUnit: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
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
                        setActiveFilters((prev) => ({ ...prev, filterHSN: "" }));
                      }}
                      className="hover:text-blue-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterPriceType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                    Price: {
                      (() => {
                        const labels = {
                          totalSaleRate: "Sale Rate",
                          totalMRP: "MRP",
                          totalLandingRate: "Landing Rate",
                          manualPrice: "Manual Price",
                          calculatedPriceWithCharges: "Calculated Price",
                          totalCalculatedRate: "Calculated Rate"
                        };
                        return labels[activeFilters.filterPriceType] || activeFilters.filterPriceType;
                      })()
                    }
                    <button
                      onClick={() => {
                        setFilterPriceType("");
                        setFilterMinPrice("");
                        setFilterMaxPrice("");
                        setActiveFilters((prev) => ({
                          ...prev,
                          filterPriceType: "",
                          filterMinPrice: "",
                          filterMaxPrice: "",
                        }));
                      }}
                      className="hover:text-purple-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterMinPrice && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                    Min Price: ₹{activeFilters.filterMinPrice}
                    <button
                      onClick={() => {
                        setFilterMinPrice("");
                        setActiveFilters((prev) => ({ ...prev, filterMinPrice: "" }));
                      }}
                      className="hover:text-purple-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeFilters.filterMaxPrice && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                    Max Price: ₹{activeFilters.filterMaxPrice}
                    <button
                      onClick={() => {
                        setFilterMaxPrice("");
                        setActiveFilters((prev) => ({ ...prev, filterMaxPrice: "" }));
                      }}
                      className="hover:text-purple-900 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            )}
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div
            ref={tableContainerRef}
            className="overflow-auto"
            style={{ maxHeight: "calc(100vh - 170px)" }}
          >
            <style>{`
  .combo-table {
    width: 100%;
    border-collapse: collapse;  /* Change from 'separate' to 'collapse' */
    background: white;
  }

  .combo-table th,
  .combo-table td {
    border: 1px solid #e5e7eb;  /* Add border to all th and td */
    vertical-align: top;
  }

  .combo-table th {
    position: sticky;
    top: 0;
    z-index: 20;
    background: #1a2332;
    color: white;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 14px 16px;
    border-bottom: 2px solid #334155;
    white-space: nowrap;
  }

  .combo-table td {
    border-bottom: 1px solid #e5e7eb;
    border-right: 1px solid #e5e7eb;  /* Add right border to all cells */
  }

  /* Remove right border from last column to avoid double border */
  .combo-table td:last-child,
  .combo-table th:last-child {
    border-right: none;
  }

  .combo-table tbody tr {
    transition: all 0.2s ease;
  }

  .combo-table tbody tr:hover {
    background: #f8fafc;
  }

  .sticky-col {
    position: sticky;
    z-index: 10;
    background: inherit;
    border-right: 1px solid #d1d5db !important;  /* Stronger border for sticky columns */
  }

  .sticky-col-header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: linear-gradient(to right, #1e293b, #111827);
    border-right: 1px solid #334155 !important;
  }

  /* Ensure all columns have visible borders */
  .combo-table td:not(:last-child) {
    border-right: 1px solid #e5e7eb;
  }

  .product-row {
    display: grid;
    grid-template-columns: 1fr 50px;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed #e5e7eb;
    min-height: 50px;
  }

  .product-row:last-child {
    border-bottom: none;
  }

  .qty-box {
    height: 30px;
    min-width: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    background: #f3f4f6;
    color: #111827;
  }

  .reward-qty {
    background: #dcfce7;
    color: #166534;
  }

  .gift-qty {
    background: #ffedd5;
    color: #c2410c;
  }

  .empty-text {
    color: #9ca3af;
    font-size: 13px;
    padding: 12px 0;
    display: block;
  }

  .more-text {
    font-size: 12px;
    font-weight: 600;
    margin-top: 10px;
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

            <table className="combo-table">
              <thead>
                <tr>
                  <th
                    className="sticky-col-header text-left"
                    style={{
                      left: STICKY_POSITIONS.COMBO_NAME,
                      minWidth: COLUMN_WIDTHS.COMBO_NAME,
                    }}
                  >
                    Combo Name
                  </th>

                  <th
                    className="sticky-col-header text-left"
                    style={{
                      left: STICKY_POSITIONS.PAID_ITEMS,
                      minWidth: COLUMN_WIDTHS.PAID_ITEMS,
                    }}
                  >
                    Purchase Product
                  </th>

                  <th style={{ minWidth: 220 }}>Free Product</th>

                  <th style={{ minWidth: 220 }}>Gifts product</th>

                  <th style={{ minWidth: GROUP_CONFIG.charges.width }}>
                    Charges
                  </th>

                  <th style={{ minWidth: GROUP_CONFIG.costBreakdown.width }}>
                    Cost Breakdown
                  </th>

                  {isAdmin && <th style={{ minWidth: 80 }}>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((row, rowIndex) => {
                  const isEvenRow = rowIndex % 2 === 0;

                  const rowBgClass = isEvenRow ? "bg-white" : "bg-gray-50";

                  const displayItems = (row.items || []).slice(0, 3);
                  const remainingItems = (row.items || []).length - 3;

                  const displayRewards = (row.rewards || []).slice(0, 3);

                  const remainingRewards = (row.rewards || []).length - 3;

                  const displayGifts = (row.gifts || []).slice(0, 3);

                  const remainingGifts = (row.gifts || []).length - 3;

                  return (
                    <tr key={row.id || rowIndex} className={rowBgClass}>
                      {/* Combo Name */}
                      <td
                        className={`sticky-col ${rowBgClass} px-5 py-4`}
                        style={{
                          left: STICKY_POSITIONS.COMBO_NAME,
                          minWidth: COLUMN_WIDTHS.COMBO_NAME,
                        }}
                      >
                        <div className="font-bold text-gray-900 text-sm">
                          {row.name}
                        </div>

                        {row.description && (
                          <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {row.description}
                          </div>
                        )}
                      </td>

                      {/* Paid Items */}
                      <td
                        className={`sticky-col ${rowBgClass} px-5 py-4`}
                        style={{
                          left: STICKY_POSITIONS.PAID_ITEMS,
                          minWidth: COLUMN_WIDTHS.PAID_ITEMS,
                        }}
                      >
                        {displayItems.length > 0 ? (
                          displayItems.map((item, idx) => {
                            const product = products.find(
                              (p) => p.id === item.product,
                            );

                            if (!product) return null;

                            return (
                              <div key={idx} className="product-row">
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {product.title}
                                  </div>

                                  {item.offer_price && (
                                    <div className="text-xs text-green-600 mt-1">
                                      Special Price: ₹
                                      {formatNumber(item.offer_price).toFixed(
                                        2,
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="qty-box">
                                  {item.quantity_required}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="empty-text">No items</span>
                        )}

                        {remainingItems > 0 && (
                          <div className="more-text text-purple-600">
                            +{remainingItems} more items
                          </div>
                        )}
                      </td>

                      {/* Rewards */}
                      <td className="px-5 py-4">
                        {displayRewards.length > 0 ? (
                          displayRewards.map((reward, idx) => {
                            const product = products.find(
                              (p) => p.id === reward.product,
                            );

                            if (!product) return null;

                            return (
                              <div key={idx} className="product-row">
                                <div className="font-medium text-green-700 text-sm">
                                  {product.title}
                                </div>

                                <div className="qty-box reward-qty">
                                  {reward.quantity_free}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="empty-text">No rewards</span>
                        )}

                        {remainingRewards > 0 && (
                          <div className="more-text text-green-600">
                            +{remainingRewards} more rewards
                          </div>
                        )}
                      </td>

                      {/* Gifts */}
                      <td className="px-5 py-4">
                        {displayGifts.length > 0 ? (
                          displayGifts.map((gift, idx) => {
                            const product = products.find(
                              (p) => p.id === gift.product,
                            );

                            if (!product) return null;

                            return (
                              <div key={idx} className="product-row">
                                <div className="font-medium text-orange-700 text-sm">
                                  {product.title}
                                </div>

                                <div className="qty-box gift-qty">
                                  {gift.quantity}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="empty-text">No gifts</span>
                        )}

                        {remainingGifts > 0 && (
                          <div className="more-text text-orange-600">
                            +{remainingGifts} more gifts
                          </div>
                        )}
                      </td>

                      {/* Charges */}
                      {renderGroupCell(row, rowIndex, "charges")}

                      {/* Cost Breakdown */}
                      {renderGroupCell(row, rowIndex, "costBreakdown")}

                      {/* Actions */}
                      {isAdmin && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEdit(row)}
                              className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(row.id)}
                              className="h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
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
                {filteredData.length} combinations
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-all"
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
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${currentPage === pageNum
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
                  className="p-2 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredData.length === 0 && (
            <div className="text-center py-14 bg-white">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-2" />

              <p className="text-gray-500 text-sm">
                No product combinations found.
              </p>

              {isAdmin && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-5 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all"
                >
                  Create your first combination
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && isAdmin && (
        <div
          className="fixed top-0 right-0 bottom-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50"
          style={{
            left: isOpen ? "256px" : "80px",
            transition: "left 0.3s ease",
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[100%] max-w-[1900px] my-8 max-h-[100vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a2332] text-white px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold">
                {editingCombination
                  ? "Edit Combination"
                  : "Create New Combination"}
              </h2>
              <button
                onClick={resetForm}
                className="text-white hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-1">
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    placeholder="Enter combination name"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.curriar_purchase_point}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        curriar_purchase_point: e.target.value,
                      })
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter Purchase Point"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.curriar_dispatch_point}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        curriar_dispatch_point: e.target.value,
                      })
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter Dispatch Point"
                  />
                </div>
              </div>

              {/* Main Content Area - Two Columns with custom widths */}
              <div className="flex gap-2">
                <div className="flex-1 space-y-2" style={{ flex: "3" }}>
                  {/* Purchase Items */}
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-base font-semibold">
                        Purchase Product
                      </h3>
                      <button
                        type="button"
                        onClick={addItem}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Item
                      </button>
                    </div>
                    {formData.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#1a2332] text-white">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Product</th>
                              <th className="px-2 py-1.5 text-left">Qty</th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Landing Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                MRP Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Sale Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Calculated Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Package Weight
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="1">
                                Package Volume
                              </th>
                              <th className="px-2 py-1.5 text-left">Offer</th>
                              <th className="px-2 py-1.5 text-left">
                                Subtotal
                              </th>
                              <th className="px-2 py-1.5 text-left">Action</th>
                            </tr>
                            <tr className="bg-gray-50">
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              {/* <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th> */}
                              {/* <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th> */}
                              <th className="px-2 py-1"></th>
                              <th className="px-2 py-1"></th>
                              <th className="px-2 py-1"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.items.map((item, index) => {
                              const selectedProductId = item.product;
                              const pricing = selectedProductId
                                ? productPricings[selectedProductId]
                                : null;
                              const product = selectedProductId
                                ? products.find(
                                  (p) => p.id === parseInt(selectedProductId),
                                )
                                : null;

                              const quantity = formatNumber(
                                item.quantity_required,
                              );

                              const landingRate = formatNumber(
                                pricing?.landing_rate ??
                                product?.landing_rate ??
                                0,
                              );
                              const landingTotal = landingRate * quantity;

                              const mrp = formatNumber(
                                pricing?.mrp ?? product?.mrp ?? 0,
                              );
                              const mrpTotal = mrp * quantity;

                              const saleRate = formatNumber(
                                pricing?.sale_rate ?? product?.price ?? 0,
                              );
                              const saleTotal = saleRate * quantity;

                              const calculatedRate = formatNumber(
                                pricing?.calculated_rate ?? product?.price ?? 0,
                              );
                              const calculatedTotal = calculatedRate * quantity;

                              // Weight calculations
                              const unitWeight = formatNumber(
                                product?.packing_weight || 0,
                              );
                              const totalWeight = unitWeight * quantity;
                              const weightUnit =
                                product?.packing_weight_unit_display || "kg";

                              // Dimension calculations
                              const lengthCm =
                                parseFloat(product?.length_cm) || 0;
                              const breadthCm =
                                parseFloat(product?.breadth_cm) || 0;
                              const heightCm =
                                parseFloat(product?.height_cm) || 0;
                              const unitVolumeCm3 =
                                lengthCm * breadthCm * heightCm;
                              const unitVolumeM3 = unitVolumeCm3 / 1000000; // Convert to cubic meters
                              const totalVolumeM3 = unitVolumeM3 * quantity;
                              const volumeDisplay =
                                unitVolumeM3 > 0
                                  ? `${unitVolumeM3.toFixed(6)} m³`
                                  : "-";
                              const totalVolumeDisplay =
                                totalVolumeM3 > 0
                                  ? `${totalVolumeM3.toFixed(6)} m³`
                                  : "-";

                              const effectiveRate =
                                item.offer_price !== null &&
                                  item.offer_price !== "" &&
                                  item.offer_price !== undefined
                                  ? parseFloat(item.offer_price)
                                  : saleRate;
                              const subtotal = effectiveRate * quantity;

                              return (
                                <tr key={index} className="border-t">
                                  {/* Product selection */}
                                  <td className="px-2 py-1.5">
                                    <SearchableProductDropdown
                                      value={item.product}
                                      onChange={(e) =>
                                        updateItem(
                                          index,
                                          "product",
                                          e.target.value,
                                        )
                                      }
                                      products={products}
                                      className="w-36"
                                      required
                                    />
                                  </td>

                                  {/* Quantity */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={item.quantity_required}
                                      onChange={(e) =>
                                        updateItem(
                                          index,
                                          "quantity_required",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-1.5 py-1 border rounded text-xs"
                                      required
                                    />
                                  </td>

                                  {/* Landing - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={landingRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={landingTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* MRP - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={mrp.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={mrpTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Sale - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={saleRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={saleTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Calculated - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={calculatedRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={calculatedTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Weight - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={`${unitWeight} ${weightUnit}`}
                                      className="w-24 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={`${totalWeight.toFixed(2)} ${weightUnit}`}
                                      className="w-24 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Dimensions - Unit & Total */}
                                  {/* <td className="px-2 py-1.5">
        <input
          type="text"
          value={volumeDisplay}
          className="w-28 px-1.5 py-1 border rounded text-xs bg-gray-50"
          readOnly
          disabled
        />
      </td> */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={totalVolumeDisplay}
                                      className="w-28 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Offer Price */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.offer_price || ""}
                                      onChange={(e) =>
                                        updateItem(
                                          index,
                                          "offer_price",
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : null,
                                        )
                                      }
                                      className="w-20 px-1.5 py-1 border rounded text-xs"
                                      placeholder="Optional"
                                    />
                                  </td>

                                  {/* Subtotal */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subtotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Action */}
                                  <td className="px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(index)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>

                          {/* Footer Row with All Totals */}
                          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                            <tr className="font-bold">
                              <td
                                colSpan="2"
                                className="px-2 py-2 text-right text-xs"
                              >
                                TOTALS:
                              </td>

                              {/* Landing Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.items
                                    .reduce((total, item) => {
                                      const selectedProductId = item.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const landingRate = formatNumber(
                                        pricing?.landing_rate ??
                                        product?.landing_rate ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        item.quantity_required,
                                      );
                                      return total + landingRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* MRP Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.items
                                    .reduce((total, item) => {
                                      const selectedProductId = item.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const mrp = formatNumber(
                                        pricing?.mrp ?? product?.mrp ?? 0,
                                      );
                                      const quantity = formatNumber(
                                        item.quantity_required,
                                      );
                                      return total + mrp * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Sale Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.items
                                    .reduce((total, item) => {
                                      const selectedProductId = item.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        item.quantity_required,
                                      );
                                      return total + saleRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Calculated Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.items
                                    .reduce((total, item) => {
                                      const selectedProductId = item.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const calculatedRate = formatNumber(
                                        pricing?.calculated_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        item.quantity_required,
                                      );
                                      return total + calculatedRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Weight Total (always in kg, with debug) */}

                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalWeightInKg = 0;
                                    console.log(
                                      "=== Weight Calculation Debug ===",
                                    );
                                    console.log("Units available:", units);

                                    formData.items.forEach((item, idx) => {
                                      const selectedProductId = item.product;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            Number(p.id) ===
                                            Number(selectedProductId),
                                        )
                                        : null;

                                      if (product) {
                                        const unitWeight = parseFloat(
                                          product?.packing_weight || 0,
                                        );
                                        const quantity = parseFloat(
                                          item.quantity_required || 0,
                                        );
                                        const unitId =
                                          product.packing_weight_unit_id;

                                        console.log(
                                          `Product ${idx + 1}: ${product.title}`,
                                        );
                                        console.log(
                                          `  Weight: ${unitWeight}, Unit ID: ${unitId}, Quantity: ${quantity}`,
                                        );

                                        if (unitId) {
                                          const convertedWeight =
                                            convertWeightToUnit(
                                              unitWeight,
                                              unitId,
                                              null,
                                            );
                                          console.log(
                                            `  Converted to kg: ${convertedWeight}`,
                                          );
                                          const totalForProduct =
                                            convertedWeight * quantity;
                                          console.log(
                                            `  Total for product: ${totalForProduct} kg`,
                                          );
                                          totalWeightInKg += totalForProduct;
                                        } else {
                                          console.log(
                                            `  No unit ID found, using raw weight: ${unitWeight} kg`,
                                          );
                                          totalWeightInKg +=
                                            unitWeight * quantity;
                                        }
                                      }
                                    });

                                    console.log(
                                      `Total Weight: ${totalWeightInKg.toFixed(3)} kg`,
                                    );
                                    return `${totalWeightInKg.toFixed(3)} kg`;
                                  })()}
                                  className="w-28 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                  readOnly
                                  disabled
                                />
                              </td>
                              {/* Volume Total - Purchase Products */}
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalVolumeInM3 = 0;
                                    formData.items.forEach((item) => {
                                      const selectedProductId = item.product;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      if (product) {
                                        const lengthCm = parseFloat(
                                          product?.length_cm || 0,
                                        );
                                        const breadthCm = parseFloat(
                                          product?.breadth_cm || 0,
                                        );
                                        const heightCm = parseFloat(
                                          product?.height_cm || 0,
                                        );
                                        const quantity = parseFloat(
                                          item.quantity_required || 0,
                                        );
                                        const unitVolumeCm3 =
                                          lengthCm * breadthCm * heightCm;
                                        const unitVolumeM3 =
                                          unitVolumeCm3 / 1000000;
                                        const volumeInM3 =
                                          unitVolumeM3 * quantity;
                                        totalVolumeInM3 += volumeInM3;
                                      }
                                    });
                                    return `${totalVolumeInM3.toFixed(6)} m³`;
                                  })()}
                                  className="w-32 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Empty cells to align with Offer and Subtotal */}

                              <td className="px-2 py-2"></td>

                              {/* Grand Subtotal - Now aligned under Subtotal column */}
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.items
                                    .reduce((total, item) => {
                                      const selectedProductId = item.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const effectiveRate =
                                        item.offer_price || saleRate;
                                      const quantity = formatNumber(
                                        item.quantity_required,
                                      );
                                      return (
                                        total +
                                        formatNumber(effectiveRate) * quantity
                                      );
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-100 font-bold text-blue-800"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Action - empty */}
                              <td className="px-2 py-2"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 text-sm">
                          No items added yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Free Rewards */}
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold">Free Product</h3>
                      <button
                        type="button"
                        onClick={addReward}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add item
                      </button>
                    </div>
                    {formData.rewards.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#1a2332] text-white">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Product</th>
                              <th className="px-2 py-1.5 text-left">Qty</th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Landing Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                MRP Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Sale Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Calculated Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Package Weight
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="1">
                                Package Volume
                              </th>
                              <th className="px-2 py-1.5 text-left">Offer</th>
                              <th className="px-2 py-1.5 text-left">
                                Subtotal
                              </th>
                              <th className="px-2 py-1.5 text-left">Action</th>
                            </tr>
                            <tr className="bg-gray-50">
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1"></th>
                              <th className="px-2 py-1"></th>
                              <th className="px-2 py-1"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.rewards.map((reward, index) => {
                              const selectedProductId = reward.product;
                              const pricing = selectedProductId
                                ? productPricings[selectedProductId]
                                : null;
                              const product = selectedProductId
                                ? products.find(
                                  (p) => p.id === parseInt(selectedProductId),
                                )
                                : null;

                              const quantity = formatNumber(
                                reward.quantity_free,
                              );

                              const landingRate = formatNumber(
                                pricing?.landing_rate ??
                                product?.landing_rate ??
                                0,
                              );
                              const landingTotal = landingRate * quantity;

                              const mrp = formatNumber(
                                pricing?.mrp ?? product?.mrp ?? 0,
                              );
                              const mrpTotal = mrp * quantity;

                              const saleRate = formatNumber(
                                pricing?.sale_rate ?? product?.price ?? 0,
                              );
                              const saleTotal = saleRate * quantity;

                              const calculatedRate = formatNumber(
                                pricing?.calculated_rate ?? product?.price ?? 0,
                              );
                              const calculatedTotal = calculatedRate * quantity;

                              // Weight calculations
                              const unitWeight = formatNumber(
                                product?.packing_weight || 0,
                              );
                              const totalWeight = unitWeight * quantity;
                              const weightUnit =
                                product?.packing_weight_unit_display || "kg";

                              // Dimension calculations
                              const lengthCm =
                                parseFloat(product?.length_cm) || 0;
                              const breadthCm =
                                parseFloat(product?.breadth_cm) || 0;
                              const heightCm =
                                parseFloat(product?.height_cm) || 0;
                              const unitVolume =
                                (lengthCm * breadthCm * heightCm) / 1000000; // Directly in m³
                              const totalVolume = unitVolume * quantity;
                              const volumeDisplay =
                                unitVolume > 0
                                  ? `${unitVolume.toFixed(6)} m³`
                                  : "-";
                              const totalVolumeDisplay =
                                totalVolume > 0
                                  ? `${totalVolume.toFixed(6)} m³`
                                  : "-";

                              // For free rewards, offer price is typically 0 since it's free
                              const offerPrice = 0;
                              const subtotal = saleRate * quantity;

                              return (
                                <tr key={index} className="border-t">
                                  <td className="px-2 py-1.5">
                                    <SearchableProductDropdown
                                      value={reward.product}
                                      onChange={(e) =>
                                        updateReward(
                                          index,
                                          "product",
                                          e.target.value,
                                        )
                                      }
                                      products={products}
                                      className="w-36"
                                      required
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={reward.quantity_free}
                                      onChange={(e) =>
                                        updateReward(
                                          index,
                                          "quantity_free",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-1.5 py-1 border rounded text-xs"
                                      required
                                    />
                                  </td>

                                  {/* Landing - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={landingRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={landingTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* MRP - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={mrp.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={mrpTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Sale - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={saleRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={saleTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Calculated - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={calculatedRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={calculatedTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Weight - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={`${unitWeight} ${weightUnit}`}
                                      className="w-24 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={`${totalWeight.toFixed(2)} ${weightUnit}`}
                                      className="w-24 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Volume - Unit & Total */}
                                  {/* <td className="px-2 py-1.5">
                                    <input

                                      type="text"
                                      value={volumeDisplay}
                                      className="w-28 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td> */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={totalVolumeDisplay}
                                      className="w-28 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Offer Price */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value="0"
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-100 cursor-not-allowed"
                                      readOnly
                                      disabled
                                      placeholder="Free"
                                    />
                                  </td>

                                  {/* Subtotal */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subtotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Action */}
                                  <td className="px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => removeReward(index)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>

                          {/* Footer Row with All Totals */}
                          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                            <tr className="font-bold">
                              <td
                                colSpan="2"
                                className="px-2 py-2 text-right text-xs"
                              >
                                TOTALS:
                              </td>

                              {/* Landing Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.rewards
                                    .reduce((total, reward) => {
                                      const selectedProductId = reward.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const landingRate = formatNumber(
                                        pricing?.landing_rate ??
                                        product?.landing_rate ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        reward.quantity_free,
                                      );
                                      return total + landingRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-green-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* MRP Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.rewards
                                    .reduce((total, reward) => {
                                      const selectedProductId = reward.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const mrp = formatNumber(
                                        pricing?.mrp ?? product?.mrp ?? 0,
                                      );
                                      const quantity = formatNumber(
                                        reward.quantity_free,
                                      );
                                      return total + mrp * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-green-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Sale Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.rewards
                                    .reduce((total, reward) => {
                                      const selectedProductId = reward.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        reward.quantity_free,
                                      );
                                      return total + saleRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-green-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Calculated Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.rewards
                                    .reduce((total, reward) => {
                                      const selectedProductId = reward.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const calculatedRate = formatNumber(
                                        pricing?.calculated_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        reward.quantity_free,
                                      );
                                      return total + calculatedRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-green-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Weight Total (always in kg) */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalWeightInKg = 0;
                                    formData.rewards.forEach((reward) => {
                                      const selectedProductId = reward.product;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      if (
                                        product &&
                                        product.packing_weight_unit_id
                                      ) {
                                        const unitWeight = parseFloat(
                                          product?.packing_weight || 0,
                                        );
                                        const quantity = parseFloat(
                                          reward.quantity_free || 0,
                                        );
                                        // Always convert to kg
                                        const weightInKg =
                                          convertWeightToUnit(
                                            unitWeight,
                                            product.packing_weight_unit_id,
                                            null,
                                          ) * quantity;
                                        totalWeightInKg += weightInKg;
                                      }
                                    });
                                    return `${totalWeightInKg.toFixed(3)} kg`;
                                  })()}
                                  className="w-28 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-green-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Volume Total */}

                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalVolumeInM3 = 0;
                                    formData.rewards.forEach((reward) => {
                                      const selectedProductId = reward.product;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      if (product) {
                                        const lengthCm = parseFloat(
                                          product?.length_cm || 0,
                                        );
                                        const breadthCm = parseFloat(
                                          product?.breadth_cm || 0,
                                        );
                                        const heightCm = parseFloat(
                                          product?.height_cm || 0,
                                        );
                                        const quantity = parseFloat(
                                          reward.quantity_free || 0,
                                        );
                                        const unitVolumeCm3 =
                                          lengthCm * breadthCm * heightCm;
                                        const unitVolumeM3 =
                                          unitVolumeCm3 / 1000000;
                                        const volumeInM3 =
                                          unitVolumeM3 * quantity;
                                        totalVolumeInM3 += volumeInM3;
                                      }
                                    });
                                    return `${totalVolumeInM3.toFixed(6)} m³`;
                                  })()}
                                  className="w-32 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-green-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Empty cell to align with Offer column */}
                              <td className="px-2 py-2"></td>

                              {/* Grand Subtotal */}
                              {/* Grand Subtotal */}
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.rewards
                                    .filter(
                                      (reward) =>
                                        reward.product &&
                                        formatNumber(reward.quantity_free) > 0,
                                    )
                                    .reduce((total, reward) => {
                                      const selectedProductId = reward.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        reward.quantity_free,
                                      );
                                      return total + saleRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-100 font-bold text-blue-800"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Action - empty */}
                              <td className="px-2 py-2"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 text-xs">
                          No rewards added yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Gifts */}
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-base font-semibold">Gift product</h3>
                      <button
                        type="button"
                        onClick={addGift}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add item
                      </button>
                    </div>
                    {formData.gifts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-[#1a2332] text-white">
                            <tr>
                              <th className="px-2 py-1.5 text-left">Product</th>
                              <th className="px-2 py-1.5 text-left">Qty</th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Landing Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                MRP Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Sale Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Calculated Rate
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="2">
                                Package Weight
                              </th>
                              <th className="px-2 py-1.5 text-left" colSpan="1">
                                Package Volume
                              </th>
                              <th className="px-2 py-1.5 text-left">Offer</th>
                              <th className="px-2 py-1.5 text-left">
                                Subtotal
                              </th>
                              <th className="px-2 py-1.5 text-left">Action</th>
                            </tr>
                            <tr className="bg-gray-50">
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-left"></th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Unit
                              </th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                                Total
                              </th>
                              <th className="px-2 py-1"></th>
                              <th className="px-2 py-1"></th>
                              <th className="px-2 py-1"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.gifts.map((gift, index) => {
                              const selectedProductId = gift.product;
                              const pricing = selectedProductId
                                ? productPricings[selectedProductId]
                                : null;
                              const product = selectedProductId
                                ? products.find(
                                  (p) => p.id === parseInt(selectedProductId),
                                )
                                : null;

                              const quantity = formatNumber(gift.quantity);

                              const landingRate = formatNumber(
                                pricing?.landing_rate ??
                                product?.landing_rate ??
                                0,
                              );
                              const landingTotal = landingRate * quantity;

                              const mrp = formatNumber(
                                pricing?.mrp ?? product?.mrp ?? 0,
                              );
                              const mrpTotal = mrp * quantity;

                              const saleRate = formatNumber(
                                pricing?.sale_rate ?? product?.price ?? 0,
                              );
                              const saleTotal = saleRate * quantity;

                              const calculatedRate = formatNumber(
                                pricing?.calculated_rate ?? product?.price ?? 0,
                              );
                              const calculatedTotal = calculatedRate * quantity;

                              // Weight calculations
                              const unitWeight = formatNumber(
                                product?.packing_weight || 0,
                              );
                              const totalWeight = unitWeight * quantity;
                              const weightUnit =
                                product?.packing_weight_unit_display || "kg";

                              const lengthCm =
                                parseFloat(product?.length_cm) || 0;
                              const breadthCm =
                                parseFloat(product?.breadth_cm) || 0;
                              const heightCm =
                                parseFloat(product?.height_cm) || 0;
                              const unitVolume =
                                (lengthCm * breadthCm * heightCm) / 1000000; // Convert to m³
                              const totalVolume = unitVolume * quantity;
                              const volumeDisplay =
                                unitVolume > 0
                                  ? `${unitVolume.toFixed(6)} m³`
                                  : "-";
                              const totalVolumeDisplay =
                                totalVolume > 0
                                  ? `${totalVolume.toFixed(6)} m³`
                                  : "-";

                              // FIXED: Use saleRate for subtotal, offer_price is just for display
                              const effectiveRate = saleRate;
                              const subtotal = effectiveRate * quantity;

                              return (
                                <tr key={index} className="border-t">
                                  <td className="px-2 py-1.5">
                                    <SearchableProductDropdown
                                      value={gift.product}
                                      onChange={(e) =>
                                        updateGift(
                                          index,
                                          "product",
                                          e.target.value,
                                        )
                                      }
                                      products={products}
                                      className="w-36"
                                      required
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={gift.quantity}
                                      onChange={(e) =>
                                        updateGift(
                                          index,
                                          "quantity",
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-1.5 py-1 border rounded text-xs"
                                      required
                                    />
                                  </td>

                                  {/* Landing - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={landingRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={landingTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* MRP - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={mrp.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={mrpTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Sale - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={saleRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={saleTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Calculated - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={calculatedRate.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={calculatedTotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Weight - Unit & Total */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={`${unitWeight} ${weightUnit}`}
                                      className="w-24 px-1.5 py-1 border rounded text-xs bg-gray-50"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={`${totalWeight.toFixed(2)} ${weightUnit}`}
                                      className="w-24 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="text"
                                      value={totalVolumeDisplay}
                                      className="w-28 px-1.5 py-1 border rounded text-xs bg-gray-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Offer Price - DISABLED (for UI alignment only) */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={gift.offer_price || ""}
                                      onChange={(e) =>
                                        updateGift(
                                          index,
                                          "offer_price",
                                          e.target.value
                                            ? parseFloat(e.target.value)
                                            : null,
                                        )
                                      }
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-gray-100 cursor-not-allowed"
                                      readOnly
                                      disabled
                                      placeholder="Optional"
                                    />
                                  </td>

                                  {/* Subtotal - Uses saleRate */}
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subtotal.toFixed(2)}
                                      className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-50 font-semibold"
                                      readOnly
                                      disabled
                                    />
                                  </td>

                                  {/* Action */}
                                  <td className="px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => removeGift(index)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>

                          {/* Footer Row with All Totals */}
                          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                            <tr className="font-bold">
                              <td
                                colSpan="2"
                                className="px-2 py-2 text-right text-xs"
                              >
                                TOTALS:
                              </td>

                              {/* Landing Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.gifts
                                    .reduce((total, gift) => {
                                      const selectedProductId = gift.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const landingRate = formatNumber(
                                        pricing?.landing_rate ??
                                        product?.landing_rate ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        gift.quantity,
                                      );
                                      return total + landingRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-orange-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* MRP Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.gifts
                                    .reduce((total, gift) => {
                                      const selectedProductId = gift.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const mrp = formatNumber(
                                        pricing?.mrp ?? product?.mrp ?? 0,
                                      );
                                      const quantity = formatNumber(
                                        gift.quantity,
                                      );
                                      return total + mrp * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-orange-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Sale Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.gifts
                                    .reduce((total, gift) => {
                                      const selectedProductId = gift.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        gift.quantity,
                                      );
                                      return total + saleRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-orange-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Calculated Total */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.gifts
                                    .reduce((total, gift) => {
                                      const selectedProductId = gift.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const calculatedRate = formatNumber(
                                        pricing?.calculated_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        gift.quantity,
                                      );
                                      return total + calculatedRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-orange-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Weight Total (always in kg) */}
                              <td className="px-2 py-2"></td>
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalWeightInKg = 0;
                                    formData.gifts.forEach((gift) => {
                                      const selectedProductId = gift.product;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      if (
                                        product &&
                                        product.packing_weight_unit_id
                                      ) {
                                        const unitWeight = parseFloat(
                                          product?.packing_weight || 0,
                                        );
                                        const quantity = parseFloat(
                                          gift.quantity || 0,
                                        );
                                        // Always convert to kg
                                        const weightInKg =
                                          convertWeightToUnit(
                                            unitWeight,
                                            product.packing_weight_unit_id,
                                            null,
                                          ) * quantity;
                                        totalWeightInKg += weightInKg;
                                      }
                                    });
                                    return `${totalWeightInKg.toFixed(3)} kg`;
                                  })()}
                                  className="w-28 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-orange-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Volume Total - Gift Products */}
                              <td className="px-2 py-2">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalVolumeInM3 = 0;
                                    formData.gifts.forEach((gift) => {
                                      const selectedProductId = gift.product;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      if (product) {
                                        const lengthCm = parseFloat(
                                          product?.length_cm || 0,
                                        );
                                        const breadthCm = parseFloat(
                                          product?.breadth_cm || 0,
                                        );
                                        const heightCm = parseFloat(
                                          product?.height_cm || 0,
                                        );
                                        const quantity = parseFloat(
                                          gift.quantity || 0,
                                        );
                                        const unitVolumeCm3 =
                                          lengthCm * breadthCm * heightCm;
                                        const unitVolumeM3 =
                                          unitVolumeCm3 / 1000000; // Convert cm³ to m³
                                        const volumeInM3 =
                                          unitVolumeM3 * quantity;
                                        totalVolumeInM3 += volumeInM3;
                                      }
                                    });
                                    return `${totalVolumeInM3.toFixed(6)} m³`;
                                  })()}
                                  className="w-32 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-orange-700"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Empty cell to align with Offer column */}
                              <td className="px-2 py-2"></td>

                              {/* Grand Subtotal - Uses saleRate */}
                              <td className="px-2 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.gifts
                                    .reduce((total, gift) => {
                                      const selectedProductId = gift.product;
                                      const pricing = selectedProductId
                                        ? productPricings[selectedProductId]
                                        : null;
                                      const product = selectedProductId
                                        ? products.find(
                                          (p) =>
                                            p.id ===
                                            parseInt(selectedProductId),
                                        )
                                        : null;
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const quantity = formatNumber(
                                        gift.quantity,
                                      );
                                      return total + saleRate * quantity;
                                    }, 0)
                                    .toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-100 font-bold text-blue-800"
                                  readOnly
                                  disabled
                                />
                              </td>

                              {/* Action - empty */}
                              <td className="px-2 py-2"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 text-xs">
                          No gifts added yet.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Grand Totals Section */}
                  {/* Grand Totals Section */}
                  <div className="border rounded-lg p-3 mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-base font-semibold">Grand Totals</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-[#1a2332] text-white">
                          <tr>
                            <th className="px-2 py-1.5 text-left">Category</th>
                            <th className="px-2 py-1.5 text-left">Qty</th>
                            <th className="px-2 py-1.5 text-center" colSpan="2">
                              Landing Rate
                            </th>
                            <th className="px-2 py-1.5 text-center" colSpan="2">
                              MRP Rate
                            </th>
                            <th className="px-2 py-1.5 text-center" colSpan="2">
                              Sale Rate
                            </th>
                            <th className="px-2 py-1.5 text-center" colSpan="2">
                              Calculated Rate
                            </th>
                            <th className="px-2 py-1.5 text-center" colSpan="2">
                              Total Weight
                            </th>
                            <th className="px-2 py-1.5 text-center" colSpan="2">
                              Total Volume
                            </th>
                            <th className="px-2 py-1.5 text-right" colSpan="1">
                              Total Price
                            </th>
                            <th className="px-2 py-1.5 text-right">Profit</th>
                          </tr>
                        </thead>
                        {/* GRAND TOTAL ROW */}
                        <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                          <tr className="font-bold">
                            <td className="px-2 py-2 text-left font-bold">
                              <div>GRAND TOTAL</div>
                              <div className="w-36 text-[10px] text-gray-500 font-normal">
                                (
                                {formData.items.filter(
                                  (item) =>
                                    formatNumber(item.quantity_required) > 0,
                                ).length +
                                  formData.rewards.filter(
                                    (reward) =>
                                      formatNumber(reward.quantity_free) > 0,
                                  ).length +
                                  formData.gifts.filter(
                                    (gift) => formatNumber(gift.quantity) > 0,
                                  ).length}{" "}
                                items)
                              </div>
                            </td>

                            <td className="px-2 py-2">
                              {formData.items.reduce(
                                (sum, item) =>
                                  sum + formatNumber(item.quantity_required),
                                0,
                              ) +
                                formData.rewards.reduce(
                                  (sum, reward) =>
                                    sum + formatNumber(reward.quantity_free),
                                  0,
                                ) +
                                formData.gifts.reduce(
                                  (sum, gift) =>
                                    sum + formatNumber(gift.quantity),
                                  0,
                                )}
                            </td>

                            {/* Landing - Unit & Total */}
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(
                                  formData.items.reduce((total, item) => {
                                    const pricing =
                                      productPricings[item.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(item.product),
                                    );
                                    const landingRate = formatNumber(
                                      pricing?.landing_rate ??
                                      product?.landing_rate ??
                                      0,
                                    );
                                    return (
                                      total +
                                      landingRate *
                                      formatNumber(item.quantity_required)
                                    );
                                  }, 0) +
                                  formData.rewards.reduce((total, reward) => {
                                    const pricing =
                                      productPricings[reward.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(reward.product),
                                    );
                                    const landingRate = formatNumber(
                                      pricing?.landing_rate ??
                                      product?.landing_rate ??
                                      0,
                                    );
                                    return (
                                      total +
                                      landingRate *
                                      formatNumber(reward.quantity_free)
                                    );
                                  }, 0) +
                                  formData.gifts.reduce((total, gift) => {
                                    const pricing =
                                      productPricings[gift.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(gift.product),
                                    );
                                    const landingRate = formatNumber(
                                      pricing?.landing_rate ??
                                      product?.landing_rate ??
                                      0,
                                    );
                                    return (
                                      total +
                                      landingRate * formatNumber(gift.quantity)
                                    );
                                  }, 0)
                                ).toFixed(2)}
                                className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                readOnly
                                disabled
                              />
                            </td>

                            {/* MRP - Unit & Total */}
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(
                                  formData.items.reduce((total, item) => {
                                    const pricing =
                                      productPricings[item.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(item.product),
                                    );
                                    const mrp = formatNumber(
                                      pricing?.mrp ?? product?.mrp ?? 0,
                                    );
                                    return (
                                      total +
                                      mrp * formatNumber(item.quantity_required)
                                    );
                                  }, 0) +
                                  formData.rewards.reduce((total, reward) => {
                                    const pricing =
                                      productPricings[reward.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(reward.product),
                                    );
                                    const mrp = formatNumber(
                                      pricing?.mrp ?? product?.mrp ?? 0,
                                    );
                                    return (
                                      total +
                                      mrp * formatNumber(reward.quantity_free)
                                    );
                                  }, 0) +
                                  formData.gifts.reduce((total, gift) => {
                                    const pricing =
                                      productPricings[gift.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(gift.product),
                                    );
                                    const mrp = formatNumber(
                                      pricing?.mrp ?? product?.mrp ?? 0,
                                    );
                                    return (
                                      total + mrp * formatNumber(gift.quantity)
                                    );
                                  }, 0)
                                ).toFixed(2)}
                                className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                readOnly
                                disabled
                              />
                            </td>

                            {/* Sale - Unit & Total */}
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(
                                  formData.items.reduce((total, item) => {
                                    const pricing =
                                      productPricings[item.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(item.product),
                                    );
                                    const saleRate = formatNumber(
                                      pricing?.sale_rate ?? product?.price ?? 0,
                                    );
                                    return (
                                      total +
                                      saleRate *
                                      formatNumber(item.quantity_required)
                                    );
                                  }, 0) +
                                  formData.rewards.reduce((total, reward) => {
                                    const pricing =
                                      productPricings[reward.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(reward.product),
                                    );
                                    const saleRate = formatNumber(
                                      pricing?.sale_rate ?? product?.price ?? 0,
                                    );
                                    return (
                                      total +
                                      saleRate *
                                      formatNumber(reward.quantity_free)
                                    );
                                  }, 0) +
                                  formData.gifts.reduce((total, gift) => {
                                    const pricing =
                                      productPricings[gift.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(gift.product),
                                    );
                                    const saleRate = formatNumber(
                                      pricing?.sale_rate ?? product?.price ?? 0,
                                    );
                                    return (
                                      total +
                                      saleRate * formatNumber(gift.quantity)
                                    );
                                  }, 0)
                                ).toFixed(2)}
                                className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                readOnly
                                disabled
                              />
                            </td>

                            {/* Calculated - Unit & Total */}
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                step="0.01"
                                value={(
                                  formData.items.reduce((total, item) => {
                                    const pricing =
                                      productPricings[item.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(item.product),
                                    );
                                    const calculatedRate = formatNumber(
                                      pricing?.calculated_rate ??
                                      product?.price ??
                                      0,
                                    );
                                    return (
                                      total +
                                      calculatedRate *
                                      formatNumber(item.quantity_required)
                                    );
                                  }, 0) +
                                  formData.rewards.reduce((total, reward) => {
                                    const pricing =
                                      productPricings[reward.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(reward.product),
                                    );
                                    const calculatedRate = formatNumber(
                                      pricing?.calculated_rate ??
                                      product?.price ??
                                      0,
                                    );
                                    return (
                                      total +
                                      calculatedRate *
                                      formatNumber(reward.quantity_free)
                                    );
                                  }, 0) +
                                  formData.gifts.reduce((total, gift) => {
                                    const pricing =
                                      productPricings[gift.product];
                                    const product = products.find(
                                      (p) => p.id === parseInt(gift.product),
                                    );
                                    const calculatedRate = formatNumber(
                                      pricing?.calculated_rate ??
                                      product?.price ??
                                      0,
                                    );
                                    return (
                                      total +
                                      calculatedRate *
                                      formatNumber(gift.quantity)
                                    );
                                  }, 0)
                                ).toFixed(2)}
                                className="w-20 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700"
                                readOnly
                                disabled
                              />
                            </td>

                            {/* Weight - Unit & Total */}
                            <td className="px-2 py-2"></td>
                            <td className="px-2 py-2">
                              <div className="flex justify-end">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalWeightInKg = 0;

                                    // Items
                                    formData.items.forEach((item) => {
                                      const product = products.find(
                                        (p) => p.id === parseInt(item.product),
                                      );
                                      if (
                                        product &&
                                        product.packing_weight_unit_id
                                      ) {
                                        const unitWeight = parseFloat(
                                          product?.packing_weight || 0,
                                        );
                                        const quantity = parseFloat(
                                          item.quantity_required || 0,
                                        );
                                        const weightInKg =
                                          convertWeightToUnit(
                                            unitWeight,
                                            product.packing_weight_unit_id,
                                            null,
                                          ) * quantity;
                                        totalWeightInKg += weightInKg;
                                      }
                                    });

                                    // Rewards
                                    formData.rewards.forEach((reward) => {
                                      const product = products.find(
                                        (p) =>
                                          p.id === parseInt(reward.product),
                                      );
                                      if (
                                        product &&
                                        product.packing_weight_unit_id
                                      ) {
                                        const unitWeight = parseFloat(
                                          product?.packing_weight || 0,
                                        );
                                        const quantity = parseFloat(
                                          reward.quantity_free || 0,
                                        );
                                        const weightInKg =
                                          convertWeightToUnit(
                                            unitWeight,
                                            product.packing_weight_unit_id,
                                            null,
                                          ) * quantity;
                                        totalWeightInKg += weightInKg;
                                      }
                                    });

                                    // Gifts
                                    formData.gifts.forEach((gift) => {
                                      const product = products.find(
                                        (p) => p.id === parseInt(gift.product),
                                      );
                                      if (
                                        product &&
                                        product.packing_weight_unit_id
                                      ) {
                                        const unitWeight = parseFloat(
                                          product?.packing_weight || 0,
                                        );
                                        const quantity = parseFloat(
                                          gift.quantity || 0,
                                        );
                                        const weightInKg =
                                          convertWeightToUnit(
                                            unitWeight,
                                            product.packing_weight_unit_id,
                                            null,
                                          ) * quantity;
                                        totalWeightInKg += weightInKg;
                                      }
                                    });

                                    return `${totalWeightInKg.toFixed(3)} kg`;
                                  })()}
                                  className="w-28 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700 text-right"
                                  readOnly
                                  disabled
                                />
                              </div>
                            </td>

                            {/* Volume */}
                            <td className="px-2 py-2">
                              <div className="flex justify-end">
                                <input
                                  type="text"
                                  value={(() => {
                                    let totalVolumeInM3 = 0;

                                    // Items
                                    formData.items.forEach((item) => {
                                      const product = products.find(
                                        (p) => p.id === parseInt(item.product),
                                      );
                                      if (product) {
                                        const lengthCm = parseFloat(
                                          product?.length_cm || 0,
                                        );
                                        const breadthCm = parseFloat(
                                          product?.breadth_cm || 0,
                                        );
                                        const heightCm = parseFloat(
                                          product?.height_cm || 0,
                                        );
                                        const quantity = parseFloat(
                                          item.quantity_required || 0,
                                        );
                                        const unitVolumeCm3 =
                                          lengthCm * breadthCm * heightCm;
                                        const unitVolumeM3 =
                                          unitVolumeCm3 / 1000000;
                                        totalVolumeInM3 +=
                                          unitVolumeM3 * quantity;
                                      }
                                    });

                                    // Rewards
                                    formData.rewards.forEach((reward) => {
                                      const product = products.find(
                                        (p) =>
                                          p.id === parseInt(reward.product),
                                      );
                                      if (product) {
                                        const lengthCm = parseFloat(
                                          product?.length_cm || 0,
                                        );
                                        const breadthCm = parseFloat(
                                          product?.breadth_cm || 0,
                                        );
                                        const heightCm = parseFloat(
                                          product?.height_cm || 0,
                                        );
                                        const quantity = parseFloat(
                                          reward.quantity_free || 0,
                                        );
                                        const unitVolumeCm3 =
                                          lengthCm * breadthCm * heightCm;
                                        const unitVolumeM3 =
                                          unitVolumeCm3 / 1000000;
                                        totalVolumeInM3 +=
                                          unitVolumeM3 * quantity;
                                      }
                                    });

                                    // Gifts
                                    formData.gifts.forEach((gift) => {
                                      const product = products.find(
                                        (p) => p.id === parseInt(gift.product),
                                      );
                                      if (product) {
                                        const lengthCm = parseFloat(
                                          product?.length_cm || 0,
                                        );
                                        const breadthCm = parseFloat(
                                          product?.breadth_cm || 0,
                                        );
                                        const heightCm = parseFloat(
                                          product?.height_cm || 0,
                                        );
                                        const quantity = parseFloat(
                                          gift.quantity || 0,
                                        );
                                        const unitVolumeCm3 =
                                          lengthCm * breadthCm * heightCm;
                                        const unitVolumeM3 =
                                          unitVolumeCm3 / 1000000;
                                        totalVolumeInM3 +=
                                          unitVolumeM3 * quantity;
                                      }
                                    });

                                    return `${totalVolumeInM3.toFixed(6)} m³`;
                                  })()}
                                  className="w-32 px-1.5 py-1 border rounded text-xs bg-yellow-50 font-bold text-blue-700 text-right"
                                  readOnly
                                  disabled
                                />
                              </div>
                            </td>

                            {/* Offer */}
                            <td className="px-2 py-2"></td>

                            {/* Total Price */}
                            <td className="px-2 py-2">
                              <div className="flex justify-end">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={(
                                    formData.items.reduce((total, item) => {
                                      const pricing =
                                        productPricings[item.product];
                                      const product = products.find(
                                        (p) => p.id === parseInt(item.product),
                                      );
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const effectiveRate =
                                        item.offer_price || saleRate;
                                      return (
                                        total +
                                        effectiveRate *
                                        formatNumber(item.quantity_required)
                                      );
                                    }, 0) +
                                    formData.rewards.reduce((total, reward) => {
                                      const pricing =
                                        productPricings[reward.product];
                                      const product = products.find(
                                        (p) =>
                                          p.id === parseInt(reward.product),
                                      );
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const effectiveRate =
                                        reward.offer_price || saleRate;
                                      return (
                                        total +
                                        effectiveRate *
                                        formatNumber(reward.quantity_free)
                                      );
                                    }, 0) +
                                    formData.gifts.reduce((total, gift) => {
                                      const pricing =
                                        productPricings[gift.product];
                                      const product = products.find(
                                        (p) => p.id === parseInt(gift.product),
                                      );
                                      const saleRate = formatNumber(
                                        pricing?.sale_rate ??
                                        product?.price ??
                                        0,
                                      );
                                      const effectiveRate =
                                        gift.offer_price || saleRate;
                                      return (
                                        total +
                                        effectiveRate *
                                        formatNumber(gift.quantity)
                                      );
                                    }, 0)
                                  ).toFixed(2)}
                                  className="w-20 px-1.5 py-1 border rounded text-xs bg-blue-100 font-bold text-blue-800 text-right"
                                  readOnly
                                  disabled
                                />
                              </div>
                            </td>

                            {/* Profit */}
                            <td className="px-2 py-2 text-right">
                              {(() => {
                                let totalLandingRate = 0;
                                formData.items.forEach((item) => {
                                  const pricing = productPricings[item.product];
                                  const product = products.find(
                                    (p) => p.id === parseInt(item.product),
                                  );
                                  const landingRate = formatNumber(
                                    pricing?.landing_rate ??
                                    product?.landing_rate ??
                                    0,
                                  );
                                  totalLandingRate +=
                                    landingRate *
                                    formatNumber(item.quantity_required);
                                });
                                formData.rewards.forEach((reward) => {
                                  const pricing =
                                    productPricings[reward.product];
                                  const product = products.find(
                                    (p) => p.id === parseInt(reward.product),
                                  );
                                  const landingRate = formatNumber(
                                    pricing?.landing_rate ??
                                    product?.landing_rate ??
                                    0,
                                  );
                                  totalLandingRate +=
                                    landingRate *
                                    formatNumber(reward.quantity_free);
                                });
                                formData.gifts.forEach((gift) => {
                                  const pricing = productPricings[gift.product];
                                  const product = products.find(
                                    (p) => p.id === parseInt(gift.product),
                                  );
                                  const landingRate = formatNumber(
                                    pricing?.landing_rate ??
                                    product?.landing_rate ??
                                    0,
                                  );
                                  totalLandingRate +=
                                    landingRate * formatNumber(gift.quantity);
                                });

                                let totalComboPrice = 0;
                                formData.items.forEach((item) => {
                                  const pricing = productPricings[item.product];
                                  const product = products.find(
                                    (p) => p.id === parseInt(item.product),
                                  );
                                  const saleRate = formatNumber(
                                    pricing?.sale_rate ?? product?.price ?? 0,
                                  );
                                  totalComboPrice +=
                                    saleRate *
                                    formatNumber(item.quantity_required);
                                });
                                formData.rewards.forEach((reward) => {
                                  const pricing =
                                    productPricings[reward.product];
                                  const product = products.find(
                                    (p) => p.id === parseInt(reward.product),
                                  );
                                  const saleRate = formatNumber(
                                    pricing?.sale_rate ?? product?.price ?? 0,
                                  );
                                  totalComboPrice +=
                                    saleRate *
                                    formatNumber(reward.quantity_free);
                                });
                                formData.gifts.forEach((gift) => {
                                  const pricing = productPricings[gift.product];
                                  const product = products.find(
                                    (p) => p.id === parseInt(gift.product),
                                  );
                                  const saleRate = formatNumber(
                                    pricing?.sale_rate ?? product?.price ?? 0,
                                  );
                                  totalComboPrice +=
                                    saleRate * formatNumber(gift.quantity);
                                });

                                const profitMarginPercent =
                                  totalLandingRate > 0
                                    ? ((totalComboPrice - totalLandingRate) /
                                      totalLandingRate) *
                                    100
                                    : 0;
                                const profitMarginAmount =
                                  totalComboPrice - totalLandingRate;

                                return (
                                  <div className="flex flex-col items-end justify-center text-right font-bold gap-1 min-w-[70px]">
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded font-bold ${profitMarginPercent >= 0
                                          ? "text-purple-700 bg-purple-50"
                                          : "text-red-700 bg-red-50"
                                        }`}
                                    >
                                      {profitMarginPercent.toFixed(2)}%
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold ${profitMarginAmount >= 0
                                          ? "text-purple-600"
                                          : "text-red-500"
                                        }`}
                                    >
                                      ₹{profitMarginAmount.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-base font-semibold">
                        Cost Breakdown
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead className="bg-[#1a2332] text-white">
                          <tr>
                            <th className="px-2 py-1.5 text-left">Packing</th>
                            <th className="px-2 py-1.5 text-left">Extra 1</th>
                            <th className="px-2 py-1.5 text-left">Handling</th>
                            <th className="px-2 py-1.5 text-left">Delivery</th>
                            <th className="px-2 py-1.5 text-left">Extra</th>
                            <th className="px-2 py-1.5 text-left">
                              Total Charges
                            </th>
                            {/* <th className="px-2 py-1.5 text-left">
            Grand Total Landing Rate
          </th> */}
                            <th className="px-2 py-1.5 text-left">
                              Calculated Price
                            </th>
                            <th className="px-2 py-1.5 text-left">
                              Manual Price
                            </th>
                            <th className="px-2 py-1.5 text-left">Profit %</th>
                            <th className="px-2 py-1.5 text-left">Profit ₹</th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              Type/Value
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              Type/Value
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              Type/Value
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              Type/Value
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              Type/Value
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              (₹)
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              (₹)
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              (₹)
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              (%)
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500">
                              (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t bg-white">
                            {/* Packing */}
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      parking_charge_type:
                                        formData.parking_charge_type ===
                                          "rupees"
                                          ? "percent"
                                          : "rupees",
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  {formData.parking_charge_type === "percent"
                                    ? "%"
                                    : "₹"}
                                </button>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.parking_charge_value || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      parking_charge_value: e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0,
                                    })
                                  }
                                  className="w-16 px-1 py-0.5 border rounded text-xs"
                                  placeholder="0"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                = ₹
                                {formCalculations.charges.parking?.toFixed(2) ||
                                  "0.00"}
                              </div>
                            </td>

                            {/* Extra 1 (Transport) */}
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      transportation_charge_type:
                                        formData.transportation_charge_type ===
                                          "rupees"
                                          ? "percent"
                                          : "rupees",
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  {formData.transportation_charge_type ===
                                    "percent"
                                    ? "%"
                                    : "₹"}
                                </button>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={
                                    formData.transportation_charge_value || ""
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      transportation_charge_value: e.target
                                        .value
                                        ? parseFloat(e.target.value)
                                        : 0,
                                    })
                                  }
                                  className="w-16 px-1 py-0.5 border rounded text-xs"
                                  placeholder="0"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                = ₹
                                {formCalculations.charges.transportation?.toFixed(
                                  2,
                                ) || "0.00"}
                              </div>
                            </td>

                            {/* Handling */}
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      handling_charge_type:
                                        formData.handling_charge_type ===
                                          "rupees"
                                          ? "percent"
                                          : "rupees",
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  {formData.handling_charge_type === "percent"
                                    ? "%"
                                    : "₹"}
                                </button>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.handling_charge_value || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      handling_charge_value: e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0,
                                    })
                                  }
                                  className="w-16 px-1 py-0.5 border rounded text-xs"
                                  placeholder="0"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                = ₹
                                {formCalculations.charges.handling?.toFixed(
                                  2,
                                ) || "0.00"}
                              </div>
                            </td>

                            {/* Delivery */}
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      delivery_charge_type:
                                        formData.delivery_charge_type ===
                                          "rupees"
                                          ? "percent"
                                          : "rupees",
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  {formData.delivery_charge_type === "percent"
                                    ? "%"
                                    : "₹"}
                                </button>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.delivery_charge_value || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      delivery_charge_value: e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0,
                                    })
                                  }
                                  className="w-16 px-1 py-0.5 border rounded text-xs"
                                  placeholder="0"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                = ₹
                                {formCalculations.charges.delivery?.toFixed(
                                  2,
                                ) || "0.00"}
                              </div>
                            </td>

                            {/* Extra */}
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      extra_charge_type:
                                        formData.extra_charge_type === "rupees"
                                          ? "percent"
                                          : "rupees",
                                    });
                                  }}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 rounded hover:bg-gray-200"
                                >
                                  {formData.extra_charge_type === "percent"
                                    ? "%"
                                    : "₹"}
                                </button>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.extra_charge_value || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      extra_charge_value: e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0,
                                    })
                                  }
                                  className="w-16 px-1 py-0.5 border rounded text-xs"
                                  placeholder="0"
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                = ₹
                                {formCalculations.charges.extra?.toFixed(2) ||
                                  "0.00"}
                              </div>
                            </td>

                            {/* Total Charges */}
                            <td className="px-2 py-1.5 font-semibold text-blue-600">
                              ₹
                              {typeof formCalculations.charges.totalCharges ===
                                "number"
                                ? formCalculations.charges.totalCharges.toFixed(
                                  2,
                                )
                                : "0.00"}
                            </td>

                            {/* Grand Total Landing Rate (All items + rewards + gifts) */}
                            {/* <td className="px-2 py-1.5 font-semibold text-green-600 bg-green-50">
            ₹{formCalculations.totalLandingRate.toFixed(2)}
            <div className="text-xs text-gray-500 font-normal mt-0.5">
              (Items + Rewards + Gifts)
            </div>
          </td> */}

                            {/* Calculated Price = Grand Total Landing Rate + Total Charges */}
                            <td className="px-2 py-1.5 font-semibold text-blue-700 bg-blue-50">
                              ₹{formCalculations.calculatedPriceWithCharges.toFixed(2)}
                              <div className="text-xs text-gray-500 font-normal mt-0.5">
                                Landing Rate + Charges
                              </div>
                            </td>

                            {/* Manual Price */}
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                step="0.01"
                                value={formData.manual_combo_price}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    manual_combo_price: e.target.value,
                                  })
                                }
                                className="w-24 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                placeholder="0.00"
                              />
                              <div className="text-xs text-gray-500 mt-0.5">
                                Enter custom price
                              </div>
                            </td>

                            {/* Profit % - Based on Grand Total Landing Rate */}
                            <td className="px-2 py-1.5">
                              <span
                                className={`font-semibold ${formCalculations.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {formCalculations.profitMargin.toFixed(1)}%
                              </span>
                              <div className="text-xs text-gray-500 mt-0.5">
                                vs Landing Rate
                              </div>
                            </td>

                            {/* Profit ₹ */}
                            <td className="px-2 py-1.5">
                              <span className="font-semibold">
                                ₹{formCalculations.profitAmount.toFixed(2)}
                              </span>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formCalculations.sellingPrice >
                                  formCalculations.totalLandingRate
                                  ? "Profit"
                                  : "Loss"}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a2332] text-white rounded-lg hover:bg-[#0d1421] text-sm"
                >
                  {editingCombination ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCombinations;
