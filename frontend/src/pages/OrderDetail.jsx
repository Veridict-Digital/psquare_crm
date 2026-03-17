import { useState } from 'react';
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
              <tr className="bg-gray-100 border-b border-gray-300">
                <th colSpan="4" className="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">
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

              {/* Row 4: Delivery Address */}
              <tr className="border-b border-gray-200 hover:bg-gray-50">
  <td className="px-6 py-4 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
    <div className="flex items-center">
      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
      Delivery Address
    </div>
  </td>
  <td colSpan="3" className="px-6 py-4 text-sm text-gray-900">
    {(() => {
      const addressParts = [
        order.customer_details?.house_flat_no,
        order.customer_details?.wing_lane,
        order.customer_details?.society_colony,
        order.customer_details?.landmark,
        order.customer_details?.area,
        order.customer_details?.city,
        order.customer_details?.district,
        order.customer_details?.state,
        order.customer_details?.pincode,
      ].filter(Boolean);

      if (addressParts.length === 0) {
        return <span className="text-gray-500">No address provided</span>;
      }

      return (
        <div className="break-words">
          {addressParts.join(", ")}
        </div>
      );
    })()}
  </td>
</tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table className="w-full border-collapse border-t border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th colSpan="6" className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  <div className="flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2 text-blue-600" />
                    ORDER ITEMS
                  </div>
                </th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.product_title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.product_sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Payment & Status Table */}
          <table className="w-full border-collapse border-t border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th colSpan="4" className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
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