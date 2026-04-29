import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Calculator,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";

const ProductCombinations = () => {
  const [combinations, setCombinations] = useState([]);
  const [products, setProducts] = useState([]);
  const [productPricings, setProductPricings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombination, setEditingCombination] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    combo_weight: "",
    curriar_purchase_point: "",
    curriar_dispatch_point: "",
    description: "",
    is_active: true,
    items: [],
    rewards: [],
    gifts: [],
    // Charge fields (for calculation display only)
    parking_charge_type: "rupees",
    parking_charge_value: 0,
    transportation_charge_type: "rupees",
    transportation_charge_value: 0,
    handling_charge_type: "rupees",
    handling_charge_value: 0,
    delivery_charge_type: "rupees",
    delivery_charge_value: 0,
    extra_charge_type: "rupees",
    extra_charge_value: 0,
    // Manual final price (actual selling price)
    manual_combo_price: "", // This is what the combo will actually sell for
  });

  useEffect(() => {
    fetchCombinations();
    fetchProducts();
    fetchProductPricings();
    checkUserRole();
  }, []);

  const checkUserRole = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user.role === "Admin");
  };

  const fetchCombinations = async () => {
    try {
      const response = await axios.get("/api/productcombinations/");
      setCombinations(response.data);
    } catch (error) {
      console.error("Error fetching combinations:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductPricings = async () => {
    try {
      const response = await axios.get("/api/productpricings/");
      const pricingsMap = {};
      response.data.forEach((pricing) => {
        pricingsMap[pricing.product] = pricing;
      });
      setProductPricings(pricingsMap);
    } catch (error) {
      console.error("Error fetching product pricings:", error);
    }
  };

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const calculateComboTotal = (items, rewards, gifts) => {
  let totalItemsValue = 0;
  let totalRewardsValue = 0;
  let totalGiftsValue = 0;
  
  // For aggregated rates from ALL products
  let totalMRP = 0;
  let totalSaleRate = 0;
  let totalLandingRate = 0;
  let totalCalculatedRate = 0;

  // Calculate PAID items
  items.forEach(item => {
    const product = products.find(p => p.id === parseInt(item.product));
    if (product) {
      const pricing = productPricings[product.id];
      
      const saleRate = formatNumber(pricing?.sale_rate) || formatNumber(product.price);
      const itemSaleTotal = saleRate * formatNumber(item.quantity_required);
      totalItemsValue += itemSaleTotal;
      
      // Add paid items to aggregated rates
      totalMRP += (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) * formatNumber(item.quantity_required);
      totalSaleRate += saleRate * formatNumber(item.quantity_required);
      totalLandingRate += (formatNumber(pricing?.landing_rate) || 0) * formatNumber(item.quantity_required);
      totalCalculatedRate += (formatNumber(pricing?.calculated_rate) || formatNumber(product.price)) * formatNumber(item.quantity_required);
    }
  });

  // ADD FREE REWARDS to aggregated rates (but NOT subtracting from net cost)
  rewards.forEach(reward => {
    const product = products.find(p => p.id === parseInt(reward.product));
    if (product) {
      const pricing = productPricings[product.id];
      const productValue = formatNumber(pricing?.sale_rate) || formatNumber(product.price);
      totalRewardsValue += productValue * formatNumber(reward.quantity_free);
      
      // Add rewards to aggregated rates only (for display purposes)
      totalMRP += (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) * formatNumber(reward.quantity_free);
      totalSaleRate += productValue * formatNumber(reward.quantity_free);
      totalLandingRate += (formatNumber(pricing?.landing_rate) || 0) * formatNumber(reward.quantity_free);
      totalCalculatedRate += (formatNumber(pricing?.calculated_rate) || formatNumber(product.price)) * formatNumber(reward.quantity_free);
    }
  });

  // ADD GIFTS to aggregated rates
  gifts.forEach(gift => {
    const product = products.find(p => p.id === parseInt(gift.product));
    if (product) {
      const pricing = productPricings[product.id];
      const productValue = formatNumber(pricing?.sale_rate) || formatNumber(product.price);
      totalGiftsValue += productValue * (formatNumber(gift.quantity) || 1);
      
      // Add gifts to aggregated rates
      totalMRP += (formatNumber(pricing?.mrp) || formatNumber(product.mrp)) * (formatNumber(gift.quantity) || 1);
      totalSaleRate += productValue * (formatNumber(gift.quantity) || 1);
      totalLandingRate += (formatNumber(pricing?.landing_rate) || 0) * (formatNumber(gift.quantity) || 1);
      totalCalculatedRate += (formatNumber(pricing?.calculated_rate) || formatNumber(product.price)) * (formatNumber(gift.quantity) || 1);
    }
  });

  return {
    totalCost: totalItemsValue,  // Total paid items cost
    rewardValue: totalRewardsValue,  // Total free rewards value
    giftValue: totalGiftsValue,  // Total gifts value
    netCost: totalItemsValue,  // REMOVED the subtraction - Net Cost is just paid items
    customerSavings: totalRewardsValue + totalGiftsValue,  // Total savings
    customerPays: totalItemsValue,  // Customer pays for paid items only
    // Aggregated rates from ALL products (paid + free + gifts)
    totalMRP: totalMRP,
    totalSaleRate: totalSaleRate,
    totalLandingRate: totalLandingRate,
    totalCalculatedRate: totalCalculatedRate
  };
};

  // Calculate individual charge based on base amount
  const calculateCharge = (baseAmount, chargeType, chargeValue) => {
    if (!chargeValue || chargeValue === 0) return 0;

    const base = formatNumber(baseAmount);
    const value = formatNumber(chargeValue);

    if (chargeType === "percent") {
      return (base * value) / 100;
    } else {
      return value;
    }
  };

  // Calculate all charges and totals
  const calculateChargesBreakdown = (baseAmount, formData) => {
    const parking = calculateCharge(
      baseAmount,
      formData.parking_charge_type,
      formData.parking_charge_value,
    );
    const transportation = calculateCharge(
      baseAmount,
      formData.transportation_charge_type,
      formData.transportation_charge_value,
    );
    const handling = calculateCharge(
      baseAmount,
      formData.handling_charge_type,
      formData.handling_charge_value,
    );
    const delivery = calculateCharge(
      baseAmount,
      formData.delivery_charge_type,
      formData.delivery_charge_value,
    );
    const extra = calculateCharge(
      baseAmount,
      formData.extra_charge_type,
      formData.extra_charge_value,
    );

    return {
      parking,
      transportation,
      handling,
      delivery,
      extra,
      totalCharges: parking + transportation + handling + delivery + extra,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        combo_weight: formData.combo_weight
          ? parseFloat(formData.combo_weight)
          : null,
        items_data: formData.items.map((item) => ({
          ...item,
          product: parseInt(item.product),
          quantity_required: parseInt(item.quantity_required),
          offer_price: item.offer_price ? parseFloat(item.offer_price) : null,
        })),
        rewards_data: formData.rewards.map((reward) => ({
          ...reward,
          product: parseInt(reward.product),
          quantity_free: parseInt(reward.quantity_free),
        })),
        gifts_data: formData.gifts.map((gift) => ({
          ...gift,
          product: parseInt(gift.product),
          quantity: parseInt(gift.quantity) || 1,
        })),
      };

      if (editingCombination) {
        await axios.put(
          `/api/productcombinations/${editingCombination.id}/`,
          dataToSend,
        );
      } else {
        await axios.post("/api/productcombinations/", dataToSend);
      }
      fetchCombinations();
      resetForm();
    } catch (error) {
      console.error("Error saving combination:", error);
      alert(error.response?.data?.message || "Error saving combination");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      combo_weight: "",
      curriar_purchase_point: "",
      curriar_dispatch_point: "",
      description: "",
      is_active: true,
      items: [],
      rewards: [],
      gifts: [],
      parking_charge_type: "rupees",
      parking_charge_value: 0,
      transportation_charge_type: "rupees",
      transportation_charge_value: 0,
      handling_charge_type: "rupees",
      handling_charge_value: 0,
      delivery_charge_type: "rupees",
      delivery_charge_value: 0,
      extra_charge_type: "rupees",
      extra_charge_value: 0,
      manual_combo_price: "",
    });
    setEditingCombination(null);
    setShowForm(false);
  };

  const handleEdit = (combination) => {
    setFormData({
      name: combination.name,
      combo_weight: combination.combo_weight || "",
      curriar_purchase_point: combination.curriar_purchase_point || "",
      curriar_dispatch_point: combination.curriar_dispatch_point || "",
      description: combination.description || "",
      is_active: combination.is_active,
      items: combination.items || [],
      rewards: combination.rewards || [],
      gifts: combination.gifts || [],
      parking_charge_type: combination.parking_charge_type || "rupees",
      parking_charge_value: combination.parking_charge_value || 0,
      transportation_charge_type:
        combination.transportation_charge_type || "rupees",
      transportation_charge_value: combination.transportation_charge_value || 0,
      handling_charge_type: combination.handling_charge_type || "rupees",
      handling_charge_value: combination.handling_charge_value || 0,
      delivery_charge_type: combination.delivery_charge_type || "rupees",
      delivery_charge_value: combination.delivery_charge_value || 0,
      extra_charge_type: combination.extra_charge_type || "rupees",
      extra_charge_value: combination.extra_charge_value || 0,
      manual_combo_price: combination.manual_combo_price || "",
    });
    setEditingCombination(combination);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this combination?")) {
      try {
        await axios.delete(`/api/productcombinations/${id}/`);
        fetchCombinations();
      } catch (error) {
        console.error("Error deleting combination:", error);
        alert("Error deleting combination");
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product: "", quantity_required: 1, offer_price: null },
      ],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addReward = () => {
    setFormData({
      ...formData,
      rewards: [...formData.rewards, { product: "", quantity_free: 1 }],
    });
  };

  const removeReward = (index) => {
    const newRewards = formData.rewards.filter((_, i) => i !== index);
    setFormData({ ...formData, rewards: newRewards });
  };

  const updateReward = (index, field, value) => {
    const newRewards = [...formData.rewards];
    newRewards[index][field] = value;
    setFormData({ ...formData, rewards: newRewards });
  };

  const addGift = () => {
    setFormData({
      ...formData,
      gifts: [...formData.gifts, { product: "", quantity: 1 }],
    });
  };

  const removeGift = (index) => {
    const newGifts = formData.gifts.filter((_, i) => i !== index);
    setFormData({ ...formData, gifts: newGifts });
  };

  const updateGift = (index, field, value) => {
    const newGifts = [...formData.gifts];
    newGifts[index][field] = value;
    setFormData({ ...formData, gifts: newGifts });
  };

  const getProductDetails = (productId) => {
    if (!productId) return null;
    const product = products.find((p) => p.id === parseInt(productId));
    const pricing = productPricings[productId];
    if (!product) return null;

    return {
      ...product,
      sale_rate:
        formatNumber(pricing?.sale_rate) || formatNumber(product.price),
      mrp: formatNumber(pricing?.mrp) || formatNumber(product.mrp),
      calculated_rate:
        formatNumber(pricing?.calculated_rate) || formatNumber(product.price),
      landing_rate: formatNumber(pricing?.landing_rate) || 0,
      price: formatNumber(product.price),
      stock_qty: formatNumber(product.stock_qty),
    };
  };

  const comboCalculations = calculateComboTotal(
    formData.items,
    formData.rewards,
    formData.gifts,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 max-w-full bg-gray-50 min-h-screen">
      {/* Header */}

      <div className="flex justify-between items-center">
        <div className="flex items-center mb-2">
          <h1 className="text-3xl font-bold text-black">
            Product Combinations
          </h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#1a2332] text-white px-6 py-2 rounded-lg hover:bg-[#2d3748] hover:text-white transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg mb-2"
          >
            <Plus className="h-5 w-5" />
            Add Combination
          </button>
        )}
      </div>

      {/* Form Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1a2332] text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingCombination
                  ? "Edit Combination"
                  : "Create New Combination"}
              </h2>
              <button
                onClick={resetForm}
                className="text-white hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Combination Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Combo Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.combo_weight}
                    onChange={(e) =>
                      setFormData({ ...formData, combo_weight: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Point
                  </label>
                  <input
                    type="text"
                    value={formData.curriar_purchase_point}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        curriar_purchase_point: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispatch Point
                  </label>
                  <input
                    type="text"
                    value={formData.curriar_dispatch_point}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        curriar_dispatch_point: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="2"
                />
              </div> */}
              {/* Additional Charges Section - For Display Only */}
              <div className="mb-1">
                <div className="flex justify-between items-center mb-1"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-1">
                  {/* Parking Charge */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Parking Charge
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.parking_charge_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parking_charge_type: e.target.value,
                          })
                        }
                        className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="rupees">₹</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.parking_charge_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parking_charge_value:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  </div>

                  {/* Transportation Charge */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transportation Charge
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.transportation_charge_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transportation_charge_type: e.target.value,
                          })
                        }
                        className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="rupees">₹</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.transportation_charge_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transportation_charge_value:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  </div>

                  {/* Handling Charge */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Handling Charge
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.handling_charge_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            handling_charge_type: e.target.value,
                          })
                        }
                        className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="rupees">₹</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.handling_charge_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            handling_charge_value:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  </div>

                  {/* Delivery Charge */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Charge
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.delivery_charge_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            delivery_charge_type: e.target.value,
                          })
                        }
                        className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="rupees">₹</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.delivery_charge_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            delivery_charge_value:
                              parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  </div>

                  {/* Extra Charge */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Extra Charge
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.extra_charge_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            extra_charge_type: e.target.value,
                          })
                        }
                        className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="rupees">₹</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.extra_charge_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            extra_charge_value: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-20 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Amount"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Combo Calculator Summary */}
              {/* Combo Calculator Summary */}
              {formData.items.length > 0 && (
                <div className="mb-6 bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex justify-between items-center bg-[#1a2332] text-white px-4 py-2">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Combo Calculator
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            MRP
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Sale Rate
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Landing Rate
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Calculated Rate
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Suggested Rate
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                            Net Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-blue-600">
                            ₹{comboCalculations.totalMRP?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-3 py-2 font-medium text-green-600">
                            ₹
                            {comboCalculations.totalSaleRate?.toFixed(2) ||
                              "0.00"}
                          </td>
                          <td className="px-3 py-2 text-yellow-600">
                            ₹
                            {comboCalculations.totalLandingRate?.toFixed(2) ||
                              "0.00"}
                          </td>
                          <td className="px-3 py-2 text-orange-600">
                            ₹
                            {comboCalculations.totalCalculatedRate?.toFixed(
                              2,
                            ) || "0.00"}
                          </td>
                          <td className="px-3 py-2 text-purple-600 font-medium">
                            ₹
                            {comboCalculations.totalSaleRate?.toFixed(2) ||
                              "0.00"}
                          </td>
                          <td className="px-3 py-2 font-bold text-purple-600">
                            ₹{comboCalculations.netCost.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Charges Breakdown Section */}
                  {(() => {
                    const charges = calculateChargesBreakdown(
                      comboCalculations.netCost,
                      formData,
                    );
                    const calculatedPriceWithCharges =
                      comboCalculations.netCost + charges.totalCharges;

                    return (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">
                          Charges Breakdown (Calculated)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs text-gray-500">Parking</p>
                            <p className="text-sm font-semibold">
                              ₹{charges.parking.toFixed(2)}
                            </p>
                            {formData.parking_charge_value > 0 && (
                              <p className="text-xs text-gray-400">
                                ({formData.parking_charge_value}
                                {formData.parking_charge_type === "percent"
                                  ? "%)"
                                  : " ₹)"}
                              </p>
                            )}
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs text-gray-500">Transport</p>
                            <p className="text-sm font-semibold">
                              ₹{charges.transportation.toFixed(2)}
                            </p>
                            {formData.transportation_charge_value > 0 && (
                              <p className="text-xs text-gray-400">
                                ({formData.transportation_charge_value}
                                {formData.transportation_charge_type ===
                                "percent"
                                  ? "%)"
                                  : " ₹)"}
                              </p>
                            )}
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs text-gray-500">Handling</p>
                            <p className="text-sm font-semibold">
                              ₹{charges.handling.toFixed(2)}
                            </p>
                            {formData.handling_charge_value > 0 && (
                              <p className="text-xs text-gray-400">
                                ({formData.handling_charge_value}
                                {formData.handling_charge_type === "percent"
                                  ? "%)"
                                  : " ₹)"}
                              </p>
                            )}
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs text-gray-500">Delivery</p>
                            <p className="text-sm font-semibold">
                              ₹{charges.delivery.toFixed(2)}
                            </p>
                            {formData.delivery_charge_value > 0 && (
                              <p className="text-xs text-gray-400">
                                ({formData.delivery_charge_value}
                                {formData.delivery_charge_type === "percent"
                                  ? "%)"
                                  : " ₹)"}
                              </p>
                            )}
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <p className="text-xs text-gray-500">Extra</p>
                            <p className="text-sm font-semibold">
                              ₹{charges.extra.toFixed(2)}
                            </p>
                            {formData.extra_charge_value > 0 && (
                              <p className="text-xs text-gray-400">
                                ({formData.extra_charge_value}
                                {formData.extra_charge_type === "percent"
                                  ? "%)"
                                  : " ₹)"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Calculated Price (Net + Charges):
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              ₹{calculatedPriceWithCharges.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Manual Combo Price Input */}
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-3">
                            Actual Combo Selling Price (Manual Entry)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Manual Combo Price (₹) - *Actual Selling Price
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.manual_combo_price}
                                onChange={(e) => {
                                  const price = parseFloat(e.target.value);
                                  setFormData({
                                    ...formData,
                                    manual_combo_price: e.target.value,
                                  });

                                  // Calculate margin based on net cost
                                  if (
                                    !isNaN(price) &&
                                    comboCalculations.netCost > 0
                                  ) {
                                    const marginOnNet =
                                      ((price - comboCalculations.netCost) /
                                        comboCalculations.netCost) *
                                      100;
                                    const marginOnCharges =
                                      calculatedPriceWithCharges > 0
                                        ? ((price -
                                            calculatedPriceWithCharges) /
                                            calculatedPriceWithCharges) *
                                          100
                                        : 0;

                                    // You can store these in state if needed
                                    console.log(
                                      `Margin on Net Cost: ${marginOnNet.toFixed(2)}%`,
                                    );
                                    console.log(
                                      `Margin on Calculated Price: ${marginOnCharges.toFixed(2)}%`,
                                    );
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Enter actual selling price"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                This is the actual price customers will pay for
                                this combo
                              </p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3">
                              <p className="text-xs text-gray-600">
                                Profit Analysis
                              </p>
                              {formData.manual_combo_price &&
                                comboCalculations.netCost > 0 && (
                                  <>
                                    <p className="text-sm font-semibold text-green-600">
                                      Profit on Net Cost: ₹
                                      {(
                                        parseFloat(
                                          formData.manual_combo_price,
                                        ) - comboCalculations.netCost
                                      ).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Margin:{" "}
                                      {(
                                        ((parseFloat(
                                          formData.manual_combo_price,
                                        ) -
                                          comboCalculations.netCost) /
                                          comboCalculations.netCost) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </p>
                                  </>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Required Items Table */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    Required Items (Paid)
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
                </div>

                {formData.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                      <thead className="bg-[#1a2332]">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Product
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Qty
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Offer Price
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            MRP
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Sale Rate
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            landing Rate
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Total
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.items.map((item, index) => {
                          const productDetails = getProductDetails(
                            item.product,
                          );
                          const itemTotal = productDetails
                            ? (formatNumber(item.offer_price) ||
                                productDetails.sale_rate) *
                              formatNumber(item.quantity_required)
                            : 0;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <select
                                  value={item.product}
                                  onChange={(e) =>
                                    updateItem(index, "product", e.target.value)
                                  }
                                  className="w-48 px-2 py-1 border border-gray-300 rounded text-sm"
                                  required
                                >
                                  <option value="">Select Product</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.title} ({product.sku})
                                    </option>
                                  ))}
                                </select>
                                {productDetails && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    SKU: {productDetails.sku} | Stock:{" "}
                                    {productDetails.stock_qty}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity_required}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "quantity_required",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  required
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.offer_price || ""}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "offer_price",
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : null,
                                    )
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Optional"
                                />
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ₹{productDetails?.mrp.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ₹
                                {productDetails?.sale_rate.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ₹
                                {productDetails?.calculated_rate.toFixed(2) ||
                                  "0.00"}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold">
                                ₹{itemTotal.toFixed(2)}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">
                      No items added yet. Click "Add Item" to start building
                      your combo.
                    </p>
                  </div>
                )}
              </div>

              {/* Free Rewards Table */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Free Rewards
                  </h3>
                  <button
                    type="button"
                    onClick={addReward}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Reward
                  </button>
                </div>

                {formData.rewards.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                      <thead className="bg-[#1a2332]">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Free Product
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            MRP
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Value
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.rewards.map((reward, index) => {
                          const productDetails = getProductDetails(
                            reward.product,
                          );
                          const rewardValue = productDetails
                            ? productDetails.sale_rate *
                              formatNumber(reward.quantity_free)
                            : 0;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <select
                                  value={reward.product}
                                  onChange={(e) =>
                                    updateReward(
                                      index,
                                      "product",
                                      e.target.value,
                                    )
                                  }
                                  className="w-64 px-2 py-1 border border-gray-300 rounded text-sm"
                                  required
                                >
                                  <option value="">Select Product</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.title} ({product.sku})
                                    </option>
                                  ))}
                                </select>
                                {productDetails && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    SKU: {productDetails.sku}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={reward.quantity_free}
                                  onChange={(e) =>
                                    updateReward(
                                      index,
                                      "quantity_free",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  required
                                />
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ₹{productDetails?.mrp.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                ₹{rewardValue.toFixed(2)}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeReward(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">
                      No rewards added yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Gifts Table */}
              <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                    Gifts
                  </h3>
                  <button
                    type="button"
                    onClick={addGift}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Gift
                  </button>
                </div>

                {formData.gifts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                      <thead className="bg-[#1a2332]">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Gift Product
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Quantity
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            MRP
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Value
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-white">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {formData.gifts.map((gift, index) => {
                          const productDetails = getProductDetails(
                            gift.product,
                          );
                          const giftValue = productDetails
                            ? productDetails.sale_rate *
                              (formatNumber(gift.quantity) || 1)
                            : 0;
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <select
                                  value={gift.product}
                                  onChange={(e) =>
                                    updateGift(index, "product", e.target.value)
                                  }
                                  className="w-64 px-2 py-1 border border-gray-300 rounded text-sm"
                                  required
                                >
                                  <option value="">Select Product</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.title} ({product.sku})
                                    </option>
                                  ))}
                                </select>
                                {productDetails && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    SKU: {productDetails.sku}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={gift.quantity}
                                  onChange={(e) =>
                                    updateGift(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  required
                                />
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ₹{productDetails?.mrp.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-2 text-sm font-semibold text-orange-600">
                                ₹{giftValue.toFixed(2)}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeGift(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">No gifts added yet.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a2332] text-white rounded-lg hover:bg-[#0d1421] transition-all duration-200 shadow-lg"
                >
                  {editingCombination
                    ? "Update Combination"
                    : "Create Combination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Combinations Table */}
      {/* Combinations Table */}
      {/* Combinations Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#1a2332]">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-white">
                  Combo
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-white"
                  colSpan="4"
                >
                  Paid Items
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-white"
                  colSpan="4"
                >
                  Free Rewards
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-white"
                  colSpan="2"
                >
                  Gifts
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-white"
                  colSpan="6"
                >
                  Cost Breakdown
                </th>
                {isAdmin && (
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-white">
                    Actions
                  </th>
                )}
              </tr>
              <tr className="bg-[#1a2332]">
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Name/Info
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Product
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Qty
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Unit Price
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Total
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Product
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Qty
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Price
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  You Save
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Product
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Value
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  MRP
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Sale Rate
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Landing Rate
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Calculated Rate
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Suggested Rate
                </th>
                <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white">
                  Combo Rate
                </th>
                {/* Combo Rate Column - Show Manual Price */}
                {isAdmin && (
                  <th className="border border-gray-300 px-4 py-2 text-xs font-medium text-white"></th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white">
              {combinations.map((combination) => {
                const comboTotal = calculateComboTotal(
                  combination.items || [],
                  combination.rewards || [],
                  combination.gifts || [],
                );

                // Get the first few items for display
                const displayItems = (combination.items || []).slice(0, 2);
                const remainingItems = (combination.items || []).length - 2;
                const displayRewards = (combination.rewards || []).slice(0, 2);
                const remainingRewards = (combination.rewards || []).length - 2;
                const displayGifts = (combination.gifts || []).slice(0, 2);
                const remainingGifts = (combination.gifts || []).length - 2;

                return (
                  <tr
                    key={combination.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Combo Details Column */}
                    <td className="border border-gray-300 px-4 py-3 align-top">
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-900 text-sm">
                          {combination.name}
                        </div>
                        {combination.description && (
                          <div className="text-xs text-gray-500">
                            {combination.description}
                          </div>
                        )}
                        <div className="flex flex-col gap-1 text-xs">
                          {combination.combo_weight && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-600">
                                Weight:
                              </span>
                              <span>
                                {formatNumber(combination.combo_weight)} kg
                              </span>
                            </div>
                          )}
                          {combination.curriar_purchase_point && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-600">
                                Purchase:
                              </span>
                              <span className="text-xs">
                                {combination.curriar_purchase_point}
                              </span>
                            </div>
                          )}
                          {combination.curriar_dispatch_point && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-600">
                                Dispatch:
                              </span>
                              <span className="text-xs">
                                {combination.curriar_dispatch_point}
                              </span>
                            </div>
                          )}
                        </div>
                        {/* <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      combination.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {combination.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div> */}
                      </div>
                    </td>

                    {/* Paid Items Section */}
                    <td className="border border-gray-300 px-4 py-3 align-top">
                      <div className="space-y-2">
                        {displayItems.map((item, idx) => {
                          const product = products.find(
                            (p) => p.id === item.product,
                          );
                          if (!product) return null;
                          return (
                            <div key={idx} className="text-sm">
                              <div className="font-medium text-gray-900">
                                {product.title}
                              </div>
                            </div>
                          );
                        })}
                        {remainingItems > 0 && (
                          <div className="text-xs text-purple-600 font-medium mt-1">
                            +{remainingItems} more item
                            {remainingItems > 1 ? "s" : ""}
                          </div>
                        )}
                        {(!combination.items ||
                          combination.items.length === 0) && (
                          <span className="text-gray-400 text-sm">
                            No items
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-center">
                      <div className="space-y-2">
                        {displayItems.map((item, idx) => (
                          <div key={idx} className="text-sm font-medium">
                            {formatNumber(item.quantity_required)}
                          </div>
                        ))}
                        {remainingItems > 0 && (
                          <div className="text-xs text-gray-400">
                            +{remainingItems}
                          </div>
                        )}
                        {(!combination.items ||
                          combination.items.length === 0) && <span>-</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-right">
                      <div className="space-y-2">
                        {displayItems.map((item, idx) => {
                          const product = products.find(
                            (p) => p.id === item.product,
                          );
                          const pricing = productPricings[item.product];
                          const price =
                            item.offer_price ||
                            pricing?.sale_rate ||
                            product?.price ||
                            0;
                          return (
                            <div key={idx} className="text-sm">
                              ₹{formatNumber(price).toFixed(2)}
                              {item.offer_price && (
                                <div className="text-xs text-green-600">
                                  Special Offer
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {remainingItems > 0 && (
                          <div className="text-xs text-gray-400">
                            Various prices
                          </div>
                        )}
                        {(!combination.items ||
                          combination.items.length === 0) && <span>-</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-right">
                      <div className="space-y-2">
                        {displayItems.map((item, idx) => {
                          const product = products.find(
                            (p) => p.id === item.product,
                          );
                          const pricing = productPricings[item.product];
                          const unitPrice =
                            item.offer_price ||
                            pricing?.sale_rate ||
                            product?.price ||
                            0;
                          const total =
                            formatNumber(unitPrice) *
                            formatNumber(item.quantity_required);
                          return (
                            <div key={idx} className="text-sm font-semibold">
                              ₹{total.toFixed(2)}
                            </div>
                          );
                        })}
                        {remainingItems > 0 && (
                          <div className="text-xs text-purple-600 font-medium">
                            +{remainingItems} more
                          </div>
                        )}
                        {(!combination.items ||
                          combination.items.length === 0) && <span>-</span>}
                      </div>
                    </td>

                    {/* Free Rewards Section */}
                    <td className="border border-gray-300 px-4 py-3 align-top">
                      <div className="space-y-2">
                        {displayRewards.map((reward, idx) => {
                          const product = products.find(
                            (p) => p.id === reward.product,
                          );
                          if (!product) return null;
                          return (
                            <div key={idx} className="text-sm">
                              <div className="font-medium text-green-700">
                                {product.title}
                              </div>
                            </div>
                          );
                        })}
                        {remainingRewards > 0 && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            +{remainingRewards} more reward
                            {remainingRewards > 1 ? "s" : ""}
                          </div>
                        )}
                        {(!combination.rewards ||
                          combination.rewards.length === 0) && (
                          <span className="text-gray-400 text-sm">
                            No rewards
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-center">
                      <div className="space-y-2">
                        {displayRewards.map((reward, idx) => (
                          <div
                            key={idx}
                            className="text-sm font-medium text-green-700"
                          >
                            {formatNumber(reward.quantity_free)}
                          </div>
                        ))}
                        {remainingRewards > 0 && (
                          <div className="text-xs text-gray-400">
                            +{remainingRewards}
                          </div>
                        )}
                        {(!combination.rewards ||
                          combination.rewards.length === 0) && <span>-</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-right">
                      <div className="space-y-2">
                        {displayRewards.map((reward, idx) => {
                          const product = products.find(
                            (p) => p.id === reward.product,
                          );
                          const pricing = productPricings[reward.product];
                          const price =
                            pricing?.sale_rate || product?.price || 0;
                          return (
                            <div
                              key={idx}
                              className="text-sm text-gray-600 line-through"
                            >
                              ₹{formatNumber(price).toFixed(2)}
                            </div>
                          );
                        })}
                        {remainingRewards > 0 && (
                          <div className="text-xs text-gray-400">
                            Various prices
                          </div>
                        )}
                        {(!combination.rewards ||
                          combination.rewards.length === 0) && <span>-</span>}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-right">
                      <div className="space-y-2">
                        {displayRewards.map((reward, idx) => {
                          const product = products.find(
                            (p) => p.id === reward.product,
                          );
                          const pricing = productPricings[reward.product];
                          const price =
                            pricing?.sale_rate || product?.price || 0;
                          const total =
                            formatNumber(price) *
                            formatNumber(reward.quantity_free);
                          return (
                            <div
                              key={idx}
                              className="text-sm font-bold text-green-600"
                            >
                              ₹{total.toFixed(2)}
                            </div>
                          );
                        })}
                        {remainingRewards > 0 && (
                          <div className="text-xs text-green-600">
                            +{remainingRewards} more
                          </div>
                        )}
                        {(!combination.rewards ||
                          combination.rewards.length === 0) && <span>-</span>}
                      </div>
                    </td>

                    {/* Gifts Section */}
                    <td className="border border-gray-300 px-4 py-3 align-top">
                      <div className="space-y-2">
                        {displayGifts.map((gift, idx) => {
                          const product = products.find(
                            (p) => p.id === gift.product,
                          );
                          if (!product) return null;
                          return (
                            <div key={idx} className="text-sm">
                              <div className="font-medium text-orange-700">
                                {product.title}
                              </div>
                            </div>
                          );
                        })}
                        {remainingGifts > 0 && (
                          <div className="text-xs text-orange-600 font-medium mt-1">
                            +{remainingGifts} more gift
                            {remainingGifts > 1 ? "s" : ""}
                          </div>
                        )}
                        {(!combination.gifts ||
                          combination.gifts.length === 0) && (
                          <span className="text-gray-400 text-sm">
                            No gifts
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 align-top text-right">
                      <div className="space-y-2">
                        {displayGifts.map((gift, idx) => {
                          const product = products.find(
                            (p) => p.id === gift.product,
                          );
                          const pricing = productPricings[gift.product];
                          const value =
                            (pricing?.sale_rate || product?.price || 0) *
                            (gift.quantity || 1);
                          return (
                            <div
                              key={idx}
                              className="text-sm font-medium text-orange-600"
                            >
                              ₹{formatNumber(value).toFixed(2)}
                            </div>
                          );
                        })}
                        {remainingGifts > 0 && (
                          <div className="text-xs text-orange-600">
                            +{remainingGifts} more
                          </div>
                        )}
                        {(!combination.gifts ||
                          combination.gifts.length === 0) && <span>-</span>}
                      </div>
                    </td>

                    {/* Cost Breakdown Section - NEW Detailed View */}
                    <td className="border border-gray-300 px-4 py-3 text-right align-top bg-blue-50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">
                          ₹{formatNumber(comboTotal.totalMRP).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right align-top bg-green-50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-green-700">
                          ₹{formatNumber(comboTotal.totalSaleRate).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right align-top bg-yellow-50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-yellow-700">
                          ₹
                          {formatNumber(comboTotal.totalLandingRate).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right align-top bg-orange-50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-orange-700">
                          ₹
                          {formatNumber(comboTotal.totalCalculatedRate).toFixed(
                            2,
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-right align-top bg-purple-50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-purple-700">
                          ₹{formatNumber(comboTotal.totalSaleRate).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    {/* Combo Rate Column - Show Manual Price */}
                    <td className="border border-gray-300 px-4 py-3 text-right align-top bg-pink-50">
                      <div className="space-y-1">
                        <div className="text-base font-bold text-pink-700">
                          ₹
                          {formatNumber(
                            combination.manual_combo_price || 0,
                          ).toFixed(2)}
                        </div>
                        {combination.manual_combo_price &&
                          comboCalculations.totalCalculatedRate > 0 && (
                            <div className="text-xs text-green-600">
                              Margin:{" "}
                              {(
                                ((combination.manual_combo_price -
                                  comboCalculations.totalCalculatedRate) /
                                  comboCalculations.totalCalculatedRate) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          )}
                      </div>
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="border border-gray-300 px-4 py-3 align-top">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleEdit(combination)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(combination.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {combinations.length === 0 && (
          <div className="text-center py-12 bg-white">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No product combinations found.</p>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
              >
                Create your first combination
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCombinations;
