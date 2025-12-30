import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallPopup } from '../context/CallPopupContext';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openPopup } = useCallPopup();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [callHistoryOpen, setCallHistoryOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [callLogsPage, setCallLogsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 5;

  const { data: customerDetails, isLoading, error } = useQuery({
    queryKey: ['customer-details', id],
    queryFn: () => axios.get(`/api/customers/${id}/details/`).then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/customers/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customer-details', id]);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/customers/${id}/`),
    onSuccess: () => navigate('/customers'),
  });

  useEffect(() => {
    if (customerDetails?.customer) setFormData(customerDetails.customer);
  }, [customerDetails]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center p-8">
      Error loading customer details: {error.message}
    </div>
  );

  const customer = customerDetails?.customer;
  const summary = customerDetails?.summary;
  const callLogs = customerDetails?.call_logs || [];
  const orders = customerDetails?.orders || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{customer?.name}</h1>
          <p className="text-lg text-gray-600">Customer ID: #{customer?.id}</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => openPopup(customer)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Call Now
          </button>
          <button
            onClick={() => window.open(`/orders/new?customer=${customer.id}`, '_blank')}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors font-medium"
          >
            Place Order
          </button>
          <Link
            to={`/customers/edit/${id}`}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Edit Customer
          </Link>
          <button
            onClick={() => deleteMutation.mutate()}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Delete Customer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.total_calls || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.total_orders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary?.total_order_value?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unique Employees</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.unique_employees || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-900">₹{summary?.total_paid?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Pending Amount</p>
                <p className="text-2xl font-bold text-red-900">₹{summary?.total_pending?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{summary?.total_orders || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Name</label>
            <p className="text-lg font-semibold text-gray-900">{customer?.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
            <p className="text-lg text-gray-900">{customer?.email || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Phone</label>
            <p className="text-lg text-gray-900">{customer?.phone}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Pincode</label>
            <p className="text-lg text-gray-900">{customer?.pincode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Agent</label>
            <p className="text-lg text-gray-900">{customer?.agent_name || 'Not assigned'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Total Order Value</label>
            <p className="text-lg font-semibold text-green-600">₹{customer?.total_order_value}</p>
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-500 mb-2">Address</label>
          <p className="text-lg text-gray-900">{customer?.address}</p>
        </div>
      </div>

      {/* Call Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <button
          onClick={() => setCallHistoryOpen(!callHistoryOpen)}
          className="w-full flex justify-between items-center text-left"
        >
          <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
          <svg
            className={`w-6 h-6 transform transition-transform ${callHistoryOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {callHistoryOpen && (
          <div className="mt-6">
            {callLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No call logs found for this customer.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {callLogs.slice((callLogsPage - 1) * itemsPerPage, callLogsPage * itemsPerPage).map((call) => (
                        <tr key={call.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(call.date).toLocaleDateString()} {new Date(call.date).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {call.employee_name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {call.duration_minutes} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              call.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              call.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {call.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {call.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Call Logs */}
                {callLogs.length > itemsPerPage && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => setCallLogsPage(Math.max(1, callLogsPage - 1))}
                      disabled={callLogsPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {callLogsPage} of {Math.ceil(callLogs.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setCallLogsPage(Math.min(Math.ceil(callLogs.length / itemsPerPage), callLogsPage + 1))}
                      disabled={callLogsPage === Math.ceil(callLogs.length / itemsPerPage)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <button
          onClick={() => setOrderHistoryOpen(!orderHistoryOpen)}
          className="w-full flex justify-between items-center text-left"
        >
          <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
          <svg
            className={`w-6 h-6 transform transition-transform ${orderHistoryOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {orderHistoryOpen && (
          <div className="mt-6">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders found for this customer.</p>
            ) : (
              <>
                <div className="space-y-6">
                  {orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.order_date).toLocaleDateString()} • Agent: {order.agent}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            order.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Products Purchased:</h4>
                        <div className="space-y-2">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">{item.product_title}</span>
                                  <span className="text-sm text-gray-600 ml-2">(SKU: {item.product_sku})</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="text-gray-600">
                                    Qty: {item.quantity} × ₹{item.unit_price}
                                  </span>
                                  <span className="text-gray-600">
                                    GST: {item.gst_rate}%
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    ₹{item.total_price}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">No product details available</p>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Total Items: {order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Paid: ₹{order.paid_amount} / Total: ₹{order.total_amount}
                          </div>
                          {order.payment_status === 'Credit' && (
                            <div className="text-sm text-red-600 font-medium">
                              Pending: ₹{(order.total_amount - order.paid_amount).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination for Orders */}
                {orders.length > itemsPerPage && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                      disabled={ordersPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {ordersPage} of {Math.ceil(orders.length / itemsPerPage)}
                    </span>
                    <button
                      onClick={() => setOrdersPage(Math.min(Math.ceil(orders.length / itemsPerPage), ordersPage + 1))}
                      disabled={ordersPage === Math.ceil(orders.length / itemsPerPage)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Payment Summary */}
      
    </div>
  );
};

export default CustomerDetail;
