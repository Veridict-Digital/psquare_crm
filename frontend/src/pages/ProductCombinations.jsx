import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

const ProductCombinations = () => {
  const [combinations, setCombinations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombination, setEditingCombination] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    combo_weight: '',
    curriar_purchase_point: '',
    curriar_dispatch_point: '',
    description: '',
    is_active: true,
    items: [],
    rewards: [],
    gifts: []
  });
  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    fetchCombinations();
    fetchProducts();
  }, []);

  const fetchCombinations = async () => {
    try {
      const response = await axios.get('/api/productcombinations/');
      setCombinations(response.data);
    } catch (error) {
      console.error('Error fetching combinations:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        items_data: formData.items,
        rewards_data: formData.rewards,
        gifts_data: formData.gifts
      };

      if (editingCombination) {
        await axios.put(`/api/productcombinations/${editingCombination.id}/`, dataToSend);
      } else {
        await axios.post('/api/productcombinations/', dataToSend);
      }
      fetchCombinations();
      resetForm();
    } catch (error) {
      console.error('Error saving combination:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      combo_weight: '',
      curriar_purchase_point: '',
      curriar_dispatch_point: '',
      description: '',
      is_active: true,
      items: [],
      rewards: [],
      gifts: []
    });
    setEditingCombination(null);
    setShowForm(false);
  };

  const handleEdit = (combination) => {
    setFormData({
      name: combination.name,
      combo_weight: combination.combo_weight || '',
      curriar_purchase_point: combination.curriar_purchase_point || '',
      curriar_dispatch_point: combination.curriar_dispatch_point || '',
      description: combination.description || '',
      is_active: combination.is_active,
      items: combination.items || [],
      rewards: combination.rewards || [],
      gifts: combination.gifts || []
    });
    setEditingCombination(combination);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this combination?')) {
      try {
        await axios.delete(`/api/productcombinations/${id}/`);
        fetchCombinations();
      } catch (error) {
        console.error('Error deleting combination:', error);
      }
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', quantity_required: 1, offer_price: 0 }]
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
      rewards: [...formData.rewards, { product: '', quantity_free: 1 }]
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
      gifts: [...formData.gifts, { product: '', quantity: 1 }]
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Product Combinations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Combination
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingCombination ? 'Edit Combination' : 'Add New Combination'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Combo Weight
                </label>
                <input
                  type="text"
                  value={formData.combo_weight}
                  onChange={(e) => setFormData({ ...formData, combo_weight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  curriar_purchase_point
                </label>
                <input
                  type="text"
                  value={formData.curriar_purchase_point}
                  onChange={(e) => setFormData({ ...formData, curriar_purchase_point: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  curriar_dispatch_Point
                </label>
                <input
                  type="text"
                  value={formData.curriar_dispatch_point}
                  onChange={(e) => setFormData({ ...formData, curriar_dispatch_point: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="1"
              />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active
                </label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Required Items */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Required Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Add Paid Item
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <select
                      value={item.product}
                      onChange={(e) => updateItem(index, 'product', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity_required}
                      onChange={(e) => updateItem(index, 'quantity_required', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.offer_price}
                      onChange={(e) => updateItem(index, 'offer_price', parseFloat(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Offer Price"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  {item.product && (
                    <div className="ml-4 p-2 bg-gray-50 rounded text-sm">
                      {(() => {
                        const product = products.find(p => p.id === parseInt(item.product));
                        return product ? (
                          <div>
                            <strong>SKU:</strong> {product.sku} | <strong>Price:</strong> ₹{product.price} | <strong>Stock:</strong> {product.stock_qty}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Free Rewards */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Free Rewards</h3>
                <button
                  type="button"
                  onClick={addReward}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Add Reward
                </button>
              </div>
              {formData.rewards.map((reward, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <select
                      value={reward.product}
                      onChange={(e) => updateReward(index, 'product', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={reward.quantity_free}
                      onChange={(e) => updateReward(index, 'quantity_free', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeReward(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  {reward.product && (
                    <div className="ml-4 p-2 bg-gray-50 rounded text-sm">
                      {(() => {
                        const product = products.find(p => p.id === parseInt(reward.product));
                        return product ? (
                          <div>
                            <strong>SKU:</strong> {product.sku} | <strong>Price:</strong> ₹{product.price} | <strong>Stock:</strong> {product.stock_qty}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Gifts */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Gifts</h3>
                <button
                  type="button"
                  onClick={addGift}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Add Gift
                </button>
              </div>
              {formData.gifts.map((gift, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <select
                      value={gift.product}
                      onChange={(e) => updateGift(index, 'product', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={gift.quantity}
                      onChange={(e) => updateGift(index, 'quantity', parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeGift(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  {gift.product && (
                    <div className="ml-4 p-2 bg-gray-50 rounded text-sm">
                      {(() => {
                        const product = products.find(p => p.id === parseInt(gift.product));
                        return product ? (
                          <div>
                            <strong>SKU:</strong> {product.sku} | <strong>Price:</strong> ₹{product.price} | <strong>Stock:</strong> {product.stock_qty}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingCombination ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="max-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Combo Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curriar Purchase Point
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curriar Dispatch Point
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Required Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Free Rewards
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gifts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinations.map((combination) => (
              <tr key={combination.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {combination.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combination.combo_weight || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combination.curriar_purchase_point || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combination.curriar_dispatch_point || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {combination.description || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {combination.items?.map(item => {
                    const product = products.find(p => p.id === item.product);
                    return product ? `${product.title} x${item.quantity_required} (MRP: ₹${product.mrp || '0.00'}, Price: ₹${product.price || '0.00'})` : 'Unknown';
                  }).join('; ') || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {combination.rewards?.map(reward => {
                    const product = products.find(p => p.id === reward.product);
                    return product ? `${product.title} x${reward.quantity_free} (MRP: ₹${product.mrp || '0.00'}, Price: ₹${product.price || '0.00'})` : 'Unknown';
                  }).join('; ') || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {combination.gifts?.map(gift => {
                    const product = products.find(p => p.id === gift.product);
                    return product ? `${product.title} x${gift.quantity} (MRP: ₹${product.mrp || '0.00'}, Price: ₹${product.price || '0.00'})` : 'Unknown';
                  }).join('; ') || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    combination.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {combination.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(combination)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(combination.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> 
    </div>
  );
};

export default ProductCombinations;
