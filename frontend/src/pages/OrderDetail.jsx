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

  const handleEditClick = () => {
    if (!order) return;

    // 1. Format the delivery address
    const deliveryAddress = {
      house_flat_no: order.delivery_house_flat_no || "",
      wing_lane: order.delivery_wing_lane || "",
      society_colony: order.delivery_society_colony || "",
      landmark: order.delivery_landmark || "",
      area: order.delivery_area || "",
      pincode: order.delivery_pincode || "",
      state: order.delivery_state || "",
      district: order.delivery_district || "",
      tahsil: order.delivery_tahsil || "",
      city: order.delivery_city || "",
    };

    // If order.delivery_address exists, try to parse it
    if (order.delivery_address) {
      if (typeof order.delivery_address === 'object' && order.delivery_address !== null) {
        Object.assign(deliveryAddress, order.delivery_address);
      } else if (typeof order.delivery_address === 'string' && order.delivery_address.trim().length > 0) {
        try {
          const parsed = JSON.parse(order.delivery_address);
          if (typeof parsed === 'object' && parsed !== null) {
            Object.assign(deliveryAddress, parsed);
          }
        } catch (e) {
          try {
            // Try fallback: replacing single quotes with double quotes for single-quoted Python dict representation
            const parsed = JSON.parse(order.delivery_address.replace(/'/g, '"'));
            if (typeof parsed === 'object' && parsed !== null) {
              Object.assign(deliveryAddress, parsed);
            }
          } catch (err) {
            // If it's a plain string, keep deliveryAddress fields as they are from individual fields, or set area
            if (!deliveryAddress.area) {
              deliveryAddress.area = order.delivery_address;
            }
          }
        }
      }
    }

    // 2. Format the form data
    const formData = {
      customer: order.customer.toString(),
      agent: order.agent || "",
      status: order.status,
      payment_status: order.payment_status,
      followup_date: order.followup_date || "",
      partial_amount: order.paid_amount || 0,
      delivery_address: deliveryAddress,
      delivery_option: order.delivery_option || "primary",
      order_date: order.order_date || new Date().toISOString().split('T')[0],
      created_at: order.created_at || new Date().toISOString().split('T')[0],
    };

    // 3. Format the order items
    const orderItems = (order.items || []).map(item => ({
      product: item.product,
      product_title: item.product_title,
      product_sku: item.product_sku,
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      original_price: parseFloat(item.unit_price),
      gst_rate: item.gst_rate,
      gst_rate_value: parseFloat(item.gst_rate_display || 0),
      is_free: item.is_free || false,
      is_gift: item.is_gift || false,
      combo_id: item.combo || item.combo_id || null,
    }));

    // 4. Format applied combos
    const appliedCombos = (order.applied_combos || []).map(ac => ({
      comboId: ac.combo_id,
      combo_id: ac.combo_id,
      quantity: ac.quantity || 1,
      name: ac.name || ""
    }));

    // 5. Package it together
    const editData = {
      formData,
      orderItems,
      appliedCombos
    };

    // 6. Set in sessionStorage
    sessionStorage.setItem("orderEditData", JSON.stringify(editData));
    sessionStorage.setItem("orderEditId", order.id.toString());

    // 7. Navigate to OrderNew
    navigate(`/orders/new?mode=edit&customer=${order.customer}`);
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

  const formatCurrencyNoDecimals = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getGstBreakdown = () => {
    const gstin = order?.customer_details?.gstin_no || "";
    const cleanGstin = gstin.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const stateCode = cleanGstin.slice(0, 2);

    const customerState = (order?.customer_details?.state || "").toLowerCase().trim();
    const isLocalState = customerState.includes("maharashtra") || customerState === "mh" || customerState === "27";
    const isMaharashtra = stateCode === "27" || (!stateCode && isLocalState) || (!stateCode && !customerState);

    let paidTotalOffer = 0;
    let paidTotalTaxable = 0;
    let paidTotalGst = 0;

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

    if (order?.items && order.items.length > 0) {
      order.items.forEach((item) => {
        const isFree = item.is_free;
        const isGift = item.is_gift;
        if (!isFree && !isGift) {
          const gstRate = parseFloat(item.gst_rate_display) || parseFloat(item.gst_rate) || getProductGstRate(item.product);
          const totalOffer = parseFloat(item.total_price) || (parseFloat(item.unit_price) * item.quantity) || 0;
          const taxableOffer = totalOffer / (1 + gstRate / 100);
          const gstOfferAmount = totalOffer - taxableOffer;

          paidTotalOffer += totalOffer;
          paidTotalTaxable += taxableOffer;
          paidTotalGst += gstOfferAmount;
        }
      });
    } else {
      paidTotalOffer = parseFloat(order?.total_amount) || 0;
      paidTotalTaxable = paidTotalOffer / 1.18;
      paidTotalGst = paidTotalOffer - paidTotalTaxable;
    }

    const cgstSgstValue = paidTotalGst / 2;
    const igstValue = paidTotalGst;

    return {
      isMaharashtra,
      taxableValue: paidTotalTaxable,
      totalGst: paidTotalGst,
      cgstSgstValue,
      igstValue
    };
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
          try {
            // Try fallback: replacing single quotes with double quotes for single-quoted Python dict representation
            const parsed = JSON.parse(order.delivery_address.replace(/'/g, '"'));
            if (typeof parsed === 'object' && parsed !== null) {
              const addressParts = Object.values(parsed).filter(Boolean);
              return addressParts.length > 0 ? addressParts.join(', ') : null;
            }
          } catch (err) {
            // Not a JSON string, just return as is
            return order.delivery_address;
          }
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
  const [combosLoading, setCombosLoading] = useState(false);
  useEffect(() => {
    async function fetchCombos() {
      if (!order || !order.applied_combos || order.applied_combos.length === 0) {
        setComboDetails([]);
        return;
      }
      setCombosLoading(true);
      try {
        // Fetch all combos by their IDs
        const comboIds = order.applied_combos.map(c => c.combo_id);
        const res = await axios.get('/api/productcombinations/');
        const allCombos = res.data || [];
        const matchedCombos = allCombos.filter(c => comboIds.includes(c.id));
        setComboDetails(matchedCombos);
      } catch (err) {
        setComboDetails([]);
      } finally {
        setCombosLoading(false);
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

  const handlePrint = () => {
    window.print();
  };

  const getInvoiceItems = () => {
    const invoiceItems = [];
    let sNo = 1;

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

    // Helper: Get HSN code from products list
    const getProductHsn = (productId) => {
      const productObj = products && products.find(p => p.id === productId);
      return productObj ? productObj.hsn : '';
    };

    if (order.applied_combos && order.applied_combos.length > 0 && comboDetails.length > 0) {
      comboDetails.forEach((combo) => {
        const appliedCombo = order.applied_combos?.find(c => c.combo_id === combo.id);
        const appliedQuantity = appliedCombo?.quantity || 1;

        (combo.items || []).forEach((item) => {
          const itemQty = item.quantity_required * appliedQuantity;
          const unitMrp = getOriginalPrice(item.product);
          const totalMrp = unitMrp * itemQty;

          const orderItemObj = order.items?.find(oi => oi.product === item.product && !oi.is_free && !oi.is_gift);
          const unitOffer = orderItemObj ? parseFloat(orderItemObj.unit_price) : (parseFloat(item.offer_price) || 0);
          const totalOffer = orderItemObj ? parseFloat(orderItemObj.total_price) : (unitOffer * itemQty);
          const gstRate = orderItemObj ? (parseFloat(orderItemObj.gst_rate_display) || parseFloat(orderItemObj.gst_rate) || 0) : getProductGstRate(item.product);

          const taxableOffer = totalOffer / (1 + gstRate / 100);
          const gstOfferAmount = totalOffer - taxableOffer;

          invoiceItems.push({
            sNo: sNo++,
            productName: `${item.product_title} (Billed under ${combo.name})`,
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

        (combo.rewards || []).forEach((reward) => {
          const itemQty = reward.quantity_free * appliedQuantity;
          const unitMrp = getOriginalPrice(reward.product);
          const totalMrp = unitMrp * itemQty;

          const orderItemObj = order.items?.find(oi => oi.product === reward.product && oi.is_free);
          const gstRate = orderItemObj ? (parseFloat(orderItemObj.gst_rate_display) || parseFloat(orderItemObj.gst_rate) || 0) : getProductGstRate(reward.product);

          const taxableMrp = totalMrp / (1 + gstRate / 100);
          const gstMrpAmount = totalMrp - taxableMrp;

          invoiceItems.push({
            sNo: sNo++,
            productName: `${reward.product_title} (Free under ${combo.name})`,
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

        (combo.gifts || []).forEach((gift) => {
          const giftQtyVal = gift.quantity_free || gift.quantity || 1;
          const itemQty = giftQtyVal * appliedQuantity;
          const unitMrp = getOriginalPrice(gift.product);
          const totalMrp = unitMrp * itemQty;

          const orderItemObj = order.items?.find(oi => oi.product === gift.product && oi.is_gift);
          const gstRate = orderItemObj ? (parseFloat(orderItemObj.gst_rate_display) || parseFloat(orderItemObj.gst_rate) || 0) : getProductGstRate(gift.product);

          const taxableMrp = totalMrp / (1 + gstRate / 100);
          const gstMrpAmount = totalMrp - taxableMrp;

          invoiceItems.push({
            sNo: sNo++,
            productName: `${gift.product_title} (Gift under ${combo.name})`,
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
    } else if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        let type = 'Paid';
        if (item.is_free) type = 'Free';
        if (item.is_gift) type = 'Gift';

        const originalPrice = getOriginalPrice(item.product);
        const gstRate = parseFloat(item.gst_rate_display) || getProductGstRate(item.product);
        const totalMrp = originalPrice * item.quantity;
        const totalOffer = type === 'Paid' ? (parseFloat(item.total_price) || (parseFloat(item.unit_price) * item.quantity) || 0) : 0;
        const unitOffer = type === 'Paid' ? (parseFloat(item.unit_price) || 0) : 0;

        let taxableAmount = 0;
        let gstAmount = 0;

        if (type === 'Paid') {
          taxableAmount = totalOffer / (1 + gstRate / 100);
          gstAmount = totalOffer - taxableAmount;
        } else {
          taxableAmount = totalMrp / (1 + gstRate / 100);
          gstAmount = totalMrp - taxableAmount;
        }

        invoiceItems.push({
          sNo: sNo++,
          productName: item.product_title + (type !== 'Paid' ? ` (${type})` : ''),
          qty: item.quantity,
          unitMrp: originalPrice,
          totalMrp: totalMrp,
          unitOffer: unitOffer,
          totalOffer: totalOffer,
          gstRate: gstRate,
          taxableOffer: taxableAmount,
          gstAmount: gstAmount,
          type: type,
          hsn: item.hsn || getProductHsn(item.product)
        });
      });
    }

    return invoiceItems;
  };

  const { isMaharashtra, taxableValue, totalGst, cgstSgstValue, igstValue } = getGstBreakdown();

  const invoiceItems = getInvoiceItems();

  const getInvoiceNumber = () => {
    const rawId = order.order_id || `ORD-${order.id}`;
    return rawId.replace(/^ORD-?/i, '');
  };

  const customerFullName = `${order.customer_details?.name || order.customer_name || ""} ${order.customer_details?.surname || ""}`.trim();
  const companyName = order.customer_details?.company_name;

  let totalShippedQty = 0;
  let totalBilledQty = 0;
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  invoiceItems.forEach(item => {
    totalShippedQty += item.qty;
    if (item.type === 'Paid') {
      totalBilledQty += item.qty;
      totalTaxableValue += item.taxableOffer;
      if (isMaharashtra) {
        totalCgst += item.gstAmount / 2;
        totalSgst += item.gstAmount / 2;
      } else {
        totalIgst += item.gstAmount;
      }
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
    if (item.type === 'Paid') {
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
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center"
            >
              <Printer className="h-4 w-4 mr-2 text-blue-600" />
              Print Invoice
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <Link
              to={`/customers/${order.customer}`}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center"
            >
              <User className="h-4 w-4 mr-2 text-indigo-600" />
              View Customer
            </Link>
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
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

        {/* Tax Invoice Layout */}
        <div className="flex justify-center bg-gray-100/50 py-8 border border-gray-300 rounded-2xl shadow-inner mb-6 print:bg-transparent print:border-none print:shadow-none print:py-0 print:mb-0">
          <div id="print-invoice-area" className="bg-white p-8 shadow-2xl border border-gray-300 rounded-xl max-w-[800px] w-full text-black print:shadow-none print:border-none print:p-0 print:max-w-full print:bg-transparent">
            <div className="inv-box">
              <div className="inv-header">Quotation</div>

              {/* Row 1: Company details (Left) and Invoice Details (Right) */}
              <div className="inv-row inv-border-b">
                {/* Left Column: Seller/From Details */}
                <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between" style={{ padding: "5px 6px" }}>
                  <div style={{ width: "50%" }} className="pr-2">
                    <div className="font-bold" style={{ fontSize: "11px" }}>PARU ENTERPRISES</div>
                    <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-normal text-gray-800">
                      A SQUARE PLAZA GR FLR OPP
                      {"\n"}NARMADA GARDEN SANGVI PUNE
                    </div>
                  </div>
                  <div style={{ width: "50%" }} className="pl-2 text-[11px] text-gray-800 self-start mt-0.5">
                    <div><strong>GSTIN/UIN:</strong> 27AKCPP9722G1ZY</div>
                    <div><strong>Contact:</strong> 9960345670</div>
                    <div><strong>E-Mail:</strong> Dcrpsquare@gmail.co</div>
                  </div>
                </div>

                {/* Right Column: Invoice Reference Numbers in a Grid */}
                <div className="inv-w-50 flex flex-col">
                  <div className="inv-row inv-border-b flex-1">
                    <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                      <span className="text-[8px] text-gray-500 font-bold uppercase">Invoice No.</span>
                      <span className="font-bold" style={{ fontSize: "10px" }}>{getInvoiceNumber()}</span>
                    </div>
                    <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                      <span className="text-[8px] text-gray-500 font-bold uppercase">Dated</span>
                      <span className="font-bold" style={{ fontSize: "10px" }}>{formatDate(order.order_date)}</span>
                    </div>
                  </div>

                  <div className="inv-row inv-border-b flex-1">
                    <div className="inv-cell inv-border-r inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                      <span className="text-[8px] text-gray-500 font-bold uppercase">Delivery Note</span>
                      <span className="font-bold" style={{ fontSize: "10px" }}></span>
                    </div>
                    <div className="inv-cell inv-w-50 flex flex-row justify-between items-center" style={{ padding: "2px 6px" }}>
                      <span className="text-[8px] text-gray-500 font-bold uppercase">Mode/Terms of Payment</span>
                      <span className="font-bold" style={{ fontSize: "10px" }}>{order.payment_status}</span>
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

              {/* Row 2: Consignee & Buyer (Left) and Dispatch & Terms (Right) */}
              <div className="inv-row inv-border-b">
                {/* Left Column: Billing/Shipping Details */}
                <div className="inv-cell inv-border-r inv-w-50 flex flex-col" style={{ padding: "5px 6px" }}>
                  <div className="inv-border-b pb-1.5 mb-1.5">
                    <div className="flex flex-row flex-wrap items-baseline gap-x-4 mb-1 text-[11px]">
                      <span className="text-[11px] text-black uppercase font-bold">Consignee (Ship to)</span>
                      {companyName && (
                        <Link to={`/customers/${order.customer}`} className="font-bold text-blue-600 hover:underline hover:text-blue-800 print:text-black print:no-underline">
                          {companyName}
                        </Link>
                      )}
                      <Link to={`/customers/${order.customer}`} className={`${companyName ? "text-gray-800 font-normal" : "font-bold text-black"} hover:underline text-blue-600 hover:text-blue-800 print:text-black print:no-underline font-bold`}>
                        {customerFullName}
                      </Link>
                    </div>
                    <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-tight font-bold text-black">{getDeliveryAddress() || "—"}</div>
                    <div className="text-[11px] mt-1 text-black font-bold">
                      {order.customer_details?.phone && <div><strong>Contact:</strong> {order.customer_details.phone}</div>}
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-row flex-wrap items-baseline gap-x-4 mb-1 text-[11px]">
                      <span className="text-[11px] text-black uppercase font-bold">Buyer (Bill to)</span>
                      {companyName && (
                        <Link to={`/customers/${order.customer}`} className="font-bold text-blue-600 hover:underline hover:text-blue-800 print:text-black print:no-underline">
                          {companyName}
                        </Link>
                      )}
                      <Link to={`/customers/${order.customer}`} className={`${companyName ? "text-gray-800 font-normal" : "font-bold text-black"} hover:underline text-blue-600 hover:text-blue-800 print:text-black print:no-underline font-bold`}>
                        {customerFullName}
                      </Link>
                    </div>
                    <div className="text-[11px] mt-0.5 whitespace-pre-wrap leading-tight text-black font-bold">{getDeliveryAddress() || "—"}</div>
                    <div className="text-[11px] mt-1 text-black font-bold">
                      {order.customer_details?.phone && <div><strong>Contact:</strong> {order.customer_details.phone}</div>}
                      <div><strong>State Name:</strong> {order.customer_details?.state || 'Maharashtra'}, Code: {order.customer_details?.state ? (order.customer_details.gstin_no ? order.customer_details.gstin_no.slice(0, 2) : '—') : '27'}</div>
                      {order.customer_details?.gstin_no && <div><strong>GSTIN/UIN:</strong> {formatGtin(order.customer_details.gstin_no)}</div>}
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

              {/* Items Table */}
              <table className="inv-table w-full">
                <thead>
                  <tr>
                    <th rowSpan="2" className="text-center w-8">Sl No.</th>
                    <th rowSpan="2" className="text-left">Description of Goods</th>
                    <th rowSpan="2" className="text-center w-16">HSN/SAC</th>
                    <th colSpan="2" className="text-center w-24">Quantity</th>
                    <th rowSpan="2" className="text-right w-20">Rate<br />(Incl. of Tax)</th>
                    <th rowSpan="2" className="text-right w-20">Rate</th>
                    <th rowSpan="2" className="text-center w-12">per</th>
                    <th rowSpan="2" className="text-center w-12">Disc. %</th>
                    <th rowSpan="2" className="text-right w-24">Amount</th>
                  </tr>
                  <tr>
                    <th className="text-center w-12" style={{ borderTop: "1.2px solid #000" }}>Shipped</th>
                    <th className="text-center w-12" style={{ borderTop: "1.2px solid #000" }}>Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, idx) => {
                    const isPaid = item.type === 'Paid';
                    const discPercent = isPaid && item.unitMrp > item.unitOffer
                      ? (((item.unitMrp - item.unitOffer) / item.unitMrp) * 100).toFixed(0) + "%"
                      : "";

                    return (
                      <tr key={idx} style={{ height: "24px" }}>
                        <td className="text-center">{item.sNo}</td>
                        <td className="text-left font-bold">
                          {item.productName}
                        </td>
                        <td className="text-center">{item.hsn}</td>
                        <td className="text-center font-bold">{item.qty} PCS</td>
                        <td className="text-center font-bold">{isPaid ? `${item.qty} PCS` : ""}</td>
                        <td className="text-right">
                          {isPaid ? formatCurrency(item.unitOffer) : ""}
                        </td>
                        <td className="text-right">
                          {isPaid ? formatCurrency(item.unitOffer / (1 + item.gstRate / 100)) : ""}
                        </td>
                        <td className="text-center">{isPaid ? "PCS" : ""}</td>
                        <td className="text-center">{discPercent}</td>
                        <td className="text-right font-bold">
                          {isPaid ? formatCurrency(item.taxableOffer) : ""}
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
                    <td className="text-center font-bold">{totalShippedQty} PCS</td>
                    <td className="text-center font-bold">{totalBilledQty} PCS</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="text-right font-bold" style={{ fontSize: "11px" }}>{formatCurrencyNoDecimals(roundedGrandTotal)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in words */}
              <div className="inv-row inv-border-b inv-cell flex justify-between items-center" style={{ padding: "5px 6px" }}>
                <div>
                  <span className="text-[8px] text-gray-500 block">Amount Chargeable (in words)</span>
                  <span className="font-bold" style={{ fontSize: "10px" }}>{convertNumberToWords(roundedGrandTotal)}</span>
                </div>
                <div className="font-bold text-[10px]">E. & O.E</div>
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
                          <tr key={idx}>
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
                          <tr key={idx}>
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
              <div className="inv-row inv-border-b inv-cell" style={{ padding: "5px 6px" }}>
                <div style={{ fontSize: "9.5px" }}>
                  <strong>Tax Amount (in words) :</strong> {convertNumberToWords(totalCgst + totalSgst + totalIgst)}
                </div>
              </div>

              {/* Row 4: Bank Details & Declaration */}
              <div className="inv-row inv-border-b">
                {/* Declaration */}
                <div className="inv-cell inv-border-r inv-w-50 text-[8px] leading-relaxed" style={{ padding: "5px 6px" }}>
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
                <div className="inv-cell inv-w-50 h-16 flex flex-col justify-between text-right" style={{ padding: "5px 6px" }}>
                  <div className="font-bold text-[9px]">for PSQUARE ENTERPRISES</div>
                  <div className="inv-row justify-between text-[8px] text-gray-500 mt-auto">
                    <span>Prepared by</span>
                    <span>Verified by</span>
                    <span className="font-bold text-black text-[9px]">Authorised Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Additional Information in Compact Table Format */}
        {order.notes && (
          <div className="mt-4 bg-white rounded-lg shadow overflow-hidden border border-gray-200 print:hidden">
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
        {/* Printable Invoice Styling */}
        <style dangerouslySetInnerHTML={{
          __html: `
          #print-invoice-area {
            font-family: Arial, sans-serif !important;
            color: black !important;
            background: white !important;
          }
          .inv-box {
            border: 1.5px solid #000 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            font-size: 10px !important;
            line-height: 1.3 !important;
          }
          .inv-header {
            text-align: center !important;
            font-weight: bold !important;
            font-size: 14px !important;
            border-bottom: 1.5px solid #000 !important;
            padding: 4px 0 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
          }
          .inv-row {
            display: flex !important;
            width: 100% !important;
          }
          .inv-cell {
            padding: 4px 6px !important;
            box-sizing: border-box !important;
          }
          .inv-border-r {
            border-right: 1.2px solid #000 !important;
          }
          .inv-border-b {
            border-bottom: 1.2px solid #000 !important;
          }
          .inv-w-50 {
            width: 50% !important;
          }
          .inv-w-25 {
            width: 25% !important;
          }
          .inv-w-100 {
            width: 100% !important;
          }
          .inv-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9px !important;
          }
          .inv-table th, .inv-table td {
            border: 1.2px solid #000 !important;
            padding: 4px 5px !important;
            vertical-align: top !important;
          }
          .inv-table th {
            background-color: #f2f2f2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          .text-center {
            text-align: center !important;
          }
          .text-right {
            text-align: right !important;
          }
          .text-left {
            text-align: left !important;
          }
          .font-bold {
            font-weight: bold !important;
          }
          .italic {
            font-style: italic !important;
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
            #print-invoice-area, #print-invoice-area * {
              visibility: visible !important;
            }
            #print-invoice-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              font-family: Arial, sans-serif !important;
              color: black !important;
              background: white !important;
            }
          }
        `}} />


      </div>
    </div>
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

export default OrderDetail;