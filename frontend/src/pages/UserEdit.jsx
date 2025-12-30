import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  console.log('UserEdit - ID from params:', id);

  // Check if we're creating a new user
  const isNew = !id || id === 'new';

  // Fetch user data only if we have a valid ID for editing
  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      console.log('Fetching user with ID:', id);
      const response = await axios.get(`/api/users/${id}/`);
      return response.data;
    },
    enabled: !!id && id !== 'new' && id !== 'undefined',
    retry: 1,
  });

  // Initialize form state - Use EXACT values from your Django model
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Employee', // Must match exactly: 'Employee' or 'Admin'
    pincode_territory: '', // Add this field from your model
  });

  useEffect(() => {
    console.log('User data loaded:', user);
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Empty for existing users
        role: user.role || 'Employee', // Keep the exact value from API
        pincode_territory: user.pincode_territory || '',
      });
    } else if (isNew) {
      // Reset form for new user
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'Employee', // Default from Django model
        pincode_territory: '',
      });
    }
  }, [user, isNew]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting data:', data, 'isNew:', isNew);
      
      // Prepare data for API - ensure correct format
      const apiData = { 
        username: data.username,
        email: data.email,
        role: data.role, // This should be 'Employee' or 'Admin' exactly
        pincode_territory: data.pincode_territory || null,
      };
      
      // Add password only for new users or if provided for existing users
      if (isNew) {
        apiData.password = data.password;
      } else if (data.password && data.password.trim() !== '') {
        // Only include password in update if it's not empty
        apiData.password = data.password;
      }
      
      console.log('API Data being sent:', apiData);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (isNew) {
        const response = await axios.post('/api/users/', apiData, config);
        return response.data;
      } else {
        const response = await axios.put(`/api/users/${id}/`, apiData, config);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      navigate('/users');
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      console.error('Error response data:', error.response?.data);
      
      let errorMessage = 'An error occurred';
      
      if (error.response?.data) {
        // Format Django validation errors
        if (typeof error.response.data === 'object') {
          const errors = [];
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              errors.push(`${field}: ${messages.join(', ')}`);
            } else {
              errors.push(`${field}: ${messages}`);
            }
          }
          errorMessage = errors.join('\n');
        } else {
          errorMessage = error.response.data;
        }
      }
      
      alert(`Error: ${errorMessage}`);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: value 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (isNew && !formData.password) {
      alert('Password is required for new users');
      return;
    }
    
    if (!formData.username || !formData.email) {
      alert('Username and email are required');
      return;
    }
    
    // Ensure role is valid
    if (!['Admin', 'Employee'].includes(formData.role)) {
      alert('Role must be either "Admin" or "Employee"');
      return;
    }
    
    console.log('Form submitted:', formData);
    mutation.mutate(formData);
  };

  // Handle loading state
  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handle error state - only for editing, not for creating new
  if (isError && !isNew) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Error Loading User</h2>
          <p>{error.message}</p>
          <button 
            onClick={() => navigate('/users')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  // Check for invalid ID (for editing)
  if (!isNew && (!id || id === 'undefined')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <h2 className="font-bold">Invalid User ID</h2>
          <p>No valid user ID provided for editing.</p>
          <button 
            onClick={() => navigate('/users')}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? 'Create New User' : 'Edit User'}
      </h1>
      
      {mutation.isError && mutation.error.response?.data && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">Validation Errors:</h3>
          <pre className="text-sm mt-2 whitespace-pre-wrap">
            {JSON.stringify(mutation.error.response.data, null, 2)}
          </pre>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
            disabled={!isNew} // Username often can't be changed
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Password {isNew ? '*' : ''}</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required={isNew}
            placeholder={isNew ? 'Required for new users' : 'Leave empty to keep current password'}
          />
          {!isNew && (
            <p className="text-sm text-gray-500 mt-1">
              Leave password empty to keep the current password
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium">Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            required
          >
            {/* Must match EXACTLY your Django model choices */}
            <option value="Employee">Employee</option>
            <option value="Admin">Admin</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Note: Role must be exactly "Employee" or "Admin"
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium">Pincode Territory</label>
          <input
            type="text"
            name="pincode_territory"
            value={formData.pincode_territory || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Optional"
            maxLength={10}
          />
        </div>
        
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading 
              ? (isNew ? 'Creating...' : 'Updating...') 
              : (isNew ? 'Create User' : 'Update User')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
        
        <div className="text-sm text-gray-500 mt-4">
          <p>* Required fields</p>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;