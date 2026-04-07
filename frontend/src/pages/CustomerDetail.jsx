import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallPopup } from "../context/CallPopupContext";
import {
  User,
  Phone,
  ShoppingBag,
  Edit,
  Trash2,
  Save,
  X,
  Plus,
  ChevronDown,
  Calendar,
  MapPin,
} from "lucide-react";
import { fetchCustomerTypes } from "../api/customerTypes";

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openPopup } = useCallPopup();
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
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
  const [showAllPhones, setShowAllPhones] = useState(false);
  const [showNameEditDropdown, setShowNameEditDropdown] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempSurname, setTempSurname] = useState("");
  const [customerTypes, setCustomerTypes] = useState([]);
  const itemsPerPage = 5;

  // Fetch customer details
  const {
    data: customerDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer-details", id],
    queryFn: () =>
      axios.get(`/api/customers/${id}/details/`).then((res) => res.data),
  });

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => axios.get("/api/users/").then((res) => res.data),
  });

  // Fetch organization types
  const { data: organizationTypes } = useQuery({
    queryKey: ["organization-types"],
    queryFn: () => axios.get("/api/organizationtypes/").then((res) => res.data),
  });

  // Fetch customer types
  useEffect(() => {
    fetchCustomerTypes()
      .then(setCustomerTypes)
      .catch(() => setCustomerTypes([]));
  }, []);

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/customers/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      setEditingField(null);
      setEditingAddress(false);
      setShowNameEditDropdown(false);
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/customers/${id}/`),
    onSuccess: () => navigate("/customers"),
  });

  // Add phone mutation
  const addPhoneMutation = useMutation({
    mutationFn: (phoneData) =>
      axios.post(`/api/customers/${id}/add_phone/`, phoneData),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      setShowAddPhone(false);
      setNewPhoneNumber("");
    },
  });

  // Set primary phone mutation
  const setPrimaryPhoneMutation = useMutation({
    mutationFn: (phoneId) =>
      axios.post(`/api/customers/${id}/set_primary_phone/`, {
        phone_id: phoneId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      setShowPrimaryDropdown(false);
    },
  });

  // Delete phone mutation
  const deletePhoneMutation = useMutation({
    mutationFn: (phoneId) =>
      axios.delete(`/api/customers/${id}/delete_phone/`, {
        data: { phone_id: phoneId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
    },
  });

  // Edit call log mutation - always updates existing record
  const editCallLogMutation = useMutation({
    mutationFn: (data) => axios.put(`/api/calllogs/${data.id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
    },
  });

  const customer = customerDetails?.customer;
  const summary = customerDetails?.summary;
  const callLogs = customerDetails?.call_logs || [];
  const orders = customerDetails?.orders || [];

  const startEditingName = () => {
    setTempName(customer?.name || "");
    setEditingField("name");
    setShowNameEditDropdown(false);
  };

  const startEditingSurname = () => {
    setTempSurname(customer?.surname || "");
    setEditingField("surname");
    setShowNameEditDropdown(false);
  };

  const saveNameEdit = () => {
    updateMutation.mutate({ name: tempName });
  };

  const saveSurnameEdit = () => {
    updateMutation.mutate({ surname: tempSurname });
  };

  const cancelNameEdit = () => {
    setEditingField(null);
    setTempName("");
  };

  const cancelSurnameEdit = () => {
    setEditingField(null);
    setTempSurname("");
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
      tahsil: customer?.tahsil || "",
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
  };

  const cancelAddressEdit = () => {
    setEditingAddress(false);
    setTempAddress({});
  };

  // Edit last call functionality - always uses call log ID for update
  const handleEditLastCall = () => {
    if (callLogs.length > 0) {
      const recentCall = callLogs[0];

      // CRITICAL: Use the CURRENT customer ID, not the one from the call log
      const currentCustomerId = customer?.id;

      console.log(
        "Editing last call - Customer ID from page:",
        currentCustomerId,
      );
      console.log(
        "Editing last call - Customer ID from call log:",
        recentCall.customer,
      );
      console.log("Full call log:", recentCall);

      // Validate customer exists
      if (!currentCustomerId) {
        console.error("No customer ID found in current page");
        toast.error("Cannot edit call: Customer information missing");
        return;
      }

      const callData = {
        // Use the CURRENT customer from the page, not the one from call log
        id: currentCustomerId,
        name: customer?.name,
        surname: customer?.surname,
        phone: customer?.phone,
        notes: recentCall.note || "",
        selectedAssumption: recentCall.assumption || [],
        selectedAssumption2: recentCall.assumption2 || [],
        selectedAssumption3: recentCall.assumption3 || [],
        orderId: recentCall.order_id || "",
        callId: recentCall.call_id,
        timer: Math.round(recentCall.duration_minutes * 60) || 0,
        isEditing: true,
        isRunning: false,
      };

      console.log("Opening popup with callData:", callData);
      openPopup(callData);
    }
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
        <div className="mb-4">
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateMutation.mutate({ name: tempName });
                            setEditingField(null);
                            setTempName("");
                          }
                        }}
                        onBlur={() => {
                          // Save when clicking outside
                          if (tempName !== customer?.name) {
                            updateMutation.mutate({ name: tempName });
                          }
                          setEditingField(null);
                          setTempName("");
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-base font-semibold w-40"
                        placeholder="Customer name"
                        autoFocus
                      />
                    </div>
                  ) : editingField === "surname" ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={tempSurname}
                        onChange={(e) => setTempSurname(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateMutation.mutate({ surname: tempSurname });
                            setEditingField(null);
                            setTempSurname("");
                          }
                        }}
                        onBlur={() => {
                          // Save when clicking outside
                          if (tempSurname !== customer?.surname) {
                            updateMutation.mutate({ surname: tempSurname });
                          }
                          setEditingField(null);
                          setTempSurname("");
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-base font-semibold w-40"
                        placeholder="Customer surname"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 relative">
                      <span className="text-xl font-bold text-gray-900">
                        {customer?.name || "No name"} {customer?.surname || ""}
                      </span>
                      <button
                        onClick={() =>
                          setShowNameEditDropdown(!showNameEditDropdown)
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {showNameEditDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                          <button
                            onClick={() => {
                              setTempName(customer?.name || "");
                              setEditingField("name");
                              setShowNameEditDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-t-lg"
                          >
                            Edit Name
                          </button>
                          <button
                            onClick={() => {
                              setTempSurname(customer?.surname || "");
                              setEditingField("surname");
                              setShowNameEditDropdown(false);
                            }}
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
                                onClick={() => {
                                  updateMutation.mutate({ phone: tempValue });
                                  setEditingField(null);
                                }}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingField(null);
                                  setTempValue("");
                                }}
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
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete phone number "${phoneObj.phone}"?`,
                                    )
                                  ) {
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
                            {customer.all_phones.slice(2).map((phone, idx) => (
                              <div
                                key={phone.id || idx}
                                className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded"
                              >
                                <div className="flex items-center">
                                  <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                  <span
                                    className={`text-sm ${
                                      phone.is_primary
                                        ? "font-semibold text-blue-600"
                                        : "text-gray-700"
                                    }`}
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
                                      if (
                                        window.confirm(
                                          `Are you sure you want to delete phone number "${phone.phone}"?`,
                                        )
                                      ) {
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
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {item.value}
                  </p>
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
                    className={`w-3 h-3 text-gray-400 flex-shrink-0 transform ${
                      showAgentDropdown ? "rotate-180" : ""
                    }`}
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
                          title={employee.username}
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
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) {
                          setNewPhoneNumber(value);
                        }
                      }}
                      placeholder="Enter new phone number"
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                      maxLength={10}
                    />
                    <button
                      onClick={() => {
                        if (newPhoneNumber.length !== 10) {
                          alert("Phone number must be exactly 10 digits.");
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
                </div>
              )}
              <button
                onClick={() => {
                  console.log("Opening popup for customer:", customer);
                  console.log("Customer ID:", customer?.id);
                  console.log("Customer phone:", customer?.phone);

                  // Make sure we're passing the full customer object with ID
                  const callData = {
                    ...customer,
                    id: customer?.id,
                    customer_id: customer?.id,
                    timer: 0,
                    notes: "",
                    selectedAssumption: [],
                    selectedAssumption2: [],
                    selectedAssumption3: [],
                  };

                  openPopup(callData);
                }}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </button>
              <button
                onClick={() => navigate(`/orders/new?customer=${customer?.id}`)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 mt-2">
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
                    onClick={() => {
                      updateMutation.mutate({ company_name: tempValue });
                      setEditingField(null);
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null);
                      setTempValue("");
                    }}
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
                    onClick={() => {
                      setEditingField("company_name");
                      setTempValue(customer?.company_name || "");
                    }}
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
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${
                    showCustomerTypeDropdown ? "rotate-180" : ""
                  }`}
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
              <span className="font-medium mr-2">Appointment:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={
                    customer?.appointment_date ||
                    customer?.created_at?.split("T")[0] ||
                    ""
                  }
                  onChange={(e) => {
                    updateMutation.mutate({ appointment_date: e.target.value });
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-center text-lg text-gray-600 bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
              <svg
                className="h-5 w-5 mr-2 text-gray-400"
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
              <span className="font-medium mr-2">Time:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  value={customer?.appointment_time || ""}
                  onChange={(e) => {
                    updateMutation.mutate({ appointment_time: e.target.value });
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          {/* Address Section - Always visible */}
          <div className="flex items-start font-semibold text-gray-700 mt-2 bg-white rounded-lg border border-gray-200 p-2">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editingAddress ? (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
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
                            setTempAddress({
                              ...tempAddress,
                              pincode: value,
                            });
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
                          Tahsil
                        </label>
                        <input
                          type="text"
                          placeholder="Tahsil"
                          value={tempAddress.tahsil}
                          onChange={(e) =>
                            setTempAddress({
                              ...tempAddress,
                              tahsil: e.target.value,
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
                  </div>
                  <div className="ml-4 flex-shrink-0 pt-6 flex items-center space-x-2">
                    <button
                      onClick={saveAddressEdit}
                      className="text-green-600 hover:text-green-800 flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                      title="Save changes"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelAddressEdit}
                      className="text-red-600 hover:text-red-800 flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                      title="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-10 gap-1">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          House No
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.house_flat_no || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Wing/Lane
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.wing_lane || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Society/Colony
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.society_colony || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Landmark
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.landmark || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Area
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.area || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.pincode || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.city || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          District
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.district || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Tahsil
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.tahsil || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <div className="px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50 min-h-[34px] flex items-center">
                          {customer?.state || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 pt-6">
                    <button
                      onClick={startEditingAddress}
                      className="text-gray-400 hover:text-gray-600 flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100"
                      title="Edit address"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conversation history - EXACTLY as you had it, just fixed the logic */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* Left container - Conversation History (60%) */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-2 h-96 lg:h-[600px] xl:h-[700px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
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
              {/* FIXED: Edit Last Call button - Now properly works */}
              {callLogs.length > 0 &&
                callLogs[0]?.date &&
                new Date() - new Date(callLogs[0].date) <
                  24 * 60 * 60 * 1000 && (
                  <button
                    onClick={handleEditLastCall}
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
                    if (call.order_id) {
                      elements.push(
                        <span key="sep3" className="text-gray-400 text-lg">
                          {" "}
                          |{" "}
                        </span>,
                      );
                      elements.push(
                        <span
                          key="order-text"
                          className="text-blue-600 font-medium text-lg underline"
                        >
                          {call.order_id}
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
                      curr,
                    ];
                  }, [])}
              </div>
            )}
          </div>

          {/* Right container - Order History (40%) - Keep exactly as you had */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-96 lg:h-[600px] xl:h-[700px] flex flex-col">
            {/* Order History Section */}
            <div className="flex-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-4">
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order History
                  </h2>
                </div>
                <div className="text-sm text-gray-500">
                  {orders.length} order{orders.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center py-4">
                <svg
                  className="w-12 h-12 text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">
                  No orders found for this customer.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col mb-4">
                <div className="flex-1 overflow-y-auto mb-2">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PayStatus
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due
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
                            <td className="px-2 py-1 whitespace-nowrap">
                              <Link
                                to={`/orders/${order.id}`}
                                className="text-blue-600 hover:text-blue-900 font-medium text-xs"
                              >
                                {order.order_id || `ORD-${order.id}`}
                              </Link>
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
                              {new Date(order.order_date).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">
                              <span
                                className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
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
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
                              {(() => {
                                const matchingCall = callLogs.find(
                                  (call) =>
                                    call.order_id == order.order_id &&
                                    call.order_placed === "Yes",
                                );
                                if (
                                  matchingCall &&
                                  matchingCall.assumption3_names &&
                                  matchingCall.assumption3_names.length > 0
                                ) {
                                  return matchingCall.assumption3_names.join(
                                    ", ",
                                  );
                                }
                                return "-";
                              })()}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs">
                              {order.payment_status}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs">
                              ₹{order.total_amount}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs">
                              ₹{order.paid_amount}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-xs">
                              ₹{order.total_amount - order.paid_amount}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Orders */}
                {orders.length > itemsPerPage && (
                  <div className="flex-none flex justify-between items-center mt-2">
                    <button
                      onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                      disabled={ordersPage === 1}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600">
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
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="flex-none border-t border-gray-200 my-4"></div>

            {/* Call History Section */}
            <div className="flex-none">
              <div className="flex items-center justify-between mb-4">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Call History
                  </h2>
                </div>
                <div className="text-sm text-gray-500">
                  {callLogs.length} call{callLogs.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {callLogs.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center py-4">
                <svg
                  className="w-12 h-12 text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <p className="text-gray-500 text-sm">
                  No call logs found for this customer.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-2">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
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
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
                              {new Date(call.date).toLocaleDateString()}
                              <br />
                              <span className="text-gray-500 text-xs">
                                {new Date(call.date).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
                              {call.employee_name || "Unknown"}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-xs">
                              {formatDuration(call.duration_minutes)}
                            </td>
                            <td className="px-2 py-1 whitespace-nowrap">
                              <span
                                className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${
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
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for Call Logs */}
                {callLogs.length > itemsPerPage && (
                  <div className="flex-none flex justify-between items-center mt-2">
                    <button
                      onClick={() =>
                        setCallLogsPage(Math.max(1, callLogsPage - 1))
                      }
                      disabled={callLogsPage === 1}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600">
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
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDetail;
