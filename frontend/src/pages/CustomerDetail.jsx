import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "../api/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallPopup } from "../context/CallPopupContext";
import { useAuth } from "../context/AuthContext";
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
  Globe,
  Users,
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
  const { hasPermission } = useAuth();
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
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCommunityDropdown, setShowCommunityDropdown] = useState(false);
  const [showNewLanguageInput, setShowNewLanguageInput] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [showNewCommunityInput, setShowNewCommunityInput] = useState(false);
  const [newCommunity, setNewCommunity] = useState("");
  const [showNewOrgTypeInput, setShowNewOrgTypeInput] = useState(false);
  const [newOrgType, setNewOrgType] = useState("");
  const [showNewCustomerTypeInput, setShowNewCustomerTypeInput] = useState(false);
  const [newCustomerType, setNewCustomerType] = useState("");
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
  const itemsPerPage = 6;
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const agentDropdownRef = useRef(null);
  const orgTypeDropdownRef = useRef(null);
  const customerTypeDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const communityDropdownRef = useRef(null);
  const phoneDropdownRef = useRef(null);
  const lastSyncedDateRef = useRef(null);
  const lastSyncedTimeRef = useRef(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setShowAgentDropdown(false);
      }
      if (orgTypeDropdownRef.current && !orgTypeDropdownRef.current.contains(event.target)) {
        setShowOrgTypeDropdown(false);
        setShowNewOrgTypeInput(false);
      }
      if (customerTypeDropdownRef.current && !customerTypeDropdownRef.current.contains(event.target)) {
        setShowCustomerTypeDropdown(false);
        setShowNewCustomerTypeInput(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
        setShowNewLanguageInput(false);
      }
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(event.target)) {
        setShowCommunityDropdown(false);
        setShowNewCommunityInput(false);
      }
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(event.target)) {
        setShowPrimaryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  // Fetch languages
  const { data: languages, refetch: refetchLanguages } = useQuery({
    queryKey: ["languages"],
    queryFn: () => axios.get("/api/languages/").then((res) => res.data),
  });

  // Fetch communities
  const { data: communities, refetch: refetchCommunities } = useQuery({
    queryKey: ["communities"],
    queryFn: () => axios.get("/api/communities/").then((res) => res.data),
  });

  // Mutation for adding new language
  const addLanguageMutation = useMutation({
    mutationFn: async (langData) => {
      const response = await axios.post("/api/languages/", langData);
      return response.data;
    },
    onSuccess: (data) => {
      refetchLanguages();
      updateMutation.mutate({ language: data.id });
      setNewLanguage("");
      setShowNewLanguageInput(false);
    },
    onError: (error) => {
      console.error("Error adding language:", error);
    },
  });

  // Mutation for adding new community
  const addCommunityMutation = useMutation({
    mutationFn: async (commData) => {
      const response = await axios.post("/api/communities/", commData);
      return response.data;
    },
    onSuccess: (data) => {
      refetchCommunities();
      updateMutation.mutate({ community: data.id });
      setNewCommunity("");
      setShowNewCommunityInput(false);
    },
    onError: (error) => {
      console.error("Error adding community:", error);
    },
  });

  // Mutation for adding new organization type
  const addOrgTypeMutation = useMutation({
    mutationFn: async (orgTypeData) => {
      const response = await axios.post("/api/organizationtypes/", orgTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organization-types"] });
      updateMutation.mutate({ company_type: data.id });
      setNewOrgType("");
      setShowNewOrgTypeInput(false);
    },
    onError: (error) => {
      console.error("Error adding organization type:", error);
    },
  });

  // Mutation for adding new customer type
  const addCustomerTypeMutation = useMutation({
    mutationFn: async (customerTypeData) => {
      const response = await axios.post("/api/customertypes/", customerTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      fetchCustomerTypes().then(setCustomerTypes); // Refetch customer types
      updateMutation.mutate({ customer_type: data.id });
      setNewCustomerType("");
      setShowNewCustomerTypeInput(false);
    },
    onError: (error) => {
      console.error("Error adding customer type:", error);
    },
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
    onMutate: async (newData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["customer-details", id] });

      // Snapshot the previous value
      const previousDetails = queryClient.getQueryData(["customer-details", id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["customer-details", id], (old) => {
        if (!old) return old;
        return {
          ...old,
          customer: {
            ...old.customer,
            ...newData,
          },
        };
      });

      // Return context with previousDetails
      return { previousDetails };
    },
    onSuccess: () => {
      setEditingField(null);
      setEditingAddress(false);
      setShowNameEditDropdown(false);
      toast.success("Customer details updated successfully");
    },
    onError: (err, newData, context) => {
      console.error("Failed to update customer:", err);
      toast.error(err.response?.data?.error || err.message || "Failed to update customer");
      
      // Rollback to previous details
      if (context?.previousDetails) {
        queryClient.setQueryData(["customer-details", id], context.previousDetails);
      }
      
      // Reset local states to query cache values on failure
      if (customer) {
        setAppointmentDate(customer.appointment_date || "");
        setAppointmentTime(customer.appointment_time || "");
        lastSyncedDateRef.current = customer.appointment_date;
        lastSyncedTimeRef.current = customer.appointment_time;
      }
    },
    onSettled: () => {
      // Always refetch to sync cache with server
      queryClient.invalidateQueries({ queryKey: ["customer-details", id] });
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
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleCapitalizeInput = (e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    const originalValue = e.target.value;
    const capitalized = capitalizeWords(originalValue);
    if (originalValue !== capitalized) {
      e.target.value = capitalized;
      e.target.setSelectionRange(start, end);
    }
  };

  const customer = customerDetails?.customer;
  const primaryPhoneObj = customer?.all_phones?.find((p) => p.is_primary) || customer?.all_phones?.[0];
  const secondaryPhones = customer?.all_phones?.filter((p) => p.id !== primaryPhoneObj?.id) || [];
  const summary = customerDetails?.summary;
  const callLogs = customerDetails?.call_logs || [];
  const orders = customerDetails?.orders || [];

  // Sync date/time from query result into local states, avoiding overwriting in-flight mutations
  useEffect(() => {
    if (customer) {
      if (customer.appointment_date !== lastSyncedDateRef.current) {
        setAppointmentDate(customer.appointment_date || "");
        lastSyncedDateRef.current = customer.appointment_date;
      }
      if (customer.appointment_time !== lastSyncedTimeRef.current) {
        setAppointmentTime(customer.appointment_time || "");
        lastSyncedTimeRef.current = customer.appointment_time;
      }
    }
  }, [customer]);

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

  const handleLanguageSelect = (languageId) => {
    updateMutation.mutate({ language: languageId });
    setShowLanguageDropdown(false);
  };

  const handleCommunitySelect = (communityId) => {
    updateMutation.mutate({ community: communityId });
    setShowCommunityDropdown(false);
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
        <div className="mb-1">
          <div className="flex flex-wrap lg:flex-nowrap justify-between items-start lg:items-center gap-4">
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
              <div className="flex-shrink-0 min-w-[340px]">
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    {/* First Name Field */}
                    <div className="relative">
                      <input
                        type="text"
                        defaultValue={customer?.name || ""}
                        onChange={handleCapitalizeInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.target.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const capitalizedValue = capitalizeWords(e.target.value);
                          e.target.value = capitalizedValue;
                          if (capitalizedValue !== (customer?.name || "")) {
                            updateMutation.mutate({ name: capitalizedValue });
                          }
                        }}
                        placeholder="First name"
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-md font-semibold text-slate-800 w-40 transition-all duration-200 focus:outline-none"
                      />
                    </div>

                    {/* Last Name Field */}
                    <div className="relative">
                      <input
                        type="text"
                        defaultValue={customer?.surname || ""}
                        onChange={handleCapitalizeInput}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.target.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const capitalizedValue = capitalizeWords(e.target.value);
                          e.target.value = capitalizedValue;
                          if (capitalizedValue !== (customer?.surname || "")) {
                            updateMutation.mutate({ surname: capitalizedValue });
                          }
                        }}
                        placeholder="Last name"
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-md font-semibold text-slate-800 w-48 transition-all duration-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Primary Phone number under Name inputs */}
                  {primaryPhoneObj && (
                    <div className="mt-2.5 space-y-1.5">
                      <div ref={phoneDropdownRef} key={primaryPhoneObj.id} className="relative">
                        <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 shadow-sm transition-all duration-150 gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />

                          {/* Phone Number */}
                          {primaryPhoneObj.phone === customer.phone &&
                            editingField === "phone" ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={tempValue}
                                onChange={(e) =>
                                  setTempValue(e.target.value)
                                }
                                className="px-2 py-0.5 border border-slate-200 focus:border-blue-500 rounded text-sm w-28 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  updateMutation.mutate({
                                    phone: tempValue,
                                  });
                                  setEditingField(null);
                                }}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingField(null);
                                  setTempValue("");
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span
                              className="font-bold text-blue-600 text-md whitespace-nowrap"
                            >
                              {formatPhoneNumber(primaryPhoneObj.phone)}
                              {" (P)"}
                            </span>
                          )}

                          {/* Copy Button */}
                          <button
                            onClick={() =>
                              copyToClipboard(primaryPhoneObj.phone, primaryPhoneObj.id)
                            }
                            className="text-slate-400 hover:text-blue-600 transition-colors ml-auto"
                            title="Copy phone number"
                          >
                            {copiedPhone === primaryPhoneObj.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Contact Person - Direct Input Field */}
                          {editingContactPerson === primaryPhoneObj.id ? (
                            <input
                              type="text"
                              value={tempContactPerson}
                              onChange={(e) =>
                                setTempContactPerson(e.target.value)
                              }
                              onBlur={() => {
                                if (
                                  tempContactPerson !==
                                  (primaryPhoneObj.contact_person || "")
                                ) {
                                  updatePhoneContactPerson.mutate({
                                    id: primaryPhoneObj.id,
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
                                    (primaryPhoneObj.contact_person || "")
                                  ) {
                                    updatePhoneContactPerson.mutate({
                                      id: primaryPhoneObj.id,
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
                              placeholder="Name"
                              className="px-2 py-0.5 bg-white border border-blue-400 rounded-md text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => {
                                setEditingContactPerson(primaryPhoneObj.id);
                                setTempContactPerson(
                                  primaryPhoneObj.contact_person || "",
                                );
                              }}
                              className="text-sm text-slate-500 font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 border border-slate-200 hover:border-blue-100 rounded-md truncate max-w-[110px] inline-block align-middle transition-all duration-150"
                              title={primaryPhoneObj.contact_person || "Click to add/edit contact"}
                            >
                              {primaryPhoneObj.contact_person || "+ Contact"}
                            </span>
                          )}

                          {/* Primary Phone Dropdown Button */}
                          <button
                            onClick={() =>
                              setShowPrimaryDropdown(!showPrimaryDropdown)
                            }
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <ChevronDown
                              className={`h-3.5 w-3.5 transform transition-transform ${showPrimaryDropdown ? "rotate-180" : ""
                                }`}
                            />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete phone number "${formatPhoneNumber(primaryPhoneObj.phone)}"?`,
                                )
                              ) {
                                deletePhoneMutation.mutate(primaryPhoneObj.id);
                              }
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete phone number"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Primary phone dropdown */}
                        {showPrimaryDropdown && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="p-2 max-h-40 overflow-y-auto">
                              <div className="text-sm text-gray-500 mb-1 px-1">
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
                    </div>
                  )}
                </div>
              </div>

              {/* Phones Section - Fixed width with copy buttons */}
              <div className="flex-shrink-0 min-w-[230px]">
                {secondaryPhones && secondaryPhones.length > 0 && (
                  <div className="flex flex-col">
                    <div className="space-y-1.5">
                      {secondaryPhones
                        .slice(0, 2)
                        .map((phoneObj, index) => (
                          <div key={phoneObj.id || index} className="relative">
                            <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 shadow-sm transition-all duration-150 gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />

                              {/* Phone Number */}
                              {phoneObj.phone === customer.phone &&
                                editingField === "phone" ? (
                                <div className="flex items-center space-x-1.5">
                                  <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) =>
                                      setTempValue(e.target.value)
                                    }
                                    className="px-2 py-0.5 border border-slate-200 focus:border-blue-500 rounded text-sm w-28 focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      updateMutation.mutate({
                                        phone: tempValue,
                                      });
                                      setEditingField(null);
                                    }}
                                    className="text-green-600 hover:text-green-800 transition-colors"
                                  >
                                    <Save className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingField(null);
                                      setTempValue("");
                                    }}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className="font-semibold text-slate-700 text-md whitespace-nowrap"
                                >
                                  {formatPhoneNumber(phoneObj.phone)}
                                </span>
                              )}

                              {/* Copy Button */}
                              <button
                                onClick={() =>
                                  copyToClipboard(phoneObj.phone, phoneObj.id)
                                }
                                className="text-slate-400 hover:text-blue-600 transition-colors ml-auto"
                                title="Copy phone number"
                              >
                                {copiedPhone === phoneObj.id ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
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
                                  placeholder="Name"
                                  className="px-2 py-0.5 bg-white border border-blue-400 rounded-md text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                                  className="text-sm text-slate-500 font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-600 px-2 py-0.5 border border-slate-200 hover:border-blue-100 rounded-md truncate max-w-[110px] inline-block align-middle transition-all duration-150"
                                  title={phoneObj.contact_person || "Click to add/edit contact"}
                                >
                                  {phoneObj.contact_person || "+ Contact"}
                                </span>
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
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Delete phone number"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Show "+X more" dropdown */}
                    {secondaryPhones.length > 2 && (
                      <div className="mt-1 relative">
                        <button
                          onClick={() => setShowAllPhones(!showAllPhones)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-3 w-3 mr-1" />+
                          {secondaryPhones.length - 2} more numbers
                          <ChevronDown
                            className={`h-3 w-3 ml-1 transform ${showAllPhones ? "rotate-180" : ""}`}
                          />
                        </button>

                        {showAllPhones && (
                          <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[400px]">
                            <div className="p-2 max-h-48 overflow-y-auto">
                              <div className="text-sm text-gray-500 mb-2 px-2">
                                All phone numbers:
                              </div>
                              {secondaryPhones
                                .slice(2)
                                .map((phone, idx) => (
                                  <div
                                    key={phone.id || idx}
                                    className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-55 rounded gap-2"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                                      <span
                                        className="text-gray-700 text-base whitespace-nowrap"
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
                                          className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-0.5 rounded truncate max-w-[110px] inline-block align-middle"
                                          title={phone.contact_person || "Click to add/edit contact"}
                                        >
                                          {phone.contact_person ||
                                            "Add contact"}
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

            {/* Middle: Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-[300px]">
              {/* 4-in-1 Combined KPI Card */}
              <div className="bg-white border border-slate-200 hover:border-slate-300 p-2 rounded-xl flex flex-col justify-between shadow-sm transition-all duration-200 hover:shadow-md min-w-[130px]">
                <div className="flex justify-between items-center text-[11px] leading-tight">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Calls:</span>
                  <span className="font-extrabold text-slate-800">{summary?.total_calls || 0}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] leading-tight">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Orders:</span>
                  <span className="font-extrabold text-slate-800">{summary?.total_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] leading-tight">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Paid:</span>
                  <span className="font-extrabold text-emerald-600">₹{summary?.total_paid?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] leading-tight">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Pending:</span>
                  <span className="font-extrabold text-amber-600">₹{summary?.total_pending?.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              {/* Language Card */}
              <div ref={languageDropdownRef} className="bg-white border border-slate-200 hover:border-slate-300 p-2 rounded-xl min-w-[120px] relative transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                <div
                  className="flex items-center justify-between h-full"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Language</p>
                    <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">
                      {customer?.language_display || "Not set"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1 transform transition-transform duration-200 ${showLanguageDropdown ? "rotate-180" : ""}`}
                  />
                </div>
                {showLanguageDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto w-auto min-w-full">
                    <div className="p-1">
                      <button
                        onClick={() => handleLanguageSelect(null)}
                        className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors"
                      >
                        Not set
                      </button>
                      {languages?.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => handleLanguageSelect(lang.id)}
                          className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors truncate"
                        >
                          {lang.name}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 my-1"></div>
                      {!showNewLanguageInput ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNewLanguageInput(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          + Add New
                        </button>
                      ) : (
                        <div className="p-1.5 flex flex-col gap-1.5 bg-slate-50 rounded-md" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            placeholder="New Language..."
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800"
                          />
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                setShowNewLanguageInput(false);
                                setNewLanguage("");
                              }}
                              className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-150 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (newLanguage.trim()) {
                                  addLanguageMutation.mutate({ name: newLanguage.trim() });
                                }
                              }}
                              disabled={!newLanguage.trim() || addLanguageMutation.isLoading}
                              className="px-2.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {addLanguageMutation.isLoading ? "..." : "Add"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Community Card */}
              <div ref={communityDropdownRef} className="bg-white border border-slate-200 hover:border-slate-300 p-2 rounded-xl min-w-[120px] relative transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                <div
                  className="flex items-center justify-between h-full"
                  onClick={() => setShowCommunityDropdown(!showCommunityDropdown)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Community</p>
                    <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">
                      {customer?.community_display || "Not set"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1 transform transition-transform duration-200 ${showCommunityDropdown ? "rotate-180" : ""}`}
                  />
                </div>
                {showCommunityDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto w-auto min-w-full">
                    <div className="p-1">
                      <button
                        onClick={() => handleCommunitySelect(null)}
                        className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors"
                      >
                        Not set
                      </button>
                      {communities?.map((comm) => (
                        <button
                          key={comm.id}
                          onClick={() => handleCommunitySelect(comm.id)}
                          className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors truncate"
                        >
                          {comm.name}
                        </button>
                      ))}
                      <div className="border-t border-slate-100 my-1"></div>
                      {!showNewCommunityInput ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowNewCommunityInput(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          + Add New
                        </button>
                      ) : (
                        <div className="p-1.5 flex flex-col gap-1.5 bg-slate-50 rounded-md" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={newCommunity}
                            onChange={(e) => setNewCommunity(e.target.value)}
                            placeholder="New Community..."
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800"
                          />
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => {
                                setShowNewCommunityInput(false);
                                setNewCommunity("");
                              }}
                              className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-150 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (newCommunity.trim()) {
                                  addCommunityMutation.mutate({ name: newCommunity.trim() });
                                }
                              }}
                              disabled={!newCommunity.trim() || addCommunityMutation.isLoading}
                              className="px-2.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {addCommunityMutation.isLoading ? "..." : "Add"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Telecaller Card */}
              <div ref={agentDropdownRef} className="bg-white border border-slate-200 hover:border-slate-300 p-2 rounded-xl min-w-[120px] relative transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                <div
                  className="flex items-center justify-between h-full"
                  onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Telecaller</p>
                    <p className="text-sm font-extrabold text-slate-800 truncate mt-0.5">
                      {(() => {
                        if (!customer?.agent) return "Not assigned";
                        const agentObj = employees?.find(emp => emp.id === customer.agent || emp.id === Number(customer.agent));
                        if (agentObj) {
                          const fullName = `${agentObj.first_name || ""} ${agentObj.last_name || ""}`.trim();
                          return fullName || agentObj.username;
                        }
                        return customer.agent_name || "Not assigned";
                      })()}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1 transform transition-transform duration-200 ${showAgentDropdown ? "rotate-180" : ""
                      }`}
                  />
                </div>
                {showAgentDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-lg z-20 w-[200px] min-w-max">
                    <div className="py-1 overflow-y-auto max-h-48">
                      <button
                        onClick={() => handleAgentSelect(null)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 hover:text-slate-900 text-slate-600 transition-colors"
                      >
                        Not assigned
                      </button>
                      {employees
                        ?.filter((employee) => employee.role === "Telecaller")
                        ?.map((employee) => {
                          const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
                          const displayName = fullName || employee.username;
                          return (
                            <button
                              key={employee.id}
                              onClick={() => handleAgentSelect(employee.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 hover:text-slate-900 text-slate-600 transition-colors truncate"
                              title={displayName}
                            >
                              {displayName} ({employee.role})
                            </button>
                          );
                        })}
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
                    <div className="text-sm text-blue-500 ml-7">Verifying duplicate phone number...</div>
                  )}

                  {addPhoneMutation.isPending && (
                    <div className="text-sm text-blue-500 ml-7">Adding phone number...</div>
                  )}

                  {/* Show error message */}
                  {phoneError && (
                    <div className="text-sm text-red-500 mt-1 ml-7">
                      {phoneError}
                    </div>
                  )}
                </div>
              )}

              {hasPermission('make_calls') && (
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
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
            <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 p-1.5 px-2.5 rounded-xl shadow-sm transition-all duration-200 min-w-0 gap-2">
              <div className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <User className="h-3.5 w-3.5 mr-1 text-slate-400 flex-shrink-0" />
                Org:
              </div>
              <input
                type="text"
                key={customer?.company_name}
                defaultValue={customer?.company_name || ""}
                onChange={handleCapitalizeInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.target.blur();
                  }
                }}
                onBlur={(e) => {
                  const capitalizedValue = capitalizeWords(e.target.value);
                  e.target.value = capitalizedValue;
                  if (capitalizedValue !== (customer?.company_name || "")) {
                    updateMutation.mutate({ company_name: capitalizedValue || null });
                  }
                }}
                placeholder="Not set"
                className="flex-1 w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-all focus:outline-none"
              />
            </div>

            <div ref={orgTypeDropdownRef} className="flex items-center bg-white border border-slate-200 hover:border-slate-300 p-1.5 px-2.5 rounded-xl shadow-sm transition-all duration-200 relative min-w-0 gap-2">
              <div className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <User className="h-3.5 w-3.5 mr-1 text-slate-400 flex-shrink-0" />
                Org Type:
              </div>
              <div
                className="flex-1 flex items-center justify-between cursor-pointer w-full hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-all"
                onClick={() => setShowOrgTypeDropdown(!showOrgTypeDropdown)}
              >
                <span className="truncate">
                  {customer?.company_type_display || "Not set"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 ml-1 flex-shrink-0 transform transition-transform ${showOrgTypeDropdown ? "rotate-180" : ""}`}
                />
              </div>
              {showOrgTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto w-auto min-w-full">
                  <div className="p-1">
                    <button
                      onClick={() => handleOrgTypeSelect(null)}
                      className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors"
                    >
                      Not set
                    </button>
                    {organizationTypes?.map((orgType) => (
                      <button
                        key={orgType.id}
                        onClick={() => handleOrgTypeSelect(orgType.id)}
                        className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors truncate"
                      >
                        {orgType.name}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1"></div>
                    {!showNewOrgTypeInput ? (
                      <button
                        onClick={() => setShowNewOrgTypeInput(true)}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        + Add New
                      </button>
                    ) : (
                      <div className="p-1.5 flex flex-col gap-1.5 bg-slate-50 rounded-md">
                        <input
                          type="text"
                          value={newOrgType}
                          onChange={(e) => setNewOrgType(e.target.value)}
                          placeholder="New Org Type..."
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800"
                        />
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setShowNewOrgTypeInput(false);
                              setNewOrgType("");
                            }}
                            className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-150 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (newOrgType.trim()) {
                                addOrgTypeMutation.mutate({ name: newOrgType.trim() });
                              }
                            }}
                            disabled={!newOrgType.trim() || addOrgTypeMutation.isLoading}
                            className="px-2.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {addOrgTypeMutation.isLoading ? "..." : "Add"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={customerTypeDropdownRef} className="flex items-center bg-white border border-slate-200 hover:border-slate-300 p-1.5 px-2.5 rounded-xl shadow-sm transition-all duration-200 relative min-w-0 gap-2">
              <div className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <User className="h-3.5 w-3.5 mr-1 text-slate-400 flex-shrink-0" />
                Cust Type:
              </div>
              <div
                className="flex-1 flex items-center justify-between cursor-pointer w-full hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-all"
                onClick={() =>
                  setShowCustomerTypeDropdown(!showCustomerTypeDropdown)
                }
              >
                <span className="truncate">
                  {customerTypes.find((t) => t.id === customer?.customer_type)?.name || "Not set"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 ml-1 flex-shrink-0 transform transition-transform ${showCustomerTypeDropdown ? "rotate-180" : ""}`}
                />
              </div>
              {showCustomerTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-100 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto w-auto min-w-full">
                  <div className="p-1">
                    <button
                      onClick={() => handleCustomerTypeSelect("")}
                      className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors"
                    >
                      Not set
                    </button>
                    {customerTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleCustomerTypeSelect(type.id)}
                        className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-slate-50 rounded text-slate-600 transition-colors truncate"
                      >
                        {type.name}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 my-1"></div>
                    {!showNewCustomerTypeInput ? (
                      <button
                        onClick={() => setShowNewCustomerTypeInput(true)}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        + Add New
                      </button>
                    ) : (
                      <div className="p-1.5 flex flex-col gap-1.5 bg-slate-50 rounded-md">
                        <input
                          type="text"
                          value={newCustomerType}
                          onChange={(e) => setNewCustomerType(e.target.value)}
                          placeholder="New Cust Type..."
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800"
                        />
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setShowNewCustomerTypeInput(false);
                              setNewCustomerType("");
                            }}
                            className="px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-150 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (newCustomerType.trim()) {
                                addCustomerTypeMutation.mutate({ name: newCustomerType.trim() });
                              }
                            }}
                            disabled={!newCustomerType.trim() || addCustomerTypeMutation.isLoading}
                            className="px-2.5 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {addCustomerTypeMutation.isLoading ? "..." : "Add"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>



            <div
              onClick={() => {
                if (!hasPermission('manage_appointments')) return;
                try {
                  dateInputRef.current?.showPicker();
                } catch (err) {
                  console.error("showPicker not supported or failed", err);
                }
              }}
              className={`flex items-center bg-white border border-slate-200 hover:border-slate-300 p-1.5 px-2.5 rounded-xl shadow-sm transition-all duration-200 min-w-0 gap-2 ${
                hasPermission('manage_appointments') ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
            >
              <div className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400 flex-shrink-0" />
                Date:
              </div>
              <input
                ref={dateInputRef}
                type="date"
                value={appointmentDate}
                disabled={!hasPermission('manage_appointments')}
                onChange={(e) => {
                  const val = e.target.value;
                  setAppointmentDate(val);
                  updateMutation.mutate({ appointment_date: val || null });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasPermission('manage_appointments')) return;
                  try {
                    dateInputRef.current?.showPicker();
                  } catch (err) {
                    console.error("showPicker failed", err);
                  }
                }}
                className={`flex-1 w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-all focus:outline-none ${
                  hasPermission('manage_appointments') ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              />
              {appointmentDate && hasPermission('manage_appointments') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAppointmentDate("");
                    setAppointmentTime("");
                    updateMutation.mutate({
                      appointment_date: null,
                      appointment_time: null
                    });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10 flex-shrink-0"
                  title="Clear Date"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div
              onClick={() => {
                if (!hasPermission('manage_appointments')) return;
                try {
                  timeInputRef.current?.showPicker();
                } catch (err) {
                  console.error("showPicker not supported or failed", err);
                }
              }}
              className={`flex items-center bg-white border border-slate-200 hover:border-slate-300 p-1.5 px-2.5 rounded-xl shadow-sm transition-all duration-200 min-w-0 gap-2 ${
                hasPermission('manage_appointments') ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
              }`}
            >
              <div className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <svg
                  className="h-3.5 w-3.5 mr-1 text-slate-400 flex-shrink-0"
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
                Time:
              </div>
              <input
                ref={timeInputRef}
                type="time"
                value={appointmentTime}
                disabled={!hasPermission('manage_appointments')}
                onChange={(e) => {
                  const val = e.target.value;
                  setAppointmentTime(val);
                  updateMutation.mutate({ appointment_time: val || null });
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!hasPermission('manage_appointments')) return;
                  try {
                    timeInputRef.current?.showPicker();
                  } catch (err) {
                    console.error("showPicker failed", err);
                  }
                }}
                className={`flex-1 w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-all focus:outline-none ${
                  hasPermission('manage_appointments') ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              />
              {appointmentTime && hasPermission('manage_appointments') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAppointmentTime("");
                    updateMutation.mutate({ appointment_time: null });
                  }}
                  className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10 flex-shrink-0"
                  title="Clear Time"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-white border border-slate-200 hover:border-slate-300 p-1.5 px-2.5 rounded-xl shadow-sm transition-all duration-200 min-w-0 gap-2">
              <div className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                <span className="truncate">GST:</span>
              </div>
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={(() => {
                    if (tempGstinValue !== null) {
                      return formatGstinWithDashes(tempGstinValue);
                    }
                    return customer?.gstin_no ? formatGstinWithDashes(customer?.gstin_no) : "";
                  })()}
                  onChange={(e) => {
                    let rawValue = e.target.value.replace(/-/g, "").toUpperCase();
                    if (rawValue.length > 15) {
                      rawValue = rawValue.slice(0, 15);
                    }
                    setTempGstinValue(rawValue);
                    if (rawValue.length > 0 && rawValue.length < 15) {
                      setGstinError("GSTIN must be 15 characters");
                    } else if (rawValue.length === 15) {
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
                  className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent focus:border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-800 transition-all focus:outline-none"
                />
                {gstinError && (
                  <span className="absolute top-full left-0 text-red-500 text-sm font-bold mt-0.5 whitespace-nowrap z-10">
                    {gstinError}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white rounded-xl border border-slate-100 hover:border-slate-200/80 shadow-sm p-1.5 transition-all duration-200 mt-1">
            <div className="grid grid-cols-10 gap-2">
              {/* House No */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  House No
                </label>
                <input
                  type="text"
                  defaultValue={customer?.house_flat_no || ""}
                  title={customer?.house_flat_no || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.house_flat_no || "")) {
                      updateMutation.mutate({
                        house_flat_no: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Wing/Lane */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Wing/Lane
                </label>
                <input
                  type="text"
                  defaultValue={customer?.wing_lane || ""}
                  title={customer?.wing_lane || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.wing_lane || "")) {
                      updateMutation.mutate({
                        wing_lane: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Society/Colony */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Society/Colony
                </label>
                <input
                  type="text"
                  defaultValue={customer?.society_colony || ""}
                  title={customer?.society_colony || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.society_colony || "")) {
                      updateMutation.mutate({
                        society_colony: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Landmark
                </label>
                <input
                  type="text"
                  defaultValue={customer?.landmark || ""}
                  title={customer?.landmark || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.landmark || "")) {
                      updateMutation.mutate({
                        landmark: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Area
                </label>
                <input
                  type="text"
                  defaultValue={customer?.area || ""}
                  title={customer?.area || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.area || "")) {
                      updateMutation.mutate({
                        area: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  defaultValue={customer?.pincode || ""}
                  title={customer?.pincode || ""}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
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
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  defaultValue={customer?.city || ""}
                  title={customer?.city || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.city || "")) {
                      updateMutation.mutate({
                        city: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* Tahsil */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tahsil
                </label>
                <input
                  type="text"
                  defaultValue={customer?.tahsil || ""}
                  title={customer?.tahsil || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.tahsil || "")) {
                      updateMutation.mutate({
                        tahsil: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  defaultValue={customer?.district || ""}
                  title={customer?.district || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.district || "")) {
                      updateMutation.mutate({
                        district: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  defaultValue={customer?.state || ""}
                  title={customer?.state || ""}
                  onChange={handleCapitalizeInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                  onBlur={(e) => {
                    const capitalizedValue = capitalizeWords(e.target.value);
                    e.target.value = capitalizedValue;
                    if (capitalizedValue !== (customer?.state || "")) {
                      updateMutation.mutate({
                        state: capitalizedValue || null,
                      });
                    }
                  }}
                  placeholder="-"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 rounded-lg text-sm font-semibold text-slate-700 w-full transition-all duration-200 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conversation history - EXACTLY as you had it, just fixed the logic */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
          {/* Left container - Conversation History (60%) */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-2 h-96 lg:h-[600px] xl:h-[700px] flex flex-col">
            {/* Frozen Header */}
            <div className="flex-none flex items-center justify-between border-b border-gray-100 pb-1">
              <div className="flex items-center">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-2.5">
                  <svg
                    className="w-5 h-5 text-white"
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
                  <h2 className="text-lg font-bold text-gray-900">
                    Conversation History
                  </h2>
                </div>
              </div>
              {hasPermission('make_calls') && callLogs.length > 0 &&
                callLogs[0]?.date &&
                new Date() - new Date(callLogs[0].date) <
                24 * 60 * 60 * 1000 && (
                  <button
                    onClick={handleEditLastCall}
                    className="inline-flex items-center px-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md shadow-blue-500/20 text-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Last Call
                  </button>
                )}
            </div>

            {/* Scrollable Body Container */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-1">
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

                      return (
                        <div key={index} className="flex items-start mb-1 leading-relaxed text-lg">
                          {/* Left Column: Date */}
                          <div className="w-[110px] flex-shrink-0 whitespace-nowrap">
                            <span className="text-gray-900 font-bold">{formattedDate}</span>
                            <span className="text-gray-400"> | </span>
                          </div>

                          {/* Right Column: Details & Notes (all wrap beautifully here) */}
                          <div className="flex-1 min-w-0 break-words">
                            <span className="text-gray-900 font-semibold">{formattedTime}</span>
                            <span className="text-gray-400"> | </span>
                            <span className="text-blue-600 font-medium">
                              {formatDuration(call.duration_minutes)}
                            </span>

                            {call.employee_name && (
                              <>
                                <span className="text-gray-400"> | </span>
                                <span className="text-indigo-600 font-medium">
                                  {call.employee_name}
                                </span>
                              </>
                            )}

                            {call.order_placed === "Yes" && (
                              <>
                                <span className="text-gray-400"> | </span>
                                <span className="text-emerald-600 font-medium">
                                  Order Placed
                                </span>
                              </>
                            )}

                            {call.order_id && (
                              <>
                                <span className="text-gray-400"> | </span>
                                <span className="text-blue-600 font-medium underline">
                                  {call.order_id}
                                </span>
                              </>
                            )}

                            {call.assumption_names && call.assumption_names.length > 0 && (
                              <>
                                <span className="text-gray-400"> | </span>
                                {call.assumption_names.map((name, idx) => (
                                  <span key={`assumption-${idx}`} className="text-red-600 font-medium">
                                    {idx > 0 ? `, ${name}` : name}
                                  </span>
                                ))}
                              </>
                            )}

                            {call.assumption2_names && call.assumption2_names.length > 0 && (
                              <>
                                <span className="text-gray-400"> | </span>
                                {call.assumption2_names.map((name, idx) => (
                                  <span key={`assumption2-${idx}`} className="text-purple-600 font-medium">
                                    {idx > 0 ? `, ${name}` : name}
                                  </span>
                                ))}
                              </>
                            )}

                            {call.assumption3_names && call.assumption3_names.length > 0 && (
                              <>
                                <span className="text-gray-400"> | </span>
                                {call.assumption3_names.map((name, idx) => (
                                  <span key={`assumption3-${idx}`} className="text-green-600 font-medium">
                                    {idx > 0 ? `, ${name}` : name}
                                  </span>
                                ))}
                              </>
                            )}

                            <span className="text-gray-400"> | </span>
                            <span className="text-gray-700 whitespace-pre-wrap">
                              {call.note || "No notes provided"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Right container - Order History (40%) - Keep exactly as you had */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-2 h-96 lg:h-[600px] xl:h-[700px] flex flex-col">
            {/* Order History Section - Fixed at top */}
            <div className="flex-none">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg mr-2.5">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <h2 className="text-lg font-bold text-gray-900">
                    Order History
                  </h2>
                </div>
                <div className="text-sm text-gray-500 font-medium">
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
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        PayStatus
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
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
                              className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                            >
                              {order.order_id || `ORD-${order.id}`}
                            </Link>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-sm">
                            {new Date(order.order_date).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap">
                            <span
                              className={`inline-flex px-1.5 py-0.5 text-sm font-semibold rounded-full ${order.status === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Dispatched"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-sm">
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
                          <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-sm">
                            {order.payment_status}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-sm">
                            ₹{Math.round(parseFloat(order.total_amount || 0)).toLocaleString()}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-sm">
                            ₹{Math.round(parseFloat(order.paid_amount || 0)).toLocaleString()}
                          </td>
                          <td className="px-2 py-1 whitespace-nowrap text-gray-900 font-medium text-sm">
                            ₹{Math.round(parseFloat(order.total_amount || 0) - parseFloat(order.paid_amount || 0)).toLocaleString()}
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
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Notes
                            </th>
                            <th className="px-2 py-1 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            {/* Only show Actions column for admin */}
                            {isAdmin && (
                              <th className="px-2 py-1 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
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
                            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Employee
                            </th>
                            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-2 py-1 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
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
                                <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-sm">
                                  {new Date(call.date).toLocaleDateString()}
                                  <br />
                                  <span className="text-gray-500 text-sm">
                                    {new Date(call.date).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-sm">
                                  {call.employee_name || "Unknown"}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-gray-900 text-sm">
                                  {formatDuration(call.duration_minutes)}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-1.5 py-0.5 text-sm font-semibold rounded-full ${call.status === "Completed"
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
