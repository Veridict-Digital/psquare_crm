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
  Filter,
  BarChart3,
  TrendingUp,
  Eye,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Star,
  AlertCircle,
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
    payment_status: "Credit",
    followup_date: "",
    partial_amount: 0,
    delivery_address: "",
    delivery_option: "primary", // "primary" or "custom"
  });

  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [generatedOrderId, setGeneratedOrderId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [appliedCombos, setAppliedCombos] = useState([]);
  const [showComboSelection, setShowComboSelection] = useState(false);

  // Multi-select functionality
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productFilters, setProductFilters] = useState({
    category: "",
    priceRange: "",
    stockStatus: "",
    search: "",
  });
  const [comboFilters, setComboFilters] = useState({
    savingsRange: "",
    category: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [compactView, setCompactView] = useState(false);

  // Customer KPIs and 360-degree view
  const [customerKPIs, setCustomerKPIs] = useState(null);
  const [productKPIs, setProductKPIs] = useState([]);
  const [showCustomerInsights, setShowCustomerInsights] = useState(false);

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
    queryFn: () =>
      axios.get("/api/productcombinations/").then((res) => res.data),
  });

  // Filtered customers and products based on search
  const filteredCustomers =
    (customers?.results || customers || []).filter(
      (customer) =>
        customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone?.includes(customerSearch),
    ) || [];

  const filteredProducts =
    products?.filter(
      (product) =>
        product.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase()),
    ) || [];

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/orders/", data);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedOrderId(data.order_id);
      setShowSuccessModal(true);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["customers"]);

      // Clear the form after successful order creation
      setFormData({
        customer: "",
        agent: "",
        status: "Placed",
        payment_status: "Credit",
        followup_date: "",
        partial_amount: 0,
        delivery_address: "",
        delivery_option: "primary",
      });
      setOrderItems([]);
      setSelectedProduct("");
      setQuantity(1);
      setSelectedProducts([]);
      setAppliedCombos([]);
      setCustomerKPIs(null);
    },
    onError: (error) => {
      // Handle validation errors from backend
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === "object" && errorData.detail) {
          alert(`Error: ${errorData.detail}`);
        } else if (Array.isArray(errorData) && errorData.length > 0) {
          // Handle array of errors (like from ValidationError)
          alert(`Error: ${errorData[0]}`);
        } else {
          alert(
            "An error occurred while creating the order. Please try again.",
          );
        }
      } else {
        alert("An error occurred while creating the order. Please try again.");
      }
    },
  });

  // Calculate totals with combination logic - Inclusive GST
  const calculateTotals = () => {
    let itemsWithCombinations = [...orderItems];

    // First, remove any free/gift items that are no longer valid
    itemsWithCombinations = itemsWithCombinations.filter((item) => {
      if (!item.is_free && !item.is_gift) return true; // Keep paid items

      // Check if the combo that provided this free/gift item is still valid
      const combo = combinations?.find((c) => c.id === item.combo_id);
      if (!combo || !appliedCombos.includes(combo.id)) return false;

      // Check if all required items for this combo are still present
      const requiredItems = combo.items || [];
      return requiredItems.every((reqItem) => {
        const orderItem = itemsWithCombinations.find(
          (i) => i.product === reqItem.product && !i.is_free && !i.is_gift,
        );
        return orderItem && orderItem.quantity >= reqItem.quantity_required;
      });
    });

    // Create a copy of items to apply combo prices
    let finalItems = [...itemsWithCombinations];

    // Apply combo offer prices to items
    if (combinations && combinations.length > 0 && appliedCombos.length > 0) {
      appliedCombos.forEach((comboId) => {
        const combination = combinations.find((c) => c.id === comboId);
        if (!combination || !combination.is_active) return;

        // Apply offer prices to required items
        const requiredItems = combination.items || [];
        requiredItems.forEach((reqItem) => {
          if (reqItem.offer_price && reqItem.offer_price > 0) {
            // Find the item in finalItems and update its price
            const itemIndex = finalItems.findIndex(
              (item) =>
                item.product === reqItem.product &&
                !item.is_free &&
                !item.is_gift,
            );
            if (itemIndex !== -1) {
              const item = finalItems[itemIndex];
              // Apply offer price
              finalItems[itemIndex] = {
                ...item,
                unit_price: parseFloat(reqItem.offer_price),
                original_price: item.original_price || item.unit_price, // Store original price
              };
            }
          }
        });
      });
    }

    // Calculate totals with Inclusive GST
    let subtotal = 0;
    let gstAmount = 0;
    let totalDiscount = 0;

    finalItems.forEach((item) => {
      if (!item.is_free && !item.is_gift) {
        // For paid items
        const itemTotal = item.unit_price * item.quantity;

        // For inclusive GST: GST is already included in the price
        // We need to calculate the GST amount from the inclusive price
        const gstRate = !isNaN(item.gst_rate_value) ? item.gst_rate_value : 0;

        // Calculate GST amount from inclusive price
        // GST = (price × GST rate) / (100 + GST rate)
        const itemGST = (itemTotal * gstRate) / (100 + gstRate);

        // Calculate taxable value (price without GST)
        const taxableValue = itemTotal - itemGST;

        subtotal += taxableValue;
        gstAmount += itemGST;

        // Calculate discount if there was an original price
        if (item.original_price && item.original_price > item.unit_price) {
          const originalTotal = item.original_price * item.quantity;
          const originalTaxableValue =
            originalTotal - (originalTotal * gstRate) / (100 + gstRate);
          totalDiscount += originalTaxableValue - taxableValue;
        }
      }
    });

    // Grand total is the sum of all paid items (already includes GST)
    const grandTotal = finalItems.reduce((sum, item) => {
      if (!item.is_free && !item.is_gift) {
        return sum + item.unit_price * item.quantity;
      }
      return sum;
    }, 0);

    return {
      subtotal: subtotal,
      gstAmount: gstAmount,
      total: grandTotal,
      itemsWithCombinations: finalItems,
      totalDiscount: totalDiscount,
    };
  };

  const totals = calculateTotals();

  // Set customer from URL parameter on component mount
  useEffect(() => {
    const customerId = searchParams.get("customer");
    if (customerId && customers) {
      const customerExists = customers?.results?.find(
        (c) => c.id.toString() === customerId.toString(),
      );
      if (customerExists) {
        setFormData((prev) => ({ ...prev, customer: customerId }));
      }
    }
  }, [searchParams, customers]);

  // Auto-assign agent based on customer selection
  useEffect(() => {
    if (formData.customer && customers) {
      const selectedCustomer = customers?.results?.find(
        (c) => c.id.toString() === formData.customer.toString(),
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
        const customer = customers?.results?.find(
          (c) => c.id.toString() === formData.customer.toString(),
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
          ]
            .filter(Boolean)
            .join(", ");
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
      (p) => p.id.toString() === selectedProduct.toString(),
    );
    if (!product) return;

    // Check if product already exists in order items
    const existingItem = orderItems.find((item) => item.product === product.id);
    if (existingItem) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.product === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                original_price:
                  item.original_price || parseFloat(product.price),
              }
            : item,
        ),
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          product: product.id,
          product_title: product.title,
          product_sku: product.sku,
          quantity: quantity,
          unit_price: parseFloat(product.price) || 0,
          original_price: parseFloat(product.price) || 0,
          gst_rate: product.gst_rate,
          gst_rate_value: !isNaN(parseFloat(product.gst_rate_display))
            ? parseFloat(product.gst_rate_display)
            : 0,
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
        item.product === productId ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  // Multi-select functionality
  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const addSelectedProducts = () => {
    if (selectedProducts.length === 0) return;

    selectedProducts.forEach((productId) => {
      const product = products.find(
        (p) => p.id.toString() === productId.toString(),
      );
      if (product) {
        const existingItem = orderItems.find(
          (item) => item.product === product.id,
        );
        if (existingItem) {
          setOrderItems((prev) =>
            prev.map((item) =>
              item.product === product.id
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    original_price:
                      item.original_price || parseFloat(product.price),
                  }
                : item,
            ),
          );
        } else {
          setOrderItems((prev) => [
            ...prev,
            {
              product: product.id,
              product_title: product.title,
              product_sku: product.sku,
              quantity: 1,
              unit_price: parseFloat(product.price) || 0,
              original_price: parseFloat(product.price) || 0,
              gst_rate: product.gst_rate,
              gst_rate_value: !isNaN(parseFloat(product.gst_rate_display))
                ? parseFloat(product.gst_rate_display)
                : 0,
            },
          ]);
        }
      }
    });

    setSelectedProducts([]);
  };

  // Enhanced filtering
  const getFilteredProducts = () => {
    let filtered = products || [];

    if (productFilters.search) {
      filtered = filtered.filter(
        (product) =>
          product.title
            .toLowerCase()
            .includes(productFilters.search.toLowerCase()) ||
          product.sku
            .toLowerCase()
            .includes(productFilters.search.toLowerCase()),
      );
    }

    if (productFilters.category) {
      filtered = filtered.filter(
        (product) => product.category?.toString() === productFilters.category,
      );
    }

    if (productFilters.priceRange) {
      const [min, max] = productFilters.priceRange.split("-").map(Number);
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price);
        return max ? price >= min && price <= max : price >= min;
      });
    }

    if (productFilters.stockStatus) {
      filtered = filtered.filter((product) => {
        const stock = product.stock_qty;
        switch (productFilters.stockStatus) {
          case "in-stock":
            return stock > 10;
          case "low-stock":
            return stock > 0 && stock <= 10;
          case "out-of-stock":
            return stock === 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  // Calculate product KPIs
  const calculateProductKPIs = () => {
    if (!products) return [];

    return products
      .map((product) => {
        // Mock calculations - in real app, this would come from order history
        const totalSales = Math.floor(Math.random() * 1000) + 100;
        const stockLevel = product.stock_qty;
        const averagePrice = parseFloat(product.price);
        const popularityScore = Math.floor(Math.random() * 100) + 1;

        return {
          productId: product.id,
          totalSales,
          stockLevel,
          averagePrice,
          popularityScore,
          performance:
            popularityScore > 70
              ? "high"
              : popularityScore > 40
                ? "medium"
                : "low",
        };
      })
      .sort((a, b) => b.popularityScore - a.popularityScore);
  };

  // Fetch customer KPIs when customer is selected
  useEffect(() => {
    if (formData.customer && customers) {
      const customer = customers?.results?.find(
        (c) => c.id.toString() === formData.customer.toString(),
      );
      if (customer) {
        // Mock customer KPIs - in real app, this would be fetched from API
        setCustomerKPIs({
          totalOrders: Math.floor(Math.random() * 50) + 1,
          totalValue: Math.floor(Math.random() * 50000) + 1000,
          averageOrderValue: Math.floor(Math.random() * 2000) + 500,
          lastOrderDate: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .split("T")[0],
          customerType: customer.contact_type,
          loyaltyScore: Math.floor(Math.random() * 100) + 1,
        });
      }
    }
  }, [formData.customer, customers]);

  // Calculate product KPIs on mount
  useEffect(() => {
    if (products) {
      setProductKPIs(calculateProductKPIs());
    }
  }, [products]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    // Get the final items with applied combo prices
    const finalItems = totals.itemsWithCombinations;

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
      items: finalItems
        .filter((item) => !item.is_free && !item.is_gift)
        .map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price,
          gst_rate: item.gst_rate_value || 0,
        })),
      applied_combos: appliedCombos,
    };

    mutation.mutate(orderData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
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
                    onClick={() =>
                      setCustomerDropdownOpen(!customerDropdownOpen)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        formData.customer ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {formData.customer
                        ? customers?.results?.find(
                            (c) =>
                              c.id.toString() === formData.customer.toString(),
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
                    customers?.results?.find(
                      (c) => c.id.toString() === formData.customer?.toString(),
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
                          const customer = customers?.results?.find(
                            (c) =>
                              c.id.toString() === formData.customer.toString(),
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
                  placeholder={
                    formData.delivery_option === "custom"
                      ? "Enter delivery address"
                      : "Primary address will be used"
                  }
                  rows="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                  readOnly={formData.delivery_option === "primary"}
                />
              </div>

              {/* Conditional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
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
                      className="w-full px-2 py-1 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:bg-gray-50"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Insights Section */}
        {formData.customer && customerKPIs && (
          <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Customer 360° View
              </h2>
              <button
                onClick={() => setShowCustomerInsights(!showCustomerInsights)}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                {showCustomerInsights ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
            {showCustomerInsights && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600 flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Total Orders
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {customerKPIs.totalOrders}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    Total Value
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    ₹{customerKPIs.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-purple-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Avg Order Value
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    ₹{customerKPIs.averageOrderValue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Add Products
                </h2>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productFilters.search}
                      onChange={(e) =>
                        setProductFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Range
                    </label>
                    <select
                      value={productFilters.priceRange}
                      onChange={(e) =>
                        setProductFilters((prev) => ({
                          ...prev,
                          priceRange: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Prices</option>
                      <option value="0-100">₹0 - ₹100</option>
                      <option value="100-500">₹100 - ₹500</option>
                      <option value="500-1000">₹500 - ₹1000</option>
                      <option value="1000">₹1000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Status
                    </label>
                    <select
                      value={productFilters.stockStatus}
                      onChange={(e) =>
                        setProductFilters((prev) => ({
                          ...prev,
                          stockStatus: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">All Stock</option>
                      <option value="in-stock">In Stock (10+)</option>
                      <option value="low-stock">Low Stock (1-10)</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-select Product List */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Products
                </label>
                <span className="text-sm text-gray-500">
                  {selectedProducts.length} selected
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {getFilteredProducts().length > 0 ? (
                  getFilteredProducts().map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedProducts.includes(product.id.toString())
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleProductSelection(product.id.toString())
                        }
                        className="mr-3"
                      >
                        {selectedProducts.includes(product.id.toString()) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      <div className="flex-shrink-0 mr-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          SKU: {product.sku} • ₹{product.price} (Incl. GST) •
                          Stock: {product.stock_qty}
                          {product.stock_qty === 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Out of Stock
                            </span>
                          )}
                          {product.stock_qty > 0 && product.stock_qty < 5 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No products found
                  </div>
                )}
              </div>
              {selectedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={addSelectedProducts}
                  className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Selected Products ({selectedProducts.length})</span>
                </button>
              )}
            </div>

            {/* Single Product Quick Add */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-3 mb-3">
                <Package className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">
                  Quick Add Single Product
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white hover:bg-gray-50 text-left flex items-center justify-between text-sm"
                  >
                    <span
                      className={
                        selectedProduct ? "text-gray-900" : "text-gray-500"
                      }
                    >
                      {selectedProduct
                        ? products?.find(
                            (p) =>
                              p.id.toString() === selectedProduct.toString(),
                          )?.title
                        : "Select Product"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${productDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {productDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                      <div className="p-2 border-b border-gray-200">
                        <input
                          type="text"
                          placeholder="Search..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="py-1">
                        {filteredProducts.slice(0, 10).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product.id);
                              setProductDropdownOpen(false);
                              setProductSearch("");
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                          >
                            {product.title} - ₹{product.price} (Incl. GST)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addProduct}
                    disabled={!selectedProduct}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Combo Offers Section - Show only when product is selected */}
            {selectedProduct && (
              <div className="mt-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Package className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Related Combo Offers
                  </h3>
                </div>

                {(() => {
                  const selectedProductId = parseInt(selectedProduct);
                  const relatedCombinations =
                    combinations?.filter(
                      (combo) =>
                        combo.is_active &&
                        combo.items?.some(
                          (item) => item.product === selectedProductId,
                        ),
                    ) || [];

                  if (relatedCombinations.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No combo offers available for this product
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {relatedCombinations.map((combo) => {
                        const requiredItems = combo.items || [];
                        const rewardItems = combo.rewards || [];
                        const giftItems = combo.gifts || [];

                        // Check if combo can be applied (all required items are in order)
                        const canApplyCombo = requiredItems.every((reqItem) => {
                          const orderItem = orderItems.find(
                            (item) => item.product === reqItem.product,
                          );
                          return (
                            orderItem &&
                            orderItem.quantity >= reqItem.quantity_required
                          );
                        });

                        return (
                          <div
                            key={combo.id}
                            className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                              appliedCombos.includes(combo.id)
                                ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 cursor-pointer"
                                : canApplyCombo
                                  ? "bg-gradient-to-br from-blue-50 to-blue-50 border-blue-200 cursor-pointer"
                                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                            }`}
                            onClick={() => {
                              // Apply the combo offer
                              requiredItems.forEach((reqItem) => {
                                const product = products?.find(
                                  (p) => p.id === reqItem.product,
                                );
                                if (product) {
                                  const existingItem = orderItems.find(
                                    (item) => item.product === product.id,
                                  );
                                  if (existingItem) {
                                    setOrderItems((prev) =>
                                      prev.map((item) =>
                                        item.product === product.id
                                          ? {
                                              ...item,
                                              quantity: Math.max(
                                                item.quantity,
                                                reqItem.quantity_required,
                                              ),
                                              unit_price:
                                                reqItem.offer_price &&
                                                reqItem.offer_price > 0
                                                  ? parseFloat(
                                                      reqItem.offer_price,
                                                    )
                                                  : item.unit_price,
                                              original_price:
                                                reqItem.offer_price &&
                                                reqItem.offer_price > 0
                                                  ? item.original_price ||
                                                    parseFloat(product.price)
                                                  : item.original_price ||
                                                    parseFloat(product.price),
                                            }
                                          : item,
                                      ),
                                    );
                                  } else {
                                    setOrderItems((prev) => [
                                      ...prev,
                                      {
                                        product: product.id,
                                        product_title: product.title,
                                        product_sku: product.sku,
                                        quantity: reqItem.quantity_required,
                                        unit_price:
                                          reqItem.offer_price &&
                                          reqItem.offer_price > 0
                                            ? parseFloat(reqItem.offer_price)
                                            : parseFloat(product.price),
                                        original_price: parseFloat(
                                          product.price,
                                        ),
                                        gst_rate: product.gst_rate,
                                        gst_rate_value:
                                          product.gst_rate_display &&
                                          !isNaN(
                                            parseFloat(
                                              product.gst_rate_display,
                                            ),
                                          )
                                            ? parseFloat(
                                                product.gst_rate_display,
                                              )
                                            : 0,
                                      },
                                    ]);
                                  }
                                }
                              });

                              // Add free items
                              rewardItems.forEach((reward) => {
                                const product = products?.find(
                                  (p) => p.id === reward.product,
                                );
                                if (product) {
                                  setOrderItems((prev) => [
                                    ...prev,
                                    {
                                      product: product.id,
                                      product_title: `${product.title} (FREE)`,
                                      product_sku: product.sku,
                                      quantity: reward.quantity_free,
                                      unit_price: 0,
                                      gst_rate: product.gst_rate,
                                      gst_rate_value: parseFloat(
                                        product.gst_rate_display || 0,
                                      ),
                                      is_free: true,
                                    },
                                  ]);
                                }
                              });

                              // Add gifts
                              giftItems.forEach((gift) => {
                                const product = products?.find(
                                  (p) => p.id === gift.product,
                                );
                                if (product) {
                                  setOrderItems((prev) => [
                                    ...prev,
                                    {
                                      product: product.id,
                                      product_title: `${product.title} (GIFT)`,
                                      product_sku: product.sku,
                                      quantity: 1,
                                      unit_price: 0,
                                      gst_rate: product.gst_rate,
                                      gst_rate_value: parseFloat(
                                        product.gst_rate_display || 0,
                                      ),
                                      is_gift: true,
                                    },
                                  ]);
                                }
                              });

                              // Add to applied combos for display
                              setAppliedCombos((prev) => [...prev, combo.id]);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">
                                  {combo.name}
                                </h4>
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  appliedCombos.includes(combo.id)
                                    ? "bg-green-100 text-green-800"
                                    : canApplyCombo
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {appliedCombos.includes(combo.id)
                                  ? "Applied"
                                  : canApplyCombo
                                    ? "Available"
                                    : "Add to apply"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  Buy:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {requiredItems.map((item, index) => {
                                    const product = products?.find(
                                      (p) => p.id === item.product,
                                    );
                                    const inOrder = orderItems.find(
                                      (orderItem) =>
                                        orderItem.product === item.product,
                                    );
                                    const hasEnough =
                                      inOrder &&
                                      inOrder.quantity >=
                                        item.quantity_required;
                                    return (
                                      <span
                                        key={index}
                                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                                          hasEnough
                                            ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {product?.title} x
                                        {item.quantity_required}
                                        {item.offer_price &&
                                          item.offer_price > 0 && (
                                            <span className="ml-1 text-green-600">
                                              ₹{item.offer_price} (Incl. GST)
                                            </span>
                                          )}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>

                              {rewardItems.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-green-700">
                                    Get FREE:
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {rewardItems.map((reward, index) => {
                                      const product = products?.find(
                                        (p) => p.id === reward.product,
                                      );
                                      return (
                                        <span
                                          key={index}
                                          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full border border-green-300 font-medium"
                                        >
                                          {product?.title} x
                                          {reward.quantity_free} (₹
                                          {parseFloat(
                                            product?.price || 0,
                                          ).toFixed(2)}{" "}
                                          Incl. GST)
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {giftItems.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-purple-700">
                                    Gifts:
                                  </span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {giftItems.map((gift, index) => {
                                      const product = products?.find(
                                        (p) => p.id === gift.product,
                                      );
                                      return (
                                        <span
                                          key={index}
                                          className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full border border-purple-300 font-medium"
                                        >
                                          {product?.title} (₹
                                          {parseFloat(
                                            product?.price || 0,
                                          ).toFixed(2)}{" "}
                                          Incl. GST)
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

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
                      key={`${item.product}-${item.is_free ? "free" : "paid"}`}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        item.is_free
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${item.is_free ? "text-green-900" : "text-gray-900"}`}
                        >
                          {item.product_title}
                          {item.is_free && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              FREE
                            </span>
                          )}
                          {item.original_price &&
                            item.original_price > item.unit_price && (
                              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                COMBO PRICE
                              </span>
                            )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          SKU: {item.product_sku}
                          {!item.is_free && !item.is_gift && (
                            <span className="ml-2">
                              GST: {item.gst_rate_value || 0}%
                            </span>
                          )}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          {!item.is_free && !item.is_gift && (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product,
                                    item.quantity - 1,
                                  )
                                }
                                className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product,
                                    item.quantity + 1,
                                  )
                                }
                                className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          )}
                          {(item.is_free || item.is_gift) && (
                            <span className="text-sm text-green-600 font-medium">
                              Quantity: {item.quantity}
                            </span>
                          )}
                          <div className="flex flex-col">
                            <span
                              className={`text-sm ${item.is_free ? "text-green-600" : "text-gray-600"}`}
                            >
                              ₹{item.unit_price.toFixed(2)} × {item.quantity} =
                              ₹{(item.unit_price * item.quantity).toFixed(2)}
                            </span>
                            {item.original_price &&
                              item.original_price > item.unit_price && (
                                <span className="text-xs text-gray-500 line-through">
                                  Original: ₹
                                  {(
                                    item.original_price * item.quantity
                                  ).toFixed(2)}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                      {!item.is_free && !item.is_gift && (
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

          {/* Applied Combo Offers */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Applied Combo Offers
                </h2>
              </div>
            </div>

            {(() => {
              // Show only manually applied combinations
              const appliedCombinations =
                combinations?.filter(
                  (combo) =>
                    appliedCombos.includes(combo.id) && combo.is_active,
                ) || [];

              if (appliedCombinations.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No combo offers applied yet
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Add products to see available combo deals on the left.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {appliedCombinations.map((combo) => {
                    const requiredItems = combo.items || [];
                    const rewardItems = combo.rewards || [];
                    const giftItems = combo.gifts || [];

                    // Calculate savings for this specific combo
                    let comboRegularTotal = 0;
                    let comboOfferTotal = 0;
                    let comboSavings = 0;

                    requiredItems.forEach((reqItem) => {
                      const product = products?.find(
                        (p) => p.id === reqItem.product,
                      );
                      if (product) {
                        const regularPrice =
                          parseFloat(product.price) * reqItem.quantity_required;
                        comboRegularTotal += regularPrice;

                        if (reqItem.offer_price && reqItem.offer_price > 0) {
                          const offerPrice =
                            parseFloat(reqItem.offer_price) *
                            reqItem.quantity_required;
                          comboOfferTotal += offerPrice;
                        } else {
                          comboOfferTotal += regularPrice;
                        }
                      }
                    });

                    // Add value of free items to savings
                    rewardItems.forEach((reward) => {
                      const product = products?.find(
                        (p) => p.id === reward.product,
                      );
                      if (product) {
                        const freeItemValue =
                          parseFloat(product.price) * reward.quantity_free;
                        comboRegularTotal += freeItemValue; // User would have to pay this normally
                      }
                    });

                    // Add value of gifts to savings
                    giftItems.forEach((gift) => {
                      const product = products?.find(
                        (p) => p.id === gift.product,
                      );
                      if (product) {
                        const giftValue = parseFloat(product.price);
                        comboRegularTotal += giftValue; // User would have to pay this normally
                      }
                    });

                    comboSavings = comboRegularTotal - comboOfferTotal;

                    return (
                      <div
                        key={combo.id}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {combo.name}
                              </h4>
                              {/* Combo-specific calculation */}
                              <div className="flex items-center space-x-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                <span>Save ₹{comboSavings.toFixed(2)}</span>
                                <span className="text-gray-500">•</span>
                                <span className="line-through text-gray-600">
                                  ₹{comboRegularTotal.toFixed(2)}
                                </span>
                                <span className="font-bold">
                                  → ₹{comboOfferTotal.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              Applied
                            </div>
                            <button
                              onClick={() => {
                                setAppliedCombos((prev) =>
                                  prev.filter((id) => id !== combo.id),
                                );
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remove this combo offer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Compact Savings Breakdown */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="text-center font-medium text-gray-700">
                                    Regular Price
                                  </th>
                                  <th className="text-center font-medium text-gray-700">
                                    Offer Price
                                  </th>
                                  <th className="text-center font-medium text-gray-700">
                                    Free Items Value
                                  </th>
                                  <th className="text-center font-medium text-gray-700">
                                    Gifts Value
                                  </th>
                                  <th className="text-center font-medium text-gray-700">
                                    Total Savings
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="text-center text-lg font-bold text-gray-900">
                                        ₹{comboRegularTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="text-center text-lg font-bold text-green-700">
                                        ₹{comboOfferTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="text-center text-lg font-bold text-blue-700">
                                        ₹
                                        {rewardItems
                                          .reduce((sum, reward) => {
                                            const product = products?.find(
                                              (p) => p.id === reward.product,
                                            );
                                            return (
                                              sum +
                                              parseFloat(product?.price || 0) *
                                                reward.quantity_free
                                            );
                                          }, 0)
                                          .toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="text-center text-lg font-bold text-purple-700">
                                        ₹
                                        {giftItems
                                          .reduce((sum, gift) => {
                                            const product = products?.find(
                                              (p) => p.id === gift.product,
                                            );
                                            return (
                                              sum +
                                              parseFloat(product?.price || 0)
                                            );
                                          }, 0)
                                          .toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex flex-col">
                                      <span className="text-center text-lg font-bold text-green-700">
                                        ₹{comboSavings.toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
  <table className="w-full text-sm border-collapse border border-gray-200">
    <thead>
      <tr className="bg-gray-50">
        <th className="px-2 py-1 border border-gray-200 text-left font-medium text-gray-700">
          Items Purchased
        </th>
        <th className="px-2 py-1 border border-gray-200 text-left font-medium text-gray-700 text-green-600">
          Free Items
        </th>
        <th className="px-2 py-1 border border-gray-200 text-left font-medium text-gray-700 text-purple-600">
          Gifts
        </th>
      </tr>
    </thead>
    <tbody>
      {/* Images Row */}
      <tr>
        {/* Purchased Items Images */}
        <td className="px-2 py-1 border border-gray-200 align-top">
          <div className="space-y-1">
            {requiredItems.map((item, index) => {
              const product = products?.find(p => p.id === item.product);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-8 h-8 flex-shrink-0">
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-8 h-8 object-cover rounded border border-gray-300"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-300">
                        <span className="text-xs text-gray-500">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="truncate text-xs">{product?.title || 'Unknown'}</div>
                </div>
              );
            })}
          </div>
        </td>
        
        {/* Free Items Images */}
        <td className="px-2 py-1 border border-gray-200 align-top">
          <div className="space-y-1">
            {rewardItems.map((reward, index) => {
              const product = products?.find(p => p.id === reward.product);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-8 h-8 flex-shrink-0">
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-8 h-8 object-cover rounded border border-gray-300"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-300">
                        <span className="text-xs text-gray-500">🎁</span>
                      </div>
                    )}
                  </div>
                  <div className="truncate text-xs">{product?.title || 'Unknown'}</div>
                </div>
              );
            })}
            {rewardItems.length === 0 && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </td>
        
        {/* Gifts Images */}
        <td className="px-2 py-1 border border-gray-200 align-top">
          <div className="space-y-1">
            {giftItems.map((gift, index) => {
              const product = products?.find(p => p.id === gift.product);
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-8 h-8 flex-shrink-0">
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-8 h-8 object-cover rounded border border-gray-300"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-300">
                        <span className="text-xs text-gray-500">🎉</span>
                      </div>
                    )}
                  </div>
                  <div className="truncate text-xs">{product?.title || 'Unknown'}</div>
                </div>
              );
            })}
            {giftItems.length === 0 && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </td>
      </tr>
      
      {/* Prices/Details Row */}
      <tr>
        {/* Purchased Items Prices */}
        <td className="px-2 py-1 border border-gray-200 align-top">
          <div className="space-y-1">
            {requiredItems.map((item, index) => {
              const product = products?.find(p => p.id === item.product);
              const hasDiscount = item.offer_price && item.offer_price > 0;
              const totalPrice = parseFloat(product?.price || 0) * item.quantity_required;
              const totalOfferPrice = parseFloat(item.offer_price || 0) * item.quantity_required;
              const savings = (parseFloat(product?.price || 0) - parseFloat(item.offer_price || 0)) * item.quantity_required;
              
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Qty: {item.quantity_required}</span>
                    <div className="text-right">
                      {hasDiscount ? (
                        <>
                          <div className="text-gray-400 line-through">₹{totalPrice.toFixed(2)}</div>
                          <div className="text-green-600 font-medium">₹{totalOfferPrice.toFixed(2)}</div>
                          <div className="text-green-500 text-xs">Save ₹{savings.toFixed(2)}</div>
                        </>
                      ) : (
                        <div className="text-gray-800 font-medium">₹{totalPrice.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </td>
        
        {/* Free Items Details */}
        <td className="px-2 py-1 border border-gray-200 align-top">
          <div className="space-y-1">
            {rewardItems.map((reward, index) => {
              const product = products?.find(p => p.id === reward.product);
              const freeItemValue = parseFloat(product?.price || 0) * reward.quantity_free;
              
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Qty: {reward.quantity_free}</span>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">FREE</span>
                      <div className="text-gray-500 mt-0.5">Value: ₹{freeItemValue.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {rewardItems.length === 0 && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </td>
        
        {/* Gifts Details */}
        <td className="px-2 py-1 border border-gray-200 align-top">
          <div className="space-y-1">
            {giftItems.map((gift, index) => {
              const product = products?.find(p => p.id === gift.product);
              const giftValue = parseFloat(product?.price || 0);
              
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-600">Qty: 1</span>
                    <div className="text-right">
                      <span className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs">GIFT</span>
                      <div className="text-gray-500 mt-0.5">Value: ₹{giftValue.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {giftItems.length === 0 && (
              <span className="text-xs text-gray-400">-</span>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
                      </div>
                    );
                  })}

                  {/* Overall Calculation Summary */}
                  {appliedCombinations.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            Regular Total
                          </div>
                          <div className="text-lg font-bold text-gray-700 line-through">
                            ₹
                            {(() => {
                              let total = 0;
                              appliedCombinations.forEach((combo) => {
                                combo.items?.forEach((item) => {
                                  const product = products?.find(
                                    (p) => p.id === item.product,
                                  );
                                  if (product) {
                                    total +=
                                      parseFloat(product.price) *
                                      item.quantity_required;
                                  }
                                });
                                combo.rewards?.forEach((reward) => {
                                  const product = products?.find(
                                    (p) => p.id === reward.product,
                                  );
                                  if (product) {
                                    total +=
                                      parseFloat(product.price) *
                                      reward.quantity_free;
                                  }
                                });
                                combo.gifts?.forEach((gift) => {
                                  const product = products?.find(
                                    (p) => p.id === gift.product,
                                  );
                                  if (product) {
                                    total += parseFloat(product.price);
                                  }
                                });
                              });
                              return total.toFixed(2);
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            Combo Total
                          </div>
                          <div className="text-2xl font-bold text-green-700">
                            ₹
                            {(() => {
                              let total = 0;
                              appliedCombinations.forEach((combo) => {
                                combo.items?.forEach((item) => {
                                  const product = products?.find(
                                    (p) => p.id === item.product,
                                  );
                                  if (product) {
                                    if (
                                      item.offer_price &&
                                      item.offer_price > 0
                                    ) {
                                      total +=
                                        parseFloat(item.offer_price) *
                                        item.quantity_required;
                                    } else {
                                      total +=
                                        parseFloat(product.price) *
                                        item.quantity_required;
                                    }
                                  }
                                });
                              });
                              return total.toFixed(2);
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">
                            Total Savings
                          </div>
                          <div className="text-xl font-bold text-green-800">
                            ₹{totals.totalDiscount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-center text-gray-500 mt-2">
                        You're saving{" "}
                        {(
                          (totals.totalDiscount /
                            (totals.total + totals.totalDiscount)) *
                          100
                        ).toFixed(1)}
                        % on your order!
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Order Summary (Incl. GST)
              </h2>
            </div>

            {/* Discount Display */}
            {totals.totalDiscount > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-yellow-700">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="font-medium">
                      Total Savings from Combos
                    </span>
                  </div>
                  <span className="text-xl font-bold text-green-700">
                    -₹{totals.totalDiscount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-sm font-medium text-blue-600 flex items-center">
                  <IndianRupee className="w-4 h-4 mr-1" />
                  Taxable Value (Excl. GST)
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  ₹{totals.subtotal.toFixed(2)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-sm font-medium text-purple-600 flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  GST Amount
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  ₹{(totals.gstAmount || 0).toFixed(2)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="text-sm font-medium text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Grand Total (Incl. GST)
                </div>
                <div className="text-2xl font-bold text-green-900">
                  ₹{totals.total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* GST Breakdown */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                GST Breakdown
              </h4>
              <div className="text-sm text-gray-600">
                <p>
                  All prices shown include GST. The total amount payable is
                  inclusive of all applicable taxes.
                </p>
                <p className="mt-1">
                  Taxable Value: ₹{totals.subtotal.toFixed(2)} + GST: ₹
                  {totals.gstAmount.toFixed(2)} = Grand Total: ₹
                  {totals.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Place Order</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 relative overflow-hidden">
              <div className="relative z-10 text-center">
                <div className="relative mb-8 flex justify-center">
                  <div className="relative">
                    {/* Pulsing core with checkmark */}
                    <div className="w-28 h-28 bg-gradient-to-br from-green-100 via-green-200 to-green-300 rounded-full flex items-center justify-center animate-pulse shadow-2xl border-4 border-white">
                      <CheckCircle className="w-14 h-14 text-green-600 drop-shadow-lg" />
                    </div>
                  </div>
                </div>

                {/* Ultra Fast Animated Cart Icon with Dramatic Effects */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    {/* High-speed cart animation */}
                    <div className="relative overflow-visible">
                      <ShoppingCart
                        className="w-10 h-10 text-blue-600 animate-bounce drop-shadow-lg"
                        style={{
                          animationDuration: "0.2s",
                          animationDelay: "0.5s",
                          filter:
                            "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))",
                        }}
                      />

                      {/* Dramatic speed lines */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex space-x-1">
                          <div
                            className="w-20 h-1 bg-gradient-to-r from-blue-300 to-transparent animate-pulse rounded-full"
                            style={{
                              animationDelay: "0.6s",
                              animationDuration: "0.3s",
                            }}
                          ></div>
                          <div
                            className="w-16 h-1 bg-gradient-to-r from-blue-400 to-transparent animate-pulse rounded-full"
                            style={{
                              animationDelay: "0.7s",
                              animationDuration: "0.3s",
                            }}
                          ></div>
                          <div
                            className="w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent animate-pulse rounded-full"
                            style={{
                              animationDelay: "0.8s",
                              animationDuration: "0.3s",
                            }}
                          ></div>
                          <div
                            className="w-8 h-1 bg-gradient-to-r from-blue-600 to-transparent animate-pulse rounded-full"
                            style={{
                              animationDelay: "0.9s",
                              animationDuration: "0.3s",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h2
                  className="text-4xl font-bold text-gray-900 mb-3 animate-fade-in drop-shadow-sm"
                  style={{ animationDelay: "0.2s" }}
                >
                  ORDER SUCCESS!
                </h2>

                <div
                  className="mb-8 animate-fade-in"
                  style={{ animationDelay: "0.6s" }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Order ID
                  </label>
                  <div className="flex items-center justify-center space-x-3">
                    <input
                      type="text"
                      value={generatedOrderId}
                      readOnly
                      className="px-6 py-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-900 font-mono text-xl text-center shadow-inner font-bold"
                    />
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(generatedOrderId)
                      }
                      className="bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div
                  className="flex space-x-4 animate-fade-in"
                  style={{ animationDelay: "0.8s" }}
                >
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      setGeneratedOrderId("");
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-8 py-4 rounded-xl hover:bg-gray-300 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Create New Order
                  </button>
                  <button
                    onClick={() => navigate("/orders")}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl "
                  >
                    <ShoppingCart className="w-3 h-5" />
                    <span>View Orders</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default OrderNew;
