import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallPopup } from '../context/CallPopupContext';
import { User, CheckCircle, Hash, Phone, Mail, ShoppingBag, Edit, Trash2, Save, X, PenTool, Plus } from 'lucide-react';
import { MapPin, DollarSign, UserCheck} from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openPopup } = useCallPopup();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [callHistoryOpen, setCallHistoryOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [callLogsPage, setCallLogsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
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

  const createCustomerMutation = useMutation({
    mutationFn: (data) => axios.post('/api/customers/', data),
    onSuccess: (response) => {
      navigate(`/customers/${response.data.id}`);
      setShowAddPhone(false);
      setNewPhoneNumber('');
    },
    onError: (error) => {
      console.error('Error creating customer:', error.response?.data);
      alert('Error creating customer: ' + JSON.stringify(error.response?.data || error.message));
    },
  });

  useEffect(() => {
    if (customerDetails?.customer) setFormData(customerDetails.customer);
  }, [customerDetails]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const saveEdit = () => {
    if (editingField) {
      updateMutation.mutate({ [editingField]: tempValue });
      setEditingField(null);
      setTempValue('');
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
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
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8 max-w-full min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
  <div className="flex justify-between items-center">
    {/* Left side: Avatar + Name + Verified */}
    <div className="flex items-center space-x-6">
      {/* Avatar */}
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center">
          <User className="h-10 w-10 text-blue-600" />
        </div>
        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
      </div>

      {/* Name + Verified */}
      <div className="flex items-center space-x-4">
        <h1 className="text-4xl font-bold text-gray-900">{customer?.name}</h1>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle className="h-3 w-3 mr-1.5" />
          Verified
        </span>
      </div>
    </div>

    {/* Right side: Buttons aligned with name */}
    <div className="flex space-x-3">
      <button
        onClick={() => openPopup(customer)}
        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25"
      >
        <Phone className="h-4 w-4 mr-2" />
        Call Now
      </button>
      <button
        onClick={() => window.open(`/orders/new?customer=${customer.id}`, '_blank')}
        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-purple-500/25"
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        Place Order
      </button>
      <Link
        to={`/customers/edit/${id}`}
        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25"
      >
        <Edit className="h-4 w-4 mr-2" />
        Edit Profile
      </Link>
      <button
        onClick={() => deleteMutation.mutate()}
        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg shadow-red-500/25"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </button>
    </div>
  </div>

  {/* Secondary info below */}
              <div className="flex items-center space-x-6 mt-4 flex-wrap gap-2 ml-4">
              <div className="flex items-center text-lg text-gray-600">
                <span className="font-medium mr-2">ID:</span>
                <span className="font-bold text-gray-900">#{customer?.id}</span>
              </div>
              <div className="flex items-center text-lg text-gray-600">
                <User className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Name:</span>
                {editingField === 'name' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{customer?.name}</span>
                    <button onClick={() => startEditing('name', customer?.name)} className="text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {customer?.phone && (
                <div className="flex items-center text-lg text-gray-600">
                  <Phone className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">Phone:</span>
                  {editingField === 'phone' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{customer?.phone}</span>
                      <button onClick={() => startEditing('phone', customer?.phone)} className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!showAddPhone ? (
                <button onClick={() => setShowAddPhone(true)} className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Another Phone No
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="Enter new phone number"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                  <button onClick={() => createCustomerMutation.mutate({ name: customer.name, address: customer.address, email: customer.email, phone: newPhoneNumber, pincode: customer.pincode })} className="text-green-600 hover:text-green-800">
                    <Save className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setShowAddPhone(false); setNewPhoneNumber(''); }} className="text-red-600 hover:text-red-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              {customer?.email && (
                <div className="flex items-center text-lg text-gray-600">
                  <Mail className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">Email:</span>
                  {editingField === 'email' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{customer?.email}</span>
                      <button onClick={() => startEditing('email', customer?.email)} className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {summary?.total_calls > 0 && (<div className="flex items-center text-lg text-gray-600">
                <Phone className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Total Calls:</span>
                <span className="font-semibold text-gray-900">{summary?.total_calls}</span>
              </div>)}
              {summary?.unique_employees > 0 && (<div className="flex items-center text-lg text-gray-600">
                <User className="h-5 w-5 mr-2 text-gray-400" />
                <span className="font-medium mr-2">Unique Employees:</span>
                <span className="font-semibold text-gray-900">{summary?.unique_employees}</span>
              </div>)}
              {customer?.pincode && (
                <div className="flex items-center text-lg text-gray-600">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">Pincode:</span>
                  {editingField === 'pincode' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{customer?.pincode}</span>
                      <button onClick={() => startEditing('pincode', customer?.pincode)} className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {customer?.address && (
                <div className="flex items-center text-lg text-gray-600">
                  <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                  <span className="font-medium mr-2">Address:</span>
                  {editingField === 'address' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{customer?.address}</span>
                      <button onClick={() => startEditing('address', customer?.address)} className="text-gray-400 hover:text-gray-600">
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
</div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-4">
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
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary?.total_paid?.toFixed(2) || '0.00'}</p>
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
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary?.total_pending?.toFixed(2) || '0.00'}</p>
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
              <p className="text-sm font-medium text-gray-600">Assigned Agent</p>
              <p className="text-2xl font-bold text-gray-900">{customer?.agent_name || 'Not assigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-4 max-h-96 overflow-y-auto">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Call Timeline</h2>
          </div>
        </div>

        {callLogs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No call logs found for this customer.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {callLogs
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((call, index) => {
                const callDate = new Date(call.date);
                const formattedDate = callDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                const formattedTime = callDate.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });

                return (
                  <div key={call.id} className="flex items-start space-x-4 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        call.status === 'Completed' ? 'bg-green-500' :
                        call.status === 'Follow-up' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-1">
                        <span className="font-medium text-gray-900">{formattedDate}</span>
                        <span>|</span>
                        <span className="font-medium text-gray-900">{formattedTime}</span>
                        <span>|</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          call.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          call.status === 'Follow-up' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.status}
                        </span>
                        {call.order_placed === 'Yes' && (
                          <>
                            <span>|</span>
                            <span className="text-green-600 font-medium">Order Placed</span>
                          </>
                        )}
                        {call.assumption_name && (
                          <>
                            <span>|</span>
                            <span className="text-blue-600 font-medium">Assumption: {call.assumption_name}</span>
                          </>
                        )}

                      <div className="text-gray-900 max-h-20 overflow-y-auto hide-scrollbar">
                        <span className="font-medium text-gray-700">Notes: </span>
                        <span className="text-gray-900">{call.note || 'No notes provided'}</span>
                      </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>Call ID: {call.call_id}</span>
                        <span>Duration: {call.duration_minutes} min</span>
                        <span>Agent: {call.employee_name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      {/* Call Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call ID</th>
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
                            {call.call_id}
                          </td>
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.order_id}
                          </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/orders/${order.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                    {order.order_id || `ORD-${order.id}`}
                  </Link>
                </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.order_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.agent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{order.total_amount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

    </div>
    </>
  );
};

export default CustomerDetail;
