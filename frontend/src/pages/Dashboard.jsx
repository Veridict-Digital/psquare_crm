import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => axios.get('api/dashboard/').then(res => res.data),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => axios.get('api/customers/').then(res => res.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => axios.get('api/orders/').then(res => res.data),
  });

  const totalCustomers = customersData?.length || 0;
  const totalOrders = ordersData?.length || 0;
  const totalRevenue = dashboardData?.total_revenue || 0;
  const totalProfit = dashboardData?.total_profit || 0;

  const chartData = [
    { name: 'Revenue', value: totalRevenue },
    { name: 'Profit', value: totalProfit },
  ];

  if (dashboardLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Total Customers</h2>
          <p className="text-3xl font-bold text-blue-600">{totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Total Orders</h2>
          <p className="text-3xl font-bold text-green-600">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Total Revenue</h2>
          <p className="text-3xl font-bold text-purple-600">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Total Profit</h2>
          <p className="text-3xl font-bold text-red-600">${totalProfit.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Revenue vs Profit</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
