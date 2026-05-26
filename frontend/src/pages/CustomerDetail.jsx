import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallPopup } from "../context/CallPopupContext";
import { toast } from "react-hot-toast";
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
  Copy,
  Check,
} from "lucide-react";
import { fetchCustomerTypes } from "../api/customerTypes";
import {
  Calendar as CalendarIcon,
  FileText,
  DollarSign,
  MoreVertical,
} from "lucide-react";

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
  const [phoneError, setPhoneError] = useState("");
  const [gstinError, setGstinError] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [editingContactPerson, setEditingContactPerson] = useState(null);
  const [tempContactPerson, setTempContactPerson] = useState("");
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
  const [copiedPhone, setCopiedPhone] = useState(null); // State for copy feedback
  const [oldOrders, setOldOrders] = useState([]);
  const [showAddOldOrder, setShowAddOldOrder] = useState(false);
  const [editingOldOrder, setEditingOldOrder] = useState(null);
  const [oldOrderForm, setOldOrderForm] = useState({
    date: "",
    notes: "",
    amount: "",
  });
  const [showOldOrderHistory, setShowOldOrderHistory] = useState(true); // Default to Old Order History
  const [oldOrdersPage, setOldOrdersPage] = useState(1);
  const [tempGstinValue, setTempGstinValue] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

  useEffect(() => {
    // Get user from localStorage or your auth context
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.role === "Admin");
  }, []);

  // Fetch old order histories
  const { data: oldOrderHistoriesData } = useQuery({
    queryKey: ["old-order-histories", id],
    queryFn: () =>
      axios
        .get(`/api/old-order-histories/?customer_id=${id}`)
        .then((res) => res.data),
    enabled: !!id,
  });

  // Add old order history mutation
  const addOldOrderMutation = useMutation({
    mutationFn: (data) => axios.post("/api/old-order-histories/", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["old-order-histories", id]);
      setShowAddOldOrder(false);
      setOldOrderForm({ date: "", notes: "", amount: "" });
      toast.success("Old order added successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to add old order");
    },
  });

  // Update old order history mutation
  const updateOldOrderMutation = useMutation({
    mutationFn: ({ id, data }) =>
      axios.put(`/api/old-order-histories/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["old-order-histories", id]);
      setEditingOldOrder(null);
      setOldOrderForm({ date: "", notes: "", amount: "" });
      toast.success("Old order updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update old order");
    },
  });

  // Delete old order history mutation
  const deleteOldOrderMutation = useMutation({
    mutationFn: (orderId) =>
      axios.delete(`/api/old-order-histories/${orderId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["old-order-histories", id]);
      toast.success("Old order deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete old order");
    },
  });

  // Add this useEffect to set old orders when data loads
  useEffect(() => {
    if (oldOrderHistoriesData) {
      setOldOrders(oldOrderHistoriesData);
    }
  }, [oldOrderHistoriesData]);

  // Add handler functions
  const handleAddOldOrder = () => {
    if (!oldOrderForm.date || !oldOrderForm.amount) {
      toast.error("Date and amount are required");
      return;
    }
    addOldOrderMutation.mutate({
      customer: id,
      date: oldOrderForm.date,
      notes: oldOrderForm.notes,
      amount: parseFloat(oldOrderForm.amount),
    });
  };

  const handleEditOldOrder = (order) => {
    setEditingOldOrder(order.id);
    setOldOrderForm({
      date: order.date,
      notes: order.notes || "",
      amount: order.amount,
    });
  };

  const handleUpdateOldOrder = () => {
    if (!oldOrderForm.date || !oldOrderForm.amount) {
      toast.error("Date and amount are required");
      return;
    }
    updateOldOrderMutation.mutate({
      id: editingOldOrder,
      data: {
        date: oldOrderForm.date,
        notes: oldOrderForm.notes,
        amount: parseFloat(oldOrderForm.amount),
      },
    });
  };

  const handleDeleteOldOrder = (orderId) => {
    if (window.confirm("Are you sure you want to delete this old order?")) {
      deleteOldOrderMutation.mutate(orderId);
    }
  };

  const handleCancelEdit = () => {
    setEditingOldOrder(null);
    setShowAddOldOrder(false);
    setOldOrderForm({ date: "", notes: "", amount: "" });
  };

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

  const formatGstinWithDashes = (gstin) => {
  if (!gstin) return "";
  const cleaned = gstin.toString().replace(/[^A-Z0-9]/gi, "").toUpperCase();
  
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 12)}-${cleaned.slice(12, 15)}`;
};

  // Copy phone number to clipboard
  const copyToClipboard = async (phoneNumber, phoneId) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(phoneNumber);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = phoneNumber;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("document.execCommand('copy') was unsuccessful");
        }
      }
      setCopiedPhone(phoneId);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
    setPhoneError("");
  },
  onError: (error) => {
    // Only show error if it's not a duplicate (though frontend should catch it)
    if (error.response?.data?.error?.includes("already exists")) {
      setPhoneError("Phone number already exists");
    } else {
      setPhoneError(error.response?.data?.error || "Failed to add phone number");
    }
  },
});

  // Add or update contact person for a phone
  const updatePhoneContactPerson = useMutation({
    mutationFn: ({ id, contact_person }) =>
      axios.patch(`/api/phones/${id}/`, { contact_person }),
    onSuccess: () => queryClient.invalidateQueries(["customer-details", id]),
  });

  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.toString().replace(/\D/g, "");
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return phone;
  };

  const formatGstin = (gstin) => {
    if (!gstin) return "";
    const cleaned = gstin.toString().replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (cleaned.length === 15) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 12)}-${cleaned.slice(12, 15)}`;
    }
    return cleaned;
  };

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
  // Edit call log mutation - FIXED VERSION
  // Edit call log mutation - FIXED VERSION
  const editCallLogMutation = useMutation({
    mutationFn: async (callData) => {
      // CRITICAL: Use the call log ID correctly
      const callLogId = callData.id; // This should be the call log ID

      console.log("Updating call log:", callLogId);
      console.log("Call data:", callData);

      // Calculate duration in seconds (timer is in seconds)
      const durationSeconds = callData.duration;

      // Prepare update data
      const updateData = {
        note: callData.note || "",
        assumption: callData.assumption || [],
        assumption2: callData.assumption2 || [],
        assumption3: callData.assumption3 || [],
        order_id: callData.order_id || null,
        duration: durationSeconds, // Send as seconds (number)
        status: "Completed",
      };

      console.log("Sending update data:", updateData);

      // Make the PUT request to update existing call log
      const response = await axios.put(
        `/api/calllogs/${callLogId}/`,
        updateData,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customer-details", id]);
      toast.success("Call log updated successfully");
    },
    onError: (error) => {
      console.error("Failed to update call log:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.duration?.[0] ||
        error.response?.data?.error ||
        "Failed to update call log",
      );
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
  // FIXED: Edit last call function
  const handleEditLastCall = () => {
    if (callLogs.length > 0) {
      const recentCall = callLogs[0];

      console.log("Editing call log:", recentCall);

      const callData = {
        // Customer info for display
        id: customer?.id, // Customer ID
        name: customer?.name,
        surname: customer?.surname,
        phone: customer?.phone,

        // Call log data to edit
        notes: recentCall.note || "",
        selectedAssumption: recentCall.assumption || [],
        selectedAssumption2: recentCall.assumption2 || [],
        selectedAssumption3: recentCall.assumption3 || [],
        orderId: recentCall.order_id || "",
        timer: Math.round(recentCall.duration_minutes * 60) || 0,

        // CRITICAL: IDs for edit mode
        isEditing: true, // Flag to indicate edit mode
        callId: recentCall.call_id, // The call_id string from database
        dbId: recentCall.id, // The database primary key
      };

      console.log("Opening popup with edit data:", callData);
      openPopup(callData, editCallLogMutation.mutateAsync);
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
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-start lg:items-center gap-4 py-2">
            {/* Left side: Avatar + Name + Phones - Fixed width */}
            <div className="flex items-start lg:items-center space-x-4 flex-shrink-0 w-full lg:w-auto">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-17 w-17 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-lg flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              {/* Name Section - Fixed width container */}
              <div className="flex-shrink-0 min-w-[200px]">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">Name</span>
                  <div className="flex items-center space-x-2">
                    {/* First Name Field */}
                    <div className="relative">
                      <input
                        type="text"
                        defaultValue={customer?.name || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.name) {
                            updateMutation.mutate({ name: e.target.value });
                          }
                        }}
                        placeholder="First name"
                        className="px-2 py-1 border border-gray-300 rounded text-base font-semibold w-28 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Last Name Field */}
                    <div className="relative">
                      <input
                        type="text"
                        defaultValue={customer?.surname || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.surname) {
                            updateMutation.mutate({ surname: e.target.value });
                          }
                        }}
                        placeholder="Last name"
                        className="px-2 py-1 border border-gray-300 rounded text-base font-semibold w-28 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phones Section - Fixed width with copy buttons */}

              <div className="flex-shrink-0 min-w-[200px]">
                {customer?.all_phones && customer.all_phones.length > 0 && (
                  <div className="relative">
                    <div className="space-y-1">
                      {customer.all_phones
                        .slice(0, 2)
                        .map((phoneObj, index) => (
                          <div key={phoneObj.id || index} className="relative">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />

                              {/* Phone Number */}
                              {phoneObj.phone === customer.phone &&
                                editingField === "phone" ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) =>
                                      setTempValue(e.target.value)
                                    }
                                    className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      updateMutation.mutate({
                                        phone: tempValue,
                                      });
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
                                <span
                                  className={`${phoneObj.is_primary
                                    ? "font-semibold text-blue-600"
                                    : "text-gray-600"
                                    } text-base md:text-lg whitespace-nowrap`}
                                >
                                  {formatPhoneNumber(phoneObj.phone)}
                                  {phoneObj.is_primary && " (P)"}
                                </span>
                              )}

                              {/* Copy Button */}
                              <button
                                onClick={() =>
                                  copyToClipboard(phoneObj.phone, phoneObj.id)
                                }
                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                title="Copy phone number"
                              >
                                {copiedPhone === phoneObj.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>

                              {/* Contact Person - Direct Input Field */}
                              {editingContactPerson === phoneObj.id ? (
                                <input
                                  type="text"
                                  value={tempContactPerson}
                                  onChange={(e) =>
                                    setTempContactPerson(e.target.value)
                                  }
                                  onBlur={() => {
                                    if (
                                      tempContactPerson !==
                                      (phoneObj.contact_person || "")
                                    ) {
                                      updatePhoneContactPerson.mutate({
                                        id: phoneObj.id,
                                        contact_person: tempContactPerson,
                                      });
                                    }
                                    setEditingContactPerson(null);
                                    setTempContactPerson("");
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      if (
                                        tempContactPerson !==
                                        (phoneObj.contact_person || "")
                                      ) {
                                        updatePhoneContactPerson.mutate({
                                          id: phoneObj.id,
                                          contact_person: tempContactPerson,
                                        });
                                      }
                                      setEditingContactPerson(null);
                                      setTempContactPerson("");
                                    } else if (e.key === "Escape") {
                                      setEditingContactPerson(null);
                                      setTempContactPerson("");
                                    }
                                  }}
                                  placeholder="Contact person"
                                  className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingContactPerson(phoneObj.id);
                                    setTempContactPerson(
                                      phoneObj.contact_person || "",
                                    );
                                  }}
                                  className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded whitespace-nowrap"
                                >
                                  {phoneObj.contact_person || "Add contact"}
                                </span>
                              )}

                              {/* Primary Phone Dropdown Button */}
                              {phoneObj.is_primary && (
                                <button
                                  onClick={() =>
                                    setShowPrimaryDropdown(!showPrimaryDropdown)
                                  }
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transform transition-transform ${showPrimaryDropdown ? "rotate-180" : ""
                                      }`}
                                  />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete phone number "${formatPhoneNumber(phoneObj.phone)}"?`,
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

                            {/* Primary phone dropdown */}
                            {phoneObj.is_primary && showPrimaryDropdown && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
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
                                        disabled={
                                          setPrimaryPhoneMutation.isPending
                                        }
                                      >
                                        {formatPhoneNumber(p.phone)}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>

                    {/* Show "+X more" dropdown */}
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

                        {showAllPhones && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[400px]">
                            <div className="p-2 max-h-48 overflow-y-auto">
                              <div className="text-xs text-gray-500 mb-2 px-2">
                                All phone numbers:
                              </div>
                              {customer.all_phones
                                .slice(2)
                                .map((phone, idx) => (
                                  <div
                                    key={phone.id || idx}
                                    className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded gap-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                                      <span
                                        className={`${phone.is_primary
                                          ? "font-semibold text-blue-600"
                                          : "text-gray-700"
                                          } text-base whitespace-nowrap`}
                                      >
                                        {formatPhoneNumber(phone.phone)}
                                      </span>

                                      {/* Copy button */}
                                      <button
                                        onClick={() =>
                                          copyToClipboard(phone.phone, phone.id)
                                        }
                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Copy phone number"
                                      >
                                        {copiedPhone === phone.id ? (
                                          <Check className="h-3.5 w-3.5 text-green-500" />
                                        ) : (
                                          <Copy className="h-3.5 w-3.5" />
                                        )}
                                      </button>

                                      {/* Contact Person - Direct Input */}
                                      {editingContactPerson === phone.id ? (
                                        <input
                                          type="text"
                                          value={tempContactPerson}
                                          onChange={(e) =>
                                            setTempContactPerson(e.target.value)
                                          }
                                          onBlur={() => {
                                            if (
                                              tempContactPerson !==
                                              (phone.contact_person || "")
                                            ) {
                                              updatePhoneContactPerson.mutate({
                                                id: phone.id,
                                                contact_person:
                                                  tempContactPerson,
                                              });
                                            }
                                            setEditingContactPerson(null);
                                            setTempContactPerson("");
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              if (
                                                tempContactPerson !==
                                                (phone.contact_person || "")
                                              ) {
                                                updatePhoneContactPerson.mutate(
                                                  {
                                                    id: phone.id,
                                                    contact_person:
                                                      tempContactPerson,
                                                  },
                                                );
                                              }
                                              setEditingContactPerson(null);
                                              setTempContactPerson("");
                                            } else if (e.key === "Escape") {
                                              setEditingContactPerson(null);
                                              setTempContactPerson("");
                                            }
                                          }}
                                          placeholder="Contact person"
                                          className="px-2 py-0.5 border border-gray-300 rounded text-sm w-28"
                                          autoFocus
                                        />
                                      ) : (
                                        <span
                                          onClick={() => {
                                            setEditingContactPerson(phone.id);
                                            setTempContactPerson(
                                              phone.contact_person || "",
                                            );
                                          }}
                                          className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap"
                                        >
                                          {phone.contact_person ||
                                            "Add contact"}
                                        </span>
                                      )}

                                      {phone.is_primary && (
                                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded whitespace-nowrap">
                                          Primary
                                        </span>
                                      )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `Are you sure you want to delete phone number "${formatPhoneNumber(phone.phone)}"?`,
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
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Summary Cards - Flexible but with min-width */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 flex-1 min-w-[300px]">
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
                  className="bg-white rounded-lg border border-gray-200 p-1.5 min-w-[80px] flex-1"
                >
                  <p className="text-xs text-gray-500 truncate">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {item.value}
                  </p>
                </div>
              ))}

              <div className="bg-white rounded-lg border border-gray-200 p-1.5 min-w-[120px] relative">
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
                    className={`w-3 h-3 text-gray-400 flex-shrink-0 transform ${showAgentDropdown ? "rotate-180" : ""
                      }`}
                  />
                </div>
                {showAgentDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-[200px] min-w-max">
                    <div className="py-1 overflow-y-auto max-h-48">
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

            {/* Right side: Buttons - Fixed width, wrap on mobile */}
            <div className="flex flex-wrap gap-2 items-center justify-end flex-shrink-0">
              {!showAddPhone ? (
  <button
    onClick={() => {
      setShowAddPhone(true);
      setTimeout(() => {
        const phoneInput = document.getElementById("new-phone-input");
        if (phoneInput) phoneInput.focus();
      }, 100);
    }}
    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 text-sm whitespace-nowrap"
  >
    <Plus className="h-4 w-4 mr-1" />
    Phone
  </button>
) : (
  <div className="flex flex-col space-y-1">
    <div className="flex items-center space-x-2">
      <Phone className="h-4 w-4 text-gray-400" />
      <input
        id="new-phone-input"
        type="text"
        value={newPhoneNumber}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, "");
          if (value.length <= 10) {
            setNewPhoneNumber(value);
            
            // Clear previous errors
            if (phoneError === "Phone number must be 10 digits.") {
              setPhoneError("");
            }
            
            // Validation for length
            if (value.length > 0 && value.length < 10) {
              setPhoneError("Phone number must be 10 digits.");
            } else if (value.length === 10) {
              // Check if phone number already exists
              setPhoneError(""); // Clear length error first
              
              // 1. Check against current customer's existing phone numbers
              const phoneExistsLocally = customer?.all_phones?.some(
                (phoneObj) => phoneObj.phone === value
              );
              
              if (phoneExistsLocally) {
                setPhoneError("Phone number already exists");
              } else {
                // 2. Perform global duplicate check in entire database
                setIsCheckingPhone(true);
                axios.get(`/api/customers/?phone=${value}`)
                  .then((res) => {
                    const results = res.data?.results || res.data || [];
                    if (results.length > 0) {
                      setPhoneError("Phone number already exists");
                    } else {
                      setPhoneError(""); // Clear error if not duplicate
                    }
                  })
                  .catch((err) => {
                    console.error("Duplicate check failed:", err);
                  })
                  .finally(() => {
                    setIsCheckingPhone(false);
                  });
              }
            } else {
              setPhoneError("");
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (newPhoneNumber && newPhoneNumber.length === 10 && !phoneError && !isCheckingPhone && !addPhoneMutation.isPending) {
              addPhoneMutation.mutate({ phone: newPhoneNumber });
            } else if (newPhoneNumber.length !== 10) {
              setPhoneError("Phone number must be 10 digits.");
            }
          } else if (e.key === "Escape") {
            setShowAddPhone(false);
            setNewPhoneNumber("");
            setPhoneError("");
          }
        }}
        placeholder="Enter 10-digit number"
        className="px-2 py-1 border border-gray-300 rounded text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
        maxLength={10}
        autoFocus
        disabled={addPhoneMutation.isPending || isCheckingPhone}
      />
      
      {/* Save and Cancel Buttons */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            if (newPhoneNumber && newPhoneNumber.length === 10 && !phoneError && !isCheckingPhone && !addPhoneMutation.isPending) {
              addPhoneMutation.mutate({ phone: newPhoneNumber });
            } else if (newPhoneNumber.length !== 10) {
              setPhoneError("Phone number must be 10 digits.");
            }
          }}
          disabled={
            !newPhoneNumber || 
            newPhoneNumber.length !== 10 || 
            !!phoneError || 
            isCheckingPhone ||
            addPhoneMutation.isPending
          }
          className="inline-flex items-center px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Save className="h-3 w-3 mr-1" />
          Save
        </button>
        <button
          onClick={() => {
            setShowAddPhone(false);
            setNewPhoneNumber("");
            setPhoneError("");
          }}
          disabled={addPhoneMutation.isPending}
          className="inline-flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          X
        </button>
      </div>
    </div>
    
    {isCheckingPhone && (
      <div className="text-xs text-blue-500 ml-7">Verifying duplicate phone number...</div>
    )}
    
    {addPhoneMutation.isPending && (
      <div className="text-xs text-blue-500 ml-7">Adding phone number...</div>
    )}
    
    {/* Show error message */}
    {phoneError && (
      <div className="text-xs text-red-500 mt-1 ml-7">
        {phoneError}
      </div>
    )}
  </div>
)}

              <button
                onClick={() => {
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
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/25 text-sm whitespace-nowrap"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </button>
              <button
                onClick={() => navigate(`/orders/new?customer=${customer?.id}&customer_name=${encodeURIComponent(customer?.name || "")}`)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-purple-500/25 text-sm whitespace-nowrap"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Order
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
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 shadow-lg shadow-red-500/25 text-sm whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4 mr-2 items-center" />
                Del
              </button>
            </div>
          </div>

          {/* Secondary info below */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mt-2">
            <div className="flex items-center text-lg text-gray-600 bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Org:</span>
              {editingField === "company_name" ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateMutation.mutate({ company_name: tempValue });
                        setEditingField(null);
                        setTempValue("");
                      }
                    }}
                    onBlur={() => {
                      if (tempValue !== customer?.company_name) {
                        updateMutation.mutate({ company_name: tempValue });
                      }
                      setEditingField(null);
                      setTempValue("");
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm w-48"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span
                    className="font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                    onClick={() => {
                      setEditingField("company_name");
                      setTempValue(customer?.company_name || "");
                    }}
                  >
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
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${showOrgTypeDropdown ? "rotate-180" : ""
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
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${showCustomerTypeDropdown ? "rotate-180" : ""
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
                  value={customer?.appointment_date || ""}
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
            <div className="flex flex-col justify-center text-lg text-gray-600 bg-white rounded-lg border border-gray-200 p-1.5 min-w-20">
              <div className="flex items-center w-full">
  <span className="font-small mr-2 whitespace-nowrap">GST:</span>
  <input
    type="text"
    value={(() => {
      // Format the value for display while typing
      if (tempGstinValue !== null) {
        return formatGstinWithDashes(tempGstinValue);
      }
      return customer?.gstin_no ? formatGstinWithDashes(customer?.gstin_no) : "";
    })()}
    onChange={(e) => {
      // Get the raw input value and remove any dashes
      let rawValue = e.target.value.replace(/-/g, "").toUpperCase();
      
      // Limit to 15 characters
      if (rawValue.length > 15) {
        rawValue = rawValue.slice(0, 15);
      }
      
      setTempGstinValue(rawValue);
      
      // Validate length
      if (rawValue.length > 0 && rawValue.length < 15) {
        setGstinError("GSTIN must be exactly 15 characters");
      } else if (rawValue.length === 15) {
        // Check for duplicates
        axios.get(`/api/customers/?gstin_no=${rawValue}`)
          .then((res) => {
            const existingCustomers = res.data;
            const isDuplicate = existingCustomers.some(c => c.id !== Number(id));
            if (isDuplicate) {
              setGstinError("GSTIN already exists");
            } else {
              setGstinError("");
            }
          })
          .catch(() => {
            setGstinError("");
          });
      } else {
        setGstinError("");
      }
    }}
    onBlur={(e) => {
      const value = tempGstinValue !== null ? tempGstinValue : (customer?.gstin_no || "");
      
      if (value !== (customer?.gstin_no || "")) {
        if (value && value.length !== 15) {
          toast.error("GSTIN must be exactly 15 characters");
          setTempGstinValue(null);
          setGstinError("");
          // Reset to original value
          e.target.value = customer?.gstin_no ? formatGstinWithDashes(customer.gstin_no) : "";
        } else if (value.length === 15) {
          axios.get(`/api/customers/?gstin_no=${value}`)
            .then((res) => {
              const existingCustomers = res.data;
              const isDuplicate = existingCustomers.some(c => c.id !== Number(id));
              if (isDuplicate) {
                toast.error("GSTIN already exists");
                setGstinError("GSTIN already exists");
                setTempGstinValue(null);
              } else {
                updateMutation.mutate({ gstin_no: value });
                setGstinError("");
                setTempGstinValue(null);
              }
            })
            .catch(() => {
              updateMutation.mutate({ gstin_no: value });
              setGstinError("");
              setTempGstinValue(null);
            });
        } else {
          updateMutation.mutate({ gstin_no: null });
          setGstinError("");
          setTempGstinValue(null);
        }
      } else {
        setTempGstinValue(null);
      }
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.target.blur();
      } else if (e.key === "Escape") {
        setTempGstinValue(null);
        setGstinError("");
        e.target.blur();
      }
    }}
    placeholder="XX-XXXXXXXXXX-XXX"
    className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold text-gray-900 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>
              {gstinError && (
                <span className="text-red-500 text-xs font-semibold mt-1 ml-7">
                  {gstinError}
                </span>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="flex items-start font-semibold text-gray-700 mt-2 bg-white rounded-lg border border-gray-200 p-2">
            <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-10 gap-1">
                    {/* House No */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        House No
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.house_flat_no || ""}
                        title={customer?.house_flat_no || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.house_flat_no) {
                            updateMutation.mutate({
                              house_flat_no: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Wing/Lane */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Wing/Lane
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.wing_lane || ""}
                        title={customer?.wing_lane || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.wing_lane) {
                            updateMutation.mutate({
                              wing_lane: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Society/Colony */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Society/Colony
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.society_colony || ""}
                        title={customer?.society_colony || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.society_colony) {
                            updateMutation.mutate({
                              society_colony: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Landmark
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.landmark || ""}
                        title={customer?.landmark || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.landmark) {
                            updateMutation.mutate({
                              landmark: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Area */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Area
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.area || ""}
                        title={customer?.area || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.area) {
                            updateMutation.mutate({
                              area: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Pincode
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.pincode || ""}
                        title={customer?.pincode || ""}
                        onBlur={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          if (value !== customer?.pincode) {
                            if (value && value.length !== 6) {
                              alert("Pincode must be exactly 6 digits");
                              return;
                            }
                            updateMutation.mutate({ pincode: value || null });
                          }
                        }}
                        onChange={(e) => {
                          // Allow only digits and limit to 6 characters while typing
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          e.target.value = value;
                        }}
                        placeholder="-"
                        maxLength={6}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.city || ""}
                        title={customer?.city || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.city) {
                            updateMutation.mutate({
                              city: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* District */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.district || ""}
                        title={customer?.district || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.district) {
                            updateMutation.mutate({
                              district: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Tahsil */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tahsil
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.tahsil || ""}
                        title={customer?.tahsil || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.tahsil) {
                            updateMutation.mutate({
                              tahsil: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        defaultValue={customer?.state || ""}
                        title={customer?.state || ""}
                        onBlur={(e) => {
                          if (e.target.value !== customer?.state) {
                            updateMutation.mutate({
                              state: e.target.value || null,
                            });
                          }
                        }}
                        placeholder="-"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
            {/* Order History Section - Fixed at top */}
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
              <div className="flex-none h-[250px] flex flex-col justify-center items-center py-4">
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
              <div className="flex-none mb-2 h-[250px] overflow-y-auto">
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
                              className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${order.status === "Delivered"
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

                {/* Pagination for Orders */}
                {orders.length > itemsPerPage && (
                  <div className="flex justify-between items-center mt-2">
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
            <div className="flex-none border-t border-gray-200 my-1"></div>

            {/* Toggle Section */}
            <div className="flex-none mb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowOldOrderHistory(true)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 ${showOldOrderHistory
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    <FileText className="h-3 w-3 inline mr-2" />
                    Old Order History
                  </button>
                  <button
                    onClick={() => setShowOldOrderHistory(false)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 ${!showOldOrderHistory
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    <Phone className="h-3 w-3 inline mr-2" />
                    Call History
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowAddOldOrder(!showAddOldOrder);
                    setEditingOldOrder(null);
                    setOldOrderForm({ date: "", notes: "", amount: "" });
                  }}
                  className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg shadow-purple-500/25 text-sm"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Old Order
                </button>
                <div className="text-sm text-gray-500">
                  {showOldOrderHistory
                    ? `${oldOrders.length} old order${oldOrders.length !== 1 ? "s" : ""}`
                    : `${callLogs.length} call${callLogs.length !== 1 ? "s" : ""}`}
                </div>
              </div>
            </div>

            {/* Old Order History Section */}
            {showOldOrderHistory && (
              <div className="flex-1 flex flex-col min-h-0">
                {(showAddOldOrder || editingOldOrder) && isAdmin && (
                  <div className="flex-none mb-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={oldOrderForm.date}
                          onChange={(e) =>
                            setOldOrderForm({
                              ...oldOrderForm,
                              date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount * (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={oldOrderForm.amount}
                          onChange={(e) =>
                            setOldOrderForm({
                              ...oldOrderForm,
                              amount: e.target.value,
                            })
                          }
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          rows={1}
                          value={oldOrderForm.notes}
                          onChange={(e) =>
                            setOldOrderForm({
                              ...oldOrderForm,
                              notes: e.target.value,
                            })
                          }
                          placeholder="Optional notes"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>
                      <div className="flex justify-end space-x-2 sm:mb-0.5">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={
                            editingOldOrder
                              ? handleUpdateOldOrder
                              : handleAddOldOrder
                          }
                          disabled={
                            addOldOrderMutation.isPending ||
                            updateOldOrderMutation.isPending
                          }
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {editingOldOrder ? "Update" : "Add"} Old Order
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Old Orders Table */}
                {oldOrders.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-12">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg">
                      No old orders found for this customer.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto mb-2">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            {/* Only show Actions column for admin */}
                            {isAdmin && (
                              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {oldOrders
                            .slice(
                              (oldOrdersPage - 1) * itemsPerPage,
                              oldOrdersPage * itemsPerPage,
                            )
                            .map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(order.date).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-1 text-sm text-gray-900 max-w-md">
                                  {order.notes || "-"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                                  ₹{parseFloat(order.amount).toFixed(2)}
                                </td>
                                {/* Only show action buttons for admin */}
                                {isAdmin && (
                                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-right">
                                    <button
                                      onClick={() => handleEditOldOrder(order)}
                                      className="text-blue-600 hover:text-blue-900 mr-3"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteOldOrder(order.id)
                                      }
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination for Old Orders */}
                    {oldOrders.length > itemsPerPage && (
                      <div className="flex-none flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() =>
                            setOldOrdersPage(Math.max(1, oldOrdersPage - 1))
                          }
                          disabled={oldOrdersPage === 1}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {oldOrdersPage} of{" "}
                          {Math.ceil(oldOrders.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() =>
                            setOldOrdersPage(
                              Math.min(
                                Math.ceil(oldOrders.length / itemsPerPage),
                                oldOrdersPage + 1,
                              ),
                            )
                          }
                          disabled={
                            oldOrdersPage ===
                            Math.ceil(oldOrders.length / itemsPerPage)
                          }
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Call History Section */}
            {!showOldOrderHistory && (
              <div className="flex-1 flex flex-col min-h-0">
                {callLogs.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-12">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <p className="text-gray-500 text-lg">
                      No call logs found for this customer.
                    </p>
                  </div>
                ) : (
                  <>
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
                                    {new Date(call.date).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
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
                                    className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${call.status === "Completed"
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
                      <div className="flex-none flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() =>
                            setCallLogsPage(Math.max(1, callLogsPage - 1))
                          }
                          disabled={callLogsPage === 1}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </>
  );
};

export default CustomerDetail;
