import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchCustomerTypes, addCustomerType } from "../api/customerTypes";
import { useCallPopup } from "../context/CallPopupContext";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Eye,
  Edit,
  Grid,
  List,
  Download,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Users,
  AlertCircle,
  Filter,
  UserCircle,
} from "lucide-react";

const CustomerList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search states (auto-apply) - initialized from URL params
  const [phoneSearch, setPhoneSearch] = useState(() => searchParams.get("phone") || "");
  const [phoneSearchInput, setPhoneSearchInput] = useState(() => searchParams.get("phone") || "");
  const [nameSearch, setNameSearch] = useState(() => searchParams.get("name") || "");
  const [nameSearchInput, setNameSearchInput] = useState(() => searchParams.get("name") || "");
  const [surnameSearch, setSurnameSearch] = useState(() => searchParams.get("surname") || "");
  const [surnameSearchInput, setSurnameSearchInput] = useState(() => searchParams.get("surname") || "");

  // Auto-focus phone search input on mount (page refresh)
  useEffect(() => {
    if (phoneSearchInputRef.current) {
      phoneSearchInputRef.current.focus();
    }
  }, []);

  // Auto-focus phone search input after debounce/refresh
  useEffect(() => {
    if (phoneSearchInputRef.current) {
      phoneSearchInputRef.current.focus();
    }
  }, [phoneSearch]);

  // Applied filter states - initialized from URL params
  const [filterOrgName, setFilterOrgName] = useState(() => searchParams.get("org_name") || "");
  const [filterOrgType, setFilterOrgType] = useState(() => searchParams.get("org_type") || "");
  const [filterCustomerType, setFilterCustomerType] = useState(() => searchParams.get("customer_type") || "");
  const [filterTelecaller, setFilterTelecaller] = useState(() => searchParams.get("telecaller") || "");
  const [filterTime, setFilterTime] = useState(() => searchParams.get("time") || "");

  // Address filter states (separate for each field) - initialized from URL params
  const [filterHouseFlatNo, setFilterHouseFlatNo] = useState(() => searchParams.get("house_flat_no") || "");
  const [filterWingLane, setFilterWingLane] = useState(() => searchParams.get("wing_lane") || "");
  const [filterSocietyColony, setFilterSocietyColony] = useState(() => searchParams.get("society_colony") || "");
  const [filterLandmark, setFilterLandmark] = useState(() => searchParams.get("landmark") || "");
  const [filterArea, setFilterArea] = useState(() => searchParams.get("area") || "");
  const [filterCity, setFilterCity] = useState(() => searchParams.get("city") || "");
  const [filterDistrict, setFilterDistrict] = useState(() => searchParams.get("district") || "");
  const [filterTahsil, setFilterTahsil] = useState(() => searchParams.get("tahsil") || "");
  const [filterState, setFilterState] = useState(() => searchParams.get("state") || "");
  const [filterPincode, setFilterPincode] = useState(() => searchParams.get("pincode") || "");

  // Pending filter states (what user selects before clicking Apply)
  const [pendingFilterOrgName, setPendingFilterOrgName] = useState(() => searchParams.get("org_name") || "");
  const [pendingFilterOrgType, setPendingFilterOrgType] = useState(() => searchParams.get("org_type") || "");
  const [pendingFilterCustomerType, setPendingFilterCustomerType] = useState(() => searchParams.get("customer_type") || "");
  const [pendingFilterTelecaller, setPendingFilterTelecaller] = useState(() => searchParams.get("telecaller") || "");
  const [pendingFilterTime, setPendingFilterTime] = useState(() => searchParams.get("time") || "");

  // Pending address filter states
  const [pendingFilterHouseFlatNo, setPendingFilterHouseFlatNo] = useState(() => searchParams.get("house_flat_no") || "");
  const [pendingFilterWingLane, setPendingFilterWingLane] = useState(() => searchParams.get("wing_lane") || "");
  const [pendingFilterSocietyColony, setPendingFilterSocietyColony] = useState(() => searchParams.get("society_colony") || "");
  const [pendingFilterLandmark, setPendingFilterLandmark] = useState(() => searchParams.get("landmark") || "");
  const [pendingFilterArea, setPendingFilterArea] = useState(() => searchParams.get("area") || "");
  const [pendingFilterCity, setPendingFilterCity] = useState(() => searchParams.get("city") || "");
  const [pendingFilterDistrict, setPendingFilterDistrict] = useState(() => searchParams.get("district") || "");
  const [pendingFilterTahsil, setPendingFilterTahsil] = useState(() => searchParams.get("tahsil") || "");
  const [pendingFilterState, setPendingFilterState] = useState(() => searchParams.get("state") || "");
  const [pendingFilterPincode, setPendingFilterPincode] = useState(() => searchParams.get("pincode") || "");

  // Date filter states - initialized from URL params
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("date_from") || "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("date_to") || "");
  const [pendingDateFrom, setPendingDateFrom] = useState(() => searchParams.get("date_from") || "");
  const [pendingDateTo, setPendingDateTo] = useState(() => searchParams.get("date_to") || "");

  // UI states
  const [viewMode, setViewMode] = useState("table");
  const [viewType, setViewType] = useState(() => searchParams.get("view_type") || "customers");
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });
  const [pageSize, setPageSize] = useState(() => {
    const size = searchParams.get("page_size");
    return size ? parseInt(size) : 15;
  });

  // Editing states
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentValue, setAppointmentValue] = useState("");
  const [editingTime, setEditingTime] = useState(null);
  const [timeValue, setTimeValue] = useState("");

  // Add form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewOrgTypeInput, setShowNewOrgTypeInput] = useState(false);
  const [newOrgType, setNewOrgType] = useState("");
  const [showNewCustomerTypeInput, setShowNewCustomerTypeInput] = useState(false);
  const [newCustomerType, setNewCustomerType] = useState("");
  const [newContact, setNewContact] = useState({
    name: "",
    surname: "",
    phone: "",
    email: "",
    company_name: "",
    company_type: "",
    customer_type: "",
    telecaller_id: "",
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
      appointment_date: "",
    });

  // Validation states
  const [phoneError, setPhoneError] = useState("");
  const [pendingNameSearch, setPendingNameSearch] = useState(() => searchParams.get("name") || "");
  const [pendingSurnameSearch, setPendingSurnameSearch] = useState(() => searchParams.get("surname") || "");
  
  // Selection states
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("");

  // Message states
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Refs
  const phoneSearchInputRef = useRef(null);
  const nameSearchInputRef = useRef(null);
  const surnameSearchInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const phoneSearchTimeoutRef = useRef(null);
  const nameSearchTimeoutRef = useRef(null);
  const surnameSearchTimeoutRef = useRef(null);
  const addFormPhoneInputRef = useRef(null);

  const { user } = useAuth();
  const { openPopup } = useCallPopup();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Function to update URL with current filters
  const updateURLParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add all active filters to URL
    if (phoneSearch) params.set("phone", phoneSearch);
    if (nameSearch) params.set("name", nameSearch);
    if (surnameSearch) params.set("surname", surnameSearch);
    if (filterOrgName) params.set("org_name", filterOrgName);
    if (filterOrgType) params.set("org_type", filterOrgType);
    if (filterCustomerType) params.set("customer_type", filterCustomerType);
    if (filterTelecaller) params.set("telecaller", filterTelecaller);
    if (filterTime) params.set("time", filterTime);
    if (filterHouseFlatNo) params.set("house_flat_no", filterHouseFlatNo);
    if (filterWingLane) params.set("wing_lane", filterWingLane);
    if (filterSocietyColony) params.set("society_colony", filterSocietyColony);
    if (filterLandmark) params.set("landmark", filterLandmark);
    if (filterArea) params.set("area", filterArea);
    if (filterCity) params.set("city", filterCity);
    if (filterDistrict) params.set("district", filterDistrict);
    if (filterTahsil) params.set("tahsil", filterTahsil);
    if (filterState) params.set("state", filterState);
    if (filterPincode) params.set("pincode", filterPincode);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (viewType !== "customers") params.set("view_type", viewType);
    if (currentPage !== 1) params.set("page", currentPage);
    if (pageSize !== 15) params.set("page_size", pageSize);
    
    setSearchParams(params, { replace: true });
  }, [
    phoneSearch, nameSearch, surnameSearch,
    filterOrgName, filterOrgType, filterCustomerType, filterTelecaller, filterTime,
    filterHouseFlatNo, filterWingLane, filterSocietyColony, filterLandmark,
    filterArea, filterCity, filterDistrict, filterTahsil, filterState, filterPincode,
    dateFrom, dateTo, viewType, currentPage, pageSize, setSearchParams
  ]);

  // Update URL whenever filters change
  useEffect(() => {
    updateURLParams();
  }, [
    phoneSearch, nameSearch, surnameSearch,
    filterOrgName, filterOrgType, filterCustomerType, filterTelecaller, filterTime,
    filterHouseFlatNo, filterWingLane, filterSocietyColony, filterLandmark,
    filterArea, filterCity, filterDistrict, filterTahsil, filterState, filterPincode,
    dateFrom, dateTo, viewType, currentPage, pageSize, updateURLParams
  ]);

  // Reusable async searchable dropdown for filter fields
  const SearchableDropdown = ({
    value,
    onChange,
    fetchUrl,
    placeholder,
    minLength = 1,
    disabled = false,
    className = "",
  }) => {
    const [inputValue, setInputValue] = useState(value || "");
    const [options, setOptions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const [isTyping, setIsTyping] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const fetchTimeoutRef = useRef(null);

    useEffect(() => {
      setInputValue(value || "");
    }, [value]);

    useEffect(() => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      if (!isTyping || !inputValue || inputValue.trim().length < minLength) {
        setOptions([]);
        setShowDropdown(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      fetchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await axios.get(`${fetchUrl}?q=${encodeURIComponent(inputValue)}`);
          
          let optionsArray = [];
          if (Array.isArray(response.data)) {
            optionsArray = response.data;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            optionsArray = response.data.results;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            optionsArray = response.data.data;
          } else if (typeof response.data === 'object') {
            optionsArray = Object.values(response.data).find(val => Array.isArray(val)) || [];
          }
          
          setOptions(optionsArray);
          if (isTyping && optionsArray.length > 0) {
            setShowDropdown(true);
          }
        } catch (err) {
          console.error("Dropdown fetch error for", fetchUrl, err);
          setOptions([]);
          setShowDropdown(false);
        } finally {
          setLoading(false);
        }
      }, 500);
      
      return () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }, [inputValue, fetchUrl, minLength, isTyping]);

    const handleKeyDown = (e) => {
      if (!showDropdown) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((prev) => Math.min(prev + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && highlighted >= 0) {
        e.preventDefault();
        handleSelect(options[highlighted]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        setIsTyping(false);
      }
    };

    const handleSelect = (option) => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      setShowDropdown(false);
      setIsTyping(false);
      setHighlighted(-1);
      setOptions([]);
      
      setInputValue(option);
      onChange(option);
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setShowDropdown(false);
          setIsTyping(false);
          setHighlighted(-1);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            const newValue = e.target.value;
            setInputValue(newValue);
            setIsTyping(true);
            onChange("");
            setHighlighted(-1);
          }}
          onFocus={() => {
            if (inputValue && inputValue.length >= minLength && !showDropdown) {
              setIsTyping(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsTyping(false);
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white ${className}`}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        {showDropdown && options.length > 0 && (
          <ul
            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{ zIndex: 9999 }}
          >
            {options.map((option, idx) => (
              <li
                key={idx}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors ${
                  idx === highlighted ? "bg-blue-100" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
                onMouseEnter={() => setHighlighted(idx)}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  // Query for customers (uses applied filters and searches)
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
      phoneSearch,
      nameSearch,
      surnameSearch,
      filterHouseFlatNo,
      filterWingLane,
      filterSocietyColony,
      filterLandmark,
      filterArea,
      filterCity,
      filterDistrict,
      filterTahsil,
      filterState,
      filterPincode,
      filterOrgName,
      filterOrgType,
      filterCustomerType,
      filterTelecaller,
      filterTime,
      user?.role,
      user?.id,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("page_size", pageSize);

      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (phoneSearch) params.append("search_phone", phoneSearch);
      if (nameSearch) params.append("search_name", nameSearch);
      if (surnameSearch) params.append("search_surname", surnameSearch);
      if (filterHouseFlatNo) params.append("house_flat_no", filterHouseFlatNo);
      if (filterWingLane) params.append("wing_lane", filterWingLane);
      if (filterSocietyColony) params.append("society_colony", filterSocietyColony);
      if (filterLandmark) params.append("landmark", filterLandmark);
      if (filterArea) params.append("area", filterArea);
      if (filterCity) params.append("city", filterCity);
      if (filterDistrict) params.append("district", filterDistrict);
      if (filterTahsil) params.append("tahsil", filterTahsil);
      if (filterState) params.append("state", filterState);
      if (filterPincode) params.append("pincode", filterPincode);
      if (filterOrgName) params.append("organization_name", filterOrgName);
      if (filterOrgType) params.append("organization_type", filterOrgType);
      if (filterCustomerType) params.append("customer_type", filterCustomerType);
      if (filterTelecaller) params.append("telecaller", filterTelecaller);
      if (filterTime) params.append("time", filterTime);

      if (!phoneSearch && !nameSearch && !surnameSearch) {
        if (viewType === "customers") {
          params.append("has_appointment", "true");
        } else if (viewType === "leads") {
          params.append("has_appointment", "false");
        }
      }

      const response = await axios.get(`/api/customers/?${params.toString()}`);
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

  const { data: customerTypes } = useQuery({
    queryKey: ["customerTypes"],
    queryFn: () => fetchCustomerTypes(),
  });

  // Phone check query
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

  // Auto-focus on add form phone input when form opens
  useEffect(() => {
    if (showAddForm && addFormPhoneInputRef.current) {
      setTimeout(() => {
        addFormPhoneInputRef.current.focus();
      }, 100);
    }
  }, [showAddForm]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format phone number as XXX-XXX-XXXX
  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    return phone;
  };

  // Reset to first page when search or applied filters change
  useEffect(() => {
    setCurrentPage(1);
    if (phoneSearchInputRef.current) {
      phoneSearchInputRef.current.focus();
    }
  }, [
    phoneSearch,
    nameSearch,
    surnameSearch,
    filterHouseFlatNo,
    filterWingLane,
    filterSocietyColony,
    filterLandmark,
    filterArea,
    filterCity,
    filterDistrict,
    filterTahsil,
    filterState,
    filterPincode,
    filterOrgName,
    filterOrgType,
    filterCustomerType,
    filterTelecaller,
    filterTime,
    dateFrom,
    dateTo,
    viewType,
    pageSize,
  ]);

  // Apply filters when apply button is clicked
  const handleApplyFilters = useCallback(() => {
    setNameSearch(pendingNameSearch);
    setSurnameSearch(pendingSurnameSearch);
    setFilterHouseFlatNo(pendingFilterHouseFlatNo);
    setFilterWingLane(pendingFilterWingLane);
    setFilterSocietyColony(pendingFilterSocietyColony);
    setFilterLandmark(pendingFilterLandmark);
    setFilterArea(pendingFilterArea);
    setFilterCity(pendingFilterCity);
    setFilterDistrict(pendingFilterDistrict);
    setFilterTahsil(pendingFilterTahsil);
    setFilterState(pendingFilterState);
    setFilterPincode(pendingFilterPincode);
    setFilterOrgName(pendingFilterOrgName);
    setFilterOrgType(pendingFilterOrgType);
    setFilterCustomerType(pendingFilterCustomerType);
    setFilterTelecaller(pendingFilterTelecaller);
    setFilterTime(pendingFilterTime);
    setDateFrom(pendingDateFrom);
    setDateTo(pendingDateTo);
    setCurrentPage(1);
  }, [
    pendingNameSearch,
    pendingSurnameSearch,
    pendingFilterHouseFlatNo,
    pendingFilterWingLane,
    pendingFilterSocietyColony,
    pendingFilterLandmark,
    pendingFilterArea,
    pendingFilterCity,
    pendingFilterDistrict,
    pendingFilterTahsil,
    pendingFilterState,
    pendingFilterPincode,
    pendingFilterOrgName,
    pendingFilterOrgType,
    pendingFilterCustomerType,
    pendingFilterTelecaller,
    pendingFilterTime,
    pendingDateFrom,
    pendingDateTo,
  ]);

  // Auto-close success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Auto-close error message
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Phone validation
  useEffect(() => {
    if (newContact.phone.length > 0 && newContact.phone.length < 10) {
      setPhoneError("Phone number must be at least 10 digits");
    } else if (newContact.phone.length === 0) {
      setPhoneError("");
    }
  }, [newContact.phone]);

  // Phone check and auto-fill Quick Add form if phone exists
const [existingCustomerId, setExistingCustomerId] = useState(null);

useEffect(() => {
  // If phone is empty, clear all fields
  if (!newContact.phone || newContact.phone.length === 0) {
    setExistingCustomerId(null);
    setPhoneError("");
    setNewContact({
      name: "",
      surname: "",
      phone: "",
      email: "",
      company_name: "",
      company_type: "",
      customer_type: "",
      telecaller_id: "",
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
      appointment_date: "",
    });
    return;
  }

  // If phone length is less than 10, don't check yet
  if (newContact.phone.length < 10) {
    setPhoneError("Phone number must be at least 10 digits");
    setExistingCustomerId(null);
    // Clear all fields except phone when phone is incomplete
    setNewContact((prev) => ({
      name: "",
      surname: "",
      email: "",
      company_name: "",
      company_type: "",
      customer_type: "",
      telecaller_id: "",
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
      appointment_date: "",
      phone: prev.phone, // Preserve the phone being typed
    }));
    return;
  }

  // Phone length is 10 or more, check if exists
  if (phoneCheckLoading) {
    setPhoneError("Checking phone number...");
    setExistingCustomerId(null);
  } else if (phoneCheckData && phoneCheckData.count > 0) {
    setPhoneError("Phone number already exists");
    const customer = phoneCheckData.results && phoneCheckData.results[0];
    if (customer) {
      setExistingCustomerId(customer.id);
      let companyTypeId = customer.company_type;
      if (typeof companyTypeId === "string" && organizationTypes) {
        const found = organizationTypes.find(
          (org) => org.name === companyTypeId,
        );
        if (found) companyTypeId = found.id;
      } else if (
        typeof companyTypeId === "object" &&
        companyTypeId !== null
      ) {
        companyTypeId = companyTypeId.id;
      }
      setNewContact((prev) => ({
        ...prev,
        name: customer.name || "",
        surname: customer.surname || "",
        email: customer.email || "",
        company_name: customer.company_name || "",
        company_type: companyTypeId || "",
        customer_type: customer.customer_type
          ? typeof customer.customer_type === "object"
            ? customer.customer_type.id
            : customer.customer_type
          : "",
        telecaller_id: customer.agent
          ? typeof customer.agent === "object"
            ? customer.agent.id
            : customer.agent
          : "",
        pincode: customer.pincode || "",
        house_flat_no: customer.house_flat_no || "",
        wing_lane: customer.wing_lane || "",
        society_colony: customer.society_colony || "",
        landmark: customer.landmark || "",
        area: customer.area || "",
        state: customer.state || "",
        district: customer.district || "",
        tahsil: customer.tahsil || "",
        city: customer.city || "",
        appointment_date: customer.appointment_date || "",
      }));
    }
  } else if (phoneCheckData && phoneCheckData.count === 0) {
    // Phone doesn't exist, clear all fields except phone
    setPhoneError("");
    setExistingCustomerId(null);
    setNewContact((prev) => ({
      name: "",
      surname: "",
      email: "",
      company_name: "",
      company_type: "",
      customer_type: "",
      telecaller_id: "",
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
      phone: prev.phone, // Preserve the phone being entered
    }));
  }
}, [newContact.phone, phoneCheckLoading, phoneCheckData, organizationTypes]);

  // Phone search handler (auto-apply with debounce)
  const handlePhoneSearchChange = (e) => {
    const value = e.target.value;
    if (value && !/^\d*$/.test(value)) {
      return;
    }
    if (value.length > 10) {
      return;
    }
    setPhoneSearchInput(value);
    if (phoneSearchTimeoutRef.current) {
      clearTimeout(phoneSearchTimeoutRef.current);
    }
    phoneSearchTimeoutRef.current = setTimeout(() => {
      setPhoneSearch(value);
      setCurrentPage(1);
    }, 2000);
  };

  const handlePhoneSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (phoneSearchTimeoutRef.current) {
        clearTimeout(phoneSearchTimeoutRef.current);
      }
      setPhoneSearch(phoneSearchInput);
      setCurrentPage(1);
    }
  };

  // Name search handler (auto-apply with debounce)
  const handleNameSearchChange = (e) => {
    const value = e.target.value;
    setNameSearchInput(value);
    if (nameSearchTimeoutRef.current) {
      clearTimeout(nameSearchTimeoutRef.current);
    }
    nameSearchTimeoutRef.current = setTimeout(() => {
      setNameSearch(value);
      setCurrentPage(1);
    }, 2000);
  };

  const handleNameSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (nameSearchTimeoutRef.current) {
        clearTimeout(nameSearchTimeoutRef.current);
      }
      setNameSearch(nameSearchInput);
      setCurrentPage(1);
    }
  };

  // Surname search handler (auto-apply with debounce)
  const handleSurnameSearchChange = (e) => {
    const value = e.target.value;
    setSurnameSearchInput(value);
    if (surnameSearchTimeoutRef.current) {
      clearTimeout(surnameSearchTimeoutRef.current);
    }
    surnameSearchTimeoutRef.current = setTimeout(() => {
      setSurnameSearch(value);
      setCurrentPage(1);
    }, 2000);
  };

  const handleSurnameSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (surnameSearchTimeoutRef.current) {
        clearTimeout(surnameSearchTimeoutRef.current);
      }
      setSurnameSearch(surnameSearchInput);
      setCurrentPage(1);
    }
  };

  // Get customers (use backend order)
  const customers = data?.results ? [...data.results] : [];

  useEffect(() => {
    if (customers.length > 0) {
      console.log("First 5 customers from API:");
      customers.slice(0, 5).forEach((c, i) => {
        console.log(
          `${i + 1}. ID: ${c.id}, Date: ${c.appointment_date}, Time: ${c.appointment_time}`,
        );
      });
    }
  }, [customers]);

  const totalPages = Math.ceil((data?.count || 0) / pageSize);
  const totalCustomers = data?.count || 0;
  const activeAgents = new Set(
    customers.map((customer) => customer.agent_name).filter(Boolean),
  ).size;

  const handleCall = (customer) => {
    openPopup(customer);
  };

  // Mutations
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, appointment_date }) => {
      const response = await axios.patch(`/api/customers/${id}/`, {
        appointment_date,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditingAppointment(null);
      setAppointmentValue("");
    },
    onError: (error) => {
      console.error("Error updating appointment date:", error);
      setErrorMessage("Failed to update appointment date");
    },
  });

  const updateTimeMutation = useMutation({
    mutationFn: async ({ id, appointment_time }) => {
      const response = await axios.patch(`/api/customers/${id}/`, {
        appointment_time,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditingTime(null);
      setTimeValue("");
    },
    onError: (error) => {
      console.error("Error updating appointment time:", error);
      setErrorMessage("Failed to update appointment time");
    },
  });

  // Mutation for adding new organization type
  const addOrgTypeMutation = useMutation({
    mutationFn: async (orgTypeData) => {
      const response = await axios.post("/api/organizationtypes/", orgTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organizationTypes"] });
      setNewContact({ ...newContact, company_type: data.name });
      setNewOrgType("");
      setShowNewOrgTypeInput(false);
      setSuccessMessage("Organization type added successfully!");
    },
    onError: (error) => {
      console.error("Error adding organization type:", error);
      setErrorMessage("Failed to add organization type");
    },
  });

  // Mutation for adding new customer type
  const addCustomerTypeMutation = useMutation({
    mutationFn: async (customerTypeData) => {
      const response = await axios.post(
        "/api/customertypes/",
        customerTypeData,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customerTypes"] });
      setNewContact({ ...newContact, customer_type: data.id });
      setNewCustomerType("");
      setShowNewCustomerTypeInput(false);
      setSuccessMessage("Customer type added successfully!");
    },
    onError: (error) => {
      console.error("Error adding customer type:", error);
      setErrorMessage("Failed to add customer type");
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customerData) => {
      const response = await axios.post("/api/customers/", customerData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setNewContact({
        name: "",
        surname: "",
        phone: "",
        email: "",
        company_name: "",
        company_type: "",
        customer_type: "",
        telecaller_id: "",
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
      setSuccessMessage("Customer added successfully!");
      setTimeout(() => {
        if (addFormPhoneInputRef.current) {
          addFormPhoneInputRef.current.focus();
          addFormPhoneInputRef.current.select();
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
      setTimeout(() => {
        if (addFormPhoneInputRef.current) {
          addFormPhoneInputRef.current.focus();
        }
      }, 100);
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ customer_ids, agent_id }) => {
      const response = await axios.post("/api/customers/bulk_assign/", {
        customer_ids,
        agent_id,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
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

  // Handlers
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

  const handleAddCustomer = () => {
    if (!newContact.phone) {
      setErrorMessage("Phone is required");
      if (addFormPhoneInputRef.current) {
        addFormPhoneInputRef.current.focus();
      }
      return;
    }
    if (newContact.phone.length < 10) {
      setErrorMessage("Phone number must be at least 10 digits");
      if (addFormPhoneInputRef.current) {
        addFormPhoneInputRef.current.focus();
      }
      return;
    }
    if (phoneError && phoneError !== "Checking phone number...") {
      setErrorMessage(phoneError);
      if (addFormPhoneInputRef.current) {
        addFormPhoneInputRef.current.focus();
      }
      return;
    }

    const selectedOrgType = organizationTypes?.find(
      (type) => type.name === newContact.company_type,
    );
    const selectedCustomerType = customerTypes?.find(
      (type) =>
        type.id === Number(newContact.customer_type) ||
        type.name === newContact.customer_type,
    );

    const submitData = {
      ...newContact,
      company_type: selectedOrgType?.id || null,
      customer_type: selectedCustomerType?.id || null,
      telecaller_id: newContact.telecaller_id || null,
        appointment_date: newContact.appointment_date || null,
      };

    addCustomerMutation.mutate(submitData);
  };

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
      setErrorMessage("Please select customers to assign");
      return;
    }
    if (!selectedAgent) {
      setErrorMessage("Please select an agent");
      return;
    }
    bulkAssignMutation.mutate({
      customer_ids: selectedCustomers,
      agent_id: selectedAgent,
    });
  };

  const handleIndividualAssign = (customer) => {
    setSelectedCustomers([customer.id]);
    setShowAssignmentModal(true);
  };

  // Clear all filters and searches
  const handleClearFilters = useCallback(() => {
    // Clear applied filters
    setFilterHouseFlatNo("");
    setFilterWingLane("");
    setFilterSocietyColony("");
    setFilterLandmark("");
    setFilterArea("");
    setFilterCity("");
    setFilterDistrict("");
    setFilterTahsil("");
    setFilterState("");
    setFilterPincode("");
    setFilterOrgName("");
    setFilterOrgType("");
    setFilterCustomerType("");
    setFilterTelecaller("");
    setFilterTime("");
    setDateFrom("");
    setDateTo("");

    // Clear pending filters
    setPendingFilterHouseFlatNo("");
    setPendingFilterWingLane("");
    setPendingFilterSocietyColony("");
    setPendingFilterLandmark("");
    setPendingFilterArea("");
    setPendingFilterCity("");
    setPendingFilterDistrict("");
    setPendingFilterTahsil("");
    setPendingFilterState("");
    setPendingFilterPincode("");
    setPendingFilterOrgName("");
    setPendingFilterOrgType("");
    setPendingFilterCustomerType("");
    setPendingFilterTelecaller("");
    setPendingFilterTime("");
    setPendingDateFrom("");
    setPendingDateTo("");

    // Clear searches
    setPhoneSearch("");
    setPhoneSearchInput("");
    setNameSearch("");
    setNameSearchInput("");
    setSurnameSearch("");
    setSurnameSearchInput("");
    setPendingNameSearch("");
    setPendingSurnameSearch("");

    // Reset page
    setCurrentPage(1);
  }, []);

  // Excel export handler
  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (phoneSearch) params.append("phone", phoneSearch);
      if (nameSearch) params.append("name", nameSearch);
      if (surnameSearch) params.append("surname", surnameSearch);
      if (filterOrgName) params.append("company_name", filterOrgName);
      if (filterOrgType) params.append("company_type", filterOrgType);
      if (filterCustomerType) params.append("customer_type", filterCustomerType);
      if (filterTelecaller) params.append("agent", filterTelecaller);
      if (filterTime) params.append("time", filterTime);
      if (filterHouseFlatNo) params.append("house_flat_no", filterHouseFlatNo);
      if (filterWingLane) params.append("wing_lane", filterWingLane);
      if (filterSocietyColony) params.append("society_colony", filterSocietyColony);
      if (filterLandmark) params.append("landmark", filterLandmark);
      if (filterArea) params.append("area", filterArea);
      if (filterCity) params.append("city", filterCity);
      if (filterDistrict) params.append("district", filterDistrict);
      if (filterTahsil) params.append("tahsil", filterTahsil);
      if (filterState) params.append("state", filterState);
      if (filterPincode) params.append("pincode", filterPincode);
      if (viewType === "customers") params.append("contact_type", "Customer");
      if (viewType === "leads") params.append("contact_type", "Lead");

      const response = await axios.get(
        `/api/customers/export_excel/?${params.toString()}`,
      );
      const { customers: customersData } = response.data;

      const ws = XLSX.utils.json_to_sheet(customersData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");

      const date = new Date().toISOString().split("T")[0];
      const filename = `customers_export_${date}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting Excel:", error);
      setErrorMessage("Failed to export customers data");
    }
  };

  // Loading state
  if (isLoading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading customers...</p>
        </div>
      </div>
    );

  // Error state
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

  return (
    <div className="p-4">
      {/* Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        </div>
      )}

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

      {/* Search and Filter Section */}
      <div className="sticky top-0 z-20 bg-gray-50 pb-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {/* Row 1: Quick Search - Phone, Name, Surname, Organization */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={phoneSearchInputRef}
                type="text"
                placeholder="Phone number"
                value={phoneSearchInput}
                onChange={handlePhoneSearchChange}
                onKeyDown={handlePhoneSearchKeyDown}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                maxLength="10"
                autoFocus={true}
              />
              {phoneSearchInput !== phoneSearch && phoneSearchInput && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <SearchableDropdown
                value={pendingNameSearch}
                onChange={setPendingNameSearch}
                fetchUrl="/api/customers/unique_names/"
                placeholder="First name"
                className="pl-9"
              />
            </div>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <SearchableDropdown
                value={pendingSurnameSearch}
                onChange={setPendingSurnameSearch}
                fetchUrl="/api/customers/unique_surnames/"
                placeholder="Surname"
                className="pl-9"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Organization"
                value={pendingFilterOrgName}
                onChange={(e) => setPendingFilterOrgName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
              />
            </div>
            <select
              value={pendingFilterOrgType}
              onChange={(e) => setPendingFilterOrgType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white"
            >
              <option value="">Org Type</option>
              {organizationTypes?.map((org) => (
                <option key={org.id} value={org.name}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 2: Address Filters - Compact grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-2 mb-4">
            <input
              type="text"
              placeholder="Pincode"
              value={pendingFilterPincode}
              onChange={(e) => setPendingFilterPincode(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
              maxLength="6"
            />
            <input
              type="text"
              placeholder="State"
              value={pendingFilterState}
              onChange={(e) => setPendingFilterState(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="District"
              value={pendingFilterDistrict}
              onChange={(e) => setPendingFilterDistrict(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="Tahsil"
              value={pendingFilterTahsil}
              onChange={(e) => setPendingFilterTahsil(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="City"
              value={pendingFilterCity}
              onChange={(e) => setPendingFilterCity(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="Area"
              value={pendingFilterArea}
              onChange={(e) => setPendingFilterArea(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="Landmark"
              value={pendingFilterLandmark}
              onChange={(e) => setPendingFilterLandmark(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="Society/Colony"
              value={pendingFilterSocietyColony}
              onChange={(e) => setPendingFilterSocietyColony(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="Wing/Lane"
              value={pendingFilterWingLane}
              onChange={(e) => setPendingFilterWingLane(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
            <input
              type="text"
              placeholder="House/Flat"
              value={pendingFilterHouseFlatNo}
              onChange={(e) => setPendingFilterHouseFlatNo(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white"
            />
          </div>

          {/* Row 3: Additional Filters and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={pendingFilterCustomerType}
                onChange={(e) => setPendingFilterCustomerType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white"
              >
                <option value="">Customer Type</option>
                {customerTypes?.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>

              <select
                value={pendingFilterTelecaller}
                onChange={(e) => setPendingFilterTelecaller(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white"
              >
                <option value="">Telecaller</option>
                {employees
                  ?.filter((emp) => emp.role === "Telecaller")
                  .map((emp) => (
                    <option key={emp.id} value={emp.username}>
                      {emp.username}
                    </option>
                  ))}
              </select>


              <input
                type="date"
                value={pendingDateFrom}
                onChange={(e) => setPendingDateFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white"
                placeholder="From"
              />

              <input
                type="date"
                value={pendingDateTo}
                onChange={(e) => setPendingDateTo(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white"
                placeholder="To"
              />

              {/* KPI: Total Customers */}
              <div className="flex items-center bg-blue-50 border border-blue-200 rounded-lg px-2 py-2 shadow-sm">
                <Users className="w-5 h-5 text-blue-500 mr-2" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-gray-500">Total Customers</span>
                  <span className="text-sm font-semibold text-blue-600">{data?.count ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply
              </button>

              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Clear
              </button>

              <div className="h-8 w-px bg-gray-200 mx-1"></div>

              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 hover:bg-white"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="h-8 w-px bg-gray-200 mx-1"></div>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewType("customers");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewType === "customers"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Appointments
                </button>
                <button
                  onClick={() => {
                    setViewType("leads");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewType === "leads"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Leads
                </button>
              </div>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "card"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleExportExcel}
                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Export Excel"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                ref={addFormPhoneInputRef}
                type="text"
                value={newContact.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d*$/.test(value)) {
                    return;
                  }
                  if (value.length > 10) {
                    return;
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
                    setNewContact({
                      ...newContact,
                      company_type: value ? Number(value) : "",
                    });
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
                {customerTypes?.map((type) => (
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
                    onClick={() => {
                      if (newCustomerType.trim()) {
                        addCustomerTypeMutation.mutate({
                          name: newCustomerType.trim(),
                        });
                      }
                    }}
                    disabled={
                      addCustomerTypeMutation.isLoading ||
                      !newCustomerType.trim()
                    }
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {addCustomerTypeMutation.isLoading ? "Adding..." : "Add"}
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
                Telecaller
              </label>
              <select
                value={newContact.telecaller_id || ""}
                onChange={(e) => {
                  const telecallerId = e.target.value
                    ? parseInt(e.target.value)
                    : "";
                  setNewContact({ ...newContact, telecaller_id: telecallerId });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Telecaller</option>
                {employees
                  ?.filter((emp) => emp.role === "Telecaller")
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.username})
                    </option>
                  ))}
              </select>
            </div>
            <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        value={newContact.appointment_date}
                        onChange={(e) =>
                          setNewContact({ ...newContact, appointment_date: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Appointment Date"
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
                Pincode
              </label>
              <input
                type="text"
                value={newContact.pincode}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value && !/^\d*$/.test(value)) {
                    return;
                  }
                  if (value.length > 6) {
                    return;
                  }
                  setNewContact({ ...newContact, pincode: value });
                }}
                onBlur={() => {
                  if (newContact.pincode && newContact.pincode.length !== 6) {
                    alert("Pincode must be exactly 6 digits");
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Pincode"
                maxLength="6"
              />
              {newContact.pincode &&
                newContact.pincode.length > 0 &&
                newContact.pincode.length !== 6 && (
                  <p className="mt-1 text-xs text-red-600">
                    Pincode must be exactly 6 digits (current:{" "}
                    {newContact.pincode.length})
                  </p>
                )}
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
                Tahsil
              </label>
              <input
                type="text"
                value={newContact.tahsil}
                onChange={(e) =>
                  setNewContact({ ...newContact, tahsil: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tahsil"
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
              {existingCustomerId ? (
                <button
                  onClick={async () => {
                    let submitContact = { ...newContact };
                    if (
                      typeof submitContact.company_type === "string" &&
                      organizationTypes
                    ) {
                      const found = organizationTypes.find(
                        (org) => org.name === submitContact.company_type,
                      );
                      if (found) submitContact.company_type = found.id;
                    }
                    try {
                      await axios.patch(
                        `/api/customers/${existingCustomerId}/`,
                        submitContact,
                      );
                      setSuccessMessage("Customer updated successfully!");
                      setShowAddForm(false);
                      setExistingCustomerId(null);
                      setNewContact({
                        name: "",
                        surname: "",
                        phone: "",
                        email: "",
                        company_name: "",
                        company_type: "",
                        customer_type: "",
                        telecaller_id: "",
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
                          appointment_date: "",
                        });
                      queryClient.invalidateQueries({
                        queryKey: ["customers"],
                      });
                    } catch (err) {
                      setErrorMessage("Failed to update customer");
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Edit className="h-4 w-4" />
                  Update
                </button>
              ) : (
                <button
                  onClick={handleAddCustomer}
                  disabled={addCustomerMutation.isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {addCustomerMutation.isLoading ? "Adding..." : "Add"}
                </button>
              )}
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

      {/* Table View */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            className="overflow-x-auto overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ maxHeight: "calc(100vh - 280px)" }}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#1a2332] sticky top-0 z-10">
                <tr>
                  {user?.role === "Admin" && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider sticky left-0 bg-[#1a2332] z-20">
                      <input
                        type="checkbox"
                        checked={
                          selectedCustomers.length === customers.length &&
                          customers.length > 0
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Contact Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Org Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Org Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Telecaller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
                {selectedCustomers.length > 0 && user?.role === "Admin" && (
                  <tr className="bg-blue-50">
                    <td colSpan="10" className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">
                          {selectedCustomers.length} contact
                          {selectedCustomers.length > 1 ? "s" : ""} selected
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowAssignmentModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Assign
                          </button>
                          <button
                            onClick={() => setSelectedCustomers([])}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                          >
                            Clear
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
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    {user?.role === "Admin" && (
                      <td
                        className="px-6 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectCustomer(customer.id);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {customer.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {customer.name?.charAt(0)?.toUpperCase() +
                              customer.name?.slice(1) || "Unknown"}
                          </Link>
                          {customer.surname && (
                            <div className="text-xs text-gray-500">
                              {customer.surname}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 max-w-36 overflow-hidden">
                      {customer.company_name || "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {customer.company_type_display || "—"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="space-y-0.5">
                        {customer.phones && customer.phones.length > 0 ? (
                          customer.phones.map((phoneObj, idx) => (
                            <div
                              key={idx}
                              className="flex items-center text-sm"
                            >
                              <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                              <span
                                className={
                                  phoneObj.phone === customer.phone
                                    ? "font-medium text-blue-600"
                                    : "text-gray-700"
                                }
                              >
                                {formatPhoneNumber(phoneObj.phone)}
                                {phoneObj.phone === customer.phone && " (P)"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center text-sm text-gray-700">
                            <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {formatPhoneNumber(customer.phone)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-sm text-gray-700 max-w-36 overflow-hidden">
                        {(() => {
                          const addressParts = [
                            customer.house_flat_no,
                            customer.wing_lane,
                            customer.society_colony,
                            customer.landmark,
                            customer.area,
                            customer.city,
                            customer.district,
                            customer.tahsil,
                            customer.state,
                            customer.pincode,
                          ].filter(Boolean);

                          if (addressParts.length === 0) {
                            return <span className="text-gray-400">—</span>;
                          }

                          return addressParts.join(", ");
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <User className="h-3 w-3 mr-1" />
                        {customer.agent_name || "Unassigned"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingAppointment === customer.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={appointmentValue}
                            onChange={(e) =>
                              setAppointmentValue(e.target.value)
                            }
                            className="text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveAppointment}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            disabled={updateAppointmentMutation.isLoading}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {customer.appointment_date
                            ? new Date(
                                customer.appointment_date,
                              ).toLocaleDateString()
                            : "—"}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-6 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingTime === customer.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={timeValue}
                            onChange={(e) => setTimeValue(e.target.value)}
                            className="text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveTime}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                            disabled={updateTimeMutation.isLoading}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelTimeEdit}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">
                          {customer.appointment_time || "—"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/customers/${customer.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/customers/edit/${customer.id}`}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
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
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualAssign(customer);
                          }}
                          className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
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
            <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-100">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-3 py-1.5 border border-gray-200 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-medium text-gray-900">
                      {data?.count > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-gray-900">
                      {Math.min(currentPage * pageSize, data?.count || 0)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-gray-900">
                      {data?.count || 0}
                    </span>{" "}
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
                      className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 2,
                      )
                      .map((page, index, array) => (
                        <React.Fragment key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-3 py-1.5 border border-gray-200 bg-white text-gray-500 text-sm">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-3 py-1.5 border text-sm font-medium transition-colors ${
                              page === currentPage
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-200 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
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
            <div className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                No contacts found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {phoneSearch || nameSearch || surnameSearch
                  ? "No results match your search criteria"
                  : "Try adjusting your filters"}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Contact
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
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
                      {customer.surname && (
                        <span className="text-gray-600">
                          {" "}
                          {customer.surname}
                        </span>
                      )}
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

              <div className="p-6">
                <div className="space-y-4">
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
                      <span>{customer.pincode || "No pincode"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <User className="h-3 w-3 mr-1" />
                      {customer.agent_name || "Unassigned"}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(customer.total_order_value)}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-2" />
                    Joined {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </div>

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
                {phoneSearch || nameSearch || surnameSearch
                  ? "No results match your search criteria"
                  : "Try adjusting your filters and click Apply"}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </button>
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
                {employees
                  ?.filter((emp) => emp.role === "Telecaller")
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.username})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedCustomers([]);
                  setSelectedAgent("");
                }}
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