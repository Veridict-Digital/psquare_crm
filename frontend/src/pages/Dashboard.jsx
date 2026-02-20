import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import ReactApexChart from 'react-apexcharts';
import { TrendingUp, Users, ShoppingCart, Phone, Package, Activity, Target, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch all data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', dateFrom, dateTo],
    queryFn: () => {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      return axios.get('api/dashboard/', { params }).then(res => res.data);
    },
  });

  // Extract chart data from dashboard API
  const monthlyRevenueData = dashboardData?.monthly_revenue || [];
  const orderStatusTrends = dashboardData?.order_status_trends || {};
  const customerSegments = dashboardData?.customer_segments || [44, 55, 13];
  const performanceTrends = dashboardData?.performance_trends || [];

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => axios.get('api/customers/').then(res => res.data),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => axios.get('api/orders/').then(res => res.data),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => axios.get('api/products/').then(res => res.data),
  });

  const { data: callLogsData } = useQuery({
    queryKey: ['callLogs'],
    queryFn: () => axios.get('api/calllogs/').then(res => res.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => axios.get('api/users/').then(res => res.data),
  });

  // Handle both paginated and non-paginated responses
  const ordersArray = ordersData?.results || ordersData || [];
  const callLogsArray = callLogsData?.results || callLogsData || [];

  // Calculate KPIs
  const totalCustomers = customersData?.length || 0;
  const totalOrders = ordersArray?.length || 0;
  const totalRevenue = dashboardData?.total_revenue || 0;
  const totalProfit = dashboardData?.total_profit || 0;
  const totalProducts = productsData?.length || 0;
  const totalCallLogs = callLogsArray?.length || 0;
  const totalUsers = usersData?.length || 0;

  // Calculate additional metrics
  const completedOrders = ordersArray?.filter(order => order.status === 'Completed').length || 0;
  const pendingOrders = ordersArray?.filter(order => order.status === 'Pending').length || 0;
  const completedCalls = callLogsArray?.filter(call => call.status === 'Completed').length || 0;
  const pendingCalls = callLogsArray?.filter(call => call.status === 'Pending').length || 0;

  const conversionRate = totalOrders > 0 ? Math.min(((totalOrders / totalCallLogs) * 100), 100).toFixed(1) : 0;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Semi-circle Gauge (RadialBar) - Profit Margin
  const radialBarOptions = {
    chart: {
      type: 'radialBar',
      height: 350,
      sparkline: {
        enabled: true
      }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: "#e7e7e7",
          strokeWidth: '97%',
          margin: 5,
          dropShadow: {
            enabled: true,
            top: 2,
            left: 0,
            color: '#999',
            opacity: 1,
            blur: 2
          }
        },
        dataLabels: {
          name: {
            show: false
          },
          value: {
            offsetY: -2,
            fontSize: '22px'
          }
        }
      }
    },
    grid: {
      padding: {
        top: -10
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        shadeIntensity: 0.4,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 50, 53, 91]
      },
    },
    labels: ['Profit Margin'],
  };

  const radialBarSeries = [parseFloat(profitMargin)];

  // Vertical Bar Chart with rounded corners and gradient - Monthly Revenue
  const barChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
        distributed: false,
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 0.85,
        opacityTo: 0.85,
        stops: [50, 0, 100]
      },
    },
    xaxis: {
      categories: monthlyRevenueData.map(item => item.month),
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return '₹' + value.toLocaleString();
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return '₹' + value.toLocaleString();
        }
      }
    }
  };

  const barChartSeries = [{
    name: 'Revenue',
    data: monthlyRevenueData.map(item => item.revenue)
  }];

  // Stacked Area Chart - Order Status Over Time
  const areaChartOptions = {
    chart: {
      type: 'area',
      height: 350,
      stacked: true,
      toolbar: {
        show: false
      }
    },
    colors: ['#00C49F', '#FFBB28', '#FF8042'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.8,
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    xaxis: {
      type: 'datetime',
      categories: Object.keys(orderStatusTrends)
    },
    tooltip: {
      x: {
        format: 'MMM yyyy'
      }
    }
  };

  const areaChartSeries = [
    {
      name: 'Completed',
      data: Object.values(orderStatusTrends).map(item => item.completed)
    },
    {
      name: 'Pending',
      data: Object.values(orderStatusTrends).map(item => item.pending)
    },
    {
      name: 'Cancelled',
      data: Object.values(orderStatusTrends).map(item => item.cancelled)
    }
  ];

  // Modern Donut Chart with center hole - Customer Distribution
  const donutChartOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['New Customers', 'Returning Customers', 'VIP Customers'],
    colors: ['#008FFB', '#00E396', '#FEB019'],
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a, b) => {
                  return a + b
                }, 0)
              }
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    tooltip: {
      y: {
        formatter: function (value) {
          return value + ' customers'
        }
      }
    }
  };

  const donutChartSeries = customerSegments;

  // Area Chart - Performance Trends (Enhanced with fill)
  const lineChartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      }
    },
    colors: ['#00D4AA', '#FF6B6B', '#4ECDC4'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 50, 100]
      }
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    xaxis: {
      categories: performanceTrends.map(item => item.month),
      labels: {
        style: {
          colors: '#64748b'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function (value) {
          return '₹' + value.toLocaleString();
        }
      }
    },
    tooltip: {
      theme: 'dark'
    },
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    }
  };

  const lineChartSeries = [
    {
      name: 'Revenue',
      data: performanceTrends.map(item => item.revenue)
    },
    {
      name: 'Orders',
      data: performanceTrends.map(item => item.orders)
    },
    {
      name: 'Customers',
      data: performanceTrends.map(item => item.customers)
    }
  ];

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
          <p className="text-gray-600">360° Business Intelligence & Performance Insights</p>
        </div>

        {/* Dashboard Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Time Range Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === '7d'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === '30d'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === '90d'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              90 Days
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-600">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            />
            <label className="text-sm font-medium text-gray-600">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500">+12.5%</span>
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600">{totalCustomers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-500">+8.2%</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-purple-600">{totalOrders.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-500">+15.3%</span>
              </div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <ShoppingCart className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-orange-600">{conversionRate}%</p>
              <div className="flex items-center mt-2">
                <Target className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-500">+5.1%</span>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-center">
            <Package className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Products</p>
            <p className="text-xl font-bold text-indigo-600">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-center">
            <Phone className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Call Logs</p>
            <p className="text-xl font-bold text-cyan-600">{totalCallLogs}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-center">
            <Users className="w-6 h-6 text-teal-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Users</p>
            <p className="text-xl font-bold text-teal-600">{totalUsers}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-center">
            <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Avg Order</p>
            <p className="text-xl font-bold text-emerald-600">₹{avgOrderValue}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-center">
            <TrendingUp className="w-6 h-6 text-rose-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Profit</p>
            <p className="text-xl font-bold text-rose-600">₹{totalProfit.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-center">
            <Target className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Margin</p>
            <p className="text-xl font-bold text-amber-600">{profitMargin}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Semi-circle Gauge */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Profit Margin</h3>
          <ReactApexChart
            options={radialBarOptions}
            series={radialBarSeries}
            type="radialBar"
            height={300}
          />
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">Current profit margin percentage</p>
          </div>
        </div>

        {/* Vertical Bar Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <ReactApexChart
            options={barChartOptions}
            series={barChartSeries}
            type="bar"
            height={300}
          />
        </div>

        {/* Stacked Area Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Status Over Time</h3>
          <ReactApexChart
            options={areaChartOptions}
            series={areaChartSeries}
            type="area"
            height={300}
          />
        </div>

        {/* Modern Donut Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Segmentation</h3>
          <ReactApexChart
            options={donutChartOptions}
            series={donutChartSeries}
            type="donut"
            height={300}
          />
        </div>
      </div>

      {/* Line Chart - Full Width */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <ReactApexChart
          options={lineChartOptions}
          series={lineChartSeries}
          type="line"
          height={350}
        />
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {ordersArray?.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.order_id}</p>
                  <p className="text-sm text-gray-600">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{order.total_amount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {productsData?.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <img
                    src={product.image || '/placeholder-product.jpg'}
                    alt={product.title}
                    className="w-10 h-10 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-sm text-gray-600">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">₹{product.b2c_price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Log Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Call Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Calls</span>
              <span className="font-semibold text-gray-900">{totalCallLogs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{completedCalls}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{pendingCalls}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-blue-600">{conversionRate}%</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${conversionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;