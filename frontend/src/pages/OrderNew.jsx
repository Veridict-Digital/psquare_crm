import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  CreditCard,
  User,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
  IndianRupee,
  X,
  Minus,
  Plus as PlusIcon,
  MapPin,
} from "lucide-react";

const OrderNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    customer: "",
    agent: "",
    status: "Placed",
    payment_status: "Paid",
    followup_date: "",
    partial_amount: 0,
    delivery_address: "",
    delivery_option: "primary", // "primary" or "custom"
  });

  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [generatedOrderId, setGeneratedOrderId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  // Fetch customers, products, and combinations
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => axios.get("/api/customers/").then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => axios.get("/api/products/").then((res) => res.data),
  });

  const { data: combinations } = useQuery({
    queryKey: ["combinations"],
    queryFn: () => axios.get("/api/productcombinations/").then((res) => res.data),
  });

  // Filtered customers and products based on search
  const filteredCustomers =
    customers?.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch)
    ) || [];

  const filteredProducts =
    products?.filter(
      (product) =>
        product.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase())
    ) || [];

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/orders/", data);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedOrderId(data.order_id);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["customers"]);
      // Don't navigate immediately, show the order ID first
    },
  });

  // Calculate totals with combination logic
  const calculateTotals = () => {
    let itemsWithCombinations = [...orderItems];

    // Apply combinations if available
    if (combinations && combinations.length > 0) {
      combinations.forEach((combination) => {
        if (!combination.is_active) return;

        // Check if all required items are in the order with sufficient quantities
        const requiredItems = combination.combination_items || [];
        let canApplyCombination = true;

        requiredItems.forEach((reqItem) => {
          const orderItem = itemsWithCombinations.find(
            (item) => item.product === reqItem.product
          );
          if (!orderItem || orderItem.quantity < reqItem.quantity) {
            canApplyCombination = false;
          }
        });

        if (canApplyCombination) {
          // Add free items from combination rewards
          const rewards = combination.combination_rewards || [];
          rewards.forEach((reward) => {
            const existingFreeItem = itemsWithCombinations.find(
              (item) => item.product === reward.product && item.is_free
            );

            if (existingFreeItem) {
              existingFreeItem.quantity += reward.quantity;
            } else {
              const product = products?.find((p) => p.id === reward.product);
              if (product) {
                itemsWithCombinations.push({
                  product: product.id,
                  product_title: `${product.title} (FREE)`,
                  product_sku: product.sku,
                  quantity: reward.quantity,
                  unit_price: 0, // Free items have 0 price
                  gst_rate: product.gst_rate,
                  is_free: true,
                });
              }
            }
          });
        }
      });
    }

    const subtotal = itemsWithCombinations.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const gstTotal = itemsWithCombinations.reduce(
      (sum, item) =>
        sum + (item.unit_price * item.quantity * item.gst_rate) / 100,
      0
    );
    return {
      subtotal: subtotal,
      gstTotal: gstTotal,
      total: subtotal + gstTotal,
      itemsWithCombinations: itemsWithCombinations,
    };
  };

  const totals = calculateTotals();

  // Set customer from URL parameter on component mount
  useEffect(() => {
    const customerId = searchParams.get("customer");
    if (customerId && customers) {
      const customerExists = customers.find(
        (c) => c.id.toString() === customerId.toString()
      );
      if (customerExists) {
        setFormData((prev) => ({ ...prev, customer: customerId }));
      }
    }
  }, [searchParams, customers]);

  // Auto-assign agent based on customer selection
  useEffect(() => {
    if (formData.customer && customers) {
      const selectedCustomer = customers.find(
        (c) => c.id.toString() === formData.customer.toString()
      );
      if (selectedCustomer && selectedCustomer.agent) {
        setFormData((prev) => ({ ...prev, agent: selectedCustomer.agent }));
      } else {
        // Clear agent - backend will auto-assign to admin
        setFormData((prev) => ({ ...prev, agent: "" }));
      }
    }
  }, [formData.customer, customers]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setCustomerDropdownOpen(false);
        setCustomerSearch("");
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setProductDropdownOpen(false);
        setProductSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Set followup date if payment status is credit
    if (name === "payment_status" && value === "Credit") {
      const today = new Date();
      const followupDate = new Date(today.setDate(today.getDate() + 30))
        .toISOString()
        .split("T")[0];
      setFormData((prev) => ({
        ...prev,
        followup_date: followupDate,
        partial_amount: 0,
      }));
    } else if (name === "payment_status" && value === "Paid") {
      setFormData((prev) => ({
        ...prev,
        followup_date: "",
        partial_amount: 0,
      }));
    } else if (name === "payment_status" && value === "Partial") {
      setFormData((prev) => ({ ...prev, followup_date: "" }));
    }

    // Handle delivery option change
    if (name === "delivery_option") {
      if (value === "primary" && formData.customer) {
        const customer = customers?.find(
          (c) => c.id.toString() === formData.customer.toString()
        );
        if (customer) {
          const fullAddress = [
            customer.house_flat_no,
            customer.wing_lane,
            customer.society_colony,
            customer.area,
            customer.city,
            customer.district,
            customer.state,
            customer.pincode,
          ].filter(Boolean).join(", ");
          setFormData((prev) => ({ ...prev, delivery_address: fullAddress }));
        }
      } else if (value === "custom") {
        setFormData((prev) => ({ ...prev, delivery_address: "" }));
      }
    }
  };

  const addProduct = () => {
    if (!selectedProduct || quantity <= 0) return;

    const product = products.find(
      (p) => p.id.toString() === selectedProduct.toString()
    );
    if (!product) return;

    // Check if product already exists in order items
    const existingItem = orderItems.find((item) => item.product === product.id);
    if (existingItem) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.product === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          product: product.id,
          product_title: product.title,
          product_sku: product.sku,
          quantity: quantity,
          unit_price: parseFloat(product.price),
          gst_rate: parseFloat(product.gst_rate),
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity(1);
  };

  const removeProduct = (productId) => {
    setOrderItems((prev) => prev.filter((item) => item.product !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    const orderData = {
      customer: formData.customer,
      agent: formData.agent || undefined,
      status: formData.status,
      payment_status: formData.payment_status,
      ...(formData.followup_date && { followup_date: formData.followup_date }),
      delivery_address: formData.delivery_address,
      total_amount: totals.total,
      paid_amount:
        formData.payment_status === "Paid"
          ? totals.total
          : formData.payment_status === "Partial"
          ? parseFloat(formData.partial_amount)
          : 0,
      items: orderItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate,
      })),
    };

    mutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 max-w-full">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
             New Order
            </h1>
          </div>
          <div className="">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Customer
              </label>
              <div className="relative" ref={customerDropdownRef}>
                <button
                  type="button"
                  onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50 text-left flex items-center justify-between"
                >
                  <span
                    className={
                      formData.customer ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {formData.customer
                      ? customers?.find(
                          (c) =>
                            c.id.toString() === formData.customer.toString()
                        )?.name
                      : "Select Customer"}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      customerDropdownOpen ? "rotate-180" : ""
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
                {customerDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search customers..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="py-1">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                customer: customer.id,
                              }));
                              setCustomerDropdownOpen(false);
                              setCustomerSearch("");
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            {customer.name} - {customer.phone}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">
                          No customers found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-purple-500" />
                Agent
              </label>
              <input
                type="text"
                value={
                  customers?.find(
                    (c) => c.id.toString() === formData.customer?.toString()
                  )?.agent_name || ""
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 transition-all duration-200"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-500" />
                Address
              </label>
              <input
                type="text"
                value={
                  formData.customer
                    ? (() => {
                        const customer = customers?.find(
                          (c) =>
                            c.id.toString() === formData.customer.toString()
                        );
                        return customer
                          ? [
                              customer.house_flat_no,
                              customer.wing_lane,
                              customer.society_colony,
                              customer.area,
                              customer.city,
                              customer.district,
                              customer.state,
                              customer.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")
                          : "";
                      })()
                    : ""
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 transition-all duration-200"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
              >
                <option value="Placed">Placed</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-indigo-500" />
                Payment Status
              </label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
              >
                <option value="Paid">Full Paid</option>
                <option value="Partial">Partial</option>
                <option value="Credit">Credit</option>
              </select>
            </div>
          

          {/* Delivery Address Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-red-500" />
              Delivery Address Option
            </label>
            <select
              name="delivery_option"
              value={formData.delivery_option}
              onChange={handleFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
            >
              <option value="primary">Use Primary Address</option>
              <option value="custom">Enter Custom Address</option>
            </select>
          </div>

          {/* Delivery Address Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-red-500" />
              Delivery Address
            </label>
            <textarea
              name="delivery_address"
              value={formData.delivery_address}
              onChange={handleFormChange}
              placeholder={formData.delivery_option === "custom" ? "Enter delivery address" : "Primary address will be used"}
              rows="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
              readOnly={formData.delivery_option === "primary"}
            />
          </div>

          {/* Conditional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {formData.payment_status === "Credit" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  Follow-up Date
                </label>
                <input
                  type="date"
                  name="followup_date"
                  value={formData.followup_date}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                  required
                />
              </div>
            )}

            {formData.payment_status === "Partial" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-2 text-yellow-500" />
                  Partial Payment Amount
                </label>
                <input
                  type="number"
                  name="partial_amount"
                  value={formData.partial_amount}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                  required
                />
              </div>
            )}
          </div>
          </div>
        </div>
        </div>

        {/* Horizontal Order Details */}
        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Add Products</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-purple-500" />
                  Product
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:bg-gray-50 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        selectedProduct ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {selectedProduct
                        ? products?.find(
                            (p) =>
                              p.id.toString() === selectedProduct.toString()
                          )?.title +
                          " (SKU: " +
                          products?.find(
                            (p) =>
                              p.id.toString() === selectedProduct.toString()
                          )?.sku +
                          ") - ₹" +
                          products?.find(
                            (p) =>
                              p.id.toString() === selectedProduct.toString()
                          )?.price +
                          " (Stock: " +
                          products?.find(
                            (p) =>
                              p.id.toString() === selectedProduct.toString()
                          )?.stock_qty +
                          ")"
                        : "Select Product"}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        productDropdownOpen ? "rotate-180" : ""
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
                  {productDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="py-1">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(product.id);
                                setProductDropdownOpen(false);
                                setProductSearch("");
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center space-x-3"
                            >
                              <div className="flex-shrink-0">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-600">
                                  SKU: {product.sku} • ₹{product.price} • Stock: {product.stock_qty}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">
                            No products found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-green-500" />
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:bg-gray-50"
                />
              </div>

              <button
                type="button"
                onClick={addProduct}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                disabled={!selectedProduct}
              >
                <Plus className="w-5 h-5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Items
              </h3>
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No products added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {totals.itemsWithCombinations?.map((item) => (
                    <div
                      key={`${item.product}-${item.is_free ? 'free' : 'paid'}`}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        item.is_free ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className={`font-medium ${item.is_free ? 'text-green-900' : 'text-gray-900'}`}>
                          {item.product_title}
                          {item.is_free && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              FREE
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          SKU: {item.product_sku}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          {!item.is_free && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product, item.quantity - 1)
                                }
                                className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product, item.quantity + 1)
                                }
                                className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          )}
                          {item.is_free && (
                            <span className="text-sm text-green-600 font-medium">
                              Quantity: {item.quantity}
                            </span>
                          )}
                          <span className={`text-sm ${item.is_free ? 'text-green-600' : 'text-gray-600'}`}>
                            ₹{item.unit_price} × {item.quantity} = ₹
                            {(item.unit_price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {!item.is_free && (
                        <button
                          onClick={() => removeProduct(item.product)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />

                        </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Combo Offers Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <Package className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Combo Offers</h2>
            </div>

            {selectedProduct ? (
              (() => {
                const selectedProductId = parseInt(selectedProduct);
                const relatedCombinations = combinations?.filter(
                  (combo) =>
                    combo.is_active &&
                    combo.items?.some((item) => item.product === selectedProductId)
                ) || [];

                if (relatedCombinations.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No combo offers available for this product.
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Select a different product to see available offers.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {relatedCombinations.map((combo) => {
                      const requiredItems = combo.items || [];
                      const rewardItems = combo.rewards || [];

                      return (
                        <div
                          key={combo.id}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            // Apply the combo offer
                            requiredItems.forEach((reqItem) => {
                              const product = products?.find((p) => p.id === reqItem.product);
                              if (product) {
                                const existingItem = orderItems.find((item) => item.product === product.id);
                                if (existingItem) {
                                  setOrderItems((prev) =>
                                    prev.map((item) =>
                                      item.product === product.id
                                        ? { ...item, quantity: item.quantity + reqItem.quantity_required }
                                        : item
                                    )
                                  );
                                } else {
                                  setOrderItems((prev) => [
                                    ...prev,
                                    {
                                      product: product.id,
                                      product_title: product.title,
                                      product_sku: product.sku,
                                      quantity: reqItem.quantity_required,
                                      unit_price: parseFloat(product.price),
                                      gst_rate: parseFloat(product.gst_rate),
                                    },
                                  ]);
                                }
                              }
                            });

                            // Add free items
                            rewardItems.forEach((reward) => {
                              const product = products?.find((p) => p.id === reward.product);
                              if (product) {
                                setOrderItems((prev) => [
                                  ...prev,
                                  {
                                    product: product.id,
                                    product_title: `${product.title} (FREE)`,
                                    product_sku: product.sku,
                                    quantity: reward.quantity_free,
                                    unit_price: 0,
                                    gst_rate: parseFloat(product.gst_rate),
                                    is_free: true,
                                  },
                                ]);
                              }
                            });

                            // Clear selection
                            setSelectedProduct("");
                            setQuantity(1);
                          }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {combo.name}
                              </h4>
                              {combo.description && (
                                <p className="text-sm text-gray-600 mb-3">
                                  {combo.description}
                                </p>
                              )}
                            </div>
                            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                              Click to Apply
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Buy:
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {requiredItems.map((item, index) => {
                                  const product = products?.find(
                                    (p) => p.id === item.product
                                  );
                                  return (
                                    <span
                                      key={index}
                                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                                        item.product === selectedProductId
                                          ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {product?.title} x{item.quantity_required}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <span className="text-sm font-medium text-green-700">
                                Get FREE:
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {rewardItems.map((reward, index) => {
                                  const product = products?.find(
                                    (p) => p.id === reward.product
                                  );
                                  return (
                                    <span
                                      key={index}
                                      className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-300 font-medium"
                                    >
                                      {product?.title} x{reward.quantity_free}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Select a product to see combo offers
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Choose a product from the left panel to view available combo deals.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Order Summary
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-sm font-medium text-blue-600 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-1" />
                  Subtotal
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  ₹{totals.subtotal.toFixed(2)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-sm font-medium text-purple-600 flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  GST Total
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  ₹{totals.gstTotal.toFixed(2)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-sm font-medium text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Grand Total
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ₹{totals.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Order ID */}
        {generatedOrderId && (
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-green-900">
                Order Created Successfully!
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">
                  Order ID
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={generatedOrderId}
                    readOnly
                    className="px-4 py-3 border border-green-300 rounded-xl bg-white text-green-900 font-mono text-lg"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(generatedOrderId)
                    }
                    className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>View All Orders</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderNew;
