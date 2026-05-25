import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  User,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  FileText,
  ShoppingBag,
  AlertCircle,
  ChevronRight,
  Printer,
  Download,
  Copy,
  Hash,
  Tag,
  Box,
  Scale,
  Percent,
  Receipt,
  Building2,
  UserCircle,
  Clock,
  ClipboardList
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const OrderDetail = () => {
  // Fetch products for original price lookup
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await axios.get('/api/products/');
      return response.data;
    },
  });
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await axios.get(`/api/orders/${id}/`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/api/orders/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      toast.success('Order deleted successfully');
      navigate('/orders');
    },
    onError: () => {
      toast.error('Failed to delete order');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatGstin = (gstin) => {
    if (!gstin) return "";
    const cleaned = gstin.toString().replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (cleaned.length === 15) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 12)}-${cleaned.slice(12, 15)}`;
    }
    return cleaned;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const colors = {
      'Delivered': 'bg-green-100 text-green-800',
      'Dispatched': 'bg-blue-100 text-blue-800',
      'Processing': 'bg-yellow-100 text-yellow-800',
      'Pending': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || colors['Pending'];
  };

  const getPaymentStatusBadge = (status) => {
    return status === 'Paid'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-rose-100 text-rose-800';
  };

  // Helper: Get delivery address from order
  const getDeliveryAddress = () => {
    // If custom address, use order.delivery_address (string or object)
    if (order && order.delivery_address) {
      if (typeof order.delivery_address === 'string' && order.delivery_address.length > 0) {
        // Try to parse if it looks like a JSON object
        try {
          const parsed = JSON.parse(order.delivery_address);
          if (typeof parsed === 'object' && parsed !== null) {
            const addressParts = Object.values(parsed).filter(Boolean);
            return addressParts.length > 0 ? addressParts.join(', ') : null;
          }
        } catch (e) {
          // Not a JSON string, just return as is
          return order.delivery_address;
        }
        return order.delivery_address;
      }
      if (typeof order.delivery_address === 'object' && order.delivery_address !== null) {
        // Only show the values, not the keys
        const addressParts = Object.values(order.delivery_address).filter(Boolean);
        return addressParts.length > 0 ? addressParts.join(', ') : null;
      }
    }
    // Fallback: use customer primary address
    if (order && order.customer_details) {
      const addressParts = [
        order.customer_details.house_flat_no,
        order.customer_details.wing_lane,
        order.customer_details.society_colony,
        order.customer_details.landmark,
        order.customer_details.area,
        order.customer_details.city,
        order.customer_details.district,
        order.customer_details.state,
        order.customer_details.pincode,
      ].filter(Boolean);
      return addressParts.length > 0 ? addressParts.join(', ') : null;
    }
    return null;
  };

  // Helper: Fetch combos for applied_combos
  const [comboDetails, setComboDetails] = useState([]);
  useEffect(() => {
    async function fetchCombos() {
      if (!order || !order.applied_combos || order.applied_combos.length === 0) {
        setComboDetails([]);
        return;
      }
      try {
        // Fetch all combos by their IDs
        const comboIds = order.applied_combos.map(c => c.combo_id);
        const res = await axios.get('/api/productcombinations/');
        const allCombos = res.data || [];
        const matchedCombos = allCombos.filter(c => comboIds.includes(c.id));
        setComboDetails(matchedCombos);
      } catch (err) {
        setComboDetails([]);
      }
    }
    fetchCombos();
  }, [order]);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading order details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Error Loading Order</h2>
        <p className="text-gray-600 text-center mb-6">{error.message}</p>
        <Link
          to="/orders"
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded transition text-center"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The requested order could not be found.</p>
        <Link
          to="/orders"
          className="inline-flex items-center px-5 py-2.5 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_id || `ORD-${order.id}`}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <Link
              to={`/orders/edit/${order.id}`}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Excel-like Table Structure */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {/* Master Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1a2332] border-b border-gray-300">
                <th colSpan="4" className="px-6 py-3 text-left text-sm font-semibold text-white border-r border-gray-300">
                  <div className="flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2 text-blue-600" />
                    ORDER INFORMATION
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: Basic Order Details */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 w-48 border-r border-gray-200">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-gray-400" />
                    Order ID
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium w-64 border-r border-gray-200">
                  {order.order_id || `ORD-${order.id}`}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 w-48 border-r border-gray-200">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Order Date
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(order.order_date)}
                </td>
              </tr>

              {/* Row 2: Customer & Agent */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    Customer
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                  <div className="flex items-center">
                    {order.customer_name}
                    {order.customer_details?.id && (
                      <Link
                        to={`/customers/${order.customer_details.id}`}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <UserCircle className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                    Agent
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {order.agent_name || 'N/A'}
                </td>
              </tr>

              {/* Row 3: Contact Information */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    Phone
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                  {order.customer_details?.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    Email
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {order.customer_details?.email || 'N/A'}
                </td>
              </tr>

              {/* Row 4: GSTIN No */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    GSTIN No
                  </div>
                </td>
                <td colSpan="3" className="px-6 py-4 text-sm text-gray-900 font-semibold tracking-wider">
                  {order.customer_details?.gstin_no ? formatGstin(order.customer_details.gstin_no) : '—'}
                </td>
              </tr>

              {/* Row 5: Delivery Address */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    Delivery Address
                  </div>
                </td>
                <td colSpan="3" className="px-6 py-4 text-sm text-gray-900">
                  {getDeliveryAddress() ? (
                    <div className="break-words">{getDeliveryAddress()}</div>
                  ) : (
                    <span className="text-gray-500">No address provided</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table className="w-full border-collapse border-t border-gray-300">
            <thead>
              <tr className="bg-[#1a2332] border-b border-gray-300">
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-white">Combo Name</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-white" colSpan="4">Purchase Product</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-white" colSpan="3">Free Product</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-white" colSpan="3">Gift Product</th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-white" colSpan="2">Total</th>
              </tr>
              <tr className="bg-[#1a2332] border-b border-gray-300">
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white"></th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Product</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Qty</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Mrp</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Offer Price</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Product</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Qty</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Mrp</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Product</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Qty</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Mrp</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Total Mrp</th>
                <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-white">Combo Price</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Initialize Grand Total accumulators
                let purchaseTotalQty = 0;
                let purchaseTotalMrp = 0;
                let purchaseTotalOffer = 0;
                let purchaseTotalTaxable = 0;
                let purchaseTotalGst = 0;

                let freeTotalQty = 0;
                let freeTotalMrp = 0;
                let freeTotalTaxable = 0;
                let freeTotalGst = 0;

                let giftTotalQty = 0;
                let giftTotalMrp = 0;
                let giftTotalTaxable = 0;
                let giftTotalGst = 0;

                let grandTotalRegular = 0;
                let grandTotalOffer = 0;

                // Render helpers
                const formatCurrencyVal = (val) => formatCurrency(val);

                // Helper: Get original price (MRP) from products list (supporting ProductPricing)
                const getOriginalPrice = (productId) => {
                  const productObj = products && products.find(p => p.id === productId);
                  if (productObj) {
                    if (productObj.pricing?.mrp !== undefined && productObj.pricing?.mrp !== null) {
                      return parseFloat(productObj.pricing.mrp);
                    }
                    return parseFloat(productObj.mrp || productObj.price || 0);
                  }
                  return 0;
                };

                // Helper: Get GST rate from products list
                const getProductGstRate = (productId) => {
                  const productObj = products && products.find(p => p.id === productId);
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

                // Helper: Replicate OrderNew calculateComboSavings supporting manual combo price
                const calculateComboSavings = (combo, quantity = 1) => {
                  let regularTotal = 0;
                  let offerTotal = 0;

                  combo.items?.forEach((item) => {
                    const mrpVal = getOriginalPrice(item.product);
                    regularTotal += mrpVal * item.quantity_required * quantity;
                  });

                  if (combo.manual_combo_price !== undefined && combo.manual_combo_price !== null && parseFloat(combo.manual_combo_price) > 0) {
                    offerTotal = parseFloat(combo.manual_combo_price) * quantity;
                  } else {
                    combo.items?.forEach((item) => {
                      const prodObj = products?.find(p => p.id === item.product);
                      const saleVal = prodObj?.pricing?.sale_rate !== undefined && prodObj?.pricing?.sale_rate !== null
                        ? parseFloat(prodObj.pricing.sale_rate)
                        : parseFloat(prodObj?.price || 0);
                      const offerPrice = item.offer_price ? parseFloat(item.offer_price) : saleVal;
                      offerTotal += offerPrice * item.quantity_required * quantity;
                    });
                  }

                  combo.rewards?.forEach((reward) => {
                    const mrpVal = getOriginalPrice(reward.product);
                    regularTotal += mrpVal * reward.quantity_free * quantity;
                  });

                  combo.gifts?.forEach((gift) => {
                    const mrpVal = getOriginalPrice(gift.product);
                    const giftQty = gift.quantity_free || gift.quantity || 1;
                    regularTotal += mrpVal * giftQty * quantity;
                  });

                  return {
                    regularTotal,
                    offerTotal,
                    savings: regularTotal - offerTotal,
                    savingsPercentage: regularTotal > 0 ? ((regularTotal - offerTotal) / regularTotal * 100).toFixed(1) : 0
                  };
                };

                if (comboDetails.length > 0) {
                  return (
                    <>
                      {comboDetails.flatMap((combo, comboIdx) => {
                        const appliedCombo = order.applied_combos?.find(c => c.combo_id === combo.id);
                        const appliedQuantity = appliedCombo?.quantity || 1;
                        
                        const savingsObj = calculateComboSavings(combo, appliedQuantity);
                        grandTotalRegular += savingsObj.regularTotal;
                        grandTotalOffer += savingsObj.offerTotal;

                        const paidItems = combo.items || [];
                        const freeItems = combo.rewards || [];
                        const giftItems = combo.gifts || [];

                        const maxLength = Math.max(paidItems.length, freeItems.length, giftItems.length, 1);

                        return Array.from({ length: maxLength }).map((_, i) => {
                          const paidItem = paidItems[i];
                          const freeItem = freeItems[i];
                          const giftItem = giftItems[i];

                          // Calculations for Paid Item
                          let paidItemJsx = (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            </>
                          );
                          if (paidItem) {
                            const unitMrp = getOriginalPrice(paidItem.product);
                            const itemQty = paidItem.quantity_required * appliedQuantity;
                            const totalMrp = unitMrp * itemQty;
                            const unitOffer = parseFloat(paidItem.offer_price) || 0;
                            const totalOffer = unitOffer * itemQty;
                            const gstRate = getProductGstRate(paidItem.product);
                            const taxableOffer = totalOffer / (1 + gstRate / 100);
                            const gstOfferAmount = totalOffer - taxableOffer;

                            purchaseTotalQty += itemQty;
                            purchaseTotalMrp += totalMrp;
                            purchaseTotalOffer += totalOffer;
                            purchaseTotalTaxable += taxableOffer;
                            purchaseTotalGst += gstOfferAmount;

                            paidItemJsx = (
                              <>
                                <td className="border border-gray-300 px-4 py-3 text-sm">
                                  <div className="font-semibold text-gray-900">{paidItem.product_title}</div>
                                  <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                    GST: {gstRate}% | Taxable: {formatCurrencyVal(taxableOffer)} | Tax: {formatCurrencyVal(gstOfferAmount)}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-center font-medium text-gray-900">
                                  {itemQty}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                  <div className="text-gray-900 font-medium">{formatCurrencyVal(totalMrp)}</div>
                                  <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(unitMrp)}</div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                  <div className="text-green-700 font-bold">{formatCurrencyVal(totalOffer)}</div>
                                  <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(unitOffer)}</div>
                                </td>
                              </>
                            );
                          }

                          // Calculations for Free Item
                          let freeItemJsx = (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            </>
                          );
                          if (freeItem) {
                            const unitMrp = getOriginalPrice(freeItem.product);
                            const itemQty = freeItem.quantity_free * appliedQuantity;
                            const totalMrp = unitMrp * itemQty;
                            const gstRate = getProductGstRate(freeItem.product);
                            const taxableMrp = totalMrp / (1 + gstRate / 100);
                            const gstMrpAmount = totalMrp - taxableMrp;

                            freeTotalQty += itemQty;
                            freeTotalMrp += totalMrp;
                            freeTotalTaxable += taxableMrp;
                            freeTotalGst += gstMrpAmount;

                            freeItemJsx = (
                              <>
                                <td className="border border-gray-300 px-4 py-3 text-sm">
                                  <div className="font-semibold text-gray-900">{freeItem.product_title}</div>
                                  <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                    GST: {gstRate}% | Taxable: {formatCurrencyVal(taxableMrp)} | Tax: {formatCurrencyVal(gstMrpAmount)}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-center font-medium text-gray-900">
                                  {itemQty}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                  <div className="text-gray-900 font-medium">{formatCurrencyVal(totalMrp)}</div>
                                  <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(unitMrp)}</div>
                                </td>
                              </>
                            );
                          }

                          // Calculations for Gift Item
                          let giftItemJsx = (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            </>
                          );
                          const giftQtyVal = giftItem ? (giftItem.quantity_free || giftItem.quantity || 1) : 0;
                          if (giftItem) {
                            const unitMrp = getOriginalPrice(giftItem.product);
                            const itemQty = giftQtyVal * appliedQuantity;
                            const totalMrp = unitMrp * itemQty;
                            const gstRate = getProductGstRate(giftItem.product);
                            const taxableMrp = totalMrp / (1 + gstRate / 100);
                            const gstMrpAmount = totalMrp - taxableMrp;

                            giftTotalQty += itemQty;
                            giftTotalMrp += totalMrp;
                            giftTotalTaxable += taxableMrp;
                            giftTotalGst += gstMrpAmount;

                            giftItemJsx = (
                              <>
                                <td className="border border-gray-300 px-4 py-3 text-sm">
                                  <div className="font-semibold text-gray-900">{giftItem.product_title}</div>
                                  <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                    GST: {gstRate}% | Taxable: {formatCurrencyVal(taxableMrp)} | Tax: {formatCurrencyVal(gstMrpAmount)}
                                  </div>
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-center font-medium text-gray-900">
                                  {itemQty}
                                </td>
                                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                  <div className="text-gray-900 font-medium">{formatCurrencyVal(totalMrp)}</div>
                                  <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(unitMrp)}</div>
                                </td>
                              </>
                            );
                          }

                          return (
                            <tr key={`${combo.id}-${i}`} className="hover:bg-gray-50">
                              {i === 0 && (
                                <td className="border border-gray-300 px-4 py-3 align-middle bg-gray-50/50" rowSpan={maxLength}>
                                  <div className="font-bold text-gray-900 text-sm">{combo.name}</div>
                                  <div className="text-xs text-green-700 mt-1 font-semibold">Qty: {appliedQuantity}</div>
                                </td>
                              )}
                              {paidItemJsx}
                              {freeItemJsx}
                              {giftItemJsx}
                              {i === 0 && (
                                <>
                                  <td className="border border-gray-300 px-4 py-3 text-sm text-right align-middle font-medium text-gray-900 bg-gray-50/20" rowSpan={maxLength}>
                                    {formatCurrencyVal(savingsObj.regularTotal)}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-sm text-right align-middle font-bold text-green-700 bg-gray-50/20" rowSpan={maxLength}>
                                    {formatCurrencyVal(savingsObj.offerTotal)}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        });
                      })}
                      {renderGrandTotalsRow()}
                    </>
                  );
                } else {
                  // Non-combo order items list
                  if (!products || !Array.isArray(products)) {
                    return (
                      <tr>
                        <td colSpan="11" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          Loading product data...
                        </td>
                      </tr>
                    );
                  }

                  if (!order.items || order.items.length === 0) {
                    return (
                      <tr>
                        <td colSpan="11" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          No items found for this order
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <>
                      {order.items.map((item, idx) => {
                        let itemType = 'Paid';
                        if (item.is_free) itemType = 'Free';
                        if (item.is_gift) itemType = 'Gift';

                        const originalPrice = getOriginalPrice(item.product);
                        const gstRate = parseFloat(item.gst_rate_display) || getProductGstRate(item.product);

                        let paidItemJsx = (
                          <>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                          </>
                        );

                        let freeItemJsx = (
                          <>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                          </>
                        );

                        let giftItemJsx = (
                          <>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400">-</td>
                          </>
                        );

                        if (itemType === 'Paid') {
                          const totalMrp = originalPrice * item.quantity;
                          const totalOffer = parseFloat(item.total_price) || (parseFloat(item.unit_price) * item.quantity) || 0;
                          const taxableOffer = totalOffer / (1 + gstRate / 100);
                          const gstOfferAmount = totalOffer - taxableOffer;

                          purchaseTotalQty += item.quantity;
                          purchaseTotalMrp += totalMrp;
                          purchaseTotalOffer += totalOffer;
                          purchaseTotalTaxable += taxableOffer;
                          purchaseTotalGst += gstOfferAmount;

                          paidItemJsx = (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-sm">
                                <div className="font-semibold text-gray-900">{item.product_title}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                  GST: {gstRate}% | Taxable: {formatCurrencyVal(taxableOffer)} | Tax: {formatCurrencyVal(gstOfferAmount)}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center font-medium text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                <div className="text-gray-900 font-medium">{formatCurrencyVal(totalMrp)}</div>
                                <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(originalPrice)}</div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                <div className="text-green-700 font-bold">{formatCurrencyVal(totalOffer)}</div>
                                <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(parseFloat(item.unit_price) || 0)}</div>
                              </td>
                            </>
                          );
                        } else if (itemType === 'Free') {
                          const totalMrp = originalPrice * item.quantity;
                          const taxableMrp = totalMrp / (1 + gstRate / 100);
                          const gstMrpAmount = totalMrp - taxableMrp;

                          freeTotalQty += item.quantity;
                          freeTotalMrp += totalMrp;
                          freeTotalTaxable += taxableMrp;
                          freeTotalGst += gstMrpAmount;

                          freeItemJsx = (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-sm">
                                <div className="font-semibold text-gray-900">{item.product_title}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                  GST: {gstRate}% | Taxable: {formatCurrencyVal(taxableMrp)} | Tax: {formatCurrencyVal(gstMrpAmount)}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center font-medium text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                <div className="text-gray-900 font-medium">{formatCurrencyVal(totalMrp)}</div>
                                <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(originalPrice)}</div>
                              </td>
                            </>
                          );
                        } else if (itemType === 'Gift') {
                          const totalMrp = originalPrice * item.quantity;
                          const taxableMrp = totalMrp / (1 + gstRate / 100);
                          const gstMrpAmount = totalMrp - taxableMrp;

                          giftTotalQty += item.quantity;
                          giftTotalMrp += totalMrp;
                          giftTotalTaxable += taxableMrp;
                          giftTotalGst += gstMrpAmount;

                          giftItemJsx = (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-sm">
                                <div className="font-semibold text-gray-900">{item.product_title}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                  GST: {gstRate}% | Taxable: {formatCurrencyVal(taxableMrp)} | Tax: {formatCurrencyVal(gstMrpAmount)}
                                </div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-center font-medium text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                                <div className="text-gray-900 font-medium">{formatCurrencyVal(totalMrp)}</div>
                                <div className="text-[10px] text-gray-400">Unit: {formatCurrencyVal(originalPrice)}</div>
                              </td>
                            </>
                          );
                        }

                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 bg-gray-50/50">
                              {itemType}
                            </td>
                            {paidItemJsx}
                            {freeItemJsx}
                            {giftItemJsx}
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400 bg-gray-50/5">-</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-400 bg-gray-50/5">-</td>
                          </tr>
                        );
                      })}
                      {renderGrandTotalsRow()}
                    </>
                  );
                }

                // Helper: Grand totals row renderer
                function renderGrandTotalsRow() {
                  return (
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 uppercase tracking-wider">
                        GRAND TOTALS
                      </td>
                      {/* Purchase Section Totals */}
                      <td className="border border-gray-300 px-4 py-3 text-[11px] text-gray-700 leading-tight">
                        <div>Taxable: {formatCurrencyVal(purchaseTotalTaxable)}</div>
                        <div className="mt-0.5">GST: {formatCurrencyVal(purchaseTotalGst)}</div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-900 font-bold">
                        {purchaseTotalQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right text-gray-900 font-bold">
                        {formatCurrencyVal(purchaseTotalMrp)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-800 font-extrabold">
                        {formatCurrencyVal(purchaseTotalOffer)}
                      </td>

                      {/* Free Section Totals */}
                      <td className="border border-gray-300 px-4 py-3 text-[11px] text-gray-700 leading-tight">
                        <div>Taxable: {formatCurrencyVal(freeTotalTaxable)}</div>
                        <div className="mt-0.5">GST: {formatCurrencyVal(freeTotalGst)}</div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-900 font-bold">
                        {freeTotalQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right text-gray-900 font-bold">
                        {formatCurrencyVal(freeTotalMrp)}
                      </td>

                      {/* Gift Section Totals */}
                      <td className="border border-gray-300 px-4 py-3 text-[11px] text-gray-700 leading-tight">
                        <div>Taxable: {formatCurrencyVal(giftTotalTaxable)}</div>
                        <div className="mt-0.5">GST: {formatCurrencyVal(giftTotalGst)}</div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-center text-gray-900 font-bold">
                        {giftTotalQty}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right text-gray-900 font-bold">
                        {formatCurrencyVal(giftTotalMrp)}
                      </td>

                      {/* Overall Totals */}
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold text-gray-900">
                        {grandTotalRegular > 0 ? formatCurrencyVal(grandTotalRegular) : '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold text-green-700">
                        {grandTotalOffer > 0 ? formatCurrencyVal(grandTotalOffer) : '-'}
                      </td>
                    </tr>
                  );
                }
              })()}
            </tbody>
          </table>

          {/* Consolidated Product Quantity Summary Table */}
          {(() => {
            const consolidatedProducts = {};
            const getProductTitle = (productId, fallbackTitle) => {
              const productObj = products && products.find(p => p.id === productId);
              return productObj && productObj.title ? productObj.title : fallbackTitle;
            };

            const addConsolidated = (productId, fallbackTitle, qty, type) => {
              if (!productId) return;
              if (!consolidatedProducts[productId]) {
                consolidatedProducts[productId] = {
                  productTitle: getProductTitle(productId, fallbackTitle) || `Product #${productId}`,
                  paidQty: 0,
                  freeQty: 0,
                  giftQty: 0,
                };
              }
              if (type === 'Paid') {
                consolidatedProducts[productId].paidQty += qty;
              } else if (type === 'Free') {
                consolidatedProducts[productId].freeQty += qty;
              } else if (type === 'Gift') {
                consolidatedProducts[productId].giftQty += qty;
              }
            };

            if (comboDetails.length > 0) {
              comboDetails.forEach((combo) => {
                const appliedCombo = order.applied_combos?.find(c => c.combo_id === combo.id);
                const appliedQuantity = appliedCombo?.quantity || 1;

                (combo.items || []).forEach(item => {
                  const qty = item.quantity_required * appliedQuantity;
                  addConsolidated(item.product, item.product_title, qty, 'Paid');
                });

                (combo.rewards || []).forEach(reward => {
                  const qty = reward.quantity_free * appliedQuantity;
                  addConsolidated(reward.product, reward.product_title, qty, 'Free');
                });

                (combo.gifts || []).forEach(gift => {
                  const giftQtyVal = gift.quantity_free || gift.quantity || 1;
                  const qty = giftQtyVal * appliedQuantity;
                  addConsolidated(gift.product, gift.product_title, qty, 'Gift');
                });
              });
            } else if (order.items && order.items.length > 0) {
              order.items.forEach(item => {
                let type = 'Paid';
                if (item.is_free) type = 'Free';
                if (item.is_gift) type = 'Gift';
                addConsolidated(item.product, item.product_title, item.quantity, type);
              });
            }

            const productKeys = Object.keys(consolidatedProducts);
            if (productKeys.length === 0) return null;

            return (
              <table className="w-full border-collapse border-t border-gray-300">
                <thead>
                  <tr className="bg-[#1a2332] border-b border-gray-300">
                    <th colSpan="5" className="px-6 py-3 text-left text-sm font-semibold text-white">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-blue-400" />
                        CONSOLIDATED PRODUCT QUANTITY SUMMARY
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="px-6 py-2 border border-gray-300 text-left text-xs font-semibold text-gray-700 w-1/2">Product Name</th>
                    <th className="px-4 py-2 border border-gray-300 text-center text-xs font-semibold text-gray-700 w-1/8">Paid Qty</th>
                    <th className="px-4 py-2 border border-gray-300 text-center text-xs font-semibold text-gray-700 w-1/8">Free Qty</th>
                    <th className="px-4 py-2 border border-gray-300 text-center text-xs font-semibold text-gray-700 w-1/8">Gift Qty</th>
                    <th className="px-6 py-2 border border-gray-300 text-center text-xs font-bold text-gray-900 bg-gray-200/50 w-1/8">Total Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {productKeys.map((key) => {
                    const prod = consolidatedProducts[key];
                    const totalQty = prod.paidQty + prod.freeQty + prod.giftQty;
                    return (
                      <tr key={key} className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="px-6 py-3 border border-gray-300 text-sm font-semibold text-gray-800">
                          {prod.productTitle}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-sm text-center text-gray-700 font-medium">
                          {prod.paidQty || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-sm text-center text-gray-700 font-medium">
                          {prod.freeQty || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-4 py-3 border border-gray-300 text-sm text-center text-gray-700 font-medium">
                          {prod.giftQty || <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-6 py-3 border border-gray-300 text-sm text-center font-bold text-blue-700 bg-blue-50/30">
                          {totalQty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}

          {/* Payment & Status Table */}
          <table className="w-full border-collapse border-t border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th colSpan="4" className="px-6 py-3 bg-[#1a2332] text-left text-sm font-semibold text-white">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-blue-600" />
                    PAYMENT & STATUS
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 w-48 border-r border-gray-200">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    Total Amount
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-bold w-64 border-r border-gray-200">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 w-48 border-r border-gray-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-gray-400" />
                    Payment Status
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </td>
              </tr>

              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    Paid Amount
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200">
                  {formatCurrency(order.paid_amount)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 mr-2 text-gray-400" />
                    Order Status
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
              </tr>

              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                    Balance Due
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-red-600 font-bold border-r border-gray-200">
                  {formatCurrency(order.total_amount - order.paid_amount)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    Follow-up Date
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {order.followup_date ? formatDate(order.followup_date) : 'Not scheduled'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Summary Row */}
          <div className="bg-gray-100 border-t border-gray-300 p-4">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Total Items:</span>
                  <span className="text-sm font-bold text-gray-900">{order.items?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-300">
                  <span className="text-base font-bold text-gray-800">Grand Total:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information in Compact Table Format */}
        {order.notes && (
          <div className="mt-4 bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      ADDITIONAL NOTES
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.notes}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;