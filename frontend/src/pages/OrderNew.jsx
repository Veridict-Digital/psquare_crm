import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OrderNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    customer: '',
    agent: '',
    status: 'Placed',
    payment_status: 'Paid',
    followup_date: '',
  });

  const [orderItems, setOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [generatedOrderId, setGeneratedOrderId] = useState('');

  // Fetch customers and products
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => axios.get('/api/customers/').then(res => res.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('/api/products/').then(res => res.data),
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/orders/', data);
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedOrderId(data.order_id);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['customers']);
      // Don't navigate immediately, show the order ID first
    },
  });

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const gstTotal = orderItems.reduce((sum, item) => sum + ((item.unit_price * item.quantity * item.gst_rate) / 100), 0);
    return {
      subtotal: subtotal,
      gstTotal: gstTotal,
      total: subtotal + gstTotal,
    };
  };

  const totals = calculateTotals();

  // Set customer from URL parameter on component mount
  useEffect(() => {
    const customerId = searchParams.get('customer');
    if (customerId && customers) {
      const customerExists = customers.find(c => c.id.toString() === customerId.toString());
      if (customerExists) {
        setFormData(prev => ({ ...prev, customer: customerId }));
      }
    }
  }, [searchParams, customers]);

  // Auto-assign agent based on customer selection
  useEffect(() => {
    if (formData.customer && customers) {
      const selectedCustomer = customers.find(c => c.id.toString() === formData.customer.toString());
      if (selectedCustomer && selectedCustomer.agent) {
        setFormData(prev => ({ ...prev, agent: selectedCustomer.agent }));
      } else {
        // Clear agent - backend will auto-assign to admin
        setFormData(prev => ({ ...prev, agent: '' }));
      }
    }
  }, [formData.customer, customers]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Set followup date if payment status is credit
    if (name === 'payment_status' && value === 'Credit') {
      const today = new Date();
      const followupDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, followup_date: followupDate }));
    } else if (name === 'payment_status' && value === 'Paid') {
      setFormData(prev => ({ ...prev, followup_date: '' }));
    }
  };

  const addProduct = () => {
    if (!selectedProduct || quantity <= 0) return;

    const product = products.find(p => p.id.toString() === selectedProduct.toString());
    if (!product) return;

    // Check if product already exists in order items
    const existingItem = orderItems.find(item => item.product === product.id);
    if (existingItem) {
      setOrderItems(prev => prev.map(item =>
        item.product === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setOrderItems(prev => [...prev, {
        product: product.id,
        product_title: product.title,
        product_sku: product.sku,
        quantity: quantity,
        unit_price: parseFloat(product.price),
        gst_rate: parseFloat(product.gst_rate),
      }]);
    }

    setSelectedProduct('');
    setQuantity(1);
  };

  const removeProduct = (productId) => {
    setOrderItems(prev => prev.filter(item => item.product !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return;
    setOrderItems(prev => prev.map(item =>
      item.product === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (orderItems.length === 0) {
      alert('Please add at least one product to the order.');
      return;
    }

    const orderData = {
      customer: formData.customer,
      agent: formData.agent || undefined,
      status: formData.status,
      payment_status: formData.payment_status,
      ...(formData.followup_date && { followup_date: formData.followup_date }),
      total_amount: totals.total,
      paid_amount: formData.payment_status === 'Paid' ? totals.total : 0,
      items: orderItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unit_price: item.unit_price,
        gst_rate: item.gst_rate,
      })),
    };

    mutation.mutate(orderData);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Create New Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
              <select
                name="customer"
                value={formData.customer}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Customer</option>
                {customers?.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Agent</label>
              <input
                type="text"
                value={customers?.find(c => c.id.toString() === formData.customer?.toString())?.agent_name || 'Auto-assigned'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Placed">Placed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Paid">Paid</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>
            </div>

            {formData.payment_status === 'Credit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                <input
                  type="date"
                  name="followup_date"
                  value={formData.followup_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={mutation.isLoading || orderItems.length === 0}
            >
              {mutation.isLoading ? 'Creating Order...' : 'Create Order'}
            </button>
          </form>
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Products</h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Product</option>
                {products?.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.title} (SKU: {product.sku}) - ₹{product.price} (Stock: {product.stock_qty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              disabled={!selectedProduct}
            >
              Add Product
            </button>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No products added yet</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.product} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product_title}</h4>
                      <p className="text-sm text-gray-600">SKU: {item.product_sku}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.product, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm text-gray-600">
                          ₹{item.unit_price} × {item.quantity} = ₹{(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeProduct(item.product)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      {orderItems.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-sm font-medium text-blue-600">Subtotal</div>
              <div className="text-2xl font-bold text-blue-900">₹{totals.subtotal.toFixed(2)}</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="text-sm font-medium text-purple-600">GST Total</div>
              <div className="text-2xl font-bold text-purple-900">₹{totals.gstTotal.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-sm font-medium text-green-600">Grand Total</div>
              <div className="text-2xl font-bold text-green-900">₹{totals.total.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Order ID */}
      {generatedOrderId && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4">Order Created Successfully!</h2>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-green-700 mb-2">Order ID</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={generatedOrderId}
                  readOnly
                  className="px-3 py-2 border border-green-300 rounded-lg bg-white text-green-900 font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generatedOrderId)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Orders
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderNew;
