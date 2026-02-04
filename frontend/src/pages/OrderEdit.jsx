import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
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
  Calendar,
  IndianRupee,
  X,
  Minus,
  Plus as PlusIcon,
  MapPin,
  Filter,
  BarChart3,
  TrendingUp,
  Eye,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
} from "lucide-react";

const OrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const customerDropdownRef = useRef(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await axios.get(`/api/orders/${id}/`);
      return response.data;
    },
  });

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => axios.get("/api/customers/").then((res) => res.data),
  });

  const [formData, setFormData] = useState({
    customer: '',
    agent: '',
    total_amount: 0,
    paid_amount: 0,
    status: 'Placed',
    payment_status: 'Credit',
    followup_date: '',
    partial_amount: 0,
    delivery_address: '',
    delivery_option: 'primary',
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Filtered customers based on search
  const filteredCustomers =
    (customers?.results || customers || []).filter(
      (customer) =>
        customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone?.includes(customerSearch),
    ) || [];

  useEffect(() => {
    if (order) {
      setFormData({
        customer: order.customer || '',
        agent: order.agent || '',
        total_amount: order.total_amount || 0,
        paid_amount: order.paid_amount || 0,
        status: order.status || 'Placed',
        payment_status: order.payment_status || 'Credit',
        followup_date: order.followup_date || '',
        partial_amount: (order.payment_status === 'Partial' ? order.paid_amount : 0) || 0,
        delivery_address: order.delivery_address || '',
        delivery_option: order.delivery_address ? 'custom' : 'primary',
      });
    }
  }, [order]);

  // Auto-assign agent based on customer selection
  useEffect(() => {
    if (formData.customer && customers) {
      const selectedCustomer = customers?.results?.find(
        (c) => c.id.toString() === formData.customer.toString(),
      );
      if (selectedCustomer && selectedCustomer.agent) {
        setFormData((prev) => ({ ...prev, agent: selectedCustomer.agent }));
      } else {
        // Clear agent - backend will auto-assign to admin
        setFormData((prev) => ({ ...prev, agent: '' }));
      }
    }
  }, [formData.customer, customers]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setCustomerDropdownOpen(false);
        setCustomerSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.put(`/api/orders/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      setShowSuccessModal(true);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['customers']);
    },
    onError: (error) => {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && errorData.detail) {
          alert(`Error: ${errorData.detail}`);
        } else if (Array.isArray(errorData) && errorData.length > 0) {
          alert(`Error: ${errorData[0]}`);
        } else {
          alert('An error occurred while updating the order. Please try again.');
        }
      } else {
        alert('An error occurred while updating the order. Please try again.');
      }
    },
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Set followup date if payment status is credit
    if (name === 'payment_status' && value === 'Credit') {
      const today = new Date();
      const followupDate = new Date(today.setDate(today.getDate() + 30))
        .toISOString()
        .split('T')[0];
      setFormData((prev) => ({
        ...prev,
        followup_date: followupDate,
        partial_amount: 0,
      }));
    } else if (name === 'payment_status' && value === 'Paid') {
      setFormData((prev) => ({
        ...prev,
        followup_date: '',
        partial_amount: 0,
      }));
    } else if (name === 'payment_status' && value === 'Partial') {
      setFormData((prev) => ({ ...prev, followup_date: '' }));
    }

    // Handle delivery option change
    if (name === 'delivery_option') {
      if (value === 'primary' && formData.customer) {
        const customer = customers?.results?.find(
          (c) => c.id.toString() === formData.customer.toString(),
        );
        if (customer) {
          const fullAddress = [
            customer.house_flat_no,
            customer.wing_lane,
            customer.society_colony,
            customer.area,
            customer.city,
            customer.district,
            customer.state,
            customer.pincode,
          ]
            .filter(Boolean)
            .join(', ');
          setFormData((prev) => ({ ...prev, delivery_address: fullAddress }));
        }
      } else if (value === 'custom') {
        setFormData((prev) => ({ ...prev, delivery_address: '' }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      alert('Please select a customer to update the order.');
      return;
    }

    const orderData = {
      customer: formData.customer,
      agent: formData.agent || undefined,
      status: formData.status,
      payment_status: formData.payment_status,
      ...(formData.followup_date && { followup_date: formData.followup_date }),
      delivery_address: formData.delivery_address,
      total_amount: parseFloat(formData.total_amount),
      paid_amount:
        formData.payment_status === 'Paid'
          ? parseFloat(formData.total_amount)
          : formData.payment_status === 'Partial'
            ? parseFloat(formData.partial_amount)
            : 0,
    };

    mutation.mutate(orderData);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center">
      Error loading order: {error.message}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
      <div className="container mx-auto px-4 max-w-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-3 mr-4">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Order
            </h1>
          </div>
        </div>

        {/* Order Details Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Customer
              </label>
              <div className="relative" ref={customerDropdownRef}>
                <button
                  type="button"
                  onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50 text-left flex items-center justify-between"
                >
                  <span
                    className={
                      formData.customer ? 'text-gray-900' : 'text-gray-500'
                    }
                  >
                    {formData.customer
                      ? customers?.results?.find(
                          (c) => c.id.toString() === formData.customer.toString(),
                        )?.name
                      : 'Select Customer'}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      customerDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {customerDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search customers..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="py-1">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                customer: customer.id,
                              }));
                              setCustomerDropdownOpen(false);
                              setCustomerSearch('');
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {customer.name} - {customer.phone}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          No customers found
                        </div>
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
                value={
                  customers?.results?.find(
                    (c) => c.id.toString() === formData.customer?.toString(),
                  )?.agent_name || ''
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 transition-all duration-200"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-500" />
                Address
              </label>
              <input
                type="text"
                value={
                  formData.customer
                    ? (() => {
                        const customer = customers?.results?.find(
                          (c) =>
                            c.id.toString() === formData.customer.toString(),
                        );
                        return customer
                          ? [
                              customer.house_flat_no,
                              customer.wing_lane,
                              customer.society_colony,
                              customer.area,
                              customer.city,
                              customer.district,
                              customer.state,
                              customer.pincode,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : '';
                      })()
                    : ''
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 transition-all duration-200"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
              >
                <option value="Placed">Placed</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
              >
                <option value="Credit">Credit</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>
            </div>

            {/* Delivery Address Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                Delivery Address Option
              </label>
              <select
                name="delivery_option"
                value={formData.delivery_option}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
              >
                <option value="primary">Use Primary Address</option>
                <option value="custom">Enter Custom Address</option>
              </select>
            </div>

            {/* Delivery Address Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center mt-1.5">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                Delivery Address
              </label>
              <textarea
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleFormChange}
                placeholder={
                  formData.delivery_option === 'custom'
                    ? 'Enter delivery address'
                    : 'Primary address will be used'
                }
                rows="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                readOnly={formData.delivery_option === 'primary'}
              />
            </div>
          </div>

          {/* Conditional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {formData.payment_status === 'Credit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  Follow-up Date
                </label>
                <input
                  type="date"
                  name="followup_date"
                  value={formData.followup_date}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                />
              </div>
            )}

            {formData.payment_status === 'Partial' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-2 text-yellow-500" />
                  Partial Payment Amount
                </label>
                <input
                  type="number"
                  name="partial_amount"
                  value={formData.partial_amount}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <IndianRupee className="w-4 h-4 mr-2 text-green-500" />
                Total Amount
              </label>
              <input
                type="number"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        {/* Order Items Display (Read-only) */}
        {order?.items && order.items.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
              <span className="text-sm text-gray-500">(Read-only - items cannot be modified)</span>
            </div>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.product_title}</h4>
                    <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-600">
                        ₹{parseFloat(item.unit_price).toFixed(2)} × {item.quantity} = ₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="text-sm font-medium text-blue-600 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" />
                Total Amount
              </div>
              <div className="text-2xl font-bold text-blue-900">
                ₹{parseFloat(formData.total_amount).toFixed(2)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="text-sm font-medium text-green-600 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" />
                Paid Amount
              </div>
              <div className="text-2xl font-bold text-green-900">
                ₹{(
                  formData.payment_status === 'Paid'
                    ? parseFloat(formData.total_amount)
                    : formData.payment_status === 'Partial'
                      ? parseFloat(formData.partial_amount)
                      : 0
                ).toFixed(2)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
              <div className="text-sm font-medium text-red-600 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" />
                Pending Amount
              </div>
              <div className="text-2xl font-bold text-red-900">
                ₹{(
                  parseFloat(formData.total_amount) - (
                    formData.payment_status === 'Paid'
                      ? parseFloat(formData.total_amount)
                      : formData.payment_status === 'Partial'
                        ? parseFloat(formData.partial_amount)
                        : 0
                  )
                ).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              disabled={mutation.isLoading}
            >
              <CheckCircle className="w-5 h-5" />
              <span>{mutation.isLoading ? 'Updating Order...' : 'Update Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative z-10 text-center">
              <div className="relative mb-8 flex justify-center">
                <div className="relative">
                  <div className="w-28 h-28 bg-gradient-to-br from-green-100 via-green-200 to-green-300 rounded-full flex items-center justify-center animate-pulse shadow-2xl border-4 border-white">
                    <CheckCircle className="w-14 h-14 text-green-600 drop-shadow-lg" />
                  </div>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-gray-900 mb-3 animate-fade-in drop-shadow-sm">
                ORDER UPDATED!
              </h2>

              <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <p className="text-gray-600">Order has been successfully updated.</p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  View Orders
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Continue Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default OrderEdit;
