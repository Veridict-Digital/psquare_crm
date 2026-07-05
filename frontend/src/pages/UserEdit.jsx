import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Lock, Shield, MapPin, Loader2 } from 'lucide-react';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  console.log('UserEdit - ID from params:', id);

  const isNew = !id || id === 'new';

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

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Employee',
    pincode_territory: '',
  });

  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    axios.get('/api/roles/')
      .then(res => setRoles(res.data))
      .catch(err => console.error('Error loading roles:', err));
  }, []);

  useEffect(() => {
    console.log('User data loaded:', user);
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'Employee',
        pincode_territory: user.pincode_territory || '',
      });
    } else if (isNew) {
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'Employee',
        pincode_territory: '',
      });
    }
  }, [user, isNew]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (isNew && !formData.password.trim()) {
      newErrors.password = 'Password is required for new users';
    }
    
    if (!formData.role || formData.role.trim() === '') {
      newErrors.role = 'Please select a valid role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting data:', data, 'isNew:', isNew);
      
      const apiData = { 
        username: data.username,
        email: data.email,
        role: data.role,
        pincode_territory: data.pincode_territory || null,
      };
      
      if (isNew) {
        apiData.password = data.password;
      } else if (data.password && data.password.trim() !== '') {
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
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          const apiErrors = {};
          for (const [field, messages] of Object.entries(error.response.data)) {
            if (Array.isArray(messages)) {
              apiErrors[field] = messages.join(', ');
            } else {
              apiErrors[field] = messages;
            }
          }
          setErrors(apiErrors);
        }
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData, 
      [name]: value 
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    console.log('Form submitted:', formData);
    mutation.mutate(formData);
  };

  // Loading state
  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError && !isNew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="text-red-500 text-2xl">!</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading User</h2>
              <p className="text-gray-600 mb-2">{error.message}</p>
              <button 
                onClick={() => navigate('/users')}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
                Back to Users List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid ID state
  if (!isNew && (!id || id === 'undefined')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <div className="text-yellow-500 text-2xl">⚠</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid User ID</h2>
              <p className="text-gray-600 mb-2">No valid user ID provided for editing.</p>
              <button 
                onClick={() => navigate('/users')}
                className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeft size={20} />
                Back to Users List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-2 lg:p-8">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNew ? 'Create New User' : 'Edit User'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isNew ? 'Add a new user to the system' : 'Update user information and permissions'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-gray-100 px-8 py-6">
            <h2 className="text-xl font-semibold text-gray-800">User Information</h2>
            <p className="text-gray-500 text-sm mt-1">
              Fill in the details below. Fields marked with * are required.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
  {/* First Row: Username, Email, Password */}
  <div className="grid grid-cols-3 gap-6">
    {/* Username Field */}
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <User size={16} className="text-gray-400" />
        Username *
      </label>
      <div className="relative">
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={`w-full px-4 py-3 pl-11 border ${
            errors.username ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } rounded-lg focus:ring-2 ${
            errors.username ? 'focus:ring-red-100' : 'focus:ring-blue-100'
          } transition-all duration-200 outline-none bg-gray-50/50`}
          required
          disabled={!isNew}
          placeholder="Enter username"
        />
        <User size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {errors.username && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span> {errors.username}
        </p>
      )}
    </div>

    {/* Email Field */}
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Mail size={16} className="text-gray-400" />
        Email Address *
      </label>
      <div className="relative">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 pl-11 border ${
            errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } rounded-lg focus:ring-2 ${
            errors.email ? 'focus:ring-red-100' : 'focus:ring-blue-100'
          } transition-all duration-200 outline-none bg-gray-50/50`}
          required
          placeholder="user@example.com"
        />
        <Mail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {errors.email && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span> {errors.email}
        </p>
      )}
    </div>

    {/* Password Field */}
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Lock size={16} className="text-gray-400" />
        Password {isNew ? '*' : ''}
      </label>
      <div className="relative">
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-4 py-3 pl-11 border ${
            errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } rounded-lg focus:ring-2 ${
            errors.password ? 'focus:ring-red-100' : 'focus:ring-blue-100'
          } transition-all duration-200 outline-none bg-gray-50/50`}
          required={isNew}
          placeholder={isNew ? 'Enter a secure password' : 'Leave empty to keep current password'}
        />
        <Lock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {errors.password && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span> {errors.password}
        </p>
      )}
      {!isNew && !errors.password && (
        <p className="mt-2 text-sm text-gray-500">
          Leave password empty to keep the current password
        </p>
      )}
    </div>
  </div>

  {/* Second Row: Role, Pincode Territory */}
  <div className="grid grid-cols-2 gap-6">
    {/* Role Field */}
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Shield size={16} className="text-gray-400" />
        Role *
      </label>
      <div className="relative">
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={`w-full px-4 py-3 pl-11 border ${
            errors.role ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
          } rounded-lg focus:ring-2 ${
            errors.role ? 'focus:ring-red-100' : 'focus:ring-blue-100'
          } transition-all duration-200 outline-none bg-gray-50/50 appearance-none cursor-pointer`}
          required
        >
          {roles.map(r => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
          {roles.length === 0 && (
            <>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
              <option value="Telecaller">Telecaller</option>
            </>
          )}
        </select>
        <Shield size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {errors.role && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <span>⚠</span> {errors.role}
        </p>
      )}
    </div>

    {/* Pincode Territory Field */}
    <div className="relative group">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <MapPin size={16} className="text-gray-400" />
        Pincode Territory
      </label>
      <div className="relative">
        <input
          type="text"
          name="pincode_territory"
          value={formData.pincode_territory || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 pl-11 border border-gray-200 focus:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-100 transition-all duration-200 outline-none bg-gray-50/50"
          placeholder="Enter territory pincodes (comma separated)"
          maxLength={100}
        />
        <MapPin size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Optional: Specify pincodes for territory assignment
      </p>
    </div>
  </div>
</div>

            {/* Form Actions */}
            <div className="mt-2 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="flex-1 inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-blue-500/25"
              >
                {mutation.isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {isNew ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {isNew ? 'Create User' : 'Update User'}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="flex-1 inline-flex items-center justify-center gap-3 bg-white text-gray-700 px-8 py-4 rounded-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>

            {/* Required Fields Note */}
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
            </div>
          </form>
        </div>

        {/* API Error Display */}
        {Object.keys(errors).length > 0 && mutation.isError && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-2">
            <h3 className="font-semibold text-red-700 mb-2">Validation Errors:</h3>
            <ul className="text-sm text-red-600 space-y-1">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field} className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    <span className="font-medium">{field}:</span> {message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>User management requires appropriate permissions. Changes are logged.</p>
        </div>
      </div>
    </div>
  );
};

export default UserEdit;