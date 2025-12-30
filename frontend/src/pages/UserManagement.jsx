import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users', filterRole],
    queryFn: async () => {
      const params = {};
      if (filterRole) params.role = filterRole;
      const response = await axios.get('/api/users/', { params });
      return response.data;
    },
  });

  const filteredUsers = users?.filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center">Error loading users: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Link to="/users/new" className="bg-green-500 text-white px-4 py-2 rounded">
          Add New User
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Employee">Employee</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers?.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/users/edit/${user.id}`} className="text-blue-600 hover:text-blue-900 mr-2">Edit</Link>
                  <button className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
