import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
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
  Download
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Dispatched': 'bg-blue-100 text-blue-800 border-blue-200',
      'Processing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Pending': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors['Pending'];
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status) => {
    return status === 'Paid' 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : 'bg-rose-100 text-rose-800 border-rose-200';
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading order details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">Error Loading Order</h2>
        <p className="text-gray-600 text-center mb-6">{error.message}</p>
        <Link 
          to="/orders" 
          className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 text-center"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The requested order could not be found.</p>
        <Link 
          to="/orders" 
          className="inline-flex items-center px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-full mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                  {order.status === 'Delivered' ? <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> : 
                   order.status === 'Dispatched' ? <Truck className="h-3.5 w-3.5 mr-1.5" /> : 
                   <AlertCircle className="h-3.5 w-3.5 mr-1.5" />}
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="font-medium">Order ID:</span>
                  <span className="ml-2 font-bold text-gray-900">{order.order_id || `ORD-${order.id}`}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">{formatDate(order.order_date)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200 shadow-sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition duration-200 shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <Link
                to={`/orders/edit/${order.id}`}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-200 shadow-lg shadow-blue-500/25"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="inline-flex items-center px-5 py-2.5 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition duration-200 shadow-lg shadow-rose-500/25 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <ShoppingBag className="h-6 w-6 text-blue-600 mr-3" />
                    <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
                  </div>
                  <span className="text-sm text-gray-500">
                    {order.items?.length || 0} items
                  </span>
                </div>
                
                <div className="space-y-6">
                  {order.items?.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl hover:border-blue-300 transition duration-200">
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{item.product_title}</h3>
                                <p className="text-sm text-gray-500 mt-1">SKU: {item.product_sku}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <span className="text-sm text-gray-600">
                                    <span className="font-medium">Quantity:</span> {item.quantity}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    <span className="font-medium">GST:</span> {item.gst_rate}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="lg:text-right">
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(item.total_price)}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatCurrency(item.unit_price)} × {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <User className="h-6 w-6 text-green-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="h-4 w-4 mr-2 text-green-600" />
                        Customer Details
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-semibold text-gray-900">{order.customer_name}</p>
                          </div>
                        </div>
                        {order.customer?.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-semibold text-gray-900">{order.customer.phone}</p>
                            </div>
                          </div>
                        )}
                        {order.customer?.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-semibold text-gray-900">{order.customer.email}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                        Delivery Address
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Address</p>
                          <p className="font-medium text-gray-900 leading-relaxed">{order.customer?.address || 'No address provided'}</p>
                        </div>
                        {order.customer?.pincode && (
                          <div>
                            <p className="text-sm text-gray-600">Pincode</p>
                            <p className="font-semibold text-gray-900">{order.customer.pincode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="space-y-8">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <FileText className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Agent</span>
                      <span className="font-semibold text-gray-900">{order.agent_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Customer</span>
                      <span className="font-semibold text-gray-900">{order.customer_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Order Date</span>
                      <span className="font-semibold text-gray-900">{formatDate(order.order_date)}</span>
                    </div>
                    {order.followup_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Follow-up Date</span>
                        <span className="font-semibold text-gray-900">{formatDate(order.followup_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Items</span>
                        <span className="font-semibold text-gray-900">{order.items?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <CreditCard className="h-6 w-6 text-emerald-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Status</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status === 'Paid' ? <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                        {order.payment_status}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Total Amount</span>
                          <span className="text-2xl font-bold text-emerald-900">{formatCurrency(order.total_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Amount Paid</span>
                          <span className="text-xl font-semibold text-green-900">{formatCurrency(order.paid_amount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">Balance Due</span>
                        <span className="text-xl font-bold text-rose-900">
                          {formatCurrency(order.total_amount - order.paid_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>        
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;