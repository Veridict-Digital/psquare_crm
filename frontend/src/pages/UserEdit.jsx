import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = !id || id === 'new';

  const { data: user, isLoading, error, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
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
    first_name: '',
    middle_name: '',
    last_name: '',
    aadhar_number: '',
    pan_number: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
    gender: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    joining_date: '',
    salary: '',
    bank_account_number: '',
    bank_name: '',
    ifsc_code: '',
  });

  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    axios.get('/api/roles/')
      .then(res => setRoles(res.data))
      .catch(err => console.error('Error loading roles:', err));
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'Employee',
        pincode_territory: user.pincode_territory || '',
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        aadhar_number: user.aadhar_number || '',
        pan_number: user.pan_number || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
        joining_date: user.joining_date || '',
        salary: user.salary || '',
        bank_account_number: user.bank_account_number || '',
        bank_name: user.bank_name || '',
        ifsc_code: user.ifsc_code || '',
      });
    } else if (isNew) {
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'Employee',
        pincode_territory: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        aadhar_number: '',
        pan_number: '',
        phone_number: '',
        address: '',
        date_of_birth: '',
        gender: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        joining_date: '',
        salary: '',
        bank_account_number: '',
        bank_name: '',
        ifsc_code: '',
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
      const apiData = { ...data };

      const nullableFields = [
        'date_of_birth',
        'joining_date',
        'salary',
        'pincode_territory',
        'aadhar_number',
        'pan_number',
        'phone_number',
        'emergency_contact_phone',
        'bank_account_number',
        'ifsc_code'
      ];

      nullableFields.forEach(field => {
        if (apiData[field] === '') {
          apiData[field] = null;
        }
      });

      if (!isNew && (!apiData.password || apiData.password.trim() === '')) {
        delete apiData.password;
      }

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
      if (error.response?.data && typeof error.response.data === 'object') {
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
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    mutation.mutate(formData);
  };

  if (!isNew && isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-full text-center">
        <p className="text-gray-600">Loading user data...</p>
      </div>
    );
  }

  if (isError && !isNew) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading User</h2>
        <p className="text-gray-600 mb-4">{error?.message || 'Failed to fetch user'}</p>
        <button
          onClick={() => navigate('/users')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">{isNew ? 'Create New User' : 'Edit User'}</h1>
        <button
          onClick={() => navigate('/users')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back to Users
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-5">
            <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!isNew}
              required
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isNew ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {isNew ? '*' : '(Leave empty to keep current)'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={isNew}
              placeholder={isNew ? 'Enter password' : 'Leave empty to keep current'}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode Territory</label>
            <input
              type="text"
              name="pincode_territory"
              value={formData.pincode_territory}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
            <input
              type="text"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
            <input
              type="text"
              name="aadhar_number"
              value={formData.aadhar_number}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Emergency Contact */}
          <div className="md:col-span-5 mt-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Emergency Contact</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
            <input
              type="text"
              name="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
            <input
              type="text"
              name="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
            <input
              type="date"
              name="joining_date"
              value={formData.joining_date}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              step="0.01"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Banking Details */}
          <div className="md:col-span-5 mt-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Banking Details</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
            <input
              type="text"
              name="bank_account_number"
              value={formData.bank_account_number}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
            <input
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
            <input
              type="text"
              name="ifsc_code"
              value={formData.ifsc_code}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEdit;