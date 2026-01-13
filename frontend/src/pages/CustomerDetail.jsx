import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallPopup } from "../context/CallPopupContext";
import {
  User,
  CheckCircle,
  Hash,
  Phone,
  Mail,
  ShoppingBag,
  Edit,
  Trash2,
  Save,
  X,
  PenTool,
  Plus,
  ArrowLeft,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { MapPin, DollarSign, UserCheck } from "lucide-react";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openPopup } = useCallPopup();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [callHistoryOpen, setCallHistoryOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [callLogsPage, setCallLogsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [showAddPhone, setShowAddPhone] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState({});
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const itemsPerPage = 5;

  const {
    data: customerDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-details", id],
    queryFn: () =>
      axios.get(`/api/customers/${id}/details/`).then((res) => res.data),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => axios.get("/api/users/").then((res) => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/customers/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/customers/${id}/`),
    onSuccess: () => navigate("/customers"),
  });

  const addPhoneMutation = useMutation({
    mutationFn: (phoneData) => axios.post(`/api/customers/${id}/add_phone/`, phoneData),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      setShowAddPhone(false);
      setNewPhoneNumber("");
    },
    onError: (error) => {
      console.error("Error adding phone:", error.response?.data);
      alert(
        "Error adding phone: " +
          JSON.stringify(error.response?.data || error.message)
      );
    },
  });

  const setPrimaryPhoneMutation = useMutation({
    mutationFn: (phoneId) => axios.post(`/api/customers/${id}/set_primary_phone/`, { phone_id: phoneId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
    },
    onError: (error) => {
      console.error("Error setting primary phone:", error.response?.data);
      alert(
        "Error setting primary phone: " +
          JSON.stringify(error.response?.data || error.message)
      );
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
    setTempValue(currentValue || "");
  };

  const saveEdit = () => {
    if (editingField) {
      updateMutation.mutate({ [editingField]: tempValue });
      setEditingField(null);
      setTempValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  const formatDuration = (durationMinutes) => {
    const totalSeconds = Math.round(durationMinutes * 60);
    if (totalSeconds < 60) {
      return `${totalSeconds} sec`;
    } else {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
    }
  };

  const handleAgentSelect = (agentId) => {
    updateMutation.mutate({ agent: agentId });
    setShowAgentDropdown(false);
  };

  const startEditingAddress = () => {
    setEditingAddress(true);
    setTempAddress({
      house_flat_no: customer?.house_flat_no || "",
      wing_lane: customer?.wing_lane || "",
      society_colony: customer?.society_colony || "",
      landmark: customer?.landmark || "",
      area: customer?.area || "",
      city: customer?.city || "",
      district: customer?.district || "",
      state: customer?.state || "",
      pincode: customer?.pincode || "",
    });
  };

  const saveAddressEdit = () => {
    updateMutation.mutate(tempAddress);
    setEditingAddress(false);
    setTempAddress({});
  };

  const cancelAddressEdit = () => {
    setEditingAddress(false);
    setTempAddress({});
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
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
      <div className="container mx-auto px-4 max-w-full min-h-screen overflow-y-auto">
        {/* Header */}
        <div className="mb-4 ">
          <div className="flex justify-between items-center py-2">
            {/* Left side: Avatar + Name + Verified */}
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="relative">
                <div className="h-17 w-17 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              {/* Name + Verified */}
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {customer?.name?.charAt(0)?.toUpperCase() + customer?.name?.slice(1) || 'Unknown'} {customer?.surname?.charAt(0)?.toUpperCase() + customer?.surname?.slice(1) || ''}
                  </h1>
                </div>
              </div>
              {customer?.all_phones && customer.all_phones.length > 0 && (
                    <div className="flex flex-col">
                      {customer.all_phones.map((phoneObj, index) => (
                        <div key={phoneObj.id || index} className="flex flex-col text-md text-gray-600">
                          <div className="flex items-center">
                            <Phone className="h-4 w-2 mr-1 text-gray-400" />
                            {phoneObj.phone === customer.phone && editingField === "phone" ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={saveEdit}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`${
                                    phoneObj.is_primary ? "font-semibold text-blue-600" : "text-gray-600"
                                  }`}
                                >
                                  {phoneObj.phone}
                                  {phoneObj.is_primary && " (Primary)"}
                                </span>
                                {phoneObj.is_primary && (
                                  <button
                                    onClick={() => setShowPrimaryDropdown(!showPrimaryDropdown)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <ChevronDown className={`h-4 w-4 transform transition-transform ${showPrimaryDropdown ? "rotate-180" : ""}`} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {phoneObj.is_primary && showPrimaryDropdown && (
                            <div className="ml-2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-30 overflow-y-auto">
                              <div className="p-2">
                                {customer.all_phones.filter((p) => !p.is_primary).map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      setPrimaryPhoneMutation.mutate(p.id);
                                      setShowPrimaryDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
                                    disabled={setPrimaryPhoneMutation.isPending}
                                  >
                                    {p.phone}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
            </div>

            {/* Middle: Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 mx-8">
              <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-600">
                  Total Calls
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {summary?.total_calls || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-600">
                  Total Orders
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  {summary?.total_orders || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-600">Total Paid</p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  ₹{summary?.total_paid?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-md font-medium text-gray-600">
                  Pending Amount
                </p>
                <p className="text-base font-bold text-gray-900 mt-1">
                  ₹{summary?.total_pending?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 hover:shadow-md transition-shadow relative">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
            >
              <div>
                <p className="text-md font-medium text-gray-600">
                  Telecaller
                </p>
                <p className="text-base font-bold text-gray-900 mt-1 truncate">
                  {customer?.agent_name || "Not assigned"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ChevronDown
                  className={`w-3 h-3 text-gray-400 transform transition-transform ${
                    showAgentDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
            {showAgentDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto w-auto min-w-32">
                <div className="p-2">
                  <button
                    onClick={() => handleAgentSelect(null)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 rounded"
                  >
                    Not assigned
                  </button>
                  {employees?.map((employee) => (
                    <button
                      key={employee.id}
                      onClick={() => handleAgentSelect(employee.id)}
                      className="w-full text-left px-3 py-1.5 text-md hover:bg-gray-100 rounded"
                    >
                      {employee.username}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
          

            {/* Right side: Buttons aligned with name */}
            <div className="flex space-x-2">
              {!showAddPhone ? (
  <button
    onClick={() => setShowAddPhone(true)}
    className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25"
  >
    <Plus className="h-4 w-4 mr-1" />
    Add Phone
  </button>
) : (
  <div className="flex flex-col">
    <div className="flex items-center space-x-2">
      <input
        type="text"
        value={newPhoneNumber}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
          if (value.length <= 10) {
            setNewPhoneNumber(value);
            if (value.length === 10) {
              setPhoneError("");
            } else if (value.length > 0) {
              setPhoneError("Phone number must be exactly 10 digits.");
            } else {
              setPhoneError("");
            }
          }
        }}
        placeholder="Enter new phone number"
        className="px-2 py-1 border border-gray-300 rounded text-sm"
        autoFocus
      />
      <button
        onClick={() => {
          if (newPhoneNumber.length < 10) {
            alert("Phone number must be at least 10 digits long.");
            return;
          }
          if (newPhoneNumber.length > 10) {
            alert("Phone number cannot be more than 10 digits long.");
            return;
          }
          addPhoneMutation.mutate({
            phone: newPhoneNumber,
          });
        }}
        className="text-green-600 hover:text-green-800"
      >
        <Save className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setShowAddPhone(false);
          setNewPhoneNumber("");
        }}
        className="text-red-600 hover:text-red-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
    {phoneError && (
      <p className="text-red-500 text-xs mt-1 ml-1">
        {phoneError}
      </p>
    )}
  </div>
)}
              <button
                onClick={() => openPopup(customer)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </button>
              <button
                onClick={() =>
                  window.open(`/orders/new?customer=${customer.id}`, "_blank")
                }
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Place Order
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete customer "${customer?.name}"? This action cannot be undone.`)) {
                    deleteMutation.mutate();
                  }
                }}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {/* Secondary info below */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            <div className="flex items-center text-lg text-gray-600">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Org Name:</span>
              {editingField === "company_name" ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">
                    {customer?.company_name || "Not set"}
                  </span>
                  <button
                    onClick={() => startEditing("company_name", customer?.company_name)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center text-lg text-gray-600">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Org Type:</span>
              {editingField === "company_type" ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tempValue || ""}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                  <button onClick={saveEdit} aria-label="Save changes" className="text-green-600 hover:text-green-800">
                    <Save className="h-4 w-4" />
                  </button>
                  <button onClick={cancelEdit} aria-label="Cancel edit" className="text-red-600 hover:text-red-800">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">{customer?.company_type_display || "Not set"}</span>
                  <button
                    onClick={() => startEditing("company_type", customer?.company_type)}
                    aria-label="Edit organization type"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center text-lg text-gray-600">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Appointment Date:</span>
              {editingField === "appointment_date" ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">
                    {customer?.appointment_date ? new Date(customer.appointment_date).toLocaleDateString() : new Date(customer.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => startEditing("appointment_date", customer?.appointment_date || "")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          
          </div>
          {(customer?.house_flat_no || customer?.wing_lane || customer?.society_colony || customer?.landmark || customer?.area || customer?.city || customer?.district || customer?.state || customer?.pincode) && (
              <div className="flex items-start font-semibold text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {editingAddress ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-9 gap-2">
                        <input
                          type="text"
                          placeholder="House/Flat No"
                          value={tempAddress.house_flat_no}
                          onChange={(e) => setTempAddress({ ...tempAddress, house_flat_no: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Wing/Lane"
                          value={tempAddress.wing_lane}
                          onChange={(e) => setTempAddress({ ...tempAddress, wing_lane: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Society/Colony"
                          value={tempAddress.society_colony}
                          onChange={(e) => setTempAddress({ ...tempAddress, society_colony: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Landmark"
                          value={tempAddress.landmark}
                          onChange={(e) => setTempAddress({ ...tempAddress, landmark: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Area"
                          value={tempAddress.area}
                          onChange={(e) => setTempAddress({ ...tempAddress, area: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={tempAddress.city}
                          onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="District"
                          value={tempAddress.district}
                          onChange={(e) => setTempAddress({ ...tempAddress, district: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={tempAddress.state}
                          onChange={(e) => setTempAddress({ ...tempAddress, state: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={tempAddress.pincode}
                          onChange={(e) => setTempAddress({ ...tempAddress, pincode: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={saveAddressEdit}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelAddressEdit}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-9 gap-1">
                        <input
                          type="text"
                          placeholder="House/Flat No"
                          value={customer?.house_flat_no || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Wing/Lane"
                          value={customer?.wing_lane || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Society/Colony"
                          value={customer?.society_colony || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Landmark"
                          value={customer?.landmark || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Area"
                          value={customer?.area || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={customer?.city || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="District"
                          value={customer?.district || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={customer?.state || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={customer?.pincode || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={startEditingAddress}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
        

        {/* Conversation history*/}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-4 h-96 overflow-y-auto">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Conversation History
              </h2>
            </div>
          </div>

          {callLogs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 text-lg">
                No call logs found for this customer.
              </p>
            </div>
          ) : (
            <div className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              {callLogs
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((call, index) => {
                  const callDate = new Date(call.date);
                  const formattedDate = callDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const formattedTime = callDate.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });

                  const elements = [];
                  elements.push(
                    <span key="date" className="text-gray-900 font-semibold text-lg">
                      {formattedDate}
                    </span>
                  );
                  elements.push(
                    <span key="sep1" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>
                  );
                  elements.push(
                    <span key="time" className="text-gray-900 font-semibold text-lg">
                      {formattedTime}
                    </span>
                  );
                  elements.push(
                    <span key="sep2" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>
                  );
                  elements.push(
                    <span key="duration" className="text-blue-600 font-medium text-lg">
                      {formatDuration(call.duration_minutes)}
                    </span>
                  );
                  if (call.employee_name) {
                    elements.push(
                      <span key="sep4" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>
                    );
                    elements.push(
                      <span
                        key="employee"
                        className="text-indigo-600 font-medium text-lg"
                      >
                        {call.employee_name}
                      </span>
                    );
                  }
                  if (call.order_placed === "Yes") {
                    elements.push(
                      <span key="sep5" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>
                    );
                    elements.push(
                      <span
                        key="order"
                        className="text-emerald-600 font-medium text-lg"
                      >
                        Order Placed
                      </span>
                    );
                  }
                  if (call.assumption_names && call.assumption_names.length > 0) {
                    elements.push(
                      <span key="sep6" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>
                    );
                    call.assumption_names.forEach((name, index) => {
                      if (index > 0) {
                        elements.push(
                          <span key={`assumption-sep-${index}`} className="text-gray-400 text-lg">
                            ,{" "}
                          </span>
                        );
                      }
                      elements.push(
                        <span
                          key={`assumption-${index}`}
                          className="text-red-600 font-medium text-lg"
                        >
                          {name}
                        </span>
                      );
                    });
                  }
                  if (call.assumption2_names && call.assumption2_names.length > 0) {
                    elements.push(
                      <span key="sep7" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>
                    );
                    call.assumption2_names.forEach((name, index) => {
                      if (index > 0) {
                        elements.push(
                          <span key={`assumption2-sep-${index}`} className="text-gray-400 text-lg">
                            ,{" "}
                          </span>
                        );
                      }
                      elements.push(
                        <span
                          key={`assumption2-${index}`}
                          className="text-purple-600 font-medium text-lg"
                        >
                          {name}
                        </span>
                      );
                    });
                  }
                  if (call.assumption3_names && call.assumption3_names.length > 0) {
                    elements.push(
                      <span key="sep8" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>
                    );
                    call.assumption3_names.forEach((name, index) => {
                      if (index > 0) {
                        elements.push(
                          <span key={`assumption3-sep-${index}`} className="text-gray-400 text-lg">
                            ,{" "}
                          </span>
                        );
                      }
                      elements.push(
                        <span
                          key={`assumption3-${index}`}
                          className="text-green-600 font-medium text-lg"
                        >
                          {name}
                        </span>
                      );
                    });
                  }
                  elements.push(
                    <span key="sep9" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>
                  );
                  elements.push(
                    <span key="notes" className="text-gray-700 text-lg">
                      {call.note || "No notes provided"}
                    </span>
                  );
                  elements.push(
                    <span key="sep10" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>
                  );

                  return elements;
                })
                .reduce((acc, curr, index) => {
                  if (index === 0) return [curr];
                  return [
                    ...acc,
                    <span key={`space-${index}`} className="text-gray-300 text-lg">
                      {" "}
                    </span>,
                    ...curr,
                  ];
                }, [])}
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
              className={`w-6 h-6 transform transition-transform ${
                callHistoryOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {callHistoryOpen && (
            <div className="mt-6">
              {callLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No call logs found for this customer.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Call ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {callLogs
                          .slice(
                            (callLogsPage - 1) * itemsPerPage,
                            callLogsPage * itemsPerPage
                          )
                          .map((call) => (
                            <tr key={call.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.call_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(call.date).toLocaleDateString()}{" "}
                                {new Date(call.date).toLocaleTimeString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.employee_name || "Unknown"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDuration(call.duration_minutes)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    call.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : call.status === "Follow-up"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
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
                        onClick={() =>
                          setCallLogsPage(Math.max(1, callLogsPage - 1))
                        }
                        disabled={callLogsPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {callLogsPage} of{" "}
                        {Math.ceil(callLogs.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setCallLogsPage(
                            Math.min(
                              Math.ceil(callLogs.length / itemsPerPage),
                              callLogsPage + 1
                            )
                          )
                        }
                        disabled={
                          callLogsPage ===
                          Math.ceil(callLogs.length / itemsPerPage)
                        }
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
              className={`w-6 h-6 transform transition-transform ${
                orderHistoryOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {orderHistoryOpen && (
            <div className="mt-6">
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No orders found for this customer.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders
                          .slice(
                            (ordersPage - 1) * itemsPerPage,
                            ordersPage * itemsPerPage
                          )
                          .map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.order_id}
                          </td> */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  to={`/orders/${order.id}`}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  {order.order_id || `ORD-${order.id}`}
                                </Link>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  order.order_date
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {order.agent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    order.status === "Delivered"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "Dispatched"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    order.payment_status === "Paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
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
                        onClick={() =>
                          setOrdersPage(Math.max(1, ordersPage - 1))
                        }
                        disabled={ordersPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {ordersPage} of{" "}
                        {Math.ceil(orders.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setOrdersPage(
                            Math.min(
                              Math.ceil(orders.length / itemsPerPage),
                              ordersPage + 1
                            )
                          )
                        }
                        disabled={
                          ordersPage === Math.ceil(orders.length / itemsPerPage)
                        }
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
