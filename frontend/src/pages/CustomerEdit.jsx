import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const CustomerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Debug: Log everything
  console.log('Full useParams:', useParams());
  console.log('ID value:', id);
  console.log('Window location:', window.location.pathname);

  // Handle undefined/missing ID
  if (id === undefined || id === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Routing Error</h2>
          <p>No customer ID provided in the URL.</p>
          <p className="mt-2">Current URL: {window.location.pathname}</p>
          <p>Expected URL format: /customers/123/edit</p>
          <button 
            onClick={() => navigate('/customers')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Customers List
          </button>
        </div>
      </div>
    );
  }

  const isNew = id === 'new';

  // treat the literal string 'undefined' as missing
  const isLiteralUndefined = id === 'undefined';
  const isValidNumericId = id !== undefined && id !== null && !isLiteralUndefined && !isNaN(Number(id));

  // For edit mode: validate ID is a number
  if (!isNew && !isValidNumericId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Invalid Customer ID</h2>
          <p>ID must be a number. Received: "{String(id)}"</p>
          <button 
            onClick={() => navigate('/customers')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Customers List
          </button>
        </div>
      </div>
    );
  }

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      console.log('Fetching customer with valid ID:', id);
      const response = await axios.get(`/api/customers/${id}/`);
      return response.data;
    },
    enabled: !isNew && isValidNumericId, // Only fetch if not creating new and id is valid
    retry: 1,
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    pincode: '',
    phone: '',
    address: '',
    appointment_date: '',
    gstin_no: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        house_flat_no: customer.house_flat_no || '',
        wing_lane: customer.wing_lane || '',
        society_colony: customer.society_colony || '',
        landmark: customer.landmark || '',
        area: customer.area || '',
        pincode: customer.pincode || '',
        state: customer.state || '',
        district: customer.district || '',
        tahsil: customer.tahsil || '',
        city: customer.city || '',
        appointment_date: customer.appointment_date || '',
        gstin_no: customer.gstin_no || '',
      });
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) {
        const response = await axios.post('/api/customers/', data);
        return response.data;
      } else {
        const response = await axios.patch(`/api/customers/${id}/`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      navigate('/customers');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  
  if (error && !isNew) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Error Loading Customer</h2>
          <p>{error.message}</p>
          <button 
            onClick={() => navigate('/customers')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Customers List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? 'Add New Customer' : `Edit Customer #${id}`}
      </h1>
      
      {mutation.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {mutation.error.response?.data?.message || mutation.error.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields - same as before */}
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Pincode</label>
          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">GSTIN No</label>
          <input
            type="text"
            name="gstin_no"
            value={formData.gstin_no || ''}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
              if (value.length <= 15) {
                setFormData({ ...formData, gstin_no: value });
              }
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            maxLength="15"
            placeholder="15-digit GSTIN"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">House/Flat No</label>
          <input
            type="text"
            name="house_flat_no"
            value={formData.house_flat_no}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Wing/Lane</label>
          <input
            type="text"
            name="wing_lane"
            value={formData.wing_lane}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Society/Colony</label>
          <input
            type="text"
            name="society_colony"
            value={formData.society_colony}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Landmark</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Area</label>
          <input
            type="text"
            name="area"
            value={formData.area}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">District</label>
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Tahsil</label>
          <input
            type="text"
            name="tahsil"
            value={formData.tahsil}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">State</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Appointment Date</label>
          <input
            type="date"
            name="appointment_date"
            value={formData.appointment_date ? new Date(formData.appointment_date).toISOString().split('T')[0] : ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (isNew ? 'Creating...' : 'Updating...') : (isNew ? 'Create Customer' : 'Update Customer')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerEdit;