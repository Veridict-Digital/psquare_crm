import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  IndianRupee,
  X,
  MapPin,
  Filter,
  TrendingUp,
  ChevronDown,
  Gift,
  Percent,
  ShoppingBag,
  Maximize2,
  Minus,
} from "lucide-react";

const OrderNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const urlCustomerId = searchParams.get("customer");

  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  // Simplified state management
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      customer: urlCustomerId || "",
      agent: "",
      status: "Placed",
      payment_status: "Credit",
      followup_date: "",
      partial_amount: 0,
      delivery_address: "",
      delivery_option: "primary",
    };
    
    if (!urlCustomerId) {
      const saved = sessionStorage.getItem("orderNewFormData");
      return saved ? JSON.parse(saved) : defaultData;
    }
    return defaultData;
  });

  const [orderItems, setOrderItems] = useState(() => {
    const saved = sessionStorage.getItem("orderNewOrderItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  // Track applied combos with quantity only (no separate instances)
  const [appliedCombos, setAppliedCombos] = useState([]); // Array of {comboId, quantity, name}
  
  const [customerKPIs, setCustomerKPIs] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [productFilters, setProductFilters] = useState({
    category: "",
    priceRange: "",
    stockStatus: "",
    search: "",
  });
  
  // New state for combo offers modal
  const [showComboModal, setShowComboModal] = useState(false);
  
  // Filter states for modal based on selected product
  const [filterPaid, setFilterPaid] = useState(false);
  const [filterFree, setFilterFree] = useState(false);
  const [filterGift, setFilterGift] = useState(false);

  // Persist to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("orderNewFormData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("orderNewOrderItems", JSON.stringify(orderItems));
  }, [orderItems]);

  useEffect(() => {
    sessionStorage.setItem("orderNewAppliedCombos", JSON.stringify(appliedCombos));
  }, [appliedCombos]);

  // Fetch data
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => axios.get("/api/customers/?page_size=1000").then((res) => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => axios.get("/api/products/").then((res) => res.data),
  });

  const { data: combinations } = useQuery({
    queryKey: ["combinations"],
    queryFn: () => axios.get("/api/productcombinations/").then((res) => res.data),
  });

  // Server-side search for customers
  useEffect(() => {
    if (customerDropdownOpen && customerSearch.length > 0) {
      setCustomerSearchLoading(true);
      axios.get(`/api/customers/?search=${encodeURIComponent(customerSearch)}&page_size=20`)
        .then(res => {
          setCustomerSearchResults(res.data.results || res.data || []);
        })
        .catch(() => setCustomerSearchResults([]))
        .finally(() => setCustomerSearchLoading(false));
    } else {
      setCustomerSearchResults([]);
    }
  }, [customerSearch, customerDropdownOpen]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setCustomerDropdownOpen(false);
        setCustomerSearch("");
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setProductDropdownOpen(false);
        setProductSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-assign agent and set address based on customer selection
  useEffect(() => {
    if (formData.customer && customers) {
      const allCustomers = customers?.results || customers || [];
      const selectedCustomer = allCustomers.find(
        (c) => c.id.toString() === formData.customer.toString()
      );
      
      if (selectedCustomer) {
        setFormData((prev) => ({
          ...prev,
          agent: selectedCustomer.agent || "",
        }));

        if (formData.delivery_option === "primary") {
          const fullAddress = [
            selectedCustomer.house_flat_no,
            selectedCustomer.wing_lane,
            selectedCustomer.society_colony,
            selectedCustomer.area,
            selectedCustomer.city,
            selectedCustomer.district,
            selectedCustomer.state,
            selectedCustomer.pincode,
          ]
            .filter(Boolean)
            .join(", ");
          setFormData((prev) => ({ ...prev, delivery_address: fullAddress }));
        }

        // Mock customer KPIs
        setCustomerKPIs({
          totalOrders: Math.floor(Math.random() * 50) + 1,
          totalValue: Math.floor(Math.random() * 50000) + 1000,
          averageOrderValue: Math.floor(Math.random() * 2000) + 500,
        });
      }
    }
  }, [formData.customer, customers, formData.delivery_option]);

  // ========== FORM HANDLERS ==========
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "payment_status") {
      if (value === "Credit") {
        const today = new Date();
        const followupDate = new Date(today.setDate(today.getDate() + 30))
          .toISOString()
          .split("T")[0];
        setFormData((prev) => ({ ...prev, followup_date: followupDate, partial_amount: 0 }));
      } else {
        setFormData((prev) => ({ ...prev, followup_date: "", partial_amount: 0 }));
      }
    }

    if (name === "delivery_option") {
      if (value === "primary" && formData.customer && customers) {
        const allCustomers = customers?.results || customers || [];
        const customer = allCustomers.find(
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

  // Apply combo - adds items to order
  const applyCombo = useCallback((combo) => {
    const requiredItems = combo.items || [];
    const rewardItems = combo.rewards || [];
    const giftItems = combo.gifts || [];

    setOrderItems((prev) => {
      let newItems = [...prev];

      // Update required items (increase quantity or add new)
      requiredItems.forEach((reqItem) => {
        const product = products?.find((p) => p.id === reqItem.product);
        if (!product) return;

        const existingItemIndex = newItems.findIndex(
          (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
        );

        if (existingItemIndex !== -1) {
          // Increase quantity of existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + reqItem.quantity_required,
            unit_price: reqItem.offer_price && reqItem.offer_price > 0 
              ? parseFloat(reqItem.offer_price) 
              : newItems[existingItemIndex].unit_price,
            original_price: newItems[existingItemIndex].original_price || parseFloat(product.price),
          };
        } else {
          // Add new item
          newItems.push({
            product: product.id,
            product_title: product.title,
            product_sku: product.sku,
            quantity: reqItem.quantity_required,
            unit_price: reqItem.offer_price && reqItem.offer_price > 0 
              ? parseFloat(reqItem.offer_price) 
              : parseFloat(product.price),
            original_price: parseFloat(product.price),
            gst_rate: product.gst_rate,
            gst_rate_value: parseFloat(product.gst_rate_display || 0),
            image: product.image,
          });
        }
      });

      // Add free items (check if they already exist)
      rewardItems.forEach((reward) => {
        const product = products?.find((p) => p.id === reward.product);
        if (!product) return;

        const existingFreeIndex = newItems.findIndex(
          (item) => item.product === reward.product && item.is_free
        );

        if (existingFreeIndex !== -1) {
          // Increase quantity of existing free item
          newItems[existingFreeIndex] = {
            ...newItems[existingFreeIndex],
            quantity: newItems[existingFreeIndex].quantity + reward.quantity_free,
          };
        } else {
          // Add new free item
          newItems.push({
            product: product.id,
            product_title: `${product.title} (FREE)`,
            product_sku: product.sku,
            quantity: reward.quantity_free,
            unit_price: 0,
            original_price: parseFloat(product.price) || 0,
            gst_rate: product.gst_rate,
            gst_rate_value: parseFloat(product.gst_rate_display || 0),
            is_free: true,
            combo_id: combo.id,
            image: product.image,
          });
        }
      });

      // Add gifts (check if they already exist)
      giftItems.forEach((gift) => {
        const product = products?.find((p) => p.id === gift.product);
        if (!product) return;

        const existingGiftIndex = newItems.findIndex(
          (item) => item.product === gift.product && item.is_gift
        );

        if (existingGiftIndex !== -1) {
          // Increase quantity of existing gift
          newItems[existingGiftIndex] = {
            ...newItems[existingGiftIndex],
            quantity: newItems[existingGiftIndex].quantity + 1,
          };
        } else {
          // Add new gift
          newItems.push({
            product: product.id,
            product_title: `${product.title} (GIFT)`,
            product_sku: product.sku,
            quantity: 1,
            unit_price: 0,
            original_price: parseFloat(product.price) || 0,
            gst_rate: product.gst_rate,
            gst_rate_value: parseFloat(product.gst_rate_display || 0),
            is_gift: true,
            combo_id: combo.id,
            image: product.image,
          });
        }
      });

      return newItems;
    });

    // Update applied combos quantity
    setAppliedCombos((prev) => {
      const existingComboIndex = prev.findIndex(c => c.comboId === combo.id);
      
      if (existingComboIndex !== -1) {
        // Increase quantity of existing combo
        const newCombos = [...prev];
        newCombos[existingComboIndex] = {
          ...newCombos[existingComboIndex],
          quantity: newCombos[existingComboIndex].quantity + 1
        };
        return newCombos;
      } else {
        // Add new combo
        return [...prev, { 
          comboId: combo.id, 
          quantity: 1,
          name: combo.name 
        }];
      }
    });
  }, [products]);

  // Update combo quantity (increase/decrease)
  const updateComboQuantity = useCallback((comboId, newQuantity, combo) => {
    if (newQuantity <= 0) {
      // Remove the combo completely
      removeCombo(comboId);
      return;
    }

    const existingCombo = appliedCombos.find(c => c.comboId === comboId);
    if (!existingCombo) return;

    const quantityDiff = newQuantity - existingCombo.quantity;

    if (quantityDiff > 0) {
      // Need to add more of this combo (quantityDiff times)
      for (let i = 0; i < quantityDiff; i++) {
        // Add required items
        combo.items?.forEach((reqItem) => {
          const product = products?.find((p) => p.id === reqItem.product);
          if (!product) return;

          setOrderItems((prev) => {
            const existingItemIndex = prev.findIndex(
              (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
            );

            if (existingItemIndex !== -1) {
              const newItems = [...prev];
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: newItems[existingItemIndex].quantity + reqItem.quantity_required,
              };
              return newItems;
            }
            return prev;
          });
        });

        // Add free items
        combo.rewards?.forEach((reward) => {
          const product = products?.find((p) => p.id === reward.product);
          if (!product) return;

          setOrderItems((prev) => {
            const existingFreeIndex = prev.findIndex(
              (item) => item.product === reward.product && item.is_free
            );

            if (existingFreeIndex !== -1) {
              const newItems = [...prev];
              newItems[existingFreeIndex] = {
                ...newItems[existingFreeIndex],
                quantity: newItems[existingFreeIndex].quantity + reward.quantity_free,
              };
              return newItems;
            }
            return prev;
          });
        });

        // Add gifts
        combo.gifts?.forEach((gift) => {
          const product = products?.find((p) => p.id === gift.product);
          if (!product) return;

          setOrderItems((prev) => {
            const existingGiftIndex = prev.findIndex(
              (item) => item.product === gift.product && item.is_gift
            );

            if (existingGiftIndex !== -1) {
              const newItems = [...prev];
              newItems[existingGiftIndex] = {
                ...newItems[existingGiftIndex],
                quantity: newItems[existingGiftIndex].quantity + 1,
              };
              return newItems;
            }
            return prev;
          });
        });
      }
    } else if (quantityDiff < 0) {
      // Need to remove some instances of this combo
      const instancesToRemove = Math.abs(quantityDiff);
      
      for (let i = 0; i < instancesToRemove; i++) {
        // Remove required items
        combo.items?.forEach((reqItem) => {
          setOrderItems((prev) => {
            const existingItemIndex = prev.findIndex(
              (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
            );

            if (existingItemIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingItemIndex].quantity - reqItem.quantity_required;
              
              if (newQuantity <= 0) {
                // Remove the item if quantity becomes 0
                newItems.splice(existingItemIndex, 1);
              } else {
                newItems[existingItemIndex] = {
                  ...newItems[existingItemIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });

        // Remove free items
        combo.rewards?.forEach((reward) => {
          setOrderItems((prev) => {
            const existingFreeIndex = prev.findIndex(
              (item) => item.product === reward.product && item.is_free
            );

            if (existingFreeIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingFreeIndex].quantity - reward.quantity_free;
              
              if (newQuantity <= 0) {
                newItems.splice(existingFreeIndex, 1);
              } else {
                newItems[existingFreeIndex] = {
                  ...newItems[existingFreeIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });

        // Remove gifts
        combo.gifts?.forEach((gift) => {
          setOrderItems((prev) => {
            const existingGiftIndex = prev.findIndex(
              (item) => item.product === gift.product && item.is_gift
            );

            if (existingGiftIndex !== -1) {
              const newItems = [...prev];
              const newQuantity = newItems[existingGiftIndex].quantity - 1;
              
              if (newQuantity <= 0) {
                newItems.splice(existingGiftIndex, 1);
              } else {
                newItems[existingGiftIndex] = {
                  ...newItems[existingGiftIndex],
                  quantity: newQuantity,
                };
              }
              return newItems;
            }
            return prev;
          });
        });
      }
    }

    // Update applied combos quantity
    setAppliedCombos((prev) => 
      prev.map(c => 
        c.comboId === comboId 
          ? { ...c, quantity: newQuantity } 
          : c
      )
    );
  }, [products, appliedCombos]);

  const removeCombo = useCallback((comboId) => {
    const combo = combinations?.find(c => c.id === comboId);
    if (!combo) return;

    const existingCombo = appliedCombos.find(c => c.comboId === comboId);
    if (!existingCombo) return;

    // Remove all items associated with this combo
    for (let i = 0; i < existingCombo.quantity; i++) {
      // Remove required items
      combo.items?.forEach((reqItem) => {
        setOrderItems((prev) => {
          const existingItemIndex = prev.findIndex(
            (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
          );

          if (existingItemIndex !== -1) {
            const newItems = [...prev];
            const newQuantity = newItems[existingItemIndex].quantity - reqItem.quantity_required;
            
            if (newQuantity <= 0) {
              newItems.splice(existingItemIndex, 1);
            } else {
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: newQuantity,
              };
            }
            return newItems;
          }
          return prev;
        });
      });

      // Remove free items
      combo.rewards?.forEach((reward) => {
        setOrderItems((prev) => {
          const existingFreeIndex = prev.findIndex(
            (item) => item.product === reward.product && item.is_free
          );

          if (existingFreeIndex !== -1) {
            const newItems = [...prev];
            const newQuantity = newItems[existingFreeIndex].quantity - reward.quantity_free;
            
            if (newQuantity <= 0) {
              newItems.splice(existingFreeIndex, 1);
            } else {
              newItems[existingFreeIndex] = {
                ...newItems[existingFreeIndex],
                quantity: newQuantity,
              };
            }
            return newItems;
          }
          return prev;
        });
      });

      // Remove gifts
      combo.gifts?.forEach((gift) => {
        setOrderItems((prev) => {
          const existingGiftIndex = prev.findIndex(
            (item) => item.product === gift.product && item.is_gift
          );

          if (existingGiftIndex !== -1) {
            const newItems = [...prev];
            const newQuantity = newItems[existingGiftIndex].quantity - 1;
            
            if (newQuantity <= 0) {
              newItems.splice(existingGiftIndex, 1);
            } else {
              newItems[existingGiftIndex] = {
                ...newItems[existingGiftIndex],
                quantity: newQuantity,
              };
            }
            return newItems;
          }
          return prev;
        });
      });
    }

    // Remove the combo from applied combos
    setAppliedCombos((prev) => prev.filter(c => c.comboId !== comboId));
  }, [combinations, appliedCombos]);

  const addProduct = useCallback(() => {
    if (!selectedProduct || quantity <= 0 || !products) return;

    const product = products.find(
      (p) => p.id.toString() === selectedProduct.toString()
    );
    if (!product) return;

    setOrderItems((prev) => {
      const existingItem = prev.find((item) => item.product === product.id && !item.is_free && !item.is_gift);
      
      if (existingItem) {
        return prev.map((item) =>
          item.product === product.id && !item.is_free && !item.is_gift
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prev, {
        product: product.id,
        product_title: product.title,
        product_sku: product.sku,
        quantity: quantity,
        unit_price: parseFloat(product.price) || 0,
        original_price: parseFloat(product.price) || 0,
        gst_rate: product.gst_rate,
        gst_rate_value: !isNaN(parseFloat(product.gst_rate_display)) ? parseFloat(product.gst_rate_display) : 0,
        image: product.image,
      }];
    });

    setSelectedProduct("");
    setQuantity(1);
  }, [selectedProduct, quantity, products]);

  const addRequiredItemsForCombo = useCallback((combo) => {
    const requiredItems = combo.items || [];
    
    setOrderItems((prev) => {
      let newItems = [...prev];

      requiredItems.forEach((reqItem) => {
        const product = products?.find((p) => p.id === reqItem.product);
        if (!product) return;

        const existingItemIndex = newItems.findIndex(
          (item) => item.product === reqItem.product && !item.is_free && !item.is_gift
        );

        if (existingItemIndex !== -1) {
          // Update existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + reqItem.quantity_required,
          };
        } else {
          // Add new item
          newItems.push({
            product: product.id,
            product_title: product.title,
            product_sku: product.sku,
            quantity: reqItem.quantity_required,
            unit_price: parseFloat(product.price) || 0,
            original_price: parseFloat(product.price) || 0,
            gst_rate: product.gst_rate,
            gst_rate_value: !isNaN(parseFloat(product.gst_rate_display)) ? parseFloat(product.gst_rate_display) : 0,
            image: product.image,
          });
        }
      });

      return newItems;
    });
  }, [products]);

  const removeProduct = useCallback((productId) => {
    setOrderItems((prev) => prev.filter((item) => item.product !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }
    
    setOrderItems((prev) =>
      prev.map((item) =>
        item.product === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  }, [removeProduct]);

  // ========== MEMOIZED CALCULATIONS ==========
  const totals = useMemo(() => {
    if (!orderItems.length) {
      return { subtotal: 0, gstAmount: 0, total: 0, totalDiscount: 0 };
    }

    let subtotal = 0;
    let gstAmount = 0;
    let totalDiscount = 0;
    let originalTotal = 0;

    orderItems.forEach((item) => {
      if (!item.is_free && !item.is_gift) {
        const itemTotal = item.unit_price * item.quantity;
        const gstRate = !isNaN(item.gst_rate_value) ? item.gst_rate_value : 0;
        const itemGST = (itemTotal * gstRate) / (100 + gstRate);
        const taxableValue = itemTotal - itemGST;

        subtotal += taxableValue;
        gstAmount += itemGST;

        if (item.original_price && item.original_price > item.unit_price) {
          const originalTotalForItem = item.original_price * item.quantity;
          const originalTaxableValue = originalTotalForItem - (originalTotalForItem * gstRate) / (100 + gstRate);
          totalDiscount += originalTaxableValue - taxableValue;
          originalTotal += originalTotalForItem;
        } else {
          originalTotal += itemTotal;
        }
      }
    });

    const grandTotal = orderItems.reduce((sum, item) => {
      if (!item.is_free && !item.is_gift) {
        return sum + item.unit_price * item.quantity;
      }
      return sum;
    }, 0);

    return { subtotal, gstAmount, total: grandTotal, totalDiscount, originalTotal };
  }, [orderItems]);

  // ========== MUTATION ==========
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

      // Clear form
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
      setAppliedCombos([]);
      setCustomerKPIs(null);
      
      sessionStorage.removeItem("orderNewFormData");
      sessionStorage.removeItem("orderNewOrderItems");
      sessionStorage.removeItem("orderNewAppliedCombos");
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.[0] || 
                      "An error occurred while creating the order. Please try again.";
      alert(errorMsg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.customer) {
      alert("Please select a customer to place an order.");
      return;
    }

    if (orderItems.length === 0) {
      alert("Please add at least one product to the order.");
      return;
    }

    const paidItems = orderItems.filter((item) => !item.is_free && !item.is_gift);

    const orderData = {
      customer: Number(formData.customer),
      agent: formData.agent || undefined,
      status: formData.status,
      payment_status: formData.payment_status,
      ...(formData.followup_date && { followup_date: formData.followup_date }),
      delivery_address: formData.delivery_address,
      total_amount: totals.total,
      paid_amount: formData.payment_status === "Paid" ? totals.total : 
                   formData.payment_status === "Partial" ? parseFloat(formData.partial_amount) : 0,
      items: paidItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate_value || 0,
      })),
      applied_combos: appliedCombos.map(c => ({
        combo_id: c.comboId,
        quantity: c.quantity,
      })),
    };

    mutation.mutate(orderData);
  };

  // ========== HELPER FUNCTIONS ==========
  const getSelectedCustomerName = () => {
    if (!formData.customer) return "Select Customer";
    if (!customers) return "Loading...";
    const allCustomers = customers?.results || customers || [];
    const customer = allCustomers.find(
      (c) => c.id.toString() === formData.customer.toString()
    );
    return customer ? customer.name : "Select Customer";
  };

  const getSelectedCustomerAddress = () => {
    if (!formData.customer || !customers) return "";
    const allCustomers = customers?.results || customers || [];
    const customer = allCustomers.find(
      (c) => c.id.toString() === formData.customer.toString()
    );
    if (!customer) return "";
    return [
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
  };

  const getSelectedCustomerAgent = () => {
    if (!formData.customer || !customers) return "";
    const allCustomers = customers?.results || customers || [];
    const customer = allCustomers.find(
      (c) => c.id.toString() === formData.customer.toString()
    );
    return customer?.agent_name || "";
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;

    if (productFilters.search) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(productFilters.search.toLowerCase()) ||
          product.sku.toLowerCase().includes(productFilters.search.toLowerCase())
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
          case "in-stock": return stock > 10;
          case "low-stock": return stock > 0 && stock <= 10;
          case "out-of-stock": return stock === 0;
          default: return true;
        }
      });
    }

    return filtered;
  }, [products, productFilters]);

  const allCustomers = customers?.results || customers || [];
  const filteredCustomers = (customerDropdownOpen && customerSearch.length > 0)
    ? customerSearchResults
    : allCustomers;

  // Get all product IDs that are in the order items OR selected in dropdown
  const productIdsForCombos = useMemo(() => {
    const ids = orderItems
      .filter(item => !item.is_free && !item.is_gift)
      .map(item => item.product);
    
    // Add selected product if it exists
    if (selectedProduct) {
      ids.push(parseInt(selectedProduct));
    }
    
    return [...new Set(ids)]; // Remove duplicates
  }, [orderItems, selectedProduct]);

  // Get relevant combo offers based on products in order OR selected product
  const relevantCombinations = useMemo(() => {
    if (!combinations || productIdsForCombos.length === 0) return [];
    
    return combinations.filter(combo => {
      // Only show active combos
      if (!combo.is_active) return false;
      
      // Check if any required item in the combo is in the order or selected
      return combo.items?.some(item => productIdsForCombos.includes(item.product));
    }) || [];
  }, [combinations, productIdsForCombos]);

  const calculateComboSavings = (combo, quantity = 1) => {
    let regularTotal = 0;
    let offerTotal = 0;

    combo.items?.forEach((item) => {
      const product = products?.find(p => p.id === item.product);
      if (product) {
        const price = parseFloat(product.price);
        regularTotal += price * item.quantity_required * quantity;
        if (item.offer_price && item.offer_price > 0) {
          offerTotal += parseFloat(item.offer_price) * item.quantity_required * quantity;
        } else {
          offerTotal += price * item.quantity_required * quantity;
        }
      }
    });

    // Add value of free items
    combo.rewards?.forEach((reward) => {
      const product = products?.find(p => p.id === reward.product);
      if (product) {
        regularTotal += parseFloat(product.price) * reward.quantity_free * quantity;
      }
    });

    // Add value of gifts
    combo.gifts?.forEach((gift) => {
      const product = products?.find(p => p.id === gift.product);
      if (product) {
        regularTotal += parseFloat(product.price) * quantity;
      }
    });

    return {
      regularTotal,
      offerTotal,
      savings: regularTotal - offerTotal,
      savingsPercentage: regularTotal > 0 ? ((regularTotal - offerTotal) / regularTotal * 100).toFixed(1) : 0
    };
  };

  // Filter combinations based on selected product and filters
  const getFilteredCombinations = useCallback((combos) => {
    // If no product is selected, show all combos (or empty if you prefer)
    if (!selectedProduct) {
      return combos;
    }

    const productId = parseInt(selectedProduct);

    return combos.filter(combo => {
      let isInPaid = false;
      let isInFree = false;
      let isInGift = false;

      // Check if selected product is in paid items
      if (combo.items?.some(item => item.product === productId)) {
        isInPaid = true;
      }

      // Check if selected product is in free items
      if (combo.rewards?.some(reward => reward.product === productId)) {
        isInFree = true;
      }

      // Check if selected product is in gifts
      if (combo.gifts?.some(gift => gift.product === productId)) {
        isInGift = true;
      }

      // Apply filters based on where the selected product appears
      if (filterPaid && !isInPaid) return false;
      if (filterFree && !isInFree) return false;
      if (filterGift && !isInGift) return false;

      return true;
    });
  }, [selectedProduct, filterPaid, filterFree, filterGift]);

  // Combo Offers Table Component (reusable)
  const ComboOffersTable = ({ combinations, showActions = true }) => {
    // Apply filters to combinations
    const filteredCombos = getFilteredCombinations(combinations);

    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Offer</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700" colSpan="4">Paid Items</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700" colSpan="4">Free Items</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700" colSpan="2">Gifts</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700" colSpan="3">Total</th>
            <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">Action</th>
          </tr>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600"></th>
            {/* Required Items Sub-headers */}
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Product</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Qty</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Original Price</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Offer Price</th>
            
            {/* Free Items Sub-headers */}
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Product</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Qty</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Original Price</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">You Save</th>
            
            {/* Gifts Sub-headers */}
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Product</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Value</th>
            
            {/* Pricing Sub-headers */}
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Regular Total</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Combo Total</th>
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600">Savings</th>
            
            <th className="border border-gray-300 px-4 py-1 text-xs font-medium text-gray-600"></th>
          </tr>
        </thead>
        <tbody>
          {filteredCombos.map((combo) => {
            const isApplied = appliedCombos.some(c => c.comboId === combo.id);
            const appliedQuantity = appliedCombos.find(c => c.comboId === combo.id)?.quantity || 0;
            
            // Get the first item for display
            const firstRequiredItem = combo.items?.[0];
            const firstFreeItem = combo.rewards?.[0];
            const firstGiftItem = combo.gifts?.[0];
            
            const requiredProduct = firstRequiredItem ? products?.find(p => p.id === firstRequiredItem.product) : null;
            const freeProduct = firstFreeItem ? products?.find(p => p.id === firstFreeItem.product) : null;
            const giftProduct = firstGiftItem ? products?.find(p => p.id === firstGiftItem.product) : null;

            return (
              <tr key={combo.id} className={`${isApplied ? 'bg-green-50' : ''} hover:bg-gray-50`}>
                <td className="border border-gray-300 px-4 py-3">
                  <div className="font-medium text-gray-900">{combo.name}</div>
                  {isApplied && (
                    <div className="text-xs text-green-600 mt-1">
                      Quantity: {appliedQuantity}
                    </div>
                  )}
                </td>
                
                {/* Required Items Details */}
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {requiredProduct?.title || '-'}
                  {combo.items?.length > 1 && (
                    <span className="ml-1 text-xs text-gray-500">+{combo.items.length - 1} more</span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                  {firstRequiredItem?.quantity_required || '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                  {requiredProduct ? `₹${parseFloat(requiredProduct.price).toFixed(2)}` : '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-600 font-medium">
                  {firstRequiredItem?.offer_price ? `₹${parseFloat(firstRequiredItem.offer_price).toFixed(2)}` : '-'}
                </td>
                
                {/* Free Items Details */}
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {freeProduct?.title || '-'}
                  {combo.rewards?.length > 1 && (
                    <span className="ml-1 text-xs text-gray-500">+{combo.rewards.length - 1} more</span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                  {firstFreeItem?.quantity_free || '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                  {freeProduct ? `₹${parseFloat(freeProduct.price).toFixed(2)}` : '-'}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-right text-green-600 font-medium">
                  {freeProduct ? `₹${parseFloat(freeProduct.price).toFixed(2)}` : '-'}
                </td>
                
                {/* Gifts Details */}
                <td className="border border-gray-300 px-4 py-3 text-sm">
                  {giftProduct?.title || '-'}
                  {combo.gifts?.length > 1 && (
                    <span className="ml-1 text-xs text-gray-500">+{combo.gifts.length - 1} more</span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                  {giftProduct ? `₹${parseFloat(giftProduct.price).toFixed(2)}` : '-'}
                </td>
                
                {/* Pricing Details */}
                <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                  ₹{calculateComboSavings(combo, 1).regularTotal.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium text-green-600">
                  ₹{calculateComboSavings(combo, 1).offerTotal.toFixed(2)}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <div className="text-sm font-medium text-green-700 text-right">
                    ₹{calculateComboSavings(combo, 1).savings.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    ({calculateComboSavings(combo, 1).savingsPercentage}%)
                  </div>
                </td>
                
                {/* Action Column */}
                <td className="border border-gray-300 px-4 py-3">
                  {showActions && !isApplied && (
                    <button
                      type="button"
                      onClick={() => applyCombo(combo)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 whitespace-nowrap"
                    >
                      Apply
                    </button>
                  )}
                  {showActions && isApplied && (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newQuantity = appliedQuantity - 1;
                          if (newQuantity > 0) {
                            updateComboQuantity(combo.id, newQuantity, combo);
                          } else {
                            removeCombo(combo.id);
                          }
                        }}
                        className="w-6 h-6 bg-white rounded-full text-green-700 hover:bg-green-100 flex items-center justify-center border border-green-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">{appliedQuantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateComboQuantity(combo.id, appliedQuantity + 1, combo);
                        }}
                        className="w-6 h-6 bg-white rounded-full text-green-700 hover:bg-green-100 flex items-center justify-center border border-green-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCombo(combo.id)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {!showActions && isApplied && (
                    <div className="text-sm text-gray-600">
                      Qty: {appliedQuantity}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {filteredCombos.length === 0 && selectedProduct && (
            <tr>
              <td colSpan="16" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                No combo offers match the selected filters for this product
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 max-w-full py-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              New Order
            </h1>
          </div>
        </div>

        {/* Customer and Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2 relative" style={{ zIndex: 30 }}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-500" />
              Customer *
            </label>
            <div className="relative" ref={customerDropdownRef}>
              <button
                type="button"
                onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:bg-gray-50 text-left flex items-center justify-between"
              >
                <span className={formData.customer ? "text-gray-900" : "text-gray-500"}>
                  {getSelectedCustomerName()}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${customerDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {customerDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-80 overflow-auto">
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="py-1">
                    {customerSearchLoading || customersLoading ? (
                      <div className="px-4 py-2 text-gray-500">Loading...</div>
                    ) : filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, customer: customer.id }));
                            setCustomerDropdownOpen(false);
                            setCustomerSearch("");
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${
                            formData.customer === customer.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-sm text-gray-500">{customer.phone}</div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              customer.contact_type === 'Customer'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {customer.contact_type}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No customers found</div>
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
              value={getSelectedCustomerAgent()}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Credit">Credit</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Advance">Advance</option>
            </select>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-red-500" />
              Delivery Option
            </label>
            <select
              name="delivery_option"
              value={formData.delivery_option}
              onChange={handleFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="primary">Use Primary Address</option>
              <option value="custom">Enter Custom Address</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-red-500" />
              Delivery Address
            </label>
            <textarea
              name="delivery_address"
              value={formData.delivery_address}
              onChange={handleFormChange}
              placeholder={formData.delivery_option === "custom" ? "Enter delivery address" : "Primary address will be used"}
              rows="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
              readOnly={formData.delivery_option === "primary"}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Product Selection and Combo Offers */}
          <div className="space-y-6">
            {/* Product Selection */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4 relative" style={{ zIndex: 20 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900">Add Products</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">Filters</span>
                </button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productFilters.search}
                        onChange={(e) => setProductFilters((prev) => ({ ...prev, search: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                      <select
                        value={productFilters.priceRange}
                        onChange={(e) => setProductFilters((prev) => ({ ...prev, priceRange: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">All Prices</option>
                        <option value="0-100">₹0 - ₹100</option>
                        <option value="100-500">₹100 - ₹500</option>
                        <option value="500-1000">₹500 - ₹1000</option>
                        <option value="1000">₹1000+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                      <select
                        value={productFilters.stockStatus}
                        onChange={(e) => setProductFilters((prev) => ({ ...prev, stockStatus: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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

              {/* Product Quick Add */}
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative" ref={productDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-left flex items-center justify-between"
                    >
                      <span className={selectedProduct ? "text-gray-900" : "text-gray-500"}>
                        {selectedProduct
                          ? products?.find((p) => p.id.toString() === selectedProduct.toString())?.title
                          : "Select Product"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${productDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    
                    {productDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="py-1">
                          {filteredProducts
                            .filter(p => !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase()))
                            .slice(0, 10)
                            .map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(product.id);
                                  setProductDropdownOpen(false);
                                  setProductSearch("");
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
                              >
                                {product.image ? (
                                  <img src={product.image} alt={product.title} className="w-8 h-8 object-cover rounded" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                    <Package className="w-4 h-4 text-gray-500" />
                                  </div>
                                )}
                                <span className="flex-1 truncate text-sm">{product.title}</span>
                                <span className="text-sm text-gray-600">₹{product.price}</span>
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={addProduct}
                      disabled={!selectedProduct}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Combo Offers Section - With Expand Icon */}
            {relevantCombinations.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-yellow-600" />
                    Available Combo Offers
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowComboModal(true)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    title="Expand view"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <ComboOffersTable combinations={relevantCombinations} showActions={true} />
                </div>
              </div>
            )}  
          </div>

          {/* Right Column - Applied Combos and Order Summary */}
          <div className="space-y-6">
            {/* Applied Combos with Quantity Controls - Using the same table */}
            {appliedCombos.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-green-600" />
                  Applied Combos
                </h3>
                
                <div className="overflow-x-auto">
                  <ComboOffersTable 
                    combinations={combinations?.filter(c => appliedCombos.some(ac => ac.comboId === c.id)) || []} 
                    showActions={true} 
                  />
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              </div>

              {/* Discount Display */}
              {totals.totalDiscount > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between text-yellow-700">
                    <span className="font-medium">Total Savings from Combos</span>
                    <span className="font-bold">-₹{totals.totalDiscount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (excl. GST)</span>
                  <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST Amount</span>
                  <span className="font-medium">₹{totals.gstAmount.toFixed(2)}</span>
                </div>
                {totals.originalTotal > totals.total && (
                  <div className="flex justify-between text-gray-400">
                    <span>Regular Total</span>
                    <span className="line-through">₹{totals.originalTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Grand Total</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
                </div>
              </div>

              {/* Partial Payment Input */}
              {formData.payment_status === "Partial" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partial Amount
                  </label>
                  <input
                    type="number"
                    name="partial_amount"
                    value={formData.partial_amount}
                    onChange={handleFormChange}
                    min="0"
                    max={totals.total}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{mutation.isLoading ? "Placing Order..." : "Place Order"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Combo Offers Modal */}
      {showComboModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowComboModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-8xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Gift className="w-6 h-6 mr-2 text-yellow-600" />
                Available Combo Offers - Full View
              </h3>
              <button
                onClick={() => setShowComboModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Filter Section - Only show if a product is selected */}
            {selectedProduct && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-6">
                  <span className="text-sm font-medium text-gray-700">Filter by where selected product appears:</span>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterPaid}
                      onChange={(e) => setFilterPaid(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Paid Items</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterFree}
                      onChange={(e) => setFilterFree(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Free Items</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterGift}
                      onChange={(e) => setFilterGift(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Gifts</span>
                  </label>
                  {(filterPaid || filterFree || filterGift) && (
                    <button
                      onClick={() => {
                        setFilterPaid(false);
                        setFilterFree(false);
                        setFilterGift(false);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {!selectedProduct && (
                  <p className="text-sm text-gray-500 mt-2">Please select a product to enable filters</p>
                )}
              </div>
            )}
            
            <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
              <ComboOffersTable combinations={relevantCombinations} showActions={true} />
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
              
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">Order ID</label>
                <div className="flex items-center justify-center space-x-2">
                  <input
                    type="text"
                    value={generatedOrderId}
                    readOnly
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-center"
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(generatedOrderId)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/orders");
                }}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default OrderNew;