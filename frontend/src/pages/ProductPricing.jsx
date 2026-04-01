import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
  Percent
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { toast } from 'react-hot-toast';

const ProductPricing = () => {
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all products with their pricings
  const { data: pricingData, isLoading, error, refetch } = useQuery({
    queryKey: ['productPricings'],
    queryFn: async () => {
      const [productsRes, pricingsRes] = await Promise.all([
        axios.get('/api/products/'),
        axios.get('/api/productpricings/')
      ]);
      
      const products = productsRes.data;
      const pricings = pricingsRes.data;
      
      return products.map(product => {
        const pricing = pricings.find(p => p.product === product.id);
        return {
          id: pricing?.id || null,
          product: product.id,
          sku: product.sku,
          title: product.title,
          category: product.category_display || 
                   product.category?.name || 
                   product.category1_display || 
                   product.category1?.name || 
                   '',
          unit: product.unit || '',
          product_weight: product.product_weight || '',
          hsn: product.hsn || '',
          purchase_value: pricing?.purchase_value ?? 0,
          purchase_type: pricing?.purchase_type ?? 'rupees',
          transport_value: pricing?.transport_value ?? 0,
          transport_type: pricing?.transport_type ?? 'rupees',
          labor_value: pricing?.labor_value ?? 0,
          labor_type: pricing?.labor_type ?? 'rupees',
          handling_value: pricing?.handling_value ?? 0,
          handling_type: pricing?.handling_type ?? 'rupees',
          godown_value: pricing?.godown_value ?? 0,
          godown_type: pricing?.godown_type ?? 'rupees',
          delivery_value: pricing?.delivery_value ?? 0,
          delivery_type: pricing?.delivery_type ?? 'rupees',
          packaging_value: pricing?.packaging_value ?? 0,
          packaging_type: pricing?.packaging_type ?? 'rupees',
          extra1_value: pricing?.extra1_value ?? 0,
          extra1_type: pricing?.extra1_type ?? 'rupees',
          extra2_value: pricing?.extra2_value ?? 0,
          extra2_type: pricing?.extra2_type ?? 'rupees',
          landing_value: pricing?.landing_value ?? 0,
          landing_type: pricing?.landing_type ?? 'rupees',
          company_margin_value: pricing?.company_margin_value ?? 0,
          company_margin_type: pricing?.company_margin_type ?? 'percent',
          landing_rate: pricing?.landing_rate ?? 0,
          calculated_rate: pricing?.calculated_rate ?? 0,
          sale_rate: pricing?.sale_rate ?? 0,
          mrp: pricing?.mrp ?? 0,
          isNew: !pricing?.id
        };
      });
    },
    staleTime: 5 * 60 * 1000
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map(item => {
        // In saveMutation, ensure all fields are included
const dataToSend = {
  product: item.product,
  purchase_value: Number(item.purchase_value),
  purchase_type: item.purchase_type,
  transport_value: Number(item.transport_value),
  transport_type: item.transport_type,
  labor_value: Number(item.labor_value),
  labor_type: item.labor_type,
  handling_value: Number(item.handling_value),
  handling_type: item.handling_type,
  godown_value: Number(item.godown_value),
  godown_type: item.godown_type,
  delivery_value: Number(item.delivery_value),
  delivery_type: item.delivery_type,
  packaging_value: Number(item.packaging_value),  // ✅ Include this
  packaging_type: item.packaging_type,            // ✅ Include this
  extra1_value: Number(item.extra1_value),        // ✅ Include this
  extra1_type: item.extra1_type,                  // ✅ Include this
  extra2_value: Number(item.extra2_value),        // ✅ Include this
  extra2_type: item.extra2_type,                  // ✅ Include this
  landing_value: Number(item.landing_value),
  landing_type: item.landing_type,
  company_margin_value: Number(item.company_margin_value),
  company_margin_type: item.company_margin_type,
  sale_rate: Number(item.sale_rate) || 0,
  mrp: Number(item.mrp) || 0
};
        
        if (item.isNew) {
          return axios.post('/api/productpricings/', dataToSend);
        } else {
          return axios.put(`/api/productpricings/${item.id}/`, dataToSend);
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Pricing saved successfully!');
      setEditedValues({});
      setEditingCell(null);
      queryClient.invalidateQueries({ queryKey: ['productPricings'] });
      setSaving(false);
    },
    onError: (error) => {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.product?.[0] || 
                          error.response?.data?.message || 
                          error.message;
      toast.error(`Save failed: ${errorMessage}`);
      setSaving(false);
    }
  });

  // Calculate pricing locally
  const calculatePricing = (row) => {
    let base = Number(row.purchase_value) || 0;
    
    const calculateCost = (baseAmount, type, value) => {
      if (type === 'percent') {
        return baseAmount * (Number(value) / 100);
      }
      return Number(value);
    };
    
    base += calculateCost(base, row.transport_type, row.transport_value);
    base += calculateCost(base, row.labor_type, row.labor_value);
    base += calculateCost(base, row.handling_type, row.handling_value);
    base += calculateCost(base, row.godown_type, row.godown_value);
    base += calculateCost(base, row.delivery_type, row.delivery_value);
    base += calculateCost(base, row.packaging_type, row.packaging_value);
    base += calculateCost(base, row.extra1_type, row.extra1_value);
    base += calculateCost(base, row.extra2_type, row.extra2_value);
    
    const landing_rate = base;
    
    base += calculateCost(base, row.landing_type, row.landing_value);
    
    const calculated_rate = base;
    
    return { landing_rate, calculated_rate };
  };

  // Handle cell edit
  const handleCellEdit = (rowIndex, field, value) => {
    const row = paginatedData[rowIndex];
    const key = `${row.product}_${field}`;
    
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
    
    setEditingCell({ rowIndex, field });
  };

  // Handle cell blur
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // Get current value
  const getCellValue = (row, rowIndex, field) => {
    const key = `${row.product}_${field}`;
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    return row[field];
  };

  // Handle type toggle
  const toggleType = (rowIndex, field) => {
    const row = paginatedData[rowIndex];
    const currentType = getType(row, rowIndex, field);
    const newType = currentType === 'percent' ? 'rupees' : 'percent';
    
    // Get the current value
    const currentValue = getCellValue(row, rowIndex, `${field}_value`);
    
    // Update both the type and value
    const typeKey = `${row.product}_${field}_type`;
    const valueKey = `${row.product}_${field}_value`;
    
    setEditedValues(prev => ({
      ...prev,
      [typeKey]: newType,
      [valueKey]: currentValue
    }));
  };

  // Get type value
  const getType = (row, rowIndex, field) => {
    const key = `${row.product}_${field}_type`;
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    return row[`${field}_type`] || 'rupees';
  };

  // Prepare data for save
  const prepareSaveData = () => {
    const updates = [];
    
    paginatedData.forEach(row => {
      const updatedRow = { ...row };
      let hasChanges = false;
      
      const editableFields = [
        'purchase_value', 'purchase_type',
        'transport_value', 'transport_type',
        'labor_value', 'labor_type',
        'handling_value', 'handling_type',
        'godown_value', 'godown_type',
        'delivery_value', 'delivery_type',
        'packaging_value', 'packaging_type',
        'extra1_value', 'extra1_type',
        'extra2_value', 'extra2_type',
        'landing_value', 'landing_type',
        'company_margin_value', 'company_margin_type',
        'sale_rate', 'mrp'
      ];
      
      editableFields.forEach(field => {
        const key = `${row.product}_${field}`;
        if (editedValues[key] !== undefined) {
          updatedRow[field] = editedValues[key];
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        updates.push(updatedRow);
      }
    });
    
    return updates;
  };

  // Save all changes
  const handleSaveAll = async () => {
    const updates = prepareSaveData();
    
    if (updates.length === 0) {
      toast('No changes to save');
      return;
    }
    
    setSaving(true);
    saveMutation.mutate(updates);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU', 'Title', 'Category', 'Unit', 'Weight', 'HSN',
      'Purchase (₹/%)', 'Transport (₹/%)', 'Labor (₹/%)', 
      'Handling (₹/%)', 'Godown (₹/%)', 'Delivery (₹/%)',
      'Packaging (₹/%)', 'Extra1 (₹/%)', 'Extra2 (₹/%)',
      'Landing Rate', 'Calculated Rate', 'Sale Rate', 'MRP'
    ];
    
    const rows = filteredData.map(row => {
      const computed = calculatePricing(row);
      const purchaseDisplay = `${row.purchase_value}${row.purchase_type === 'percent' ? '%' : '₹'}`;
      const transportDisplay = `${row.transport_value}${row.transport_type === 'percent' ? '%' : '₹'}`;
      const laborDisplay = `${row.labor_value}${row.labor_type === 'percent' ? '%' : '₹'}`;
      const handlingDisplay = `${row.handling_value}${row.handling_type === 'percent' ? '%' : '₹'}`;
      const godownDisplay = `${row.godown_value}${row.godown_type === 'percent' ? '%' : '₹'}`;
      const deliveryDisplay = `${row.delivery_value}${row.delivery_type === 'percent' ? '%' : '₹'}`;
      const packagingDisplay = `${row.packaging_value}${row.packaging_type === 'percent' ? '%' : '₹'}`;
      const extra1Display = `${row.extra1_value}${row.extra1_type === 'percent' ? '%' : '₹'}`;
      const extra2Display = `${row.extra2_value}${row.extra2_type === 'percent' ? '%' : '₹'}`;
      const marginDisplay = `${row.company_margin_value}${row.company_margin_type === 'percent' ? '%' : '₹'}`;
      
      return [
        row.sku || '', row.title || '', row.category || '', row.unit || '',
        row.product_weight || '', row.hsn || '',
        purchaseDisplay, transportDisplay, laborDisplay, handlingDisplay,
        godownDisplay, deliveryDisplay, packagingDisplay, extra1Display, extra2Display, marginDisplay,
        computed.landing_rate.toFixed(2), computed.calculated_rate.toFixed(2),
        Number(row.sale_rate).toFixed(2), Number(row.mrp).toFixed(2)
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_pricing.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!pricingData) return [];
    
    return pricingData.filter(item =>
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase())
    );
  }, [pricingData, search]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading product pricing...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Pricing</h1>
          </div>

          {/* Search bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || Object.keys(editedValues).length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : `Save Changes (${Object.keys(editedValues).length})`}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div 
            className="overflow-x-auto overflow-y-auto" 
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handling</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Godown</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packaging</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra 1</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra 2</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Landing Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Calculated Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, rowIndex) => {
                  const computed = calculatePricing(row);
                  
                  return (
                    <tr key={row.product} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{row.category || '-'}</td>
                      
                      {/* Purchase */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'purchase_value')}
                          type={getType(row, rowIndex, 'purchase')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'purchase_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'purchase')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Transport */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'transport_value')}
                          type={getType(row, rowIndex, 'transport')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'transport_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'transport')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Labor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'labor_value')}
                          type={getType(row, rowIndex, 'labor')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'labor_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'labor')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Handling */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'handling_value')}
                          type={getType(row, rowIndex, 'handling')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'handling_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'handling')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Godown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'godown_value')}
                          type={getType(row, rowIndex, 'godown')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'godown_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'godown')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Delivery */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'delivery_value')}
                          type={getType(row, rowIndex, 'delivery')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'delivery_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'delivery')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Packaging */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'packaging_value')}
                          type={getType(row, rowIndex, 'packaging')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'packaging_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'packaging')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Extra 1 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'extra1_value')}
                          type={getType(row, rowIndex, 'extra1')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'extra1_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'extra1')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Extra 2 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'extra2_value')}
                          type={getType(row, rowIndex, 'extra2')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'extra2_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'extra2')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Margin */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'company_margin_value')}
                          type={getType(row, rowIndex, 'company_margin')}
                          onEdit={(value) => handleCellEdit(rowIndex, 'company_margin_value', value)}
                          onTypeToggle={() => toggleType(rowIndex, 'company_margin')}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* Computed values */}
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ₹{computed.landing_rate.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ₹{computed.calculated_rate.toFixed(2)}
                      </td>
                      
                      {/* Sale Rate - Editable (no toggle) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'sale_rate')}
                          type="rupees"
                          onEdit={(value) => handleCellEdit(rowIndex, 'sale_rate', value)}
                          onTypeToggle={() => {}}
                          onBlur={handleCellBlur}
                        />
                      </td>
                      
                      {/* MRP - Editable (no toggle) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <EditableCell
                          value={getCellValue(row, rowIndex, 'mrp')}
                          type="rupees"
                          onEdit={(value) => handleCellEdit(rowIndex, 'mrp', value)}
                          onTypeToggle={() => {}}
                          onBlur={handleCellBlur}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded disabled:opacity-50 hover:bg-gray-200"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Editable Cell Component with working toggle
const EditableCell = ({ value, type, onEdit, onTypeToggle, onBlur }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Update inputValue when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setInputValue(value);
    }
  }, [value, isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setInputValue(value);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onEdit(numValue);
    }
    setIsEditing(false);
    onBlur();
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onTypeToggle();
    // Keep focus on input after toggle
    setTimeout(() => {
      const input = document.querySelector('.editable-input');
      if (input) {
        input.focus();
      }
    }, 10);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="editable-input w-24 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={handleToggleClick}
          onMouseDown={(e) => e.preventDefault()}
          className="p-1 text-xs bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1 transition-colors min-w-[32px] justify-center"
          title={type === 'percent' ? 'Switch to rupees' : 'Switch to percentage'}
          type="button"
        >
          {type === 'percent' ? <Percent className="h-3 w-3" /> : '₹'}
        </button>
      </div>
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="cursor-pointer px-2 py-1 hover:bg-gray-100 rounded min-w-[100px] flex items-center justify-between gap-2"
    >
      <span className="text-sm font-medium">
        {type === 'percent' ? `${Number(value).toFixed(2)}%` : `₹${Number(value).toFixed(2)}`}
      </span>
      <span className="text-xs text-gray-400 bg-gray-50 px-1 rounded">
        {type === 'percent' ? '%' : '₹'}
      </span>
    </div>
  );
};

export default ProductPricing;