import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Lock, Shield, MapPin, Loader2, Phone, Calendar, CreditCard, Building2, FileText, HeartHandshake, Briefcase, DollarSign } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (isError && !isNew) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-2xl">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading User</h2>
          <p className="text-gray-600 mb-6">{error?.message || 'Failed to fetch user'}</p>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Users List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNew ? 'Create New User' : 'Edit User'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isNew ? 'Add a new user to the system' : 'Update comprehensive user profile and details'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="inline-flex items-center gap-2 bg-white text-gray-700 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Back to Users
          </button>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-10">

            {/* SECTION 1: ACCOUNT & ACCESS */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-6 border-b border-gray-100">
                <Shield className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">Account & Access Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!isNew}
                    required
                    className={`w-full p-3 border ${errors.username ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none ${!isNew ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                    placeholder="e.g. john_doe"
                  />
                  {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full p-3 border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none`}
                    placeholder="john@example.com"
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
                    className={`w-full p-3 border ${errors.password ? 'border-red-300' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none`}
                    placeholder={isNew ? 'Enter password' : '••••••••'}
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
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer bg-white"
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
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode Territory</label>
                  <input
                    type="text"
                    name="pincode_territory"
                    value={formData.pincode_territory}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Enter pincodes separated by comma (e.g. 411001, 411002)"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: PERSONAL DETAILS */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-6 border-b border-gray-100">
                <User className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Middle Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer bg-white"
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
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Mobile / Contact number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
                  <input
                    type="text"
                    name="aadhar_number"
                    value={formData.aadhar_number}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="12-digit Aadhar number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="10-digit PAN number"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Full postal address"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: EMERGENCY CONTACT */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-6 border-b border-gray-100">
                <HeartHandshake className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">Emergency Contact</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                  <input
                    type="text"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Emergency phone number"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: WORK & BANKING DETAILS */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-6 border-b border-gray-100">
                <Building2 className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">Work & Banking Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label>
                  <input
                    type="date"
                    name="joining_date"
                    value={formData.joining_date}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Monthly / Annual Salary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Bank name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={formData.ifsc_code}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="IFSC Code"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-8 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {isNew ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {isNew ? 'Create User' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEdit;