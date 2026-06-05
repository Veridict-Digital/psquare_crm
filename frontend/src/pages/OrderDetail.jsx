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

                            // Find actual OrderItem in dynamic database records to get exact billed prices and tax rates
                            const orderItemObj = order.items?.find(item => item.product === paidItem.product && !item.is_free && !item.is_gift);
                            const unitOffer = orderItemObj ? parseFloat(orderItemObj.unit_price) : (parseFloat(paidItem.offer_price) || 0);
                            const totalOffer = orderItemObj ? parseFloat(orderItemObj.total_price) : (unitOffer * itemQty);
                            const gstRate = orderItemObj ? (parseFloat(orderItemObj.gst_rate_display) || parseFloat(orderItemObj.gst_rate) || 0) : getProductGstRate(paidItem.product);

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

                            // Find actual OrderItem in dynamic database records to get exact tax rates
                            const orderItemObj = order.items?.find(item => item.product === freeItem.product && item.is_free);
                            const gstRate = orderItemObj ? (parseFloat(orderItemObj.gst_rate_display) || parseFloat(orderItemObj.gst_rate) || 0) : getProductGstRate(freeItem.product);

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

                            // Find actual OrderItem in dynamic database records to get exact tax rates
                            const orderItemObj = order.items?.find(item => item.product === giftItem.product && item.is_gift);
                            const gstRate = orderItemObj ? (parseFloat(orderItemObj.gst_rate_display) || parseFloat(orderItemObj.gst_rate) || 0) : getProductGstRate(giftItem.product);

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
                  <div>{formatCurrency(order.total_amount)}</div>
                  <div className="text-[11px] text-gray-500 font-normal mt-1.5 leading-normal">
                    {isMaharashtra ? (
                      <div>
                        <div>CGST (Inclusive): {formatCurrency(cgstSgstValue)}</div>
                        <div className="mt-0.5">SGST (Inclusive): {formatCurrency(cgstSgstValue)}</div>
                      </div>
                    ) : (
                      <div>IGST (Inclusive): {formatCurrency(igstValue)}</div>
                    )}
                    <div className="mt-1 border-t border-gray-200 pt-1 text-gray-400">Taxable Value: {formatCurrency(taxableValue)}</div>
                  </div>
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
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm font-medium text-gray-600">Total Items:</span>
                  <span className="text-sm font-bold text-gray-900">{order.items?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-xs border-t border-gray-200 pt-1.5">
                  <span className="text-gray-500 font-medium">Total Taxable Value (Inclusive):</span>
                  <span className="text-gray-900 font-bold">{formatCurrency(taxableValue)}</span>
                </div>
                {isMaharashtra ? (
                  <>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-gray-500 font-medium">CGST (Inclusive):</span>
                      <span className="text-gray-900 font-bold">{formatCurrency(cgstSgstValue)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="text-gray-500 font-medium">SGST (Inclusive):</span>
                      <span className="text-gray-900 font-bold">{formatCurrency(cgstSgstValue)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center py-1 text-xs">
                    <span className="text-gray-500 font-medium">IGST (Inclusive):</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(igstValue)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-t border-gray-300 mt-1.5">
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
        {/* Printable Invoice Styling */}
        <style dangerouslySetInnerHTML={{
          __html: `
          #print-invoice-area {
            display: none;
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
          }
        `}} />

        {/* Printable Invoice Layout (Hidden on Screen, Active on Print) */}
        {(() => {
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
            <div id="print-invoice-area" className="hidden print:block text-black bg-white">
              <div className="inv-box">
                <div className="inv-header">Tax Invoice</div>

                {/* Row 1: Company details (Left) and Invoice Details (Right) */}
                <div className="inv-row inv-border-b">
                  {/* Left Column: Seller/From Details */}
                  <div className="inv-cell inv-border-r inv-w-50 flex flex-col justify-between" style={{ minHeight: "110px" }}>
                    <div>
                      <div className="font-bold" style={{ fontSize: "11px" }}>PSQUARE ENTERPRISES</div>
                      <div className="text-[9px] mt-0.5 whitespace-pre-wrap leading-normal text-gray-800">
                        A SQUARE PLAZA GR FLR OPP
                        {"\n"}NARMADA GARDEN SANGVI PUNE
                        {"\n"}State Name: Maharashtra, Code: 27
                      </div>
                    </div>
                    <div className="mt-2 text-[9px] text-gray-800">
                      <div><strong>GSTIN/UIN:</strong> 27AKCPP9722G1ZY</div>
                      <div><strong>Contact:</strong> 9960345670</div>
                      <div><strong>E-Mail:</strong> rupesh.pataskar@gmail.com</div>
                    </div>
                  </div>

                  {/* Right Column: Invoice Reference Numbers in a Grid */}
                  <div className="inv-w-50 flex flex-col">
                    <div className="inv-row inv-border-b flex-1">
                      <div className="inv-cell inv-border-r inv-w-50">
                        <div className="text-[8px] text-gray-500">Invoice No.</div>
                        <div className="font-bold" style={{ fontSize: "10px" }}>{getInvoiceNumber()}</div>
                      </div>
                      <div className="inv-cell inv-w-50">
                        <div className="text-[8px] text-gray-500">Dated</div>
                        <div className="font-bold" style={{ fontSize: "10px" }}>{formatDate(order.order_date)}</div>
                      </div>
                    </div>

                    <div className="inv-row inv-border-b flex-1">
                      <div className="inv-cell inv-border-r inv-w-50">
                        <div className="text-[8px] text-gray-500">Delivery Note</div>
                        <div className="font-bold">—</div>
                      </div>
                      <div className="inv-cell inv-w-50">
                        <div className="text-[8px] text-gray-500">Mode/Terms of Payment</div>
                        <div className="font-bold">{order.payment_status}</div>
                      </div>
                    </div>

                    <div className="inv-row inv-border-b flex-1">
                      <div className="inv-cell inv-border-r inv-w-50">
                        <div className="text-[8px] text-gray-500">Reference No. & Date.</div>
                        <div className="font-bold">—</div>
                      </div>
                      <div className="inv-cell inv-w-50">
                        <div className="text-[8px] text-gray-500">Other References</div>
                        <div className="font-bold">—</div>
                      </div>
                    </div>

                    <div className="inv-row flex-1">
                      <div className="inv-cell inv-border-r inv-w-50">
                        <div className="text-[8px] text-gray-500">Buyer's Order No.</div>
                        <div className="font-bold">—</div>
                      </div>
                      <div className="inv-cell inv-w-50">
                        <div className="text-[8px] text-gray-500">Dated</div>
                        <div className="font-bold">—</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Consignee & Buyer (Left) and Dispatch & Terms (Right) */}
                <div className="inv-row inv-border-b">
                  {/* Left Column: Billing/Shipping Details */}
                  <div className="inv-cell inv-border-r inv-w-50 flex flex-col">
                    <div className="inv-border-b pb-1.5 mb-1.5" style={{ minHeight: "85px" }}>
                      <div className="text-[8px] text-gray-500 uppercase font-bold">Consignee (Ship to)</div>
                      {companyName && <div className="font-bold" style={{ fontSize: "10px" }}>{companyName}</div>}
                      <div className={companyName ? "text-[9px] text-gray-800" : "font-bold"} style={companyName ? {} : { fontSize: "10px" }}>
                        {customerFullName}
                      </div>
                      <div className="text-[9px] mt-0.5 whitespace-pre-wrap leading-tight text-gray-700">{getDeliveryAddress() || "—"}</div>
                      <div className="text-[8px] mt-1 text-gray-600">
                        {order.customer_details?.phone && <div><strong>Contact:</strong> {order.customer_details.phone}</div>}
                        <div><strong>State Name:</strong> {order.customer_details?.state || 'Maharashtra'}, Code: {order.customer_details?.state ? (order.customer_details.gstin_no ? order.customer_details.gstin_no.slice(0, 2) : '—') : '27'}</div>
                      </div>
                    </div>
                    <div style={{ minHeight: "85px" }}>
                      <div className="text-[8px] text-gray-500 uppercase font-bold">Buyer (Bill to)</div>
                      {companyName && <div className="font-bold" style={{ fontSize: "10px" }}>{companyName}</div>}
                      <div className={companyName ? "text-[9px] text-gray-800" : "font-bold"} style={companyName ? {} : { fontSize: "10px" }}>
                        {customerFullName}
                      </div>
                      <div className="text-[9px] mt-0.5 whitespace-pre-wrap leading-tight text-gray-700">{getDeliveryAddress() || "—"}</div>
                      <div className="text-[8px] mt-1 text-gray-600">
                        {order.customer_details?.phone && <div><strong>Contact:</strong> {order.customer_details.phone}</div>}
                        <div><strong>State Name:</strong> {order.customer_details?.state || 'Maharashtra'}, Code: {order.customer_details?.state ? (order.customer_details.gstin_no ? order.customer_details.gstin_no.slice(0, 2) : '—') : '27'}</div>
                        {order.customer_details?.gstin_no && <div><strong>GSTIN/UIN:</strong> {formatGstin(order.customer_details.gstin_no)}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dispatch Details & Terms of Delivery */}
                  <div className="inv-w-50 flex flex-col">
                    <div className="inv-row inv-border-b flex-1">
                      <div className="inv-cell inv-border-r inv-w-50">
                        <div className="text-[8px] text-gray-500">Dispatch Doc No.</div>
                        <div className="font-bold">—</div>
                      </div>
                      <div className="inv-cell inv-w-50">
                        <div className="text-[8px] text-gray-500">Delivery Note Date</div>
                        <div className="font-bold">—</div>
                      </div>
                    </div>

                    <div className="inv-row inv-border-b flex-1">
                      <div className="inv-cell inv-border-r inv-w-50">
                        <div className="text-[8px] text-gray-500">Dispatched through</div>
                        <div className="font-bold">—</div>
                      </div>
                      <div className="inv-cell inv-w-50">
                        <div className="text-[8px] text-gray-500">Destination</div>
                        <div className="font-bold">—</div>
                      </div>
                    </div>

                    <div className="inv-cell flex-1 flex flex-col justify-start" style={{ minHeight: "70px" }}>
                      <div className="text-[8px] text-gray-500 font-bold">Terms of Delivery:</div>
                      <div className="text-[9px] text-gray-700 mt-1 leading-normal">
                        Subject to Pune jurisdiction. Delivery within 7 days.
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
                      <th rowSpan="2" className="text-right w-20">Rate<br/>(Incl. of Tax)</th>
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

                    {/* Fill empty space to give the table some height like standard invoices */}
                    {Array.from({ length: Math.max(8 - invoiceItems.length, 1) }).map((_, i) => (
                      <tr key={`empty-${i}`} style={{ height: "24px" }}>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))}

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
                      <td className="text-right font-bold" style={{ fontSize: "11px" }}>{formatCurrency(roundedGrandTotal)}</td>
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
                  <div className="inv-cell inv-w-50 flex flex-col justify-start" style={{ padding: "5px 6px" }}>
                    <div className="font-bold text-[9px] mb-1">Company's Bank Details:</div>
                    <div className="space-y-1 text-[9px] text-gray-800">
                      <div><strong>Bank Name:</strong> AU SMALL FINANCE BANK</div>
                      <div><strong>A/c No.:</strong> 2221263141506073</div>
                      <div><strong>Branch & IFS Code:</strong> PUNE & AUBL0002631</div>
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
          );
        })()}
      </div>
    </div>
  );
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