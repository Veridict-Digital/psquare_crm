import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  CreditCard,
  User,
  Package,
  DollarSign,
  ShoppingCart,
  IndianRupee,
  X,
  MapPin,
  Filter,
  ChevronDown,
  Gift,
  Maximize2,
  Minus,
  ArrowLeft,
  Calendar,
  FileText,
  Printer,
} from "lucide-react";

const ComboQuantityInput = ({ combo, initialQty, onUpdateQuantity, onRemove }) => {
  const [localValue, setLocalValue] = useState(String(initialQty));
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(String(initialQty));
  }, [initialQty]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalValue(val);

    if (val === '') return;
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateQuantity(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(localValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      onRemove();
    } else {
      onUpdateQuantity(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="number"
      min="0"
      value={localValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-12 text-center text-xs font-medium border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 h-6 px-1 flex-shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
};

const ComboOffersTable = ({
  combinations,
  showActions = true,
  showGrandTotals = false,
  excludeApplied = false,
  appliedCombos = [],
  products = [],
  comboSortOrder = 'desc',
  setComboSortOrder,
  calculateComboSavings,
  applyCombo,
  updateComboQuantity,
  removeCombo,
  getFilteredCombinations,
}) => {
  const filteredCombos = excludeApplied ? getFilteredCombinations(combinations) : combinations;

  const displayCombos = excludeApplied
    ? filteredCombos.filter(combo => !appliedCombos.some(ac => String(ac.comboId || ac.combo_id) === String(combo.id)))
    : filteredCombos;

  const getPaidQty = (combo) => {
    return combo.items?.reduce((sum, item) => sum + (parseInt(item.quantity_required) || 0), 0) || 0;
  };

  const sortedDisplayCombos = [...displayCombos].sort((a, b) => {
    const qtyA = getPaidQty(a);
    const qtyB = getPaidQty(b);
    if (qtyA !== qtyB) {
      return comboSortOrder === 'desc' ? qtyB - qtyA : qtyA - qtyB;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  // Calculate Grand Totals based on applied quantities of combinations in this table
  let totalPurchaseQty = 0;
  let totalPurchaseMrp = 0;
  let totalPurchaseOffer = 0;

  let totalFreeQty = 0;
  let totalFreeMrp = 0;
  let totalFreeSave = 0;

  let totalGiftQty = 0;
  let totalGiftMrp = 0;

  let totalRegular = 0;
  let totalCombo = 0;
  let totalSavings = 0;

  sortedDisplayCombos.forEach((combo) => {
    const appliedQuantity = appliedCombos.find(c => {
      const comboId = c.comboId || c.combo_id;
      return String(comboId) === String(combo.id);
    })?.quantity || 0;

    if (appliedQuantity > 0) {
      const firstRequiredItem = combo.items?.[0];
      const firstFreeItem = combo.rewards?.[0];
      const firstGiftItem = combo.gifts?.[0];

      const requiredProduct = firstRequiredItem ? products?.find(p => p.id === firstRequiredItem.product) : null;
      const freeProduct = firstFreeItem ? products?.find(p => p.id === firstFreeItem.product) : null;
      const giftProduct = firstGiftItem ? products?.find(p => p.id === firstGiftItem.product) : null;

      const requiredProductMrp = requiredProduct?.pricing?.mrp !== undefined && requiredProduct?.pricing?.mrp !== null
        ? parseFloat(requiredProduct.pricing.mrp)
        : parseFloat(requiredProduct?.mrp || requiredProduct?.price || 0);

      const freeProductMrp = freeProduct?.pricing?.mrp !== undefined && freeProduct?.pricing?.mrp !== null
        ? parseFloat(freeProduct.pricing.mrp)
        : parseFloat(freeProduct?.mrp || freeProduct?.price || 0);

      const giftProductMrp = giftProduct?.pricing?.mrp !== undefined && giftProduct?.pricing?.mrp !== null
        ? parseFloat(giftProduct.pricing.mrp)
        : parseFloat(giftProduct?.mrp || giftProduct?.price || 0);

      // Purchase Products
      if (firstRequiredItem) {
        totalPurchaseQty += firstRequiredItem.quantity_required * appliedQuantity;
        totalPurchaseMrp += requiredProductMrp * firstRequiredItem.quantity_required * appliedQuantity;
        if (combo.manual_combo_price !== undefined && combo.manual_combo_price !== null && parseFloat(combo.manual_combo_price) > 0) {
          totalPurchaseOffer += parseFloat(combo.manual_combo_price) * appliedQuantity;
        } else {
          const offerPrice = firstRequiredItem.offer_price
            ? parseFloat(firstRequiredItem.offer_price)
            : (requiredProduct?.pricing?.sale_rate !== undefined && requiredProduct?.pricing?.sale_rate !== null
              ? parseFloat(requiredProduct.pricing.sale_rate)
              : parseFloat(requiredProduct?.price || 0));
          totalPurchaseOffer += offerPrice * firstRequiredItem.quantity_required * appliedQuantity;
        }
      }

      // Free Products
      if (firstFreeItem) {
        totalFreeQty += firstFreeItem.quantity_free * appliedQuantity;
        totalFreeMrp += freeProductMrp * firstFreeItem.quantity_free * appliedQuantity;
        totalFreeSave += freeProductMrp * firstFreeItem.quantity_free * appliedQuantity;
      }

      // Gifts
      if (giftProduct) {
        const giftQty = firstGiftItem?.quantity || 1;
        totalGiftQty += giftQty * appliedQuantity;
        totalGiftMrp += giftProductMrp * giftQty * appliedQuantity;
      }

      // Savings & Totals
      const savingsObj = calculateComboSavings(combo, appliedQuantity);
      totalRegular += savingsObj.regularTotal;
      totalCombo += savingsObj.offerTotal;
      totalSavings += savingsObj.savings;
    }
  });

  const totalSavingsPercentage = totalRegular > 0 ? ((totalRegular - totalCombo) / totalRegular * 100).toFixed(1) : 0;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-[#1a2332]">
          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-white">Combo</th>
          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-white" colSpan="5">Purchase Product</th>
          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-white" colSpan="5">Free Product</th>
          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-white" colSpan="4">Gift Product</th>
          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-white" colSpan="3">Total</th>
          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-white">Action</th>
        </tr>
        <tr className="bg-[#1a2332]">
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white"></th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Product</th>
          <th 
            className="border border-gray-300 px-4 py-1 text-xs font-semibold text-white cursor-pointer hover:bg-gray-700 transition-colors select-none"
            onClick={() => setComboSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            title="Click to sort by purchase product quantity"
          >
            <div className="flex items-center justify-center gap-0.5">
              <span>Qty</span>
              <span>{comboSortOrder === 'desc' ? '▼' : '▲'}</span>
            </div>
          </th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">MRP</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Offer Price</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Total Offer</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Product</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Qty</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">MRP</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">You Save</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Total Save</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Product</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Qty</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">MRP</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Total MRP</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Total Mrp</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">You pay</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">You Save</th>
          <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white"></th>
        </tr>
      </thead>
      <tbody>
        {sortedDisplayCombos.map((combo) => {
          const isApplied = appliedCombos.some(c => {
            const comboId = c.comboId || c.combo_id;
            return String(comboId) === String(combo.id);
          });
          const appliedQuantity = appliedCombos.find(c => {
            const comboId = c.comboId || c.combo_id;
            return String(comboId) === String(combo.id);
          })?.quantity || 0;

          const firstRequiredItem = combo.items?.[0];
          const firstFreeItem = combo.rewards?.[0];
          const firstGiftItem = combo.gifts?.[0];

          const requiredProduct = firstRequiredItem ? products?.find(p => p.id === firstRequiredItem.product) : null;
          const freeProduct = firstFreeItem ? products?.find(p => p.id === firstFreeItem.product) : null;
          const giftProduct = firstGiftItem ? products?.find(p => p.id === firstGiftItem.product) : null;

          const requiredProductMrp = requiredProduct?.pricing?.mrp !== undefined && requiredProduct?.pricing?.mrp !== null
            ? parseFloat(requiredProduct.pricing.mrp)
            : parseFloat(requiredProduct?.mrp || requiredProduct?.price || 0);

          const freeProductMrp = freeProduct?.pricing?.mrp !== undefined && freeProduct?.pricing?.mrp !== null
            ? parseFloat(freeProduct.pricing.mrp)
            : parseFloat(freeProduct?.mrp || freeProduct?.price || 0);

          const giftProductMrp = giftProduct?.pricing?.mrp !== undefined && giftProduct?.pricing?.mrp !== null
            ? parseFloat(giftProduct.pricing.mrp)
            : parseFloat(giftProduct?.mrp || giftProduct?.price || 0);

          return (
            <tr key={combo.id} className={`${isApplied ? 'bg-green-50' : ''} hover:bg-gray-50`}>
              <td className="border border-gray-300 px-4 py-3">
                <div className="font-medium text-gray-900">{combo.name}</div>
                {isApplied && (
                  <div className="text-xs text-green-600 mt-1">Quantity: {appliedQuantity}</div>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm">
                {requiredProduct?.title || '-'}
                {combo.items?.length > 1 && <span className="ml-1 text-xs text-gray-500">+{combo.items.length - 1} more</span>}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                {firstRequiredItem?.quantity_required || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                {requiredProduct ? `₹${requiredProductMrp.toFixed(2)}` : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-600 font-medium">
                {firstRequiredItem?.offer_price ? `₹${parseFloat(firstRequiredItem.offer_price).toFixed(2)}` : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium">
                {firstRequiredItem ? (
                  (() => {
                    const qty = parseInt(firstRequiredItem.quantity_required) || 0;
                    const offer = firstRequiredItem.offer_price 
                      ? parseFloat(firstRequiredItem.offer_price)
                      : (requiredProduct?.pricing?.sale_rate !== undefined && requiredProduct?.pricing?.sale_rate !== null
                        ? parseFloat(requiredProduct.pricing.sale_rate)
                        : parseFloat(requiredProduct?.price || 0));
                    return `₹${(qty * offer).toFixed(2)}`;
                  })()
                ) : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm">
                {freeProduct?.title || '-'}
                {combo.rewards?.length > 1 && <span className="ml-1 text-xs text-gray-500">+{combo.rewards.length - 1} more</span>}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                {firstFreeItem?.quantity_free || '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                {freeProduct ? `₹${freeProductMrp.toFixed(2)}` : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-600 font-medium">
                {freeProduct ? `₹${freeProductMrp.toFixed(2)}` : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-600 font-medium">
                {freeProduct ? (
                  (() => {
                    const qty = parseInt(firstFreeItem?.quantity_free) || 0;
                    return `₹${(qty * freeProductMrp).toFixed(2)}`;
                  })()
                ) : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm">
                {giftProduct?.title || '-'}
                {combo.gifts?.length > 1 && <span className="ml-1 text-xs text-gray-500">+{combo.gifts.length - 1} more</span>}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                {giftProduct ? (firstGiftItem?.quantity || 1) : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                {giftProduct ? `₹${giftProductMrp.toFixed(2)}` : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                {giftProduct ? (
                  (() => {
                    const qty = parseInt(firstGiftItem?.quantity || 1) || 0;
                    return `₹${(qty * giftProductMrp).toFixed(2)}`;
                  })()
                ) : '-'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                ₹{calculateComboSavings(combo, 1).regularTotal.toFixed(2)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium text-green-600">
                ₹{calculateComboSavings(combo, 1).offerTotal.toFixed(2)}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <div className="text-sm font-medium text-green-700 text-right">
                  ₹{calculateComboSavings(combo, 1).savings.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 text-right">
                  ({calculateComboSavings(combo, 1).savingsPercentage}%)
                </div>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                {showActions && !isApplied && (
                  <button
                    type="button"
                    onClick={() => applyCombo(combo)}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 whitespace-nowrap"
                  >
                    Apply
                  </button>
                )}
                {showActions && isApplied && (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => updateComboQuantity(combo.id, appliedQuantity - 1, combo)}
                      className="w-6 h-6 bg-white rounded-full text-green-700 hover:bg-green-100 flex items-center justify-center border border-green-300 flex-shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <ComboQuantityInput
                      combo={combo}
                      initialQty={appliedQuantity}
                      onUpdateQuantity={(newQty) => updateComboQuantity(combo.id, newQty, combo)}
                      onRemove={() => removeCombo(combo.id)}
                    />
                    <button
                      type="button"
                      onClick={() => updateComboQuantity(combo.id, appliedQuantity + 1, combo)}
                      className="w-6 h-6 bg-white rounded-full text-green-700 hover:bg-green-100 flex items-center justify-center border border-green-300 flex-shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCombo(combo.id)}
                      className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
                      title="Remove combo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                   </div>
                )}
              </td>
            </tr>
          );
        })}
        {showGrandTotals && totalRegular > 0 && (
          <tr className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-400">
            <td className="border border-gray-300 px-4 py-3 text-gray-900 font-bold">
              Grand Totals
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm"></td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-center">
              {totalPurchaseQty > 0 ? totalPurchaseQty : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
              {totalPurchaseMrp > 0 ? `₹${totalPurchaseMrp.toFixed(2)}` : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm"></td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-700 font-bold">
              {totalPurchaseOffer > 0 ? `₹${totalPurchaseOffer.toFixed(2)}` : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm"></td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-center">
              {totalFreeQty > 0 ? totalFreeQty : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
              {totalFreeMrp > 0 ? `₹${totalFreeMrp.toFixed(2)}` : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm"></td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-700 font-bold">
              {totalFreeSave > 0 ? `₹${totalFreeSave.toFixed(2)}` : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm"></td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-center">
              {totalGiftQty > 0 ? totalGiftQty : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
              {totalGiftMrp > 0 ? `₹${totalGiftMrp.toFixed(2)}` : '-'}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold text-gray-900">
              ₹{totalRegular.toFixed(2)}
            </td>
            <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold text-green-700">
              ₹{totalCombo.toFixed(2)}
            </td>
            <td className="border border-gray-300 px-4 py-3 font-bold">
              <div className="text-sm font-bold text-green-700 text-right">
                ₹{totalSavings.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 text-right">
                ({totalSavingsPercentage}%)
              </div>
            </td>
            <td className="border border-gray-300 px-4 py-3"></td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const OrderNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlCustomerId = searchParams.get("customer");
  const urlCustomerName = searchParams.get("customer_name");
  const editMode = searchParams.get("mode") === "edit";
  const editOrderId = sessionStorage.getItem("orderEditId");

  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrencyNoDecimals = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const safeParseFloat = (val, fallback = 0) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  };

  const roundToTwoDecimals = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  };

  // Get active customer ID on mount
  const initialCustomerId = useMemo(() => {
    if (editMode) return "";
    return urlCustomerId || sessionStorage.getItem("orderNewLastActiveCustomerId") || "";
  }, [urlCustomerId, editMode]);

  // Helper to load initial values from customer-specific keys
  const getInitialDraft = (type, defaultVal) => {
    if (editMode) return defaultVal;
    const targetId = initialCustomerId.toString();
    const key = type === "form" 
      ? `orderNewFormData_${targetId || 'anonymous'}`
      : type === "items"
        ? `orderNewOrderItems_${targetId || 'anonymous'}`
        : `orderNewAppliedCombos_${targetId || 'anonymous'}`;
    const saved = sessionStorage.getItem(key);
    if (!saved) return defaultVal;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return defaultVal;
    }
  };

  // State initialization with edit mode support
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      customer: urlCustomerId || "",
      agent: "",
      status: "Placed",
      payment_status: "Advance",
      followup_date: "",
      partial_amount: 0,
      delivery_address: {
        house_flat_no: "",
        wing_lane: "",
        society_colony: "",
        landmark: "",
        area: "",
        pincode: "",
        state: "",
        district: "",
        tahsil: "",
        city: "",
      },
      delivery_option: "primary",
      order_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0],
    };
    if (editMode) {
      const savedEditData = sessionStorage.getItem("orderEditData");
      if (savedEditData) {
        const editData = JSON.parse(savedEditData);
        // Robust date fallback logic
        let orderDate = '';
        if (editData.formData && editData.formData.order_date && editData.formData.order_date !== null && editData.formData.order_date !== '' && !isNaN(new Date(editData.formData.order_date))) {
          orderDate = new Date(editData.formData.order_date).toISOString().split('T')[0];
        } else if (editData.formData && editData.formData.created_at && editData.formData.created_at !== null && editData.formData.created_at !== '' && !isNaN(new Date(editData.formData.created_at))) {
          orderDate = new Date(editData.formData.created_at).toISOString().split('T')[0];
        } else {
          orderDate = new Date().toISOString().split('T')[0];
        }
        return {
          ...editData.formData,
          order_date: orderDate,
        };
      }
    }
    if (!editMode) {
      const draft = getInitialDraft("form", null);
      if (draft) {
        if (urlCustomerId) {
          return { ...draft, customer: urlCustomerId };
        }
        return draft;
      }
    }
    return defaultData;
  });

  const [orderItems, setOrderItems] = useState(() => {
    if (editMode) {
      const savedEditData = sessionStorage.getItem("orderEditData");
      if (savedEditData) {
        const editData = JSON.parse(savedEditData);
        console.log('Loaded order items from edit data:', editData.orderItems);
        return editData.orderItems || [];
      }
    }
    return getInitialDraft("items", []);
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [appliedCombos, setAppliedCombos] = useState(() => {
    if (editMode) {
      const savedEditData = sessionStorage.getItem("orderEditData");
      if (savedEditData) {
        const editData = JSON.parse(savedEditData);
        console.log('Loading applied combos from edit data:', editData.appliedCombos);
        return editData.appliedCombos || [];
      }
    }
    return getInitialDraft("combos", []);
  });

  const [customerKPIs, setCustomerKPIs] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState("");
  const [savedDbOrderId, setSavedDbOrderId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productFilters, setProductFilters] = useState({
    category: "",
    priceRange: "",
    stockStatus: "",
    search: "",
  });

  const [showComboModal, setShowComboModal] = useState(false);
  const [showPurchaseComboModal, setShowPurchaseComboModal] = useState(false);
  const [filterPaid, setFilterPaid] = useState(true);
  const [filterFree, setFilterFree] = useState(false);
  const [filterGift, setFilterGift] = useState(false);
  const [comboSortOrder, setComboSortOrder] = useState('desc');
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  // Helper to switch drafts between customers
  const loadDraftForCustomer = (custId) => {
    const targetId = custId ? custId.toString() : "";
    const savedForm = sessionStorage.getItem(`orderNewFormData_${targetId || 'anonymous'}`);
    const defaultData = {
      customer: targetId,
      agent: "",
      status: "Placed",
      payment_status: "Advance",
      followup_date: "",
      partial_amount: 0,
      delivery_address: {
        house_flat_no: "",
        wing_lane: "",
        society_colony: "",
        landmark: "",
        area: "",
        pincode: "",
        state: "",
        district: "",
        tahsil: "",
        city: "",
      },
      delivery_option: "primary",
      order_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString().split('T')[0],
    };

    let newForm = defaultData;
    let newItems = [];
    let newCombos = [];

    if (savedForm) {
      try {
        newForm = JSON.parse(savedForm);
        newItems = JSON.parse(sessionStorage.getItem(`orderNewOrderItems_${targetId || 'anonymous'}`) || "[]");
        newCombos = JSON.parse(sessionStorage.getItem(`orderNewAppliedCombos_${targetId || 'anonymous'}`) || "[]");
      } catch (e) {
        console.error("Error parsing saved draft for customer " + targetId, e);
      }
    }

    setFormData(newForm);
    setOrderItems(newItems);
    setAppliedCombos(newCombos);
    sessionStorage.setItem("orderNewLastActiveCustomerId", targetId);
  };

  // Clear combo filters if no product is selected (with purchase product default selected)
  useEffect(() => {
    if (!selectedProduct) {
      setFilterPaid(true);
      setFilterFree(false);
      setFilterGift(false);
    }
  }, [selectedProduct]);

  // Persist to sessionStorage (only for new orders, not edit mode)
  useEffect(() => {
    if (!editMode) {
      const targetId = formData.customer ? formData.customer.toString() : "";
      sessionStorage.setItem(`orderNewFormData_${targetId || 'anonymous'}`, JSON.stringify(formData));
      sessionStorage.setItem("orderNewLastActiveCustomerId", targetId);
    }
  }, [formData, editMode]);

  useEffect(() => {
    if (!editMode) {
      const targetId = formData.customer ? formData.customer.toString() : "";
      sessionStorage.setItem(`orderNewOrderItems_${targetId || 'anonymous'}`, JSON.stringify(orderItems));
    }
  }, [orderItems, formData.customer, editMode]);

  useEffect(() => {
    if (!editMode) {
      const targetId = formData.customer ? formData.customer.toString() : "";
      sessionStorage.setItem(`orderNewAppliedCombos_${targetId || 'anonymous'}`, JSON.stringify(appliedCombos));
    }
  }, [appliedCombos, formData.customer, editMode]);

  // Log for debugging
  useEffect(() => {
    if (editMode) {
      console.log('=== EDIT MODE DEBUG ===');
      console.log('Order Items:', orderItems);
      console.log('Applied Combos:', appliedCombos);
      // Calculate and log total from items
      const totalFromItems = orderItems.reduce((sum, item) => {
        if (!item.is_free && !item.is_gift) {
          return sum + (item.unit_price * item.quantity);
        }
        return sum;
      }, 0);
      console.log('Total from items:', totalFromItems);
    }
  }, [editMode, orderItems, appliedCombos]);

  // Fetch data with staleTime to cache products, combinations and customers for snappy performance
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => axios.get("/api/customers/?page_size=1000").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: urlCustomer } = useQuery({
    queryKey: ["customer", urlCustomerId],
    queryFn: () => axios.get(`/api/customers/${urlCustomerId}/`).then((res) => res.data),
    enabled: !!urlCustomerId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => axios.get("/api/products/").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const selectedProductObj = useMemo(() => {
    if (!selectedProduct) return null;
    return products?.find(p => p.id === parseInt(selectedProduct));
  }, [products, selectedProduct]);

  const { data: combinations } = useQuery({
    queryKey: ["combinations"],
    queryFn: () => axios.get("/api/productcombinations/").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  // Server-side search for customers
  useEffect(() => {
    if (customerDropdownOpen && customerSearch.length > 0) {
      setCustomerSearchLoading(true);
      axios.get(`/api/customers/?search=${encodeURIComponent(customerSearch)}&page_size=20`)
        .then(res => {
          setCustomerSearchResults(res.data.results || res.data || []);
        })
        .catch(() => setCustomerSearchResults([]))
        .finally(() => setCustomerSearchLoading(false));
    } else {
      setCustomerSearchResults([]);
    }
  }, [customerSearch, customerDropdownOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setCustomerDropdownOpen(false);
        setCustomerSearch("");
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setProductDropdownOpen(false);
        setProductSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-assign agent and set address based on customer selection
  useEffect(() => {
    if (formData.customer) {
      // Find the selected customer in either urlCustomer or customers list
      const selectedCustomer = (urlCustomer && urlCustomer.id.toString() === formData.customer.toString())
        ? urlCustomer
        : (customers ? (customers?.results || customers || []).find(
          (c) => c.id.toString() === formData.customer.toString()
        ) : null);

      if (selectedCustomer) {
        setFormData((prev) => {
          // Avoid setting state if nothing changed (prevents potential loops)
          if (prev.agent === selectedCustomer.agent) return prev;
          return {
            ...prev,
            agent: selectedCustomer.agent || "",
          };
        });

        if (formData.delivery_option === "primary") {
          setFormData((prev) => {
            // Avoid setting state if address is already loaded/matched
            if (
              prev.delivery_address.pincode === selectedCustomer.pincode &&
              prev.delivery_address.city === selectedCustomer.city
            ) {
              return prev;
            }
            return {
              ...prev,
              delivery_address: {
                house_flat_no: selectedCustomer.house_flat_no || '',
                wing_lane: selectedCustomer.wing_lane || '',
                society_colony: selectedCustomer.society_colony || '',
                landmark: selectedCustomer.landmark || '',
                area: selectedCustomer.area || '',
                pincode: selectedCustomer.pincode || '',
                state: selectedCustomer.state || '',
                district: selectedCustomer.district || '',
                tahsil: selectedCustomer.tahsil || '',
                city: selectedCustomer.city || '',
              }
            };
          });
        }

        setCustomerKPIs({
          totalOrders: Math.floor(Math.random() * 50) + 1,
          totalValue: Math.floor(Math.random() * 50000) + 1000,
          averageOrderValue: Math.floor(Math.random() * 2000) + 500,
        });
      }
    }
  }, [formData.customer, customers, urlCustomer, formData.delivery_option]);

  // ========== FORM HANDLERS ==========
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('delivery_address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        delivery_address: {
          ...prev.delivery_address,
          [field]: value
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "payment_status") {
      if (value === "Credit") {
        const today = new Date();
        const followupDate = new Date(today.setDate(today.getDate() + 30))
          .toISOString()
          .split("T")[0];
        setFormData((prev) => ({ ...prev, followup_date: followupDate, partial_amount: 0 }));
      } else {
        setFormData((prev) => ({ ...prev, followup_date: "", partial_amount: 0 }));
      }
    }

    if (name === "delivery_option") {
      if (value === "primary" && formData.customer && customers) {
        const allCustomers = customers?.results || customers || [];
        const customer = allCustomers.find(
          (c) => c.id.toString() === formData.customer.toString()
        );
        if (customer) {
          setFormData((prev) => ({
            ...prev,
            delivery_address: {
              house_flat_no: customer.house_flat_no || '',
              wing_lane: customer.wing_lane || '',
              society_colony: customer.society_colony || '',
              landmark: customer.landmark || '',
              area: customer.area || '',
              pincode: customer.pincode || '',
              state: customer.state || '',
              district: customer.district || '',
              tahsil: customer.tahsil || '',
              city: customer.city || '',
            }
          }));
        }
      } else if (value === "custom") {
        setFormData((prev) => ({
          ...prev,
          delivery_address: {
            house_flat_no: '',
            wing_lane: '',
            society_colony: '',
            landmark: '',
            area: '',
            pincode: '',
            state: '',
            district: '',
            tahsil: '',
            city: '',
          }
        }));
      }
    }
  };

  // Calculate combo savings (used for display)
  const calculateComboSavings = useCallback((combo, quantity = 1) => {
    let regularTotal = 0;
    let offerTotal = 0;

    combo.items?.forEach((item) => {
      const product = products?.find(p => p.id === item.product);
      if (product) {
        const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
          ? parseFloat(product.pricing.mrp)
          : parseFloat(product.mrp || product.price || 0);

        regularTotal += mrpVal * item.quantity_required * quantity;
      }
    });

    if (combo.manual_combo_price !== undefined && combo.manual_combo_price !== null && parseFloat(combo.manual_combo_price) > 0) {
      offerTotal = parseFloat(combo.manual_combo_price) * quantity;
    } else {
      combo.items?.forEach((item) => {
        const product = products?.find(p => p.id === item.product);
        if (product) {
          const saleVal = product.pricing?.sale_rate !== undefined && product.pricing?.sale_rate !== null
            ? parseFloat(product.pricing.sale_rate)
            : parseFloat(product.price || 0);

          if (item.offer_price && item.offer_price > 0) {
            offerTotal += parseFloat(item.offer_price) * item.quantity_required * quantity;
          } else {
            offerTotal += saleVal * item.quantity_required * quantity;
          }
        }
      });
    }

    combo.rewards?.forEach((reward) => {
      const product = products?.find(p => p.id === reward.product);
      if (product) {
        const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
          ? parseFloat(product.pricing.mrp)
          : parseFloat(product.mrp || product.price || 0);

        regularTotal += mrpVal * reward.quantity_free * quantity;
      }
    });

    combo.gifts?.forEach((gift) => {
      const product = products?.find(p => p.id === gift.product);
      if (product) {
        const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
          ? parseFloat(product.pricing.mrp)
          : parseFloat(product.mrp || product.price || 0);

        regularTotal += mrpVal * (gift.quantity || 1) * quantity;
      }
    });

    return {
      regularTotal,
      offerTotal,
      savings: regularTotal - offerTotal,
      savingsPercentage: regularTotal > 0 ? ((regularTotal - offerTotal) / regularTotal * 100).toFixed(1) : 0
    };
  }, [products]);

  // Apply combo - adds items to order
  const applyCombo = useCallback((combo) => {
    const requiredItems = combo.items || [];
    const rewardItems = combo.rewards || [];
    const giftItems = combo.gifts || [];

    setOrderItems((prev) => {
      let newItems = [...prev];

      requiredItems.forEach((reqItem) => {
        const product = products?.find((p) => p.id === reqItem.product);
        if (!product) return;

        const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
          ? parseFloat(product.pricing.mrp)
          : parseFloat(product.mrp || product.price || 0);

        const saleVal = product.pricing?.sale_rate !== undefined && product.pricing?.sale_rate !== null
          ? parseFloat(product.pricing.sale_rate)
          : parseFloat(product.price || 0);

        const existingItemIndex = newItems.findIndex(
          (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
        );

        if (existingItemIndex !== -1) {
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + reqItem.quantity_required,
            unit_price: reqItem.offer_price && reqItem.offer_price > 0
              ? parseFloat(reqItem.offer_price)
              : newItems[existingItemIndex].unit_price,
            original_price: newItems[existingItemIndex].original_price || mrpVal,
          };
        } else {
          newItems.push({
            product: product.id,
            product_title: product.title,
            product_sku: product.sku,
            quantity: reqItem.quantity_required,
            unit_price: reqItem.offer_price && reqItem.offer_price > 0
              ? parseFloat(reqItem.offer_price)
              : saleVal,
            original_price: mrpVal,
            gst_rate: product.gst_rate,
            gst_rate_value: parseFloat(product.gst_rate_display || 0),
            image: product.image,
          });
        }
      });

      rewardItems.forEach((reward) => {
        const product = products?.find((p) => p.id === reward.product);
        if (!product) return;

        const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
          ? parseFloat(product.pricing.mrp)
          : parseFloat(product.mrp || product.price || 0);

        const existingFreeIndex = newItems.findIndex(
          (item) => item.product === reward.product && item.is_free
        );

        if (existingFreeIndex !== -1) {
          newItems[existingFreeIndex] = {
            ...newItems[existingFreeIndex],
            quantity: newItems[existingFreeIndex].quantity + reward.quantity_free,
          };
        } else {
          newItems.push({
            product: product.id,
            product_title: `${product.title} (FREE)`,
            product_sku: product.sku,
            quantity: reward.quantity_free,
            unit_price: 0,
            original_price: mrpVal,
            gst_rate: product.gst_rate,
            gst_rate_value: parseFloat(product.gst_rate_display || 0),
            is_free: true,
            combo_id: combo.id,
            image: product.image,
          });
        }
      });

      giftItems.forEach((gift) => {
        const product = products?.find((p) => p.id === gift.product);
        if (!product) return;

        const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
          ? parseFloat(product.pricing.mrp)
          : parseFloat(product.mrp || product.price || 0);

        const giftQty = gift.quantity || 1;

        const existingGiftIndex = newItems.findIndex(
          (item) => item.product === gift.product && item.is_gift
        );

        if (existingGiftIndex !== -1) {
          newItems[existingGiftIndex] = {
            ...newItems[existingGiftIndex],
            quantity: newItems[existingGiftIndex].quantity + giftQty,
          };
        } else {
          newItems.push({
            product: product.id,
            product_title: `${product.title} (GIFT)`,
            product_sku: product.sku,
            quantity: giftQty,
            unit_price: 0,
            original_price: mrpVal,
            gst_rate: product.gst_rate,
            gst_rate_value: parseFloat(product.gst_rate_display || 0),
            is_gift: true,
            combo_id: combo.id,
            image: product.image,
          });
        }
      });

      return newItems;
    });

    setAppliedCombos((prev) => {
      const existingComboIndex = prev.findIndex(c => String(c.comboId || c.combo_id) === String(combo.id));

      if (existingComboIndex !== -1) {
        const newCombos = [...prev];
        newCombos[existingComboIndex] = {
          ...newCombos[existingComboIndex],
          quantity: (newCombos[existingComboIndex].quantity || 1) + 1,
          items: prev[existingComboIndex].items || combo.items,
          rewards: prev[existingComboIndex].rewards || combo.rewards,
          gifts: prev[existingComboIndex].gifts || combo.gifts
        };
        return newCombos;
      } else {
        return [...prev, {
          comboId: combo.id,
          combo_id: combo.id,
          quantity: 1,
          name: combo.name,
          items: combo.items,
          rewards: combo.rewards,
          gifts: combo.gifts
        }];
      }
    });
  }, [products]);

  const updateComboQuantity = useCallback((comboId, newQuantity, combo) => {
    if (newQuantity <= 0) {
      removeCombo(comboId);
      return;
    }

    const existingCombo = appliedCombos.find(c => String(c.comboId || c.combo_id) === String(comboId));
    if (!existingCombo) return;

    const quantityDiff = newQuantity - existingCombo.quantity;

    if (quantityDiff > 0) {
      for (let i = 0; i < quantityDiff; i++) {
        combo.items?.forEach((reqItem) => {
          const product = products?.find((p) => p.id === reqItem.product);
          if (!product) return;

          setOrderItems((prev) => {
            const existingItemIndex = prev.findIndex(
              (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
            );

            if (existingItemIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingItemIndex].quantity + reqItem.quantity_required;

              if (newQuantity <= 0) {
                newItems.splice(existingItemIndex, 1);
              } else {
                newItems[existingItemIndex] = {
                  ...newItems[existingItemIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });

        combo.rewards?.forEach((reward) => {
          setOrderItems((prev) => {
            const existingFreeIndex = prev.findIndex(
              (item) => item.product === reward.product && item.is_free
            );

            if (existingFreeIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingFreeIndex].quantity + reward.quantity_free;

              if (newQuantity <= 0) {
                newItems.splice(existingFreeIndex, 1);
              } else {
                newItems[existingFreeIndex] = {
                  ...newItems[existingFreeIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });

        combo.gifts?.forEach((gift) => {
          setOrderItems((prev) => {
            const existingGiftIndex = prev.findIndex(
              (item) => item.product === gift.product && item.is_gift
            );

            if (existingGiftIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingGiftIndex].quantity + 1;

              if (newQuantity <= 0) {
                newItems.splice(existingGiftIndex, 1);
              } else {
                newItems[existingGiftIndex] = {
                  ...newItems[existingGiftIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });
      }
    } else if (quantityDiff < 0) {
      const instancesToRemove = Math.abs(quantityDiff);

      for (let i = 0; i < instancesToRemove; i++) {
        combo.items?.forEach((reqItem) => {
          setOrderItems((prev) => {
            const existingItemIndex = prev.findIndex(
              (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
            );

            if (existingItemIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingItemIndex].quantity - reqItem.quantity_required;

              if (newQuantity <= 0) {
                newItems.splice(existingItemIndex, 1);
              } else {
                newItems[existingItemIndex] = {
                  ...newItems[existingItemIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });

        combo.rewards?.forEach((reward) => {
          setOrderItems((prev) => {
            const existingFreeIndex = prev.findIndex(
              (item) => item.product === reward.product && item.is_free
            );

            if (existingFreeIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingFreeIndex].quantity - reward.quantity_free;

              if (newQuantity <= 0) {
                newItems.splice(existingFreeIndex, 1);
              } else {
                newItems[existingFreeIndex] = {
                  ...newItems[existingFreeIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });

        combo.gifts?.forEach((gift) => {
          setOrderItems((prev) => {
            const existingGiftIndex = prev.findIndex(
              (item) => item.product === gift.product && item.is_gift
            );

            if (existingGiftIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingGiftIndex].quantity - 1;

              if (newQuantity <= 0) {
                newItems.splice(existingGiftIndex, 1);
              } else {
                newItems[existingGiftIndex] = {
                  ...newItems[existingGiftIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });
      }
    }

    setAppliedCombos((prev) =>
      prev.map(c =>
        (c.comboId === comboId || c.combo_id === comboId)
          ? { ...c, quantity: newQuantity }
          : c
      )
    );
  }, [products, appliedCombos]);

  const removeCombo = useCallback((comboId) => {
    const combo = combinations?.find(c => c.id === comboId);
    if (!combo) return;

    const existingCombo = appliedCombos.find(c => (c.comboId === comboId) || (c.combo_id === comboId));
    if (!existingCombo) return;

    for (let i = 0; i < existingCombo.quantity; i++) {
      combo.items?.forEach((reqItem) => {
        setOrderItems((prev) => {
          const existingItemIndex = prev.findIndex(
            (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
          );

          if (existingItemIndex !== -1) {
            const newItems = [...prev];
            const newQuantity = newItems[existingItemIndex].quantity - reqItem.quantity_required;

            if (newQuantity <= 0) {
              newItems.splice(existingItemIndex, 1);
            } else {
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: newQuantity,
              };
            }
            return newItems;
          }
          return prev;
        });
      });

      combo.rewards?.forEach((reward) => {
        setOrderItems((prev) => {
          const existingFreeIndex = prev.findIndex(
            (item) => item.product === reward.product && item.is_free
          );

          if (existingFreeIndex !== -1) {
            const newItems = [...prev];
            const newQuantity = newItems[existingFreeIndex].quantity - reward.quantity_free;

            if (newQuantity <= 0) {
              newItems.splice(existingFreeIndex, 1);
            } else {
              newItems[existingFreeIndex] = {
                ...newItems[existingFreeIndex],
                quantity: newQuantity,
              };
            }
            return newItems;
          }
          return prev;
        });
      });

      combo.gifts?.forEach((gift) => {
        setOrderItems((prev) => {
          const existingGiftIndex = prev.findIndex(
            (item) => item.product === gift.product && item.is_gift
          );

          if (existingGiftIndex !== -1) {
            const newItems = [...prev];
            const newQuantity = newItems[existingGiftIndex].quantity - 1;

            if (newQuantity <= 0) {
              newItems.splice(existingGiftIndex, 1);
            } else {
              newItems[existingGiftIndex] = {
                ...newItems[existingGiftIndex],
                quantity: newQuantity,
              };
            }
            return newItems;
          }
          return prev;
        });
      });
    }

    setAppliedCombos((prev) => prev.filter(c =>
      (c.comboId !== comboId) && (c.combo_id !== comboId)
    ));
  }, [combinations, appliedCombos]);

  const addProduct = useCallback(() => {
    if (!selectedProduct || quantity <= 0 || !products) return;

    const product = products.find(
      (p) => p.id.toString() === selectedProduct.toString()
    );
    if (!product) return;

    setOrderItems((prev) => {
      const existingItem = prev.find((item) => item.product === product.id && !item.is_free && !item.is_gift);

      if (existingItem) {
        return prev.map((item) =>
          item.product === product.id && !item.is_free && !item.is_gift
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      const mrpVal = product.pricing?.mrp !== undefined && product.pricing?.mrp !== null
        ? parseFloat(product.pricing.mrp)
        : parseFloat(product.mrp || product.price || 0);

      const saleVal = product.pricing?.sale_rate !== undefined && product.pricing?.sale_rate !== null
        ? parseFloat(product.pricing.sale_rate)
        : parseFloat(product.price || 0);

      return [...prev, {
        product: product.id,
        product_title: product.title,
        product_sku: product.sku,
        quantity: quantity,
        unit_price: saleVal,
        original_price: mrpVal,
        gst_rate: product.gst_rate,
        gst_rate_value: !isNaN(parseFloat(product.gst_rate_display)) ? parseFloat(product.gst_rate_display) : 0,
        image: product.image,
      }];
    });

    setSelectedProduct("");
    setQuantity(1);
  }, [selectedProduct, quantity, products]);

  const removeProduct = useCallback((productId) => {
    setOrderItems((prev) => prev.filter((item) => item.product !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }

    setOrderItems((prev) =>
      prev.map((item) =>
        item.product === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [removeProduct]);

  // ========== MEMOIZED CALCULATIONS ==========
  const pricedOrderItems = useMemo(() => {
    if (!orderItems.length) return [];

    // 1. Initialize allocations maps
    const comboQuantityAllocated = {}; // productId -> quantity
    const comboBilledTotal = {}; // productId -> total adjusted amount

    // 2. Loop over applied combos to compute their quantities and adjust prices of items
    appliedCombos.forEach((ac) => {
      const comboId = ac.comboId || ac.combo_id;
      const comboQty = safeParseFloat(ac.quantity || 0);
      if (comboQty <= 0) return;

      const combo = combinations?.find((c) => c.id === comboId);
      if (!combo) return;

      // Loop over required items to find their regular values
      const comboItemsDetails = combo.items?.map((item) => {
        const product = products?.find((p) => p.id === item.product);
        const mrpVal = product?.pricing?.mrp !== undefined && product?.pricing?.mrp !== null
          ? safeParseFloat(product.pricing.mrp)
          : safeParseFloat(product?.mrp || product?.price || 0);

        const saleVal = product?.pricing?.sale_rate !== undefined && product?.pricing?.sale_rate !== null
          ? safeParseFloat(product.pricing.sale_rate)
          : safeParseFloat(product?.price || 0);

        const regularPricePerUnit = item.offer_price && safeParseFloat(item.offer_price) > 0
          ? safeParseFloat(item.offer_price)
          : saleVal;

        const qtyReq = safeParseFloat(item.quantity_required, 1);
        const itemRegularValue = regularPricePerUnit * qtyReq;

        return {
          productId: item.product,
          qtyRequired: qtyReq,
          regularPricePerUnit,
          itemRegularValue: isNaN(itemRegularValue) ? 0 : itemRegularValue,
        };
      }) || [];

      const totalRegularValue = comboItemsDetails.reduce((sum, item) => sum + (item.itemRegularValue || 0), 0);

      // Determine the offer total for 1 quantity of combo
      let offerTotalPerCombo = 0;
      if (combo.manual_combo_price !== undefined && combo.manual_combo_price !== null && safeParseFloat(combo.manual_combo_price) > 0) {
        offerTotalPerCombo = safeParseFloat(combo.manual_combo_price);
      } else {
        offerTotalPerCombo = totalRegularValue;
      }

      // Total offer total for all applied quantities of this combo
      const comboOfferTotal = offerTotalPerCombo * comboQty;
      const comboItemsCount = comboItemsDetails.length;

      // Distribute comboOfferTotal among the required items
      comboItemsDetails.forEach((item) => {
        let adjustedItemTotal = 0;
        if (totalRegularValue > 0) {
          adjustedItemTotal = (item.itemRegularValue / totalRegularValue) * comboOfferTotal;
        } else if (comboItemsCount > 0) {
          adjustedItemTotal = comboOfferTotal / comboItemsCount;
        }

        if (isNaN(adjustedItemTotal) || !isFinite(adjustedItemTotal)) {
          adjustedItemTotal = 0;
        }

        // Track allocations
        const pId = item.productId;
        comboQuantityAllocated[pId] = (comboQuantityAllocated[pId] || 0) + (item.qtyRequired * comboQty);
        comboBilledTotal[pId] = (comboBilledTotal[pId] || 0) + adjustedItemTotal;
      });
    });

    // 3. Map orderItems to pricedOrderItems with weighted unit price
    return orderItems.map((item) => {
      // Free and gift items have 0 price
      if (item.is_free || item.is_gift) {
        return { ...item, unit_price: 0 };
      }

      const totalQty = safeParseFloat(item.quantity, 1);
      const allocatedQty = comboQuantityAllocated[item.product] || 0;
      const standaloneQty = Math.max(0, totalQty - allocatedQty);

      // Standalone unit price is the sale rate of the product
      const product = products?.find((p) => p.id === item.product);
      const productSaleRate = product?.pricing?.sale_rate !== undefined && product?.pricing?.sale_rate !== null
        ? safeParseFloat(product.pricing.sale_rate)
        : safeParseFloat(product?.price || 0);

      // If the item already had a unit_price, use it as fallback for standalone
      const standaloneUnitPrice = item.unit_price !== undefined ? safeParseFloat(item.unit_price) : productSaleRate;

      const comboTotal = comboBilledTotal[item.product] || 0;
      const standaloneTotal = standaloneQty * standaloneUnitPrice;

      const totalBilledAmount = comboTotal + standaloneTotal;
      let adjustedUnitPrice = totalQty > 0 ? (totalBilledAmount / totalQty) : standaloneUnitPrice;

      if (isNaN(adjustedUnitPrice) || !isFinite(adjustedUnitPrice)) {
        adjustedUnitPrice = standaloneUnitPrice;
      }

      return {
        ...item,
        unit_price: roundToTwoDecimals(adjustedUnitPrice),
      };
    });
  }, [orderItems, appliedCombos, products, combinations]);

  const totals = useMemo(() => {
    if (!pricedOrderItems.length) {
      return { subtotal: 0, gstAmount: 0, total: 0, savings: 0, originalTotal: 0, totalDiscount: 0 };
    }

    let subtotal = 0;
    let gstAmount = 0;
    let originalSubtotal = 0;
    let originalGstAmount = 0;
    let originalTotal = 0;
    let grandTotal = 0;

    pricedOrderItems.forEach((item) => {
      if (!item.is_free && !item.is_gift) {
        // Discounted price
        const itemQty = safeParseFloat(item.quantity, 1);
        const itemUnitPrice = safeParseFloat(item.unit_price, 0);
        const itemTotal = roundToTwoDecimals(itemUnitPrice * itemQty);
        const gstRate = safeParseFloat(item.gst_rate_value, 0);
        const itemGST = roundToTwoDecimals((itemTotal * gstRate) / (100 + gstRate));
        const taxableValue = roundToTwoDecimals(itemTotal - itemGST);
        subtotal += taxableValue;
        gstAmount += itemGST;
        grandTotal += itemTotal;

        // Original price
        const originalPrice = safeParseFloat(item.original_price || item.unit_price || 0);
        const originalItemTotal = roundToTwoDecimals(originalPrice * itemQty);
        const originalItemGST = roundToTwoDecimals((originalItemTotal * gstRate) / (100 + gstRate));
        const originalTaxableValue = roundToTwoDecimals(originalItemTotal - originalItemGST);
        originalSubtotal += originalTaxableValue;
        originalGstAmount += originalItemGST;
        originalTotal += originalItemTotal;
      }
    });

    const savings = roundToTwoDecimals(originalTotal - grandTotal);

    // Use backend total_amount in edit mode if available
    let backendTotal = null;
    if (editMode) {
      const savedEditData = sessionStorage.getItem("orderEditData");
      if (savedEditData) {
        const editData = JSON.parse(savedEditData);
        if (editData.formData && editData.formData.total_amount !== undefined && editData.formData.total_amount !== null) {
          backendTotal = parseFloat(editData.formData.total_amount);
        }
      }
    }

    return {
      subtotal: roundToTwoDecimals(subtotal),
      gstAmount: roundToTwoDecimals(gstAmount),
      total: roundToTwoDecimals(backendTotal !== null ? backendTotal : grandTotal),
      savings,
      originalTotal: roundToTwoDecimals(originalTotal),
      originalSubtotal: roundToTwoDecimals(originalSubtotal),
      originalGstAmount: roundToTwoDecimals(originalGstAmount),
      totalDiscount: savings
    };
  }, [pricedOrderItems, editMode]);

  // ========== MUTATION ==========
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editMode && editOrderId) {
        const response = await axios.put(`/api/orders/${editOrderId}/`, data);
        return response.data;
      } else {
        const response = await axios.post("/api/orders/", data);
        return response.data;
      }
    },
    onSuccess: (data) => {
      setGeneratedOrderId(data.order_id);
      setSavedDbOrderId(data.id);
      setShowSuccessModal(true);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["customers"]);

      if (editMode) {
        sessionStorage.removeItem("orderEditData");
        sessionStorage.removeItem("orderEditId");
      } else {
        const targetId = formData.customer ? formData.customer.toString() : "";
        sessionStorage.removeItem(`orderNewFormData_${targetId || 'anonymous'}`);
        sessionStorage.removeItem(`orderNewOrderItems_${targetId || 'anonymous'}`);
        sessionStorage.removeItem(`orderNewAppliedCombos_${targetId || 'anonymous'}`);
      }

      if (!editMode) {
        setFormData({
          customer: "",
          agent: "",
          status: "Placed",
          payment_status: "Advance",
          followup_date: "",
          partial_amount: 0,
          delivery_address: {
            house_flat_no: "",
            wing_lane: "",
            society_colony: "",
            landmark: "",
            area: "",
            pincode: "",
            state: "",
            district: "",
            tahsil: "",
            city: "",
          },
          delivery_option: "primary",
          order_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString().split('T')[0],
        });
        setOrderItems([]);
        setAppliedCombos([]);
        setCustomerKPIs(null);
      }
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.detail ||
        error.response?.data?.[0] ||
        "An error occurred while processing the order. Please try again.";
      alert(errorMsg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      alert("Please select a customer to place an order.");
      return;
    }

    if (pricedOrderItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    console.log('=== SUBMITTING ORDER ===');
    console.log('Raw Order Items:', orderItems);
    console.log('Priced Order Items:', pricedOrderItems);
    console.log('Applied Combos:', appliedCombos);
    console.log('Totals:', totals);

    const orderData = {
      customer: Number(formData.customer),
      agent: formData.agent || undefined,
      status: formData.status,
      payment_status: formData.payment_status,
      ...(formData.followup_date && { followup_date: formData.followup_date }),
      delivery_address: formData.delivery_address,
      total_amount: totals.total,
      paid_amount: formData.payment_status === "Paid" ? totals.total :
        formData.payment_status === "Partial" ? parseFloat(formData.partial_amount) : 0,
      items: pricedOrderItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate_value || 0,
        is_free: item.is_free || false,
        is_gift: item.is_gift || false,
        combo: item.combo_id || null,
      })),
      applied_combos: appliedCombos.map(c => ({
        combo_id: c.comboId || c.combo_id,
        quantity: c.quantity,
        name: c.name,
        items: c.items || [],
        rewards: c.rewards || [],
        gifts: c.gifts || []
      })),
    };

    mutation.mutate(orderData);
  };
  const selectedCustomerObj = useMemo(() => {
    if (!formData.customer) return null;

    if (urlCustomer && urlCustomer.id.toString() === formData.customer.toString()) {
      return urlCustomer;
    }

    const allCustomersList = customers?.results || customers || [];
    return allCustomersList.find(
      (c) => c.id.toString() === formData.customer.toString()
    ) || null;
  }, [formData.customer, urlCustomer, customers]);

  // ========== HELPER FUNCTIONS ==========
  const getSelectedCustomerName = () => {
    if (!formData.customer) return "Select Customer";

    // 1. Instant query-parameter name display
    if (urlCustomerName && formData.customer.toString() === urlCustomerId?.toString()) {
      return urlCustomerName;
    }

    return selectedCustomerObj ? selectedCustomerObj.name : "Select Customer";
  };

  const getSelectedCustomerAgent = () => {
    return selectedCustomerObj ? selectedCustomerObj.agent_name || "" : "";
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    if (productFilters.search) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(productFilters.search.toLowerCase()) ||
          product.sku.toLowerCase().includes(productFilters.search.toLowerCase())
      );
    }

    if (productFilters.priceRange) {
      const [min, max] = productFilters.priceRange.split("-").map(Number);
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price);
        return max ? price >= min && price <= max : price >= min;
      });
    }

    if (productFilters.stockStatus) {
      filtered = filtered.filter((product) => {
        const stock = product.stock_qty;
        switch (productFilters.stockStatus) {
          case "in-stock": return stock > 10;
          case "low-stock": return stock > 0 && stock <= 10;
          case "out-of-stock": return stock === 0;
          default: return true;
        }
      });
    }

    return filtered;
  }, [products, productFilters]);

  const allCustomers = customers?.results || customers || [];
  const filteredCustomers = (customerDropdownOpen && customerSearch.length > 0)
    ? customerSearchResults
    : allCustomers;

  const relevantCombinations = useMemo(() => {
    if (!combinations) return [];

    const orderProductIds = orderItems
      .filter(item => !item.is_free && !item.is_gift)
      .map(item => item.product);

    const selectedProductId = selectedProduct ? parseInt(selectedProduct) : null;

    if (orderProductIds.length === 0 && !selectedProductId) {
      return [];
    }

    return combinations.filter(combo => {
      if (!combo.is_active) return false;

      // 1. Check if any order item is a paid item in this combo
      const matchesOrder = combo.items?.some(item => orderProductIds.includes(item.product));

      // 2. Check if selected product is anywhere in this combo (paid, free, or gift)
      let matchesSelected = false;
      if (selectedProductId) {
        const inPaid = combo.items?.some(item => item.product === selectedProductId);
        const inFree = combo.rewards?.some(reward => reward.product === selectedProductId);
        const inGift = combo.gifts?.some(gift => gift.product === selectedProductId);
        matchesSelected = inPaid || inFree || inGift;
      }

      return matchesOrder || matchesSelected;
    }) || [];
  }, [combinations, orderItems, selectedProduct]);

  const getFilteredCombinations = useCallback((combos) => {
    if (!selectedProduct) {
      return combos;
    }

    const productId = parseInt(selectedProduct);

    return combos.filter(combo => {
      let isInPaid = false;
      let isInFree = false;
      let isInGift = false;

      if (combo.items?.some(item => item.product === productId)) {
        isInPaid = true;
      }

      if (combo.rewards?.some(reward => reward.product === productId)) {
        isInFree = true;
      }

      if (combo.gifts?.some(gift => gift.product === productId)) {
        isInGift = true;
      }

      // If at least one filter is active, the combo must match at least one active filter (OR logic)
      const hasActiveFilter = filterPaid || filterFree || filterGift;
      if (hasActiveFilter) {
        const matchesPaid = filterPaid && isInPaid;
        const matchesFree = filterFree && isInFree;
        const matchesGift = filterGift && isInGift;
        if (!matchesPaid && !matchesFree && !matchesGift) {
          return false;
        }
      }

      return true;
    });
  }, [selectedProduct, filterPaid, filterFree, filterGift]);



  const getOriginalPrice = (productId) => {
    const productObj = products?.find(p => p.id === productId);
    if (productObj) {
      if (productObj.pricing?.mrp !== undefined && productObj.pricing?.mrp !== null) {
        return parseFloat(productObj.pricing.mrp);
      }
      return parseFloat(productObj.mrp || productObj.price || 0);
    }
    return 0;
  };

  const getProductGstRate = (productId) => {
    const productObj = products?.find(p => p.id === productId);
    if (productObj) {
      if (productObj.gst_rate_display) {
        return parseFloat(productObj.gst_rate_display) || 0;
      }
      if (productObj.gst_rate) {
        if (typeof productObj.gst_rate === 'object') {
          return parseFloat(productObj.gst_rate.rate) || 0;
        }
        return parseFloat(productObj.gst_rate) || 0;
      }
    }
    return 0;
  };

  const getProductHsn = (productId) => {
    const productObj = products?.find(p => p.id === productId);
    return productObj ? productObj.hsn : '';
  };

  const getProductTitle = (productId) => {
    const productObj = products?.find(p => p.id === productId);
    return productObj ? productObj.title : '';
  };

  const getAllAppliedCombosInvoiceItems = () => {
    const invoiceItems = [];
    let sNo = 1;

    appliedCombos.forEach((ac) => {
      const combo = combinations?.find(c => String(c.id) === String(ac.comboId || ac.combo_id));
      if (!combo) return;
      const quantity = ac.quantity || 1;

      // 1. Paid items
      (combo.items || []).forEach((item) => {
        const itemQty = item.quantity_required * quantity;
        const unitMrp = getOriginalPrice(item.product);
        const totalMrp = unitMrp * itemQty;
        const unitOffer = parseFloat(item.offer_price) || 0;
        const totalOffer = unitOffer * itemQty;
        const gstRate = getProductGstRate(item.product);

        const taxableOffer = totalOffer / (1 + gstRate / 100);
        const gstOfferAmount = totalOffer - taxableOffer;

        invoiceItems.push({
          sNo: sNo++,
          productId: item.product,
          productName: getProductTitle(item.product),
          qty: itemQty,
          unitMrp: unitMrp,
          totalMrp: totalMrp,
          unitOffer: unitOffer,
          totalOffer: totalOffer,
          gstRate: gstRate,
          taxableOffer: taxableOffer,
          gstAmount: gstOfferAmount,
          type: 'Paid',
          hsn: getProductHsn(item.product)
        });
      });

      // 2. Free items
      (combo.rewards || []).forEach((reward) => {
        const itemQty = reward.quantity_free * quantity;
        const unitMrp = getOriginalPrice(reward.product);
        const totalMrp = unitMrp * itemQty;
        const gstRate = getProductGstRate(reward.product);

        const taxableMrp = totalMrp / (1 + gstRate / 100);
        const gstMrpAmount = totalMrp - taxableMrp;

        invoiceItems.push({
          sNo: sNo++,
          productId: reward.product,
          productName: getProductTitle(reward.product),
          qty: itemQty,
          unitMrp: unitMrp,
          totalMrp: totalMrp,
          unitOffer: 0,
          totalOffer: 0,
          gstRate: gstRate,
          taxableOffer: taxableMrp,
          gstAmount: gstMrpAmount,
          type: 'Free',
          hsn: getProductHsn(reward.product)
        });
      });

      // 3. Gift items
      (combo.gifts || []).forEach((gift) => {
        const giftQtyVal = gift.quantity_free || gift.quantity || 1;
        const itemQty = giftQtyVal * quantity;
        const unitMrp = getOriginalPrice(gift.product);
        const totalMrp = unitMrp * itemQty;
        const gstRate = getProductGstRate(gift.product);

        const taxableMrp = totalMrp / (1 + gstRate / 100);
        const gstMrpAmount = totalMrp - taxableMrp;

        invoiceItems.push({
          sNo: sNo++,
          productId: gift.product,
          productName: getProductTitle(gift.product),
          qty: itemQty,
          unitMrp: unitMrp,
          totalMrp: totalMrp,
          unitOffer: 0,
          totalOffer: 0,
          gstRate: gstRate,
          taxableOffer: taxableMrp,
          gstAmount: gstMrpAmount,
          type: 'Gift',
          hsn: getProductHsn(gift.product)
        });
      });
    });

    return invoiceItems;
  };

  // Quotation Modal Component
  // Quotation Modal Component
  const QuotationModal = () => {
    if (appliedCombos.length === 0) return null;

    const getRolledUpInvoiceItems = () => {
      const rawItems = getAllAppliedCombosInvoiceItems();
      const grouped = {};
      rawItems.forEach(item => {
        const pid = item.productId;
        if (!grouped[pid]) {
          grouped[pid] = {
            productId: pid,
            productName: item.productName,
            hsn: item.hsn,
            billedQty: 0,
            freeQty: 0,
            giftQty: 0,
            unitMrp: item.unitMrp,
            unitOffer: 0,
            totalOffer: 0,
            gstRate: item.gstRate,
            taxableOffer: 0,
            gstAmount: 0
          };
        }
        if (item.type === 'Paid') {
          grouped[pid].billedQty += item.qty;
          grouped[pid].unitOffer = item.unitOffer;
          grouped[pid].totalOffer += item.totalOffer;
          grouped[pid].taxableOffer += item.taxableOffer;
          grouped[pid].gstAmount += item.gstAmount;
        } else if (item.type === 'Free') {
          grouped[pid].freeQty += item.qty;
        } else if (item.type === 'Gift') {
          grouped[pid].giftQty += item.qty;
        }
      });

      return Object.values(grouped).map((item, idx) => ({
        ...item,
        sNo: idx + 1
      }));
    };

    const invoiceItems = getRolledUpInvoiceItems()
      .sort((a, b) => (a.productName || "").localeCompare(b.productName || ""))
      .map((item, idx) => ({
        ...item,
        sNo: idx + 1
      }));

    const selectedState = selectedCustomerObj?.state ? selectedCustomerObj.state.toLowerCase() : "";
    const isMaharashtra = selectedState.includes("maharashtra") || !selectedState;

    const customerFullName = `${selectedCustomerObj?.name || ""} ${selectedCustomerObj?.surname || ""}`.trim();
    const companyName = selectedCustomerObj?.company_name;

    const getDeliveryAddress = () => {
      return Object.values(formData.delivery_address).filter(Boolean).join(', ');
    };

    let totalBilledQty = 0;
    let totalFreeQty = 0;
    let totalGiftQty = 0;
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    invoiceItems.forEach(item => {
      totalBilledQty += item.billedQty || 0;
      totalFreeQty += item.freeQty || 0;
      totalGiftQty += item.giftQty || 0;
      totalTaxableValue += item.taxableOffer;
      if (isMaharashtra) {
        totalCgst += item.gstAmount / 2;
        totalSgst += item.gstAmount / 2;
      } else {
        totalIgst += item.gstAmount;
      }
    });

    const exactGrandTotal = totalTaxableValue + totalCgst + totalSgst + totalIgst;
    const roundedGrandTotal = Math.round(exactGrandTotal);
    const roundOff = roundedGrandTotal - exactGrandTotal;

    const formatRoundOff = (val) => {
      if (Math.abs(val) < 0.005) return "0.00";
      if (val < 0) {
        return `(-) ${Math.abs(val).toFixed(2)}`;
      }
      return val.toFixed(2);
    };

    // HSN summary
    const hsnSummary = {};
    invoiceItems.forEach(item => {
      if (item.taxableOffer > 0) {
        const hsn = item.hsn;
        const gstRate = item.gstRate;

        const key = `${hsn}-${gstRate}`;
        if (!hsnSummary[key]) {
          hsnSummary[key] = {
            hsn: hsn,
            gstRate: gstRate,
            taxableValue: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalTax: 0
          };
        }

        hsnSummary[key].taxableValue += item.taxableOffer;
        if (isMaharashtra) {
          hsnSummary[key].cgstAmount += item.gstAmount / 2;
          hsnSummary[key].sgstAmount += item.gstAmount / 2;
        } else {
          hsnSummary[key].igstAmount += item.gstAmount;
        }
        hsnSummary[key].totalTax += item.gstAmount;
      }
    });

    const hsnSummaryList = Object.values(hsnSummary);

    const formatCurrency = (val) => {
      if (val === null || val === undefined || isNaN(val)) return "₹0.00";
      return `₹${parseFloat(val).toFixed(2)}`;
    };

    const formatCurrencyNoDecimals = (val) => {
      if (val === null || val === undefined || isNaN(val)) return "₹0";
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return new Date().toLocaleDateString('en-IN');
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return new Date().toLocaleDateString('en-IN');
      return date.toLocaleDateString('en-IN');
    };

    const renderInvoiceContent = (isPrint = false) => (
      <div className={isPrint ? "inv-box" : ""}>
        {isPrint && <div className="inv-header">Quotation</div>}

        {isPrint && (
          <div className="inv-row inv-border-b">
            {/* Left Column: Seller/From Details */}
            <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between" style={{ padding: "5px 6px" }}>
              <div style={{ width: "50%" }} className="pr-2 text-[10px]">
                <div className="font-bold" style={{ fontSize: "11px" }}>PARU ENTERPRISES</div>
                <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-normal text-gray-800">
                  A SQUARE PLAZA GR FLR OPP{"\n"}NARMADA GARDEN SANGVI PUNE
                </div>
              </div>
              <div style={{ width: "50%" }} className="pl-2 text-[11px] text-gray-800 self-start mt-0.5">
                <div><strong>GSTIN/UIN:</strong> 27AKCPP9722G1ZY</div>
                <div><strong>Contact:</strong> 9960345670</div>
                <div><strong>E-Mail:</strong> Dcrpsquare@gmail.co</div>
              </div>
            </div>

            {/* Right Column: Invoice Reference Numbers in a Grid */}
            <div className="inv-w-50 flex flex-col text-[10px]">
              <div className="inv-row inv-border-b flex-1">
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Quotation No.</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}>TEMP-QUOTE</span>
                </div>
                <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Dated</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}>{formatDate(null)}</span>
                </div>
              </div>

              <div className="inv-row inv-border-b flex-1">
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Delivery Note</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
                <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Mode/Terms of Payment</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}>{formData.payment_status}</span>
                </div>
              </div>

              <div className="inv-row inv-border-b flex-1">
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Ref No. & Date</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
                <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Other References</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
              </div>

              <div className="inv-row flex-1">
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Buyer's Order No.</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
                <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Dated</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPrint && (
          <div className="inv-row inv-border-b text-[10px]">
            {/* Left Column: Billing/Shipping Details */}
            <div className="inv-cell inv-border-r inv-w-50 flex flex-col" style={{ padding: "5px 6px" }}>
              <div className="inv-border-b pb-1.5 mb-1.5">
                <div className="flex flex-row flex-wrap items-baseline gap-x-4 mb-1 text-[11px]">
                  <span className="text-[11px] text-gray-500 uppercase font-bold">Buyer (Ship to)</span>
                  {companyName && <span className="font-bold text-black">{companyName}</span>}
                  <span className={companyName ? "text-gray-800 font-normal" : "font-bold text-black"}>
                    {customerFullName || "Walk-In Customer"}
                  </span>
                </div>
                <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-tight text-gray-700">{getDeliveryAddress() || "—"}</div>
                <div className="text-[11px] mt-1 text-gray-600">
                  {selectedCustomerObj?.phone && <div><strong>Contact:</strong> {selectedCustomerObj.phone}</div>}
                  <div><strong>State Name:</strong> {selectedCustomerObj?.state || 'Maharashtra'}, Code: {selectedCustomerObj?.state ? (selectedCustomerObj.gstin_no ? selectedCustomerObj.gstin_no.slice(0, 2) : '—') : '27'}</div>
                </div>
              </div>
              <div>
                <div className="flex flex-row flex-wrap items-baseline gap-x-4 mb-1 text-[11px]">
                  <span className="text-[11px] text-gray-500 uppercase font-bold">Buyer (Bill to)</span>
                  {companyName && <span className="font-bold text-black">{companyName}</span>}
                  <span className={companyName ? "text-gray-800 font-normal" : "font-bold text-black"}>
                    {customerFullName || "Walk-In Customer"}
                  </span>
                </div>
                <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-tight text-gray-700">{getDeliveryAddress() || "—"}</div>
                <div className="text-[11px] mt-1 text-gray-600">
                  {selectedCustomerObj?.phone && <div><strong>Contact:</strong> {selectedCustomerObj.phone}</div>}
                  <div><strong>State Name:</strong> {selectedCustomerObj?.state || 'Maharashtra'}, Code: {selectedCustomerObj?.state ? (selectedCustomerObj.gstin_no ? selectedCustomerObj.gstin_no.slice(0, 2) : '—') : '27'}</div>
                  {selectedCustomerObj?.gstin_no && <div><strong>GSTIN/UIN:</strong> {formatGtin(selectedCustomerObj.gstin_no)}</div>}
                </div>
              </div>
            </div>

            {/* Right Column: Dispatch Details & Terms of Delivery */}
            <div className="inv-w-50 flex flex-col">
              <div className="inv-row inv-border-b flex-1">
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Dispatch Doc No.</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
                <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Delivery Note Date</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
              </div>

              <div className="inv-row flex-1">
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Dispatched through</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
                <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Destination</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <table className="inv-table w-full">
          <thead>
            <tr>
              <th rowSpan="2" className="text-center w-8">Sl No.</th>
              <th rowSpan="2" className="text-left">Description of Goods</th>
              <th rowSpan="2" className="text-center w-16">HSN/SAC</th>
              <th colSpan="4" className="text-center w-48">Quantity</th>
              <th rowSpan="2" className="text-right w-20">Rate<br/>(Incl. of Tax)</th>
              <th rowSpan="2" className="text-right w-20">Rate</th>
              <th rowSpan="2" className="text-right w-24">Amount</th>
            </tr>
            <tr>
              <th className="text-center w-12" style={{ borderTop: "1.2px solid #000" }}>Total</th>
              <th className="text-center w-12" style={{ borderTop: "1.2px solid #000" }}>Billed</th>
              <th className="text-center w-12" style={{ borderTop: "1.2px solid #000" }}>Free</th>
              <th className="text-center w-12" style={{ borderTop: "1.2px solid #000" }}>Gift</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item, idx) => {
              const itemTotalQty = (item.billedQty || 0) + (item.freeQty || 0) + (item.giftQty || 0);
              return (
                <tr key={idx} style={{ height: "24px" }} className="text-[10px]">
                  <td className="text-center">{item.sNo}</td>
                  <td className="text-left font-bold">{item.productName}</td>
                  <td className="text-center">{item.hsn}</td>
                  <td className="text-center font-bold">{itemTotalQty > 0 ? `${itemTotalQty} PCS` : ""}</td>
                  <td className="text-center font-bold">{item.billedQty > 0 ? `${item.billedQty} PCS` : ""}</td>
                  <td className="text-center font-bold">{item.freeQty > 0 ? `${item.freeQty} PCS` : ""}</td>
                  <td className="text-center font-bold">{item.giftQty > 0 ? `${item.giftQty} PCS` : ""}</td>
                  <td className="text-right">
                    {item.billedQty > 0 ? formatCurrency(item.unitOffer) : ""}
                  </td>
                  <td className="text-right">
                    {item.billedQty > 0 ? formatCurrency(item.unitOffer / (1 + item.gstRate / 100)) : ""}
                  </td>
                  <td className="text-right font-bold">
                    {item.billedQty > 0 ? formatCurrency(item.taxableOffer) : ""}
                  </td>
                </tr>
              );
            })}

            {/* Output Taxes rows */}
            {isMaharashtra ? (
              <>
                <tr style={{ height: "20px" }}>
                  <td></td>
                  <td className="text-right font-bold italic" colSpan="8">OUTPUT CGST</td>
                  <td className="text-right font-bold">{formatCurrency(totalCgst)}</td>
                </tr>
                <tr style={{ height: "20px" }}>
                  <td></td>
                  <td className="text-right font-bold italic" colSpan="8">OUTPUT SGST</td>
                  <td className="text-right font-bold">{formatCurrency(totalSgst)}</td>
                </tr>
              </>
            ) : (
              <tr style={{ height: "20px" }}>
                <td></td>
                <td className="text-right font-bold italic" colSpan="8">OUTPUT IGST</td>
                <td className="text-right font-bold">{formatCurrency(totalIgst)}</td>
              </tr>
            )}
            
            {/* Round Off row */}
            {Math.abs(roundOff) >= 0.005 && (
              <tr style={{ height: "20px" }}>
                <td></td>
                <td className="text-right italic" colSpan="8">
                  <strong>Less:</strong> ROUND OFF
                </td>
                <td className="text-right font-bold">{formatRoundOff(roundOff)}</td>
              </tr>
            )}

            {/* Total Row */}
            <tr className="font-bold" style={{ borderTop: "1.5px solid #000", height: "22px" }}>
              <td className="text-center"></td>
              <td className="text-right">Total</td>
              <td className="text-center"></td>
              <td className="text-center font-bold">{(totalBilledQty + totalFreeQty + totalGiftQty)} PCS</td>
              <td className="text-center font-bold">{totalBilledQty} PCS</td>
              <td className="text-center font-bold">{totalFreeQty} PCS</td>
              <td className="text-center font-bold">{totalGiftQty} PCS</td>
              <td></td>
              <td></td>
              <td className="text-right font-bold" style={{ fontSize: "11px" }}>{formatCurrencyNoDecimals(roundedGrandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words */}
        <div className="inv-row inv-border-b inv-cell flex justify-between items-center text-[10px]" style={{ padding: "5px 6px" }}>
          <div>
            <span className="text-[8px] text-gray-500 block">Amount Chargeable (in words)</span>
            <span className="font-bold">{convertNumberToWords(roundedGrandTotal)}</span>
          </div>
          <div className="font-bold">E. & O.E</div>
        </div>

        {/* HSN/SAC Tax Breakdown Table */}
        <div className="inv-w-100 inv-border-b">
          <table className="inv-table w-full">
            {isMaharashtra ? (
              <>
                <thead>
                  <tr>
                    <th rowSpan="2" className="text-center">HSN/SAC</th>
                    <th rowSpan="2" className="text-right w-24">Taxable Value</th>
                    <th colSpan="2" className="text-center">Central Tax (CGST)</th>
                    <th colSpan="2" className="text-center">State Tax (SGST)</th>
                    <th rowSpan="2" className="text-right w-24">Total Tax Amount</th>
                  </tr>
                  <tr>
                    <th className="text-center w-16">Rate</th>
                    <th className="text-right w-20">Amount</th>
                    <th className="text-center w-16">Rate</th>
                    <th className="text-right w-20">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnSummaryList.map((row, idx) => (
                    <tr key={idx} className="text-[9px]">
                      <td className="text-center font-bold">{row.hsn}</td>
                      <td className="text-right">{formatCurrency(row.taxableValue)}</td>
                      <td className="text-center">{(row.gstRate / 2).toFixed(1)}%</td>
                      <td className="text-right">{formatCurrency(row.cgstAmount)}</td>
                      <td className="text-center">{(row.gstRate / 2).toFixed(1)}%</td>
                      <td className="text-right">{formatCurrency(row.sgstAmount)}</td>
                      <td className="text-right font-bold">{formatCurrency(row.totalTax)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ borderTop: "1.2px solid #000" }}>
                    <td className="text-right">Total</td>
                    <td className="text-right">{formatCurrency(totalTaxableValue)}</td>
                    <td></td>
                    <td className="text-right">{formatCurrency(totalCgst)}</td>
                    <td></td>
                    <td className="text-right">{formatCurrency(totalSgst)}</td>
                    <td className="text-right">{formatCurrency(totalCgst + totalSgst)}</td>
                  </tr>
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th rowSpan="2" className="text-center">HSN/SAC</th>
                    <th rowSpan="2" className="text-right w-28">Taxable Value</th>
                    <th colSpan="2" className="text-center">Integrated Tax (IGST)</th>
                    <th rowSpan="2" className="text-right w-28">Total Tax Amount</th>
                  </tr>
                  <tr>
                    <th className="text-center w-20">Rate</th>
                    <th className="text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnSummaryList.map((row, idx) => (
                    <tr key={idx} className="text-[9px]">
                      <td className="text-center font-bold">{row.hsn}</td>
                      <td className="text-right">{formatCurrency(row.taxableValue)}</td>
                      <td className="text-center">{row.gstRate.toFixed(1)}%</td>
                      <td className="text-right">{formatCurrency(row.igstAmount)}</td>
                      <td className="text-right font-bold">{formatCurrency(row.totalTax)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold" style={{ borderTop: "1.2px solid #000" }}>
                    <td className="text-right">Total</td>
                    <td className="text-right">{formatCurrency(totalTaxableValue)}</td>
                    <td></td>
                    <td className="text-right">{formatCurrency(totalIgst)}</td>
                    <td className="text-right">{formatCurrency(totalIgst)}</td>
                  </tr>
                </tbody>
              </>
            )}
          </table>
        </div>

        {/* Tax Amount in Words */}
        <div className="inv-row inv-border-b inv-cell text-[10px]" style={{ padding: "5px 6px" }}>
          <div style={{ fontSize: "9.5px" }}>
            <strong>Tax Amount (in words) :</strong> {convertNumberToWords(totalCgst + totalSgst + totalIgst)}
          </div>
        </div>

        {isPrint && (
          <>
            {/* Row 4: Bank Details & Declaration */}
            <div className="inv-row inv-border-b text-[8px] leading-relaxed">
              {/* Declaration */}
              <div className="inv-cell inv-border-r inv-w-50" style={{ padding: "5px 6px" }}>
                <div className="font-bold text-[9px] mb-0.5">Declaration:</div>
                <p>
                  I/We hereby certify that my/our Registration certificate under the GST Act 2017, is in force on the date on which the sale of the goods specified in this tax invoice is made by me/us and that the transaction of sale covered by this tax invoice has been effected by me/us and it shall be accounted for in the turnover of sales while filing of return and the due tax, if any payable on the sale has been paid or shall be paid.
                </p>
                <div className="font-bold mt-1 text-gray-700">Terms & Conditions:</div>
                <ul className="list-decimal pl-3 space-y-0.5 mt-0.5 text-gray-600">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>Interest @24% p.a will be charged after due date of bill.</li>
                  <li>We reserve the right to demand payment of this bill at any time before due date.</li>
                </ul>
              </div>

              {/* Bank Details */}
              <div className="inv-cell inv-w-50 flex flex-col justify-between" style={{ padding: "5px 6px" }}>
                <div>
                  <div className="font-bold text-[9px] mb-1">Company's Bank Details:</div>
                  <div className="space-y-1 text-[9px] text-gray-800">
                    <div><strong>Bank Name:</strong> AU SMALL FINANCE BANK</div>
                    <div><strong>A/c No.:</strong> 2221263141506073</div>
                    <div><strong>Branch & IFS Code:</strong> PUNE & AUBL0002631</div>
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-gray-200">
                  <div className="text-[8px] text-gray-500 font-bold">Terms of Delivery:</div>
                  <div className="text-[9px] text-gray-700 leading-normal">
                    Subject to Pune jurisdiction. Delivery within 7 days.
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="inv-row">
              {/* Customer Signature */}
              <div className="inv-cell inv-border-r inv-w-50 h-16 flex flex-col justify-between" style={{ padding: "5px 6px" }}>
                <div className="text-[8px] text-gray-500">Customer's Seal and Signature</div>
                <div className="border-t border-dotted border-gray-400 w-36 mt-auto"></div>
              </div>

              {/* Authorized Signatory */}
              <div className="inv-cell inv-w-50 h-16 flex flex-col justify-between text-right text-[8px]" style={{ padding: "5px 6px" }}>
                <div className="font-bold text-[9px]">for PSQUARE ENTERPRISES</div>
                <div className="inv-row justify-between text-[8px] text-gray-500 mt-auto">
                  <span>Prepared by</span>
                  <span>Verified by</span>
                  <span className="font-bold text-black text-[9px]">Authorised Signatory</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <style dangerouslySetInnerHTML={{
          __html: `
          .quotation-modal-content {
            font-family: Arial, sans-serif;
            color: black;
            background: white;
            font-size: 14px;
          }
          .quotation-modal-content .inv-table {
            font-size: 12.5px;
          }
          .quotation-modal-content .inv-table th,
          .quotation-modal-content .inv-table td {
            padding: 8px 10px;
          }
          .quotation-modal-content .text-\[10px\] {
            font-size: 13.5px !important;
          }
          .quotation-modal-content .text-\[9px\] {
            font-size: 12.5px !important;
          }
          .quotation-modal-content .text-\[8px\] {
            font-size: 11.5px !important;
          }
          .quotation-modal-content td[style*="font-size: 11px"] {
            font-size: 14.5px !important;
          }
          .quotation-modal-content div[style*="font-size: 9.5px"] {
            font-size: 13.5px !important;
          }
          .inv-box {
            border: 1.5px solid #000;
            width: 100%;
            box-sizing: border-box;
            font-size: 10px;
            line-height: 1.3;
          }
          .inv-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            border-bottom: 1.5px solid #000;
            padding: 4px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .inv-row {
            display: flex;
            width: 100%;
          }
          .inv-cell {
            padding: 4px 6px;
            box-sizing: border-box;
          }
          .inv-border-r {
            border-right: 1.2px solid #000;
          }
          .inv-border-b {
            border-bottom: 1.2px solid #000;
          }
          .inv-w-50 {
            width: 50%;
          }
          .inv-w-25 {
            width: 25%;
          }
          .inv-w-100 {
            width: 100%;
          }
          .inv-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          .inv-table th, .inv-table td {
            border: 1.2px solid #000;
            padding: 4px 5px;
            vertical-align: top;
          }
          .inv-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .text-left {
            text-align: left;
          }
          .font-bold {
            font-weight: bold;
          }
          .italic {
            font-style: italic;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              background: white !important;
              color: black !important;
            }
            body * {
              visibility: hidden !important;
            }
            #quotation-print-area, #quotation-print-area * {
              visibility: visible !important;
            }
            #quotation-print-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              color: black !important;
            }
          }
        `}} />

        <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full flex flex-col max-h-[95vh] overflow-hidden print:hidden" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Applied Combos Quotation Preview
              </h3>
              <p className="text-xs text-gray-500 mt-1">Quotation generated for all applied combo offers</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/20 animate-pulse"
              >
                <Printer className="w-4 h-4" />
                Print Quotation
              </button>
              <button
                type="button"
                onClick={() => setShowQuotationModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto bg-gray-100/50 flex-1 flex justify-center">
            {/* Exact invoice template (screen preview only) */}
            <div className="quotation-modal-content p-6 shadow-lg border border-gray-300 rounded-lg max-w-5xl w-full bg-white self-start">
              {renderInvoiceContent()}
            </div>
          </div>
        </div>

        {/* Print Only Portal (Direct child of body, prevents double printing) */}
        {createPortal(
          <div id="quotation-print-area" className="hidden print:block text-black bg-white">
            {renderInvoiceContent(true)}
          </div>,
          document.body
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-white">
      <div className="container mx-auto px-4 max-w-full py-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-3">
            {editMode && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const orderId = sessionStorage.getItem('orderEditId');
                    sessionStorage.removeItem('orderEditData');
                    sessionStorage.removeItem('orderEditId');
                    navigate(`/orders/${orderId}`);
                  }}
                  className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Order Details</span>
                </button>
                <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                  <Package className="w-4 h-4 inline mr-1" />
                  Editing Order #{sessionStorage.getItem('orderEditId')}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main 60% / 40% Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column (60% Width) - Customer Details, Delivery Address, Product Add, Combo Offers */}
          <div className="lg:col-span-3 space-y-6">

            {/* Customer and Order Details Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 relative" style={{ zIndex: 30 }}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-500" />
                    Customer *
                  </label>
                  <div className="relative" ref={customerDropdownRef}>
                    <button
                      type="button"
                      onClick={() => !editMode && setCustomerDropdownOpen(!customerDropdownOpen)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 text-left flex items-center justify-between ${editMode ? 'cursor-not-allowed opacity-75' : ''}`}
                      disabled={editMode}
                    >
                      <span className={formData.customer ? "text-gray-900" : "text-gray-500"}>
                        {getSelectedCustomerName()}
                      </span>
                      {!editMode && <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${customerDropdownOpen ? "rotate-180" : ""}`} />}
                    </button>

                    {!editMode && customerDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-auto">
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search customers..."
                              value={customerSearch}
                              onChange={(e) => setCustomerSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="py-1">
                          {customerSearchLoading || customersLoading ? (
                            <div className="px-4 py-2 text-gray-500">Loading...</div>
                          ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => {
                                  loadDraftForCustomer(customer.id);
                                  setCustomerDropdownOpen(false);
                                  setCustomerSearch("");
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                      <span>{customer.phone}</span>
                                      {customer.company_name && (
                                        <>
                                          <span className="text-gray-300">|</span>
                                          <span className="font-medium text-gray-700">{customer.company_name}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    {customer.customer_type_display && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                        {customer.customer_type_display}
                                      </span>
                                    )}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${customer.contact_type === 'Customer'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {customer.contact_type}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">No customers found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-purple-500" />
                    Agent
                  </label>
                  <input
                    type="text"
                    value={getSelectedCustomerAgent()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Order Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ordered">Ordered</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Placed">Placed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-indigo-500" />
                    Payment Status
                  </label>
                  <select
                    name="payment_status"
                    value={formData.payment_status}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Credit">Credit</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Advance">Advance</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
              </div>

              {selectedCustomerObj && (
                <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
                  {selectedCustomerObj.company_name && (
                    <div>
                      <span className="font-semibold text-gray-700">Organization Name: </span>
                      <span className="text-gray-900 font-medium">{selectedCustomerObj.company_name}</span>
                    </div>
                  )}
                  {selectedCustomerObj.company_type_display && (
                    <div>
                      <span className="font-semibold text-gray-700">Organization Type: </span>
                      <span className="text-gray-900 font-medium">{selectedCustomerObj.company_type_display}</span>
                    </div>
                  )}
                  {selectedCustomerObj.customer_type_display && (
                    <div>
                      <span className="font-semibold text-gray-700">Customer Type: </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {selectedCustomerObj.customer_type_display}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    Delivery Option
                  </label>
                  <select
                    name="delivery_option"
                    value={formData.delivery_option}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="primary">Use Primary Address</option>
                    <option value="custom">Enter Custom Address</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-red-500" />
                    Delivery Address
                  </label>
                  {formData.delivery_option === "primary" ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center mb-1">
                        <MapPin className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-green-800">Primary Address Selected</span>
                      </div>
                      <div className="text-sm text-green-700">
                        {Object.values(formData.delivery_address).filter(Boolean).join(', ')}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">House/Flat No</label>
                        <input
                          name="delivery_address.house_flat_no"
                          value={formData.delivery_address.house_flat_no}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Wing/Lane</label>
                        <input
                          name="delivery_address.wing_lane"
                          value={formData.delivery_address.wing_lane}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Society/Colony</label>
                        <input
                          name="delivery_address.society_colony"
                          value={formData.delivery_address.society_colony}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Landmark</label>
                        <input
                          name="delivery_address.landmark"
                          value={formData.delivery_address.landmark}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Area</label>
                        <input
                          name="delivery_address.area"
                          value={formData.delivery_address.area}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Pincode *</label>
                        <input
                          name="delivery_address.pincode"
                          value={formData.delivery_address.pincode}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                        <input
                          name="delivery_address.state"
                          value={formData.delivery_address.state}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                        <input
                          name="delivery_address.district"
                          value={formData.delivery_address.district}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tahsil</label>
                        <input
                          name="delivery_address.tahsil"
                          value={formData.delivery_address.tahsil}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                        <input
                          name="delivery_address.city"
                          value={formData.delivery_address.city}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 relative" style={{ zIndex: 20 }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add Products</h2>
                </div>
                {/* <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                </button> */}
              </div>

              {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productFilters.search}
                        onChange={(e) => setProductFilters((prev) => ({ ...prev, search: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                      <select
                        value={productFilters.priceRange}
                        onChange={(e) => setProductFilters((prev) => ({ ...prev, priceRange: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Prices</option>
                        <option value="0-100">₹0 - ₹100</option>
                        <option value="100-500">₹100 - ₹500</option>
                        <option value="500-1000">₹500 - ₹1000</option>
                        <option value="1000">₹1000+</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  <div className="relative" ref={productDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-left flex items-center justify-between"
                    >
                      <span className={selectedProduct ? "text-gray-900" : "text-gray-500"}>
                        {selectedProduct
                          ? products?.find((p) => p.id.toString() === selectedProduct.toString())?.title
                          : "Select Product"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {productDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="py-1">
                          {filteredProducts
                            .filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()))
                            .slice(0, 10)
                            .map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(product.id);
                                  setProductDropdownOpen(false);
                                  setProductSearch("");
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
                              >
                                {product.image ? (
                                  <img src={product.image} alt={product.title} className="w-8 h-8 object-cover rounded" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                    <Package className="w-4 h-4 text-gray-500" />
                                  </div>
                                )}
                                <span className="flex-1 truncate text-sm">{product.title}</span>
                                <span className="text-sm text-gray-600">₹{product.price}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filter combos by selected product placement */}
                  <div className="flex flex-col justify-center bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                    <div className="flex items-center space-x-4 px-1">
                      <label className={`flex items-center space-x-1.5 cursor-pointer text-xs font-semibold ${!selectedProduct ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!selectedProduct}
                          checked={filterPaid}
                          onChange={(e) => setFilterPaid(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Purchase Product</span>
                      </label>
                      <label className={`flex items-center space-x-1.5 cursor-pointer text-xs font-semibold ${!selectedProduct ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!selectedProduct}
                          checked={filterFree}
                          onChange={(e) => setFilterFree(e.target.checked)}
                          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <span className="text-gray-700">Free Product</span>
                      </label>
                      <label className={`flex items-center space-x-1.5 cursor-pointer text-xs font-semibold ${!selectedProduct ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <input
                          type="checkbox"
                          disabled={!selectedProduct}
                          checked={filterGift}
                          onChange={(e) => setFilterGift(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">Gift Product</span>
                      </label>
                      <div className="flex items-center space-x-1.5 ml-auto">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Sort Qty:</span>
                        <select
                          value={comboSortOrder}
                          onChange={(e) => setComboSortOrder(e.target.value)}
                          className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="desc">High to Low</option>
                          <option value="asc">Low to High</option>
                        </select>
                      </div>
                      {(filterPaid || filterFree || filterGift) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterPaid(false);
                            setFilterFree(false);
                            setFilterGift(false);
                          }}
                          className="text-[10px] text-red-600 hover:text-red-800 font-semibold underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Combo Offers Section */}
            {relevantCombinations.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-yellow-600" />
                    Combo Offers {selectedProductObj ? `for ${selectedProductObj.title}` : ''}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowComboModal(true)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    title="Expand view"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <ComboOffersTable
                    combinations={relevantCombinations}
                    showActions={true}
                    excludeApplied={true}
                    appliedCombos={appliedCombos}
                    products={products}
                    comboSortOrder={comboSortOrder}
                    setComboSortOrder={setComboSortOrder}
                    calculateComboSavings={calculateComboSavings}
                    applyCombo={applyCombo}
                    updateComboQuantity={updateComboQuantity}
                    removeCombo={removeCombo}
                    getFilteredCombinations={getFilteredCombinations}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Purchase Combos and Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchase Combos Section */}
            {appliedCombos.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-green-600" />
                    Purchase Combos
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowQuotationModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                      title="View Quotation for all applied offers"
                    >
                      <FileText className="w-4 h-4" />
                      View Quotation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPurchaseComboModal(true)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      title="Expand view"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <ComboOffersTable
                    combinations={combinations?.filter(c =>
                      appliedCombos.some(ac => String(ac.comboId || ac.combo_id) === String(c.id))
                    ) || []}
                    showActions={true}
                    showGrandTotals={true}
                    appliedCombos={appliedCombos}
                    products={products}
                    comboSortOrder={comboSortOrder}
                    setComboSortOrder={setComboSortOrder}
                    calculateComboSavings={calculateComboSavings}
                    applyCombo={applyCombo}
                    updateComboQuantity={updateComboQuantity}
                    removeCombo={removeCombo}
                    getFilteredCombinations={getFilteredCombinations}
                  />
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (excl. GST)</span>
                  <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST Amount</span>
                  <span className="font-medium">₹{totals.gstAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span>{formatCurrencyNoDecimals(totals.total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                </div>
              </div>

              {formData.payment_status === "Partial" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partial Amount
                  </label>
                  <input
                    type="number"
                    name="partial_amount"
                    value={formData.partial_amount}
                    onChange={handleFormChange}
                    min="0"
                    max={totals.total}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{mutation.isLoading ? (editMode ? "Updating Order..." : "Placing Order...") : (editMode ? "Update Order" : "Place Order")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Combo Offers Modal */}
      {showComboModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowComboModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-8xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Gift className="w-6 h-6 mr-2 text-yellow-600" />
                Combo Offers - Full View {selectedProductObj ? `for ${selectedProductObj.title}` : ''}
              </h3>
              <button
                type="button"
                onClick={() => setShowComboModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {selectedProduct && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-6">
                  <span className="text-sm font-medium text-gray-700">Filter by where selected product appears:</span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterPaid}
                      onChange={(e) => setFilterPaid(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Paid Items</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterFree}
                      onChange={(e) => setFilterFree(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Free Items</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterGift}
                      onChange={(e) => setFilterGift(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Gifts</span>
                  </label>
                      <div className="flex items-center space-x-2 ml-auto">
                        <span className="text-xs text-gray-500 font-medium">Sort Qty:</span>
                        <select
                          value={comboSortOrder}
                          onChange={(e) => setComboSortOrder(e.target.value)}
                          className="text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="desc">Descending (High to Low)</option>
                          <option value="asc">Ascending (Low to High)</option>
                        </select>
                      </div>
                      {(filterPaid || filterFree || filterGift) && (
                        <button
                          type="button"
                          onClick={() => {
                            setFilterPaid(false);
                            setFilterFree(false);
                            setFilterGift(false);
                          }}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          Clear all
                        </button>
                      )}
                </div>
              </div>
            )}

            <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
              <ComboOffersTable
                combinations={relevantCombinations}
                showActions={true}
                excludeApplied={true}
                appliedCombos={appliedCombos}
                products={products}
                comboSortOrder={comboSortOrder}
                setComboSortOrder={setComboSortOrder}
                calculateComboSavings={calculateComboSavings}
                applyCombo={applyCombo}
                updateComboQuantity={updateComboQuantity}
                removeCombo={removeCombo}
                getFilteredCombinations={getFilteredCombinations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Purchase Combos Modal */}
      {showPurchaseComboModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPurchaseComboModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-8xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Gift className="w-6 h-6 mr-2 text-green-600" />
                Purchase Combos - Full View
              </h3>
              <button
                type="button"
                onClick={() => setShowPurchaseComboModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-100px)]">
              <ComboOffersTable
                combinations={combinations?.filter(c =>
                  appliedCombos.some(ac => String(ac.comboId || ac.combo_id) === String(c.id))
                ) || []}
                showActions={true}
                showGrandTotals={true}
                appliedCombos={appliedCombos}
                products={products}
                comboSortOrder={comboSortOrder}
                setComboSortOrder={setComboSortOrder}
                calculateComboSavings={calculateComboSavings}
                applyCombo={applyCombo}
                updateComboQuantity={updateComboQuantity}
                removeCombo={removeCombo}
                getFilteredCombinations={getFilteredCombinations}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {showQuotationModal && <QuotationModal />}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowSuccessModal(false);
            navigate(`/orders/${savedDbOrderId || editOrderId}`);
          }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {editMode ? 'Order Updated Successfully!' : 'Order Placed Successfully!'}
              </h2>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">Order ID</label>
                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="text"
                    value={generatedOrderId}
                    readOnly
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-center"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(generatedOrderId);
                        } else {
                          const text = document.createElement("textarea");
                          text.value = generatedOrderId;
                          text.style.top = "0";
                          text.style.left = "0";
                          text.style.position = "fixed";
                          text.style.opacity = "0";
                          document.body.appendChild(text);
                          text.focus();
                          text.select();
                          document.execCommand("copy");
                          document.body.removeChild(text);
                        }
                      } catch (err) {
                        console.error("Failed to copy order ID:", err);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate(`/orders/${savedDbOrderId || editOrderId}`);
                }}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                View Order Details
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

// Helper: Format GSTIN
const formatGtin = (gtin) => {
  if (!gtin) return "";
  return gtin.toUpperCase().trim();
};

// Helper: Convert number to Indian Rupees words
const convertNumberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const convertBelowThousand = (n) => {
    if (n < 20) return ones[n];
    const digit = n % 10;
    if (n < 100) return tens[Math.floor(n / 10)] + (digit ? " " + ones[digit] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 === 0 ? "" : " and " + convertBelowThousand(n % 100));
  };

  const convert = (n) => {
    if (n === 0) return "Zero";
    let word = "";

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) {
      word += convertBelowThousand(crore) + " Crore ";
    }

    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) {
      word += convertBelowThousand(lakh) + " Lakh ";
    }

    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) {
      word += convertBelowThousand(thousand) + " Thousand ";
    }

    if (n > 0) {
      word += convertBelowThousand(n);
    }

    return word.trim();
  };

  const parts = parseFloat(num).toFixed(2).split(".");
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  let result = "INR " + convert(rupees) + " Only";
  if (paise > 0) {
    result = "INR " + convert(rupees) + " and " + convert(paise) + " Paise Only";
  }

  return result;
};

export default OrderNew;