import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import { useState, useEffect, useRef } from "react";
import { fetchCustomerTypes, addCustomerType } from "../api/customerTypes";
import { useCallPopup } from "../context/CallPopupContext";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  User,
  UserCheck,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Filter,
  Grid,
  List,
  Star,
  TrendingUp,
  Users,
  Building,
  AlertCircle,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Download,
} from "lucide-react";

const CustomerList = () => {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [viewType, setViewType] = useState("customers"); // Default to 'customers' instead of 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentValue, setAppointmentValue] = useState("");
  const [editingTime, setEditingTime] = useState(null);
  const [timeValue, setTimeValue] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    surname: "",
    phone: "",
    email: "",
    company_name: "",
    company_type: "",
    customer_type: "",
    pincode: "",
    house_flat_no: "",
    wing_lane: "",
    society_colony: "",
    landmark: "",
    area: "",
    state: "",
    district: "",
    tahsil: "",
    city: "",
  });
  const [showNewCustomerTypeInput, setShowNewCustomerTypeInput] =
    useState(false);
  const [newCustomerType, setNewCustomerType] = useState("");
  const [customerTypes, setCustomerTypes] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch customer types from backend
  useEffect(() => {
    fetchCustomerTypes()
      .then((data) => setCustomerTypes(data))
      .catch(() => setCustomerTypes([]));
  }, []);

  // Mutation for adding new customer type
  const [addCustomerTypeLoading, setAddCustomerTypeLoading] = useState(false);
  const handleAddCustomerType = async () => {
    if (!newCustomerType.trim()) return;
    setAddCustomerTypeLoading(true);
    try {
      const data = await addCustomerType({ name: newCustomerType.trim() });
      setCustomerTypes((prev) => [...prev, data]);
      setNewContact({ ...newContact, customer_type: data.id });
      setShowNewCustomerTypeInput(false);
      setNewCustomerType("");
      alert("Customer type added successfully!");
    } catch (e) {
      alert("Failed to add customer type");
    } finally {
      setAddCustomerTypeLoading(false);
    }
  };
  const [phoneError, setPhoneError] = useState("");
  const [phoneExists, setPhoneExists] = useState(false);
  const [showNewOrgTypeInput, setShowNewOrgTypeInput] = useState(false);
  const [newOrgType, setNewOrgType] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");
  const { openPopup } = useCallPopup();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const phoneInputRef = useRef(null);

  const {
    data: customersData,
    isLoading: customersLoading,
    error: customersError,
  } = useQuery({
    queryKey: [
      "customers",
      viewType,
      dateFrom,
      dateTo,
      currentPage,
      pageSize,
      search,
      filterAgent,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("page_size", pageSize);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (search) params.append("search", search);
      if (filterAgent) params.append("agent", filterAgent);

      // Only add contact_type filter when NOT searching
      if (!search) {
        if (viewType === "customers") {
          params.append("contact_type", "Customer");
        } else if (viewType === "leads") {
          params.append("contact_type", "Lead");
        }
      }
      // If searching, do NOT add contact_type (show both)

      const response = await axios.get(`api/customers/?${params.toString()}`);
      return response.data;
    },
  });

  const { data: organizationTypes } = useQuery({
    queryKey: ["organizationTypes"],
    queryFn: () => axios.get("/api/organizationtypes/").then((res) => res.data),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => axios.get("/api/users/employees/").then((res) => res.data),
  });

  // Query to check if phone number exists
  const { data: phoneCheckData, isLoading: phoneCheckLoading } = useQuery({
    queryKey: ["phoneCheck", newContact.phone],
    queryFn: async () => {
      if (newContact.phone.length >= 10) {
        const response = await axios.get(
          `/api/customers/?phone=${newContact.phone}&page_size=1`,
        );
        return response.data;
      }
      return null;
    },
    enabled: newContact.phone.length >= 10,
  });

  const data = customersData;
  const isLoading = customersLoading;
  const error = customersError;

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Extract unique agents for filter
  const agents = [
    ...new Set(
      data?.results?.map((customer) => customer.agent_name).filter(Boolean),
    ),
  ];

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterAgent, dateFrom, dateTo, viewType, pageSize]);

  // Auto-close success message after 1 second
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-close error message after 3 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Update phone error based on phone length
  useEffect(() => {
    if (newContact.phone.length > 0 && newContact.phone.length < 10) {
      setPhoneError("Phone number must be at least 10 digits");
    } else if (newContact.phone.length === 0) {
      setPhoneError("");
    }
  }, [newContact.phone]);

  // Update phone error based on phoneCheckData
  useEffect(() => {
    if (newContact.phone.length >= 10) {
      if (phoneCheckLoading) {
        setPhoneError("Checking phone number...");
      } else if (phoneCheckData && phoneCheckData.count > 0) {
        setPhoneError("Phone number already exists");
      } else {
        setPhoneError("");
      }
    }
  }, [newContact.phone, phoneCheckData, phoneCheckLoading]);

  // Focus phone input when form is shown
  useEffect(() => {
    if (showAddForm && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, [showAddForm]);

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      // Keep focus on search input after debounce
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 500); // Wait 500ms after user stops typing before searching
  };

  // Handle search on Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Clear any pending timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Search immediately
      setSearch(searchInput);
    }
  };

  // Use paginated data from server
  let customers = data?.results || [];
  // Sort customers by appointment_date ascending, then by appointment_time:
  // For the same date, customers with a set time come first (ascending), then those with no time.
  customers = customers.slice().sort((a, b) => {
    const dateA = a.appointment_date || '';
    const dateB = b.appointment_date || '';
    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    // If dates are equal, sort by time: set times first, then unset
    const timeA = a.appointment_time;
    const timeB = b.appointment_time;
    if (timeA && timeB) {
      if (timeA < timeB) return -1;
      if (timeA > timeB) return 1;
      return 0;
    }
    if (timeA && !timeB) return -1; // a has time, b does not
    if (!timeA && timeB) return 1;  // b has time, a does not
    return 0;
  });
  // Enhanced search: filter on name, surname, phone, company_name, company_type, all address fields, and pincode
  const lowerSearch = search.toLowerCase();
  const customersFiltered = customers.filter((customer) => {
    // List all fields to search, and include all phone numbers (primary and additional)
    const allPhones = [customer.phone, ...(customer.phones ? customer.phones.map(p => p.phone) : [])];
    const fieldsToSearch = [
      customer.name,
      customer.surname,
      customer.company_name,
      customer.company_type,
      customer.company_type_name,
      customer.pincode,
      customer.house_flat_no,
      customer.wing_lane,
      customer.society_colony,
      customer.landmark,
      customer.area,
      customer.state,
      customer.district,
      customer.tahsil,
      customer.city,
      customer.email,
      // Do not include customer.phone here, as allPhones covers it
    ];
    // Check if any field matches, or any phone matches
    return (
      fieldsToSearch.some(
        (field) => field && field.toString().toLowerCase().includes(lowerSearch)
      ) ||
      allPhones.some(
        (phone) => phone && phone.toString().toLowerCase().includes(lowerSearch)
      )
    );
  });
  const totalPages = Math.ceil((data?.count || 0) / pageSize);

  // Calculate stats
  const totalCustomers = data?.count || 0;
  const totalOrderValue = customers.reduce(
    (sum, customer) => sum + (customer.total_order_value || 0),
    0,
  );
  const activeAgents = new Set(
    customers.map((customer) => customer.agent_name).filter(Boolean),
  ).size;
  const avgOrderValue =
    customers.length > 0 ? totalOrderValue / customers.length : 0;

  // Calculate customers with outstanding payments
  const customersWithOutstanding = customers.filter(
    (customer) =>
      customer.contact_type === "Customer" &&
      customer.outstanding_amount &&
      customer.outstanding_amount > 0,
  ).length;

  const handleCall = (customer) => {
    setSelectedCustomer(customer);
    openPopup(customer);
  };

  // Mutation for updating appointment date
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, appointment_date }) => {
      const response = await axios.patch(`/api/customers/${id}/`, {
        appointment_date,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setEditingAppointment(null);
      setAppointmentValue("");
    },
    onError: (error) => {
      console.error("Error updating appointment date:", error);
      alert("Failed to update appointment date");
    },
  });

  // Mutation for updating appointment time
  const updateTimeMutation = useMutation({
    mutationFn: async ({ id, appointment_time }) => {
      const response = await axios.patch(`/api/customers/${id}/`, {
        appointment_time,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setEditingTime(null);
      setTimeValue("");
    },
    onError: (error) => {
      console.error("Error updating appointment time:", error);
      alert("Failed to update appointment time");
    },
  });

  const handleEditAppointment = (customer) => {
    setEditingAppointment(customer.id);
    const date = customer.appointment_date || customer.created_at;
    setAppointmentValue(date ? new Date(date).toISOString().split("T")[0] : "");
  };

  const handleSaveAppointment = () => {
    if (editingAppointment) {
      updateAppointmentMutation.mutate({
        id: editingAppointment,
        appointment_date: appointmentValue || null,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
    setAppointmentValue("");
  };

  const handleEditTime = (customer) => {
    setEditingTime(customer.id);
    setTimeValue(customer.appointment_time || "");
  };

  const handleSaveTime = () => {
    if (editingTime) {
      updateTimeMutation.mutate({
        id: editingTime,
        appointment_time: timeValue || null,
      });
    }
  };

  const handleCancelTimeEdit = () => {
    setEditingTime(null);
    setTimeValue("");
  };

  // Mutation for adding new organization type
  const addOrgTypeMutation = useMutation({
    mutationFn: async (orgTypeData) => {
      const response = await axios.post("/api/organizationtypes/", orgTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["organizationTypes"]);
      setNewContact({ ...newContact, company_type: data.name });
      setNewOrgType("");
      setShowNewOrgTypeInput(false);
      alert("Organization type added successfully!");
    },
    onError: (error) => {
      console.error("Error adding organization type:", error);
      alert("Failed to add organization type");
    },
  });

  // Mutation for adding new customer
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData) => {
      const response = await axios.post("/api/customers/", customerData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setSuccessMessage("Customer added successfully!");
      setNewContact({
        name: "",
        surname: "",
        phone: "",
        email: "",
        company_name: "",
        company_type: "",
        pincode: "",
        house_flat_no: "",
        wing_lane: "",
        society_colony: "",
        landmark: "",
        area: "",
        state: "",
        district: "",
        tahsil: "",
        city: "",
      });
      setShowNewOrgTypeInput(false);
      setNewOrgType("");
      // Focus and select phone input after successful addition
      setTimeout(() => {
        if (phoneInputRef.current) {
          phoneInputRef.current.focus();
          phoneInputRef.current.select();
        }
      }, 100);
    },
    onError: (error) => {
      console.error("Error adding customer:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.phone?.[0] ||
        "Failed to add customer";
      setErrorMessage(errorMessage);
    },
  });

  const handleAddCustomer = () => {
    if (!newContact.phone) {
      alert("Phone is required");
      return;
    }
    if (newContact.phone.length < 10) {
      alert("Phone number must be at least 10 digits");
      return;
    }
    addCustomerMutation.mutate(newContact);
  };

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ customer_ids, agent_id }) => {
      const response = await axios.post("/api/customers/bulk_assign/", {
        customer_ids,
        agent_id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["customers"]);
      setSelectedCustomers([]);
      setShowAssignmentModal(false);
      setSelectedAgent("");
      setSuccessMessage(
        `Successfully assigned ${data.updated_count} customers`,
      );
    },
    onError: (error) => {
      console.error("Error bulk assigning customers:", error);
      setErrorMessage("Failed to assign customers");
    },
  });

  // Selection handlers
  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId],
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((customer) => customer.id));
    }
  };

  const handleBulkAssign = () => {
    if (selectedCustomers.length === 0) {
      alert("Please select customers to assign");
      return;
    }
    if (!selectedAgent) {
      alert("Please select an agent");
      return;
    }
    bulkAssignMutation.mutate({
      customer_ids: selectedCustomers,
      agent_id: selectedAgent,
    });
  };

  // Individual assignment handler
  const handleIndividualAssign = (customer) => {
    setSelectedCustomers([customer.id]);
    setShowAssignmentModal(true);
  };

  // Excel export handler
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (search) params.append("search", search);
      if (filterAgent) params.append("agent", filterAgent);
      if (viewType === "customers") params.append("contact_type", "Customer");
      if (viewType === "leads") params.append("contact_type", "Lead");

      const response = await axios.get(`/api/customers/export_excel/?${params.toString()}`);
      const { customers: customersData } = response.data;

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(customersData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `customers_export_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Failed to export customers data");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading customers...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
            Error Loading Customers
          </h2>
          <p className="text-gray-600 text-center mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );

  console.log("User in CustomerList:", user);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers & Leads</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            title="Download Excel"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customers & leads by name, email, phone, or ID..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
            {/* Show search indicator */}
            {searchInput !== search && searchInput && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Date From Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="From Date"
            />
          </div>

          {/* Date To Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="To Date"
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setFilterAgent("");
              setDateFrom("");
              setDateTo("");
            }}
            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200 flex items-center gap-2"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
            Clear
          </button>

          {/* Page Size Dropdown */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
            >
              <option value={15}>15 per page</option>
              <option value={30}>30 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* View Toggle - Updated to include "All" option */}
          <div className="flex gap-2">
            {/* <button
              onClick={() => {
                setViewType("all");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition duration-200 ${
                viewType === "all"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="View All (Customers & Leads)"
            >
              All
            </button> */}
            <button
              onClick={() => {
                setViewType("customers");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition duration-200 ${
                viewType === "customers"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="View Only Customers"
            >
              Customers
            </button>
            <button
              onClick={() => {
                setViewType("leads");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition duration-200 ${
                viewType === "leads"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="View Only Leads"
            >
              Leads
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-3 rounded-lg transition duration-200 ${
                viewMode === "table"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="Table View"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-3 rounded-lg transition duration-200 ${
                viewMode === "card"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="Card View"
            >
              <Grid className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCustomers}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Order Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalOrderValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Telecallers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeAgents}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Order Value</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(avgOrderValue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Outstanding Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customersWithOutstanding}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                ref={phoneInputRef}
                type="text"
                value={newContact.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numeric input
                  if (value && !/^\d*$/.test(value)) {
                    return; // Don't update if non-numeric
                  }
                  if (value.length > 10) {
                    return; // Don't allow more than 10 digits
                  }
                  setNewContact({ ...newContact, phone: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phone number"
                maxLength="10"
              />
              {phoneError && (
                <p className="mt-1 text-sm text-red-600">{phoneError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Name
              </label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surname
              </label>
              <input
                type="text"
                value={newContact.surname}
                onChange={(e) =>
                  setNewContact({ ...newContact, surname: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Customer surname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={newContact.company_name}
                onChange={(e) =>
                  setNewContact({ ...newContact, company_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Organization name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type
              </label>
              <select
                value={
                  showNewOrgTypeInput ? "add_new" : newContact.company_type
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "add_new") {
                    setShowNewOrgTypeInput(true);
                    setNewContact({ ...newContact, company_type: "" });
                  } else {
                    setNewContact({ ...newContact, company_type: value });
                    setShowNewOrgTypeInput(false);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Organization Type</option>
                {organizationTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
                <option value="add_new">Add New</option>
              </select>
              {showNewOrgTypeInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New organization type"
                  />
                  <button
                    onClick={() => {
                      if (newOrgType.trim()) {
                        addOrgTypeMutation.mutate({ name: newOrgType.trim() });
                      }
                    }}
                    disabled={
                      addOrgTypeMutation.isLoading || !newOrgType.trim()
                    }
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {addOrgTypeMutation.isLoading ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewOrgTypeInput(false);
                      setNewOrgType("");
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type
              </label>
              <select
                value={
                  showNewCustomerTypeInput
                    ? "add_new"
                    : newContact.customer_type
                }
                onChange={(e) => {
                  if (e.target.value === "add_new") {
                    setShowNewCustomerTypeInput(true);
                  } else {
                    // Always store as number or empty string
                    setNewContact({
                      ...newContact,
                      customer_type: e.target.value
                        ? Number(e.target.value)
                        : "",
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Customer Type</option>
                {customerTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
                <option value="add_new">Add New</option>
              </select>
              {showNewCustomerTypeInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCustomerType}
                    onChange={(e) => setNewCustomerType(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="New customer type"
                  />
                  <button
                    onClick={handleAddCustomerType}
                    disabled={addCustomerTypeLoading || !newCustomerType.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {addCustomerTypeLoading ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCustomerTypeInput(false);
                      setNewCustomerType("");
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={newContact.pincode}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d*$/.test(value)) {
                    alert("Only numbers are allowed in pincode field");
                    return;
                  }
                  if (value.length > 6) {
                    alert("Pincode must be exactly 6 digits");
                    return;
                  }
                  setNewContact({ ...newContact, pincode: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pincode"
                maxLength="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House/Flat No
              </label>
              <input
                type="text"
                value={newContact.house_flat_no}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    house_flat_no: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="House/Flat number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wing/Lane
              </label>
              <input
                type="text"
                value={newContact.wing_lane}
                onChange={(e) =>
                  setNewContact({ ...newContact, wing_lane: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Wing/Lane"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Society/Colony
              </label>
              <input
                type="text"
                value={newContact.society_colony}
                onChange={(e) =>
                  setNewContact({
                    ...newContact,
                    society_colony: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Society/Colony"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark
              </label>
              <input
                type="text"
                value={newContact.landmark}
                onChange={(e) =>
                  setNewContact({ ...newContact, landmark: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Landmark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                value={newContact.area}
                onChange={(e) =>
                  setNewContact({ ...newContact, area: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Area"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={newContact.city}
                onChange={(e) =>
                  setNewContact({ ...newContact, city: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                value={newContact.district}
                onChange={(e) =>
                  setNewContact({ ...newContact, district: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="District"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={newContact.state}
                onChange={(e) =>
                  setNewContact({ ...newContact, state: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="State"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddCustomer}
                disabled={addCustomerMutation.isLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {addCustomerMutation.isLoading ? "Adding..." : "Add Customer"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {user?.role === "Admin" && (
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={
                          selectedCustomers.length === customers.length &&
                          customers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Org Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Org Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Telecaller
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Appointment Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
                {selectedCustomers.length > 0 && user?.role === "Admin" && (
                  <tr className="bg-blue-50">
                    <td colSpan="10" className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedCustomers.length} contact
                          {selectedCustomers.length > 1 ? "s" : ""} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowAssignmentModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                          >
                            <UserCheck className="h-4 w-4" />
                            Assign to Telecaller
                          </button>
                          <button
                            onClick={() => setSelectedCustomers([])}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition duration-150 cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    {/* Checkbox column */}
                    {user?.role === "Admin" && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(customer.id);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {customer.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {customer.name?.charAt(0)?.toUpperCase() +
                              customer.name?.slice(1) || "Unknown"}
                          </Link>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              customer.contact_type === "Customer"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {customer.contact_type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.company_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {customer.company_type_display || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.all_phones && customer.all_phones.length > 0 ? (
                          customer.all_phones.map((phoneObj, index) => (
                            <div
                              key={index}
                              className="flex items-center text-sm text-gray-900"
                            >
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              <Link
                                to={`/customers/${phoneObj.id}`}
                                className={`hover:text-blue-800 transition-colors ${
                                  phoneObj.phone === customer.phone
                                    ? "font-semibold text-blue-600"
                                    : "text-gray-900"
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {phoneObj.phone}
                                {phoneObj.phone === customer.phone && " (Primary)"}
                              </Link>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 group">
                      <div className="text-sm text-gray-900 max-w-36 overflow-hidden">
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide hover:scrollbar-default transition-all duration-200">
                          {(() => {
                            const addressParts = [
                              customer.house_flat_no,
                              customer.wing_lane,
                              customer.society_colony,
                              customer.landmark,
                              customer.area,
                              customer.city,
                              customer.district,
                              customer.state,
                              customer.pincode,
                            ].filter(Boolean);

                            if (addressParts.length === 0) {
                              return <span className="text-gray-500">No address</span>;
                            }

                            return (
                              <div className="min-w-max">
                                {addressParts.join(", ")}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <User className="h-3 w-3 mr-1" />
                        {customer.agent_name || "Unassigned"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingAppointment === customer.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={appointmentValue}
                            onChange={(e) => setAppointmentValue(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveAppointment}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Save"
                            disabled={updateAppointmentMutation.isLoading}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.appointment_date
                              ? new Date(customer.appointment_date).toLocaleDateString()
                              : new Date(customer.created_at).toLocaleDateString()}
                          </div>
                          <button
                            onClick={() => handleEditAppointment(customer)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded ml-2"
                            title="Edit Appointment Date"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingTime === customer.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={timeValue}
                            onChange={(e) => setTimeValue(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveTime}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Save"
                            disabled={updateTimeMutation.isLoading}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelTimeEdit}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-900">
                            {customer.appointment_time || "No time set"}
                          </div>
                          <button
                            onClick={() => handleEditTime(customer)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded ml-2"
                            title="Edit Appointment Time"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="View Details"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/customers/edit/${customer.id}`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                          title="Edit Customer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(customer);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition duration-200"
                          title="Call Customer"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualAssign(customer);
                          }}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition duration-200"
                          title="Assign to Agent"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 z-10 relative">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, data?.count || 0)}
                    </span>{" "}
                    of <span className="font-medium">{data?.count || 0}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {/* Smart pagination with ellipsis */}
                    {totalPages > 7 ? (
                      <>
                        <button
                          key={1}
                          onClick={() => setCurrentPage(1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === 1 ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                        >1</button>
                        {currentPage > 4 && <span className="px-2">...</span>}
                        {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                          .filter(page => page > 1 && page < totalPages)
                          .map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                            >{page}</button>
                          ))}
                        {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                        <button
                          key={totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === totalPages ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                        >{totalPages}</button>
                      </>
                    ) : (
                      Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage ? "z-10 bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"}`}
                        >{page}</button>
                      ))
                    )}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {customers.length === 0 && (
            <div className="py-16 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No contacts found
              </h3>
              <p className="text-gray-600 mb-6">
                {search ? "No results match your search criteria" : "Try adjusting your filters"}
              </p>
              <Link
                to="/customers/new"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Card Header with Avatar */}
              <div className="bg-white p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-white font-bold text-xl">
                      {customer.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {customer.name?.charAt(0)?.toUpperCase() +
                        customer.name?.slice(1) || "Unknown"}
                    </h3>
                    <p className="text-gray-600 text-sm">ID: {customer.id}</p>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        customer.contact_type === "Customer"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {customer.contact_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="truncate">
                        {customer.email || "No email"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{customer.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span>{customer.pincode}</span>
                    </div>
                  </div>

                  {/* Agent Badge */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <User className="h-3 w-3 mr-1" />
                      {customer.agent_name || "Unassigned"}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(customer.total_order_value)}
                    </span>
                  </div>

                  {/* Join Date */}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-2" />
                    Joined {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-2">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                  <Link
                    to={`/customers/edit/${customer.id}`}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </div>

                {/* Call Button */}
                <button
                  onClick={() => handleCall(customer)}
                  className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </button>
              </div>
            </div>
          ))}

          {/* Empty State for Cards */}
          {customers.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No contacts found
              </h3>
              <p className="text-gray-600 mb-6">
                {search ? "No results match your search criteria" : "Try adjusting your filters"}
              </p>
              <Link
                to="/customers/new"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign Customers to Agent
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an agent...</option>
                {employees?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} (
                    {employee.username})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={bulkAssignMutation.isLoading || !selectedAgent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {bulkAssignMutation.isLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;