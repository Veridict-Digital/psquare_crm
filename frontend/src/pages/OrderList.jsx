import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Package, CheckCircle, Clock, TrendingUp, Users, Calendar, Filter, Search, Grid, List, DollarSign, ShoppingCart, Truck, AlertCircle, Plus, X } from 'lucide-react';

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

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [allAgents, setAllAgents] = useState([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-2 max-w-full">
        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            {/* Search */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Order ID / Customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Agent Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Telecaller</label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full bg-white transition-all duration-200 outline-none"
              >
                <option value="">All Telecallers</option>
                {allAgents.map(agent => (
                  <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full bg-white transition-all duration-200 outline-none"
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
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Payment</label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full bg-white transition-all duration-200 outline-none"
              >
                <option value="">All Payments</option>
                <option value="credit">Credit</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            {/* Product Name Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Product Name</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter by product..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Brand Name Filter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Brand Name</label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter by brand..."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Price range min */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Min Price (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Price range max */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Max Price (₹)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="100,000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Items min */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Min Items</label>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="Min"
                  value={minItems}
                  onChange={(e) => setMinItems(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Items max */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Max Items</label>
              <div className="relative">
                <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxItems}
                  onChange={(e) => setMaxItems(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Date From */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={pendingDateFrom}
                  onChange={(e) => setPendingDateFrom(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={pendingDateTo}
                  onChange={(e) => setPendingDateTo(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full transition-all duration-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons and KPIs in single toolbar line */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Apply Button */}
              <button
                onClick={handleApplyFilters}
                className="h-10 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg flex items-center space-x-2 font-semibold shadow hover:shadow-md transition-all duration-200 text-sm transform hover:-translate-y-0.5"
                title="Apply all filter criteria"
              >
                <Filter className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>

              {/* Clear Button */}
              <button
                onClick={handleClearFilters}
                className="h-10 px-4 bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center space-x-2 font-semibold border border-gray-200 shadow-sm transition-all duration-200 text-sm"
                title="Clear all filters and search"
              >
                <X className="w-4 h-4 text-gray-400" />
                <span>Clear Filters</span>
              </button>

              {/* New Order Button */}
              <button
                onClick={() => navigate('/orders/new')}
                className="h-10 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg flex items-center space-x-2 font-semibold shadow hover:shadow-md transition-all duration-200 text-sm transform hover:-translate-y-0.5"
                title="Create a new order"
              >
                <Plus className="w-4 h-4" />
                <span>New Order</span>
              </button>

              {/* Vertical divider */}
              <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>

              {/* Total Orders KPI badge */}
              <div className="h-10 px-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center space-x-2 shadow-sm text-sm" title="Total orders count">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-600">Total Orders:</span>
                <span className="font-bold text-blue-800">{totalOrders}</span>
              </div>

              {/* Total Revenue KPI badge */}
              <div className="h-10 px-4 bg-green-50 border border-green-100 rounded-lg flex items-center space-x-2 shadow-sm text-sm" title="Total revenue amount of orders">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-600">Total Revenue:</span>
                <span className="font-bold text-green-800">₹{totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 h-10 w-full sm:w-auto justify-end sm:justify-start">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 h-8 ${
                  viewMode === 'table'
                    ? 'bg-white shadow-sm text-green-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 font-medium'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="text-sm">Table</span>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 h-8 ${
                  viewMode === 'card'
                    ? 'bg-white shadow-sm text-green-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 font-medium'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#1a2332]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Order Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Paid Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Pending Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Payment Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Delivery Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
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
                            <span className="text-sm font-medium text-gray-900">{order.customer_name}</span>
                          </div>
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {order.items ? order.items.length : 0} items
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
                      <td colSpan="13" className="px-6 py-12 text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {finalFilteredOrders?.length > 0 ? (
              finalFilteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{order.customer_name}</h3>
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
        )}
      </div>
    </div>
  );
};

export default OrderList;
