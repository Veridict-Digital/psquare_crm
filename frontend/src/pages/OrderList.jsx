import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Package, CheckCircle, Clock, TrendingUp, Users, Calendar, Filter, Search, Grid, List, DollarSign, ShoppingCart, Truck, AlertCircle, Plus, X, IndianRupee } from 'lucide-react';

const OrderList = () => {
  // Filter States - Draft/Pending
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minItems, setMinItems] = useState('');
  const [maxItems, setMaxItems] = useState('');
  const [pendingDateFrom, setPendingDateFrom] = useState('');
  const [pendingDateTo, setPendingDateTo] = useState('');

  // Customer-specific Filter States - Draft/Pending
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerSurname, setCustomerSurname] = useState('');
  const [customerOrgName, setCustomerOrgName] = useState('');
  const [customerOrgType, setCustomerOrgType] = useState('');
  const [customerCustomerType, setCustomerCustomerType] = useState('');
  const [customerTelecaller, setCustomerTelecaller] = useState('');
  
  const [customerHouseFlatNo, setCustomerHouseFlatNo] = useState('');
  const [customerWingLane, setCustomerWingLane] = useState('');
  const [customerSocietyColony, setCustomerSocietyColony] = useState('');
  const [customerLandmark, setCustomerLandmark] = useState('');
  const [customerArea, setCustomerArea] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('');
  const [customerTahsil, setCustomerTahsil] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');

  // Applied Filter States
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedAgent, setAppliedAgent] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedPaymentStatus, setAppliedPaymentStatus] = useState('');
  const [appliedProductName, setAppliedProductName] = useState('');
  const [appliedBrandName, setAppliedBrandName] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [appliedMinItems, setAppliedMinItems] = useState('');
  const [appliedMaxItems, setAppliedMaxItems] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  // Applied Customer-specific Filter States
  const [appliedCustomerPhone, setAppliedCustomerPhone] = useState('');
  const [appliedCustomerName, setAppliedCustomerName] = useState('');
  const [appliedCustomerSurname, setAppliedCustomerSurname] = useState('');
  const [appliedCustomerOrgName, setAppliedCustomerOrgName] = useState('');
  const [appliedCustomerOrgType, setAppliedCustomerOrgType] = useState('');
  const [appliedCustomerCustomerType, setAppliedCustomerCustomerType] = useState('');
  const [appliedCustomerTelecaller, setAppliedCustomerTelecaller] = useState('');
  
  const [appliedCustomerHouseFlatNo, setAppliedCustomerHouseFlatNo] = useState('');
  const [appliedCustomerWingLane, setAppliedCustomerWingLane] = useState('');
  const [appliedCustomerSocietyColony, setAppliedCustomerSocietyColony] = useState('');
  const [appliedCustomerLandmark, setAppliedCustomerLandmark] = useState('');
  const [appliedCustomerArea, setAppliedCustomerArea] = useState('');
  const [appliedCustomerCity, setAppliedCustomerCity] = useState('');
  const [appliedCustomerDistrict, setAppliedCustomerDistrict] = useState('');
  const [appliedCustomerTahsil, setAppliedCustomerTahsil] = useState('');
  const [appliedCustomerState, setAppliedCustomerState] = useState('');
  const [appliedCustomerPincode, setAppliedCustomerPincode] = useState('');

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [allAgents, setAllAgents] = useState([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries for customer filter dropdowns
  const { data: organizationTypes } = useQuery({
    queryKey: ['organizationTypes'],
    queryFn: () => axios.get('/api/organizationtypes/').then((res) => res.data),
  });

  const { data: customerTypes } = useQuery({
    queryKey: ['customerTypes'],
    queryFn: () => axios.get('/api/customertypes/').then((res) => res.data),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => axios.get('/api/users/employees/').then((res) => res.data),
  });

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: [
      'orders',
      appliedSearch,
      appliedAgent,
      appliedStatus,
      appliedPaymentStatus,
      appliedProductName,
      appliedBrandName,
      appliedMinPrice,
      appliedMaxPrice,
      appliedMinItems,
      appliedMaxItems,
      appliedDateFrom,
      appliedDateTo,
      appliedCustomerPhone,
      appliedCustomerName,
      appliedCustomerSurname,
      appliedCustomerOrgName,
      appliedCustomerOrgType,
      appliedCustomerCustomerType,
      appliedCustomerTelecaller,
      appliedCustomerHouseFlatNo,
      appliedCustomerWingLane,
      appliedCustomerSocietyColony,
      appliedCustomerLandmark,
      appliedCustomerArea,
      appliedCustomerCity,
      appliedCustomerDistrict,
      appliedCustomerTahsil,
      appliedCustomerState,
      appliedCustomerPincode,
      currentPage,
      pageSize
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('page_size', pageSize);
      if (appliedSearch) params.append('search', appliedSearch);
      if (appliedAgent) params.append('agent', appliedAgent);
      if (appliedStatus) params.append('status', appliedStatus);
      if (appliedPaymentStatus) params.append('payment_status', appliedPaymentStatus);
      if (appliedProductName) params.append('product_name', appliedProductName);
      if (appliedBrandName) params.append('brand_name', appliedBrandName);
      if (appliedMinPrice) params.append('min_price', appliedMinPrice);
      if (appliedMaxPrice) params.append('max_price', appliedMaxPrice);
      if (appliedMinItems) params.append('min_items', appliedMinItems);
      if (appliedMaxItems) params.append('max_items', appliedMaxItems);
      if (appliedDateFrom) params.append('date_from', appliedDateFrom);
      if (appliedDateTo) params.append('date_to', appliedDateTo);
      
      // Customer filters
      if (appliedCustomerPhone) params.append('customer_phone', appliedCustomerPhone);
      if (appliedCustomerName) params.append('customer_name', appliedCustomerName);
      if (appliedCustomerSurname) params.append('customer_surname', appliedCustomerSurname);
      if (appliedCustomerOrgName) params.append('customer_org_name', appliedCustomerOrgName);
      if (appliedCustomerOrgType) params.append('customer_org_type', appliedCustomerOrgType);
      if (appliedCustomerCustomerType) params.append('customer_customer_type', appliedCustomerCustomerType);
      if (appliedCustomerTelecaller) params.append('customer_telecaller', appliedCustomerTelecaller);
      
      if (appliedCustomerHouseFlatNo) params.append('customer_house_flat_no', appliedCustomerHouseFlatNo);
      if (appliedCustomerWingLane) params.append('customer_wing_lane', appliedCustomerWingLane);
      if (appliedCustomerSocietyColony) params.append('customer_society_colony', appliedCustomerSocietyColony);
      if (appliedCustomerLandmark) params.append('customer_landmark', appliedCustomerLandmark);
      if (appliedCustomerArea) params.append('customer_area', appliedCustomerArea);
      if (appliedCustomerCity) params.append('customer_city', appliedCustomerCity);
      if (appliedCustomerDistrict) params.append('customer_district', appliedCustomerDistrict);
      if (appliedCustomerTahsil) params.append('customer_tahsil', appliedCustomerTahsil);
      if (appliedCustomerState) params.append('customer_state', appliedCustomerState);
      if (appliedCustomerPincode) params.append('customer_pincode', appliedCustomerPincode);
      
      const response = await axios.get(`api/orders/?${params.toString()}`);
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/api/orders/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
    },
  });

  // Use paginated data from server
  const ordersData = orders?.results || orders || [];
  const totalOrders = orders?.count || ordersData.length;
  const totalPages = Math.ceil(totalOrders / pageSize);

  // Calculate KPIs
  const totalRevenue = ordersData?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;

  // Track all telecallers seen so the list doesn't shrink when filtered
  useEffect(() => {
    if (ordersData && ordersData.length > 0) {
      const agents = [...new Set(ordersData.map(order => order.agent_name).filter(Boolean))];
      setAllAgents(prev => {
        const combined = [...new Set([...prev, ...agents])];
        return combined;
      });
    }
  }, [ordersData]);

  // Apply search filter completely server-side (fall-back container remains simple)
  const finalFilteredOrders = ordersData;

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedAgent(filterAgent);
    setAppliedStatus(filterStatus);
    setAppliedPaymentStatus(filterPaymentStatus);
    setAppliedProductName(productName);
    setAppliedBrandName(brandName);
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setAppliedMinItems(minItems);
    setAppliedMaxItems(maxItems);
    setAppliedDateFrom(pendingDateFrom);
    setAppliedDateTo(pendingDateTo);
    
    // Customer Applied States
    setAppliedCustomerPhone(customerPhone);
    setAppliedCustomerName(customerName);
    setAppliedCustomerSurname(customerSurname);
    setAppliedCustomerOrgName(customerOrgName);
    setAppliedCustomerOrgType(customerOrgType);
    setAppliedCustomerCustomerType(customerCustomerType);
    setAppliedCustomerTelecaller(customerTelecaller);
    
    setAppliedCustomerHouseFlatNo(customerHouseFlatNo);
    setAppliedCustomerWingLane(customerWingLane);
    setAppliedCustomerSocietyColony(customerSocietyColony);
    setAppliedCustomerLandmark(customerLandmark);
    setAppliedCustomerArea(customerArea);
    setAppliedCustomerCity(customerCity);
    setAppliedCustomerDistrict(customerDistrict);
    setAppliedCustomerTahsil(customerTahsil);
    setAppliedCustomerState(customerState);
    setAppliedCustomerPincode(customerPincode);

    setCurrentPage(1);
    setTimeout(() => {
      refetch();
    }, 0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterAgent('');
    setFilterStatus('');
    setFilterPaymentStatus('');
    setProductName('');
    setBrandName('');
    setMinPrice('');
    setMaxPrice('');
    setMinItems('');
    setMaxItems('');
    setPendingDateFrom('');
    setPendingDateTo('');

    // Customer Pending States
    setCustomerPhone('');
    setCustomerName('');
    setCustomerSurname('');
    setCustomerOrgName('');
    setCustomerOrgType('');
    setCustomerCustomerType('');
    setCustomerTelecaller('');
    
    setCustomerHouseFlatNo('');
    setCustomerWingLane('');
    setCustomerSocietyColony('');
    setCustomerLandmark('');
    setCustomerArea('');
    setCustomerCity('');
    setCustomerDistrict('');
    setCustomerTahsil('');
    setCustomerState('');
    setCustomerPincode('');

    setAppliedSearch('');
    setAppliedAgent('');
    setAppliedStatus('');
    setAppliedPaymentStatus('');
    setAppliedProductName('');
    setAppliedBrandName('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setAppliedMinItems('');
    setAppliedMaxItems('');
    setAppliedDateFrom('');
    setAppliedDateTo('');

    // Customer Applied States
    setAppliedCustomerPhone('');
    setAppliedCustomerName('');
    setAppliedCustomerSurname('');
    setAppliedCustomerOrgName('');
    setAppliedCustomerOrgType('');
    setAppliedCustomerCustomerType('');
    setAppliedCustomerTelecaller('');
    
    setAppliedCustomerHouseFlatNo('');
    setAppliedCustomerWingLane('');
    setAppliedCustomerSocietyColony('');
    setAppliedCustomerLandmark('');
    setAppliedCustomerArea('');
    setAppliedCustomerCity('');
    setAppliedCustomerDistrict('');
    setAppliedCustomerTahsil('');
    setAppliedCustomerState('');
    setAppliedCustomerPincode('');

    setCurrentPage(1);
    setTimeout(() => {
      refetch();
    }, 0);
  };

  // Helper: Get delivery address from order with fallback to customer primary address
  const getDeliveryAddress = (order) => {
    // If custom address, use order.delivery_address (string or object)
    if (order && order.delivery_address) {
      if (typeof order.delivery_address === 'string' && order.delivery_address.trim().length > 0 && order.delivery_address.trim().toLowerCase() !== 'n/a') {
        try {
          const parsed = JSON.parse(order.delivery_address);
          if (typeof parsed === 'object' && parsed !== null) {
            const addressParts = Object.values(parsed).filter(Boolean).map(v => String(v).trim()).filter(v => v !== '');
            if (addressParts.length > 0) return addressParts.join(', ');
          }
        } catch (e) {
          return order.delivery_address.trim();
        }
        return order.delivery_address.trim();
      }
      if (typeof order.delivery_address === 'object' && order.delivery_address !== null) {
        const addressParts = Object.values(order.delivery_address).filter(Boolean).map(v => String(v).trim()).filter(v => v !== '');
        if (addressParts.length > 0) return addressParts.join(', ');
      }
    }
    // Fallback: use customer primary address
    if (order && order.customer_details) {
      const addressParts = [
        order.customer_details.house_flat_no,
        order.customer_details.wing_lane,
        order.customer_details.society_colony,
        order.customer_details.landmark,
        order.customer_details.area,
        order.customer_details.city,
        order.customer_details.district,
        order.customer_details.state,
        order.customer_details.pincode,
      ].filter(Boolean).map(v => String(v).trim()).filter(v => v !== '');
      if (addressParts.length > 0) return addressParts.join(', ');
    }
    return 'N/A';
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center">
      Error loading orders: {error.message}
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-2 max-w-full flex-1 flex flex-col min-h-0">
        {/* Filters and Search - Static Top Section */}
        <div className="flex-none bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-2">
            {/* ================= ROW 1 (Order Basic Filters) ================= */}
            {/* Search - Increased width */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Search Order</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Order ID / Customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Order Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              >
                <option value="">All Statuses</option>
                <option value="Ordered">Ordered</option>
                <option value="Preparing">Preparing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Payment Status</label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              >
                <option value="">All Payments</option>
                <option value="credit">Credit</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {/* Product Name Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Product Name</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Product..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                />
              </div>
            </div>

            {/* Agent Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Order Telecaller</label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              >
                <option value="">All Telecallers</option>
                {allAgents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            {/* ================= ROW 2 (Customer Profile Filters) ================= */}
            {/* Cust Phone */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cust. Phone</label>
              <input
                type="text"
                placeholder="Phone..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              />
            </div>

            {/* Cust Name */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cust. Name</label>
              <input
                type="text"
                placeholder="Name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              />
            </div>

            {/* Cust Surname */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cust. Surname</label>
              <input
                type="text"
                placeholder="Surname..."
                value={customerSurname}
                onChange={(e) => setCustomerSurname(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              />
            </div>

            {/* Cust Org Name */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cust. Org Name</label>
              <input
                type="text"
                placeholder="Organization..."
                value={customerOrgName}
                onChange={(e) => setCustomerOrgName(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              />
            </div>

            {/* Cust Org Type */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cust. Org Type</label>
              <select
                value={customerOrgType}
                onChange={(e) => setCustomerOrgType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              >
                <option value="">All Org Types</option>
                {organizationTypes?.map(org => (
                  <option key={org.id} value={org.name}>{org.name}</option>
                ))}
              </select>
            </div>

            {/* Cust Type */}
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Cust. Type</label>
              <select
                value={customerCustomerType}
                onChange={(e) => setCustomerCustomerType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
              >
                <option value="">All Cust Types</option>
                {customerTypes?.map(ct => (
                  <option key={ct.id} value={ct.name}>{ct.name}</option>
                ))}
              </select>
            </div>

            {/* ================= ROW 3 (Customer Address Inline Scroll - Full Width) ================= */}
            <div className="xl:col-span-6 lg:col-span-4 col-span-1 flex flex-col justify-end">
              <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Customer Address (Pincode → House No)</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {/* Pincode */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={customerPincode}
                    onChange={(e) => setCustomerPincode(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* State */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="State"
                    value={customerState}
                    onChange={(e) => setCustomerState(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* Tahsil */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Tahsil"
                    value={customerTahsil}
                    onChange={(e) => setCustomerTahsil(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* District */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="District"
                    value={customerDistrict}
                    onChange={(e) => setCustomerDistrict(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* City */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="City"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* Area */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Area"
                    value={customerArea}
                    onChange={(e) => setCustomerArea(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* Landmark */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Landmark"
                    value={customerLandmark}
                    onChange={(e) => setCustomerLandmark(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* Society/Colony */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Society/Colony"
                    value={customerSocietyColony}
                    onChange={(e) => setCustomerSocietyColony(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* Wing/Lane */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Wing/Lane"
                    value={customerWingLane}
                    onChange={(e) => setCustomerWingLane(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
                {/* House/Flat No */}
                <div className="min-w-[110px] flex-1">
                  <input
                    type="text"
                    placeholder="Flat/House No"
                    value={customerHouseFlatNo}
                    onChange={(e) => setCustomerHouseFlatNo(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                  />
                </div>
              </div>
            </div>

            {/* ================= ROW 4 (Order Price/Items/Dates & Actions & KPIs & View Toggle) ================= */}
            <div className="xl:col-span-6 lg:col-span-4 col-span-1 flex flex-col justify-end pt-1">
              <div className="flex flex-wrap xl:flex-nowrap items-end justify-between gap-4 w-full">
                {/* Price, Items, and Date Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 flex-1 min-w-0">
                  {/* Price min */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Min Price (₹)</label>
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                    />
                  </div>

                  {/* Price max */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Max Price (₹)</label>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                    />
                  </div>

                  {/* Items min */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Min Items</label>
                    <input
                      type="number"
                      placeholder="Min Items"
                      value={minItems}
                      onChange={(e) => setMinItems(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                    />
                  </div>

                  {/* Items max */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Max Items</label>
                    <input
                      type="number"
                      placeholder="Max Items"
                      value={maxItems}
                      onChange={(e) => setMaxItems(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                    />
                  </div>

                  {/* Date From */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">From Date</label>
                    <input
                      type="date"
                      value={pendingDateFrom}
                      onChange={(e) => setPendingDateFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                    />
                  </div>

                  {/* Date To */}
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">To Date</label>
                    <input
                      type="date"
                      value={pendingDateTo}
                      onChange={(e) => setPendingDateTo(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm h-10"
                    />
                  </div>
                </div>

                {/* Actions & KPIs (Right portion) */}
                <div className="flex items-center gap-2 h-10 flex-shrink-0">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 h-full">
                    {/* Apply */}
                    <button
                      onClick={handleApplyFilters}
                      className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1 shadow-md hover:shadow-lg transition-all h-full"
                      title="Apply Filters"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Apply</span>
                    </button>
                    {/* Clear */}
                    <button
                      onClick={handleClearFilters}
                      className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-1 shadow-sm hover:shadow transition-all h-full"
                      title="Clear Filters"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                      <span>Clear</span>
                    </button>
                    {/* New Order */}
                    <button
                      onClick={() => navigate('/orders/new')}
                      className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1 shadow-md hover:shadow-lg transition-all h-full"
                      title="Create a new order"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New</span>
                    </button>
                  </div>

                  {/* KPIs & View Mode */}
                  <div className="flex items-center gap-1.5 h-full">
                    <div 
                      className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-1 text-sm font-bold text-blue-800 shadow-sm h-full" 
                      title="Total Orders count"
                    >
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                      <span>{totalOrders}</span>
                    </div>
                    <div 
                      className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg flex items-center gap-1 text-sm font-bold text-green-800 shadow-sm h-full" 
                      title="Total Revenue amount of orders"
                    >
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      <span>{totalRevenue.toLocaleString()}</span>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 h-full">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded transition-all h-full flex items-center justify-center ${viewMode === 'table' ? 'bg-white shadow-sm text-green-600 font-semibold' : 'text-gray-600'}`}
                        title="Table View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded transition-all h-full flex items-center justify-center ${viewMode === 'card' ? 'bg-white shadow-sm text-green-600 font-semibold' : 'text-gray-600'}`}
                        title="Card View"
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Flexible and Scrollable */}
        <div className="flex-1 min-h-0 flex flex-col">
          {viewMode === 'table' ? (
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                  <thead className="bg-[#1a2332] sticky top-0 z-10">
                    <tr>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Order ID</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Order Date</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Customer</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Org Name</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Org Type</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Phone</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Agent</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Total Amount</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Paid Amount</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Pending Amount</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Status</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Payment Status</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Delivery Address</th>
                      <th className="sticky top-0 z-10 bg-[#1a2332] px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)]">Actions</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finalFilteredOrders?.length > 0 ? (
                    finalFilteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-mono text-sm text-blue-600 hover:text-blue-900 font-medium transition-colors duration-200"
                          >
                            {order.order_id || `ORD-${order.id}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {`${order.customer_details?.name || order.customer_name || ""} ${order.customer_details?.surname || ""}`.trim()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_details?.company_name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_details?.company_type_display || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_details?.phone || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.agent_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">₹{parseFloat(order.total_amount || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-600">₹{parseFloat(order.paid_amount || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-red-600">
                            ₹{(parseFloat(order.total_amount || 0) - parseFloat(order.paid_amount || 0)).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'Dispatched'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'Processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.payment_status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : order.payment_status === 'Partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.payment_status === 'Credit'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-sm break-words" title={getDeliveryAddress(order)}>
                          {getDeliveryAddress(order)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/orders/edit/${order.id}`)}
                              className="text-green-600 hover:text-green-900 transition-colors duration-200"
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this order?')) {
                                  deleteMutation.mutate(order.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="14" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
                        {Math.min(currentPage * pageSize, totalOrders)}
                      </span>{" "}
                      of <span className="font-medium">{totalOrders}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
              {finalFilteredOrders?.length > 0 ? (
                finalFilteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                           <h3 className="font-semibold text-gray-900">{`${order.customer_details?.name || order.customer_name || ""} ${order.customer_details?.surname || ""}`.trim()}</h3>
                          <p className="text-sm text-gray-500 font-mono">{order.order_id || `ORD-${order.id}`}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'Delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'Processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.payment_status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_status === 'Failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {order.customer_details?.company_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Organization:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {order.customer_details.company_name} {order.customer_details.company_type_display ? `(${order.customer_details.company_type_display})` : ''}
                          </span>
                        </div>
                      )}
                      {order.customer_details?.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="text-sm font-medium text-gray-900">{order.customer_details.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Agent:</span>
                        <span className="text-sm font-medium text-gray-900">{order.agent_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="text-sm font-semibold text-green-600">₹{parseFloat(order.total_amount).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">View Details</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/orders/edit/${order.id}`)}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this order?')) {
                              deleteMutation.mutate(order.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
                  <p className="text-gray-500 text-center">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default OrderList;
