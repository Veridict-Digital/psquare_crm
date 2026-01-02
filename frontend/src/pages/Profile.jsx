import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { User, Mail, Shield, MapPin, Key } from 'lucide-react';

const Profile = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch current user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await axios.get('/api/users/me/');
      return response.data;
    },
  });

  // Initialize form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: '',
    pincode_territory: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        pincode_territory: user.pincode_territory || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const apiData = {
        username: data.username,
        email: data.email,
        role: data.role,
        pincode_territory: data.pincode_territory || null,
      };

      // Add password only if provided
      if (data.password && data.password.trim() !== '') {
        if (data.password !== data.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        apiData.password = data.password;
      }

      const response = await axios.put('/api/users/me/', apiData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
      alert('Profile updated successfully!');
    },
    onError: (error) => {
      console.error('Update error:', error);
      let errorMessage = 'An error occurred while updating your profile';

      if (error.response?.data) {
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
      } else if (error.message) {
        errorMessage = error.message;
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
    if (!formData.username || !formData.email) {
      alert('Username and email are required');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        pincode_territory: user.pincode_territory || '',
        password: '',
        confirmPassword: '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <h2 className="font-bold">Error Loading Profile</h2>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-full p-4 mr-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                  <p className="text-blue-100">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              {isEditing ? (
                /* Edit Form */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Username *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Role
                      </label>
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Pincode Territory
                      </label>
                      <input
                        type="text"
                        name="pincode_territory"
                        value={formData.pincode_territory}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Password Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      <Key className="w-5 h-5 inline mr-2" />
                      Change Password (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Leave empty to keep current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-6 border-t">
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                      disabled={updateMutation.isLoading}
                    >
                      {updateMutation.isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <User className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Username</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{user?.username}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Mail className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Email</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Role</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{user?.role}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <MapPin className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Pincode Territory</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {user?.pincode_territory || 'Not assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="pt-6 border-t">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
