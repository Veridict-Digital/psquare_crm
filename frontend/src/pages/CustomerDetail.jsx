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
import { fetchCustomerTypes } from "../api/customerTypes";

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
  const [showOrgTypeDropdown, setShowOrgTypeDropdown] = useState(false);
  const [showCustomerTypeDropdown, setShowCustomerTypeDropdown] =
    useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState({});
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [showNameEditDropdown, setShowNameEditDropdown] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempSurname, setTempSurname] = useState("");
  const [showAllPhones, setShowAllPhones] = useState(false);
  const [customerTypes, setCustomerTypes] = useState([]);
  const itemsPerPage = 5;

  const startEditingName = () => {
    setTempName("");
    setEditingField("name");
    setShowNameEditDropdown(false);
  };

  const startEditingSurname = () => {
    setTempSurname("");
    setEditingField("surname");
    setShowNameEditDropdown(false);
  };

  const saveNameEdit = () => {
    updateMutation.mutate({ name: tempName });
    setEditingField(null);
    setTempName("");
  };

  const saveSurnameEdit = () => {
    updateMutation.mutate({ surname: tempSurname });
    setEditingField(null);
    setTempSurname("");
  };

  const cancelNameEdit = () => {
    setEditingField(null);
    setTempName("");
  };

  const cancelSurnameEdit = () => {
    setEditingField(null);
    setTempSurname("");
  };

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

  const { data: organizationTypes } = useQuery({
    queryKey: ["organization-types"],
    queryFn: () => axios.get("/api/organizationtypes/").then((res) => res.data),
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
    mutationFn: (phoneData) =>
      axios.post(`/api/customers/${id}/add_phone/`, phoneData),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      setShowAddPhone(false);
      setNewPhoneNumber("");
    },
    onError: (error) => {
      console.error("Error adding phone:", error.response?.data);
      alert(
        "Error adding phone: " +
          JSON.stringify(error.response?.data || error.message),
      );
    },
  });

  const setPrimaryPhoneMutation = useMutation({
    mutationFn: (phoneId) =>
      axios.post(`/api/customers/${id}/set_primary_phone/`, {
        phone_id: phoneId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
    },
    onError: (error) => {
      console.error("Error setting primary phone:", error.response?.data);
      alert(
        "Error setting primary phone: " +
          JSON.stringify(error.response?.data || error.message),
      );
    },
  });

  const deletePhoneMutation = useMutation({
    mutationFn: (phoneId) =>
      axios.delete(`/api/customers/${id}/delete_phone/`, {
        data: { phone_id: phoneId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
    },
    onError: (error) => {
      console.error("Error deleting phone:", error.response?.data);
      alert(
        "Error deleting phone: " +
          JSON.stringify(error.response?.data || error.message),
      );
    },
  });

  useEffect(() => {
    if (customerDetails?.customer) setFormData(customerDetails.customer);
  }, [customerDetails]);

  useEffect(() => {
    fetchCustomerTypes()
      .then(setCustomerTypes)
      .catch(() => setCustomerTypes([]));
  }, []);

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

  const handleOrgTypeSelect = (orgTypeId) => {
    updateMutation.mutate({ company_type: orgTypeId });
    setShowOrgTypeDropdown(false);
  };

  const handleCustomerTypeSelect = (customerType) => {
    updateMutation.mutate({ customer_type: customerType });
    setShowCustomerTypeDropdown(false);
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
    if (tempAddress.pincode && tempAddress.pincode.length !== 6) {
      alert("Pincode must be exactly 6 digits.");
      return;
    }
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
        Error loading customer details:{" "}
        {error?.response?.data?.customer?.[0] ||
          error?.response?.data?.detail ||
          error.message ||
          "Unknown error"}
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
                  <span className="text-sm text-gray-600">Name</span>
                  {editingField === "name" ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-xl font-bold"
                        placeholder="Customer name"
                        autoFocus
                      />
                      <button
                        onClick={saveNameEdit}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={cancelNameEdit}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : editingField === "surname" ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempSurname}
                        onChange={(e) => setTempSurname(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-xl font-bold"
                        placeholder="Customer surname"
                        autoFocus
                      />
                      <button
                        onClick={saveSurnameEdit}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button
                        onClick={cancelSurnameEdit}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 relative">
                      <span className="text-2xl font-bold text-gray-900">
                        {customer?.name?.charAt(0)?.toUpperCase() +
                          customer?.name?.slice(1) || "Unknown"}{" "}
                        {customer?.surname?.charAt(0)?.toUpperCase() +
                          customer?.surname?.slice(1) || ""}
                      </span>
                      <button
                        onClick={() =>
                          setShowNameEditDropdown(!showNameEditDropdown)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {showNameEditDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                          <button
                            onClick={startEditingName}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-t-lg"
                          >
                            Edit Name
                          </button>
                          <button
                            onClick={startEditingSurname}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-b-lg"
                          >
                            Edit Surname
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {customer?.all_phones && customer.all_phones.length > 0 && (
                <div className="relative">
                  {/* Show first 2 phone numbers stacked */}
                  <div className="space-y-1">
                    {customer.all_phones.slice(0, 2).map((phoneObj, index) => (
                      <div key={phoneObj.id || index} className="relative">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {phoneObj.phone === customer.phone &&
                          editingField === "phone" ? (
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
                                  phoneObj.is_primary
                                    ? "font-semibold text-blue-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {phoneObj.phone}
                                {phoneObj.is_primary && " (P)"}
                              </span>
                              {phoneObj.is_primary && (
                                <button
                                  onClick={() =>
                                    setShowPrimaryDropdown(!showPrimaryDropdown)
                                  }
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transform transition-transform ${
                                      showPrimaryDropdown ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete phone number "${phoneObj.phone}"?`)) {
                                    deletePhoneMutation.mutate(phoneObj.id);
                                  }
                                }}
                                className="text-red-400 hover:text-red-600"
                                title="Delete phone number"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Primary phone dropdown */}
                        {phoneObj.is_primary && showPrimaryDropdown && (
                          <div className="ml-6 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="p-2 max-h-40 overflow-y-auto">
                              <div className="text-xs text-gray-500 mb-1 px-1">
                                Set as primary:
                              </div>
                              {customer.all_phones
                                .filter((p) => !p.is_primary)
                                .map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      setPrimaryPhoneMutation.mutate(p.id);
                                      setShowPrimaryDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 rounded disabled:opacity-50"
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

                  {/* Show "+X more" dropdown if more than 2 phones */}
                  {customer.all_phones.length > 2 && (
                    <div className="mt-1 relative">
                      <button
                        onClick={() => setShowAllPhones(!showAllPhones)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3 mr-1" />+
                        {customer.all_phones.length - 2} more numbers
                        <ChevronDown
                          className={`h-3 w-3 ml-1 transform ${showAllPhones ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* All phones dropdown */}
                      {showAllPhones && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                          <div className="p-2 max-h-48 overflow-y-auto">
                            <div className="text-xs text-gray-500 mb-2 px-2">
                              All phone numbers:
                            </div>
                            {customer.all_phones.map((phone, idx) => (
                              <div
                                key={phone.id || idx}
                                className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded"
                              >
                                <div className="flex items-center">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                  <span
                                    className={`text-sm ${phone.is_primary ? "font-semibold text-blue-600" : "text-gray-700"}`}
                                  >
                                    {phone.phone}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {phone.is_primary && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                      Primary
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete phone number "${phone.phone}"?`)) {
                                        deletePhoneMutation.mutate(phone.id);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-600"
                                    title="Delete phone number"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle: Summary Cards */}
            <div className="grid grid-cols-5 gap-2 mx-4">
  {[
    { label: "Total Calls", value: summary?.total_calls || 0 },
    { label: "Total Orders", value: summary?.total_orders || 0 },
    {
      label: "Total Paid",
      value: `₹${summary?.total_paid?.toFixed(2) || "0.00"}`,
    },
    {
      label: "Pending",
      value: `₹${summary?.total_pending?.toFixed(2) || "0.00"}`,
    },
  ].map((item, idx) => (
    <div
      key={idx}
      className="bg-white rounded-lg border border-gray-200 p-1.5 min-w-20"
    >
      <p className="text-xs text-gray-500 truncate">{item.label}</p>
      <p className="text-sm font-bold text-gray-900 truncate">{item.value}</p>
    </div>
  ))}

  <div className="bg-white rounded-lg border border-gray-200 p-1.5 min-w-38 relative">
    <div
      className="flex items-center justify-between cursor-pointer"
      onClick={() => setShowAgentDropdown(!showAgentDropdown)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">Telecaller</p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {customer?.agent_name || "Not assigned"}
        </p>
      </div>
      <ChevronDown
        className={`w-3 h-3 text-gray-400 flex-shrink-0 transform ${showAgentDropdown ? "rotate-180" : ""}`}
      />
    </div>
    {showAgentDropdown && (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-[200px] min-w-max">
        <div className="py-1 overflow-y-auto max-h-48 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => handleAgentSelect(null)}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 text-gray-700"
          >
            Not assigned
          </button>
          {employees?.map((employee) => (
            <button
              key={employee.id}
              onClick={() => handleAgentSelect(employee.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 text-gray-700 truncate"
              title={employee.username} // Tooltip for full name
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
            <div className="flex space-x-2 items-center min-w-max">
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
                        const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                        if (value.length <= 10) {
                          setNewPhoneNumber(value);
                          if (value.length === 10) {
                            setPhoneError("");
                          } else if (value.length > 0) {
                            setPhoneError(
                              "Phone number must be exactly 10 digits.",
                            );
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
                          alert(
                            "Phone number must be at least 10 digits long.",
                          );
                          return;
                        }
                        if (newPhoneNumber.length > 10) {
                          alert(
                            "Phone number cannot be more than 10 digits long.",
                          );
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
                onClick={() => navigate(`/orders/new?customer=${customer.id}`)}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Place Order
              </button>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete customer "${customer?.name}"? This action cannot be undone.`,
                    )
                  ) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-2">
            <div className="flex items-center text-lg text-gray-600 bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
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
                    onClick={() =>
                      startEditing("company_name", customer?.company_name)
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center text-lg text-gray-600 relative bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Org Type:</span>
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => setShowOrgTypeDropdown(!showOrgTypeDropdown)}
              >
                <span className="font-semibold text-gray-900">
                  {customer?.company_type_display || "Not set"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${
                    showOrgTypeDropdown ? "rotate-180" : ""
                  }`}
                />
              </div>
              {showOrgTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto w-auto min-w-32">
                  <div className="p-2">
                    <button
                      onClick={() => handleOrgTypeSelect(null)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 rounded"
                    >
                      Not set
                    </button>
                    {organizationTypes?.map((orgType) => (
                      <button
                        key={orgType.id}
                        onClick={() => handleOrgTypeSelect(orgType.id)}
                        className="w-full text-left px-3 py-1.5 text-md hover:bg-gray-100 rounded"
                      >
                        {orgType.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center text-lg text-gray-600 relative bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Customer Type:</span>
              <div
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() =>
                  setShowCustomerTypeDropdown(!showCustomerTypeDropdown)
                }
              >
                <span className="font-semibold text-gray-900">
                  {customerTypes.find((t) => t.id === customer?.customer_type)
                    ?.name || "Not set"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${showCustomerTypeDropdown ? "rotate-180" : ""}`}
                />
              </div>
              {showCustomerTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto w-auto min-w-32">
                  <div className="p-2">
                    <button
                      onClick={() => handleCustomerTypeSelect("")}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 rounded"
                    >
                      Not set
                    </button>
                    {customerTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleCustomerTypeSelect(type.id)}
                        className="w-full text-left px-3 py-1.5 text-md hover:bg-gray-100 rounded"
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center text-lg text-gray-600 bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
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
                    {customer?.appointment_date
                      ? new Date(customer.appointment_date).toLocaleDateString()
                      : new Date(customer.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() =>
                      startEditing(
                        "appointment_date",
                        customer?.appointment_date || "",
                      )
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {(customer?.house_flat_no ||
            customer?.wing_lane ||
            customer?.society_colony ||
            customer?.landmark ||
            customer?.area ||
            customer?.pincode ||
            customer?.city ||
            customer?.district ||
            customer?.state) && (
            <div className="flex items-start font-semibold text-gray-700 mt-2 bg-white rounded-lg border border-gray-200 p-2">
              <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {editingAddress ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-9 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          House No
                        </label>
                        <input
                          type="text"
                          placeholder="House/Flat No"
                          value={tempAddress.house_flat_no}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              house_flat_no: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Wing/Lane
                        </label>
                        <input
                          type="text"
                          placeholder="Wing/Lane"
                          value={tempAddress.wing_lane}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              wing_lane: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Society/Colony
                        </label>
                        <input
                          type="text"
                          placeholder="Society/Colony"
                          value={tempAddress.society_colony}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              society_colony: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Landmark
                        </label>
                        <input
                          type="text"
                          placeholder="Landmark"
                          value={tempAddress.landmark}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              landmark: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Area
                        </label>
                        <input
                          type="text"
                          placeholder="Area"
                          value={tempAddress.area}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              area: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={tempAddress.pincode}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            setTempAddress({ ...tempAddress, pincode: value });
                            if (value.length < 6 && value.length > 0) {
                              setAddressError(
                                "Pincode must be exactly 6 digits.",
                              );
                            } else {
                              setAddressError("");
                            }
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="City"
                          value={tempAddress.city}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              city: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          placeholder="District"
                          value={tempAddress.district}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              district: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="State"
                          value={tempAddress.state}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              state: e.target.value,
                            })
                          }
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                        />
                      </div>
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
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          House No
                        </label>
                        <input
                          type="text"
                          placeholder="House/Flat No"
                          value={customer?.house_flat_no || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Wing/Lane
                        </label>
                        <input
                          type="text"
                          placeholder="Wing/Lane"
                          value={customer?.wing_lane || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Society/Colony
                        </label>
                        <input
                          type="text"
                          placeholder="Society/Colony"
                          value={customer?.society_colony || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Landmark
                        </label>
                        <input
                          type="text"
                          placeholder="Landmark"
                          value={customer?.landmark || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Area
                        </label>
                        <input
                          type="text"
                          placeholder="Area"
                          value={customer?.area || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          placeholder="Pincode"
                          value={customer?.pincode || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="City"
                          value={customer?.city || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <input
                          type="text"
                          placeholder="District"
                          value={customer?.district || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          placeholder="State"
                          value={customer?.state || ""}
                          readOnly
                          className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 w-full"
                        />
                      </div>
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
          <div className="flex items-center justify-between">
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
            {callLogs.length > 0 &&
              callLogs[0]?.date &&
              new Date() - new Date(callLogs[0].date) < 24 * 60 * 60 * 1000 && (
                <button
                  onClick={() => {
                    // Use the most recent call log (already sorted by date descending)
                    const recentCall = callLogs[0];
                    // Open popup with pre-populated data for editing
                    const callData = {
                      ...customer,
                      // Pre-populate with existing call data
                      notes: recentCall.note || "",
                      selectedAssumption: recentCall.assumption || [],
                      selectedAssumption2: recentCall.assumption2 || [],
                      selectedAssumption3: recentCall.assumption3 || [],
                      orderId: recentCall.order_id || "",
                      callId: recentCall.call_id,
                      id: recentCall.id,
                      timer: Math.round(recentCall.duration_minutes * 60) || 0,
                    };
                    openPopup(callData);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Last Call
                </button>
              )}
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
                    <span
                      key="date"
                      className="text-gray-900 font-semibold text-lg"
                    >
                      {formattedDate}
                    </span>,
                  );
                  elements.push(
                    <span key="sep1" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>,
                  );
                  elements.push(
                    <span
                      key="time"
                      className="text-gray-900 font-semibold text-lg"
                    >
                      {formattedTime}
                    </span>,
                  );
                  elements.push(
                    <span key="sep2" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>,
                  );
                  elements.push(
                    <span
                      key="duration"
                      className="text-blue-600 font-medium text-lg"
                    >
                      {formatDuration(call.duration_minutes)}
                    </span>,
                  );
                  if (call.employee_name) {
                    elements.push(
                      <span key="sep4" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>,
                    );
                    elements.push(
                      <span
                        key="employee"
                        className="text-indigo-600 font-medium text-lg"
                      >
                        {call.employee_name}
                      </span>,
                    );
                  }
                  if (call.order_placed === "Yes") {
                    elements.push(
                      <span key="sep5" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>,
                    );
                    elements.push(
                      <span
                        key="order"
                        className="text-emerald-600 font-medium text-lg"
                      >
                        Order Placed
                      </span>,
                    );
                  }
                  if (
                    call.assumption_names &&
                    call.assumption_names.length > 0
                  ) {
                    elements.push(
                      <span key="sep6" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>,
                    );
                    call.assumption_names.forEach((name, index) => {
                      if (index > 0) {
                        elements.push(
                          <span
                            key={`assumption-sep-${index}`}
                            className="text-gray-400 text-lg"
                          >
                            ,{" "}
                          </span>,
                        );
                      }
                      elements.push(
                        <span
                          key={`assumption-${index}`}
                          className="text-red-600 font-medium text-lg"
                        >
                          {name}
                        </span>,
                      );
                    });
                  }
                  if (
                    call.assumption2_names &&
                    call.assumption2_names.length > 0
                  ) {
                    elements.push(
                      <span key="sep7" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>,
                    );
                    call.assumption2_names.forEach((name, index) => {
                      if (index > 0) {
                        elements.push(
                          <span
                            key={`assumption2-sep-${index}`}
                            className="text-gray-400 text-lg"
                          >
                            ,{" "}
                          </span>,
                        );
                      }
                      elements.push(
                        <span
                          key={`assumption2-${index}`}
                          className="text-purple-600 font-medium text-lg"
                        >
                          {name}
                        </span>,
                      );
                    });
                  }
                  if (
                    call.assumption3_names &&
                    call.assumption3_names.length > 0
                  ) {
                    elements.push(
                      <span key="sep8" className="text-gray-400 text-lg">
                        {" "}
                        |{" "}
                      </span>,
                    );
                    call.assumption3_names.forEach((name, index) => {
                      if (index > 0) {
                        elements.push(
                          <span
                            key={`assumption3-sep-${index}`}
                            className="text-gray-400 text-lg"
                          >
                            ,{" "}
                          </span>,
                        );
                      }
                      elements.push(
                        <span
                          key={`assumption3-${index}`}
                          className="text-green-600 font-medium text-lg"
                        >
                          {name}
                        </span>,
                      );
                    });
                  }
                  elements.push(
                    <span key="sep9" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>,
                  );
                  elements.push(
                    <span key="notes" className="text-gray-700 text-lg">
                      {call.note || "No notes provided"}
                    </span>,
                  );
                  elements.push(
                    <span key="sep10" className="text-gray-400 text-lg">
                      {" "}
                      |{" "}
                    </span>,
                  );

                  return elements;
                })
                .reduce((acc, curr, index) => {
                  if (index === 0) return [curr];
                  return [
                    ...acc,
                    <span
                      key={`space-${index}`}
                      className="text-gray-300 text-lg"
                    >
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
                            callLogsPage * itemsPerPage,
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
                              callLogsPage + 1,
                            ),
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
                            ordersPage * itemsPerPage,
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
                                  order.order_date,
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
                              ordersPage + 1,
                            ),
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
