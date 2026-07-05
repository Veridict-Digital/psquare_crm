import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CallPopupProvider } from './context/CallPopupContext';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import OrderList from './pages/OrderList';
import CustomerDetail from './pages/CustomerDetail';
import CustomerEdit from './pages/CustomerEdit';
import CustomerNew from './pages/CustomerNew';
import OrderEdit from './pages/OrderEdit';
import OrderNew from './pages/OrderNew';
import ProductList from './pages/ProductList';
import ProductEdit from './pages/ProductEdit';
import ProductDetail from './pages/ProductDetail';
import ProductNew from './pages/ProductNew';
import UserManagement from './pages/UserManagement';
import UserNew from './pages/UserNew';
import CallLogList from './pages/CallLogList';
import CallLogEdit from './pages/CallLogEdit';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserEdit from './pages/UserEdit';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import LeadList from './pages/LeadList';
import ProductCombinations from './pages/ProductCombinations';
import ProductPricing from './pages/ProductPricing';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const queryClient = new QueryClient();

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
    <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 mb-6">You do not have permission to view this page. Please contact your system administrator.</p>
    </div>
  </div>
);

const FeatureGuard = ({ feature, children }) => {
  const { hasPermission, permissionsLoading, isAuthenticated } = useAuth();

  if (!isAuthenticated && localStorage.getItem('access_token')) {
    // If token exists but context is reloading, show minimal spinner
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return hasPermission(feature) ? children : <AccessDenied />;
};

const AppContent = () => {
  const { isOpen } = useSidebar();

  return (
    <>
      <Navigation />
      <div className={`min-h-screen bg-gray-100 transition-all duration-300 ${
        isOpen ? 'ml-64' : 'ml-16'
      }`}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<FeatureGuard feature="view_dashboard"><Dashboard /></FeatureGuard>} />
          <Route path="/customers" element={<FeatureGuard feature="view_customers"><CustomerList /></FeatureGuard>} />
          <Route path="/customers/new" element={<FeatureGuard feature="create_customer"><CustomerNew /></FeatureGuard>} />
          <Route path="/customers/:id" element={<FeatureGuard feature="view_customers"><CustomerDetail /></FeatureGuard>} />
          <Route path="/customers/edit/:id" element={<FeatureGuard feature="edit_customer"><CustomerEdit /></FeatureGuard>} />
          <Route path="/orders" element={<FeatureGuard feature="view_orders"><OrderList /></FeatureGuard>} />
          <Route path="/orders/new" element={<FeatureGuard feature="create_order"><OrderNew /></FeatureGuard>} />
          <Route path="/orders/:id" element={<FeatureGuard feature="view_orders"><OrderDetail /></FeatureGuard>} />
          <Route path="/orders/edit/:id" element={<FeatureGuard feature="edit_order"><OrderEdit /></FeatureGuard>} />
          <Route path="/products" element={<FeatureGuard feature="view_products"><ProductList /></FeatureGuard>} />
          <Route path="/products/new" element={<FeatureGuard feature="manage_products"><ProductNew /></FeatureGuard>} />
          <Route path="/products/edit/:id" element={<FeatureGuard feature="manage_products"><ProductEdit /></FeatureGuard>} />
          <Route path="/products/:id" element={<FeatureGuard feature="view_products"><ProductDetail /></FeatureGuard>} />
          <Route path="/product-combinations" element={<FeatureGuard feature="manage_combos"><ProductCombinations /></FeatureGuard>} />
          <Route path="/products/pricing" element={<FeatureGuard feature="manage_products"><ProductPricing /></FeatureGuard>} />
          <Route path="/users" element={<FeatureGuard feature="manage_users"><UserManagement /></FeatureGuard>} />
          <Route path="/users/new" element={<FeatureGuard feature="manage_users"><UserNew /></FeatureGuard>} />
          <Route path="/users/edit/:id" element={<FeatureGuard feature="manage_users"><UserEdit /></FeatureGuard>} />
          <Route path="/calllogs" element={<FeatureGuard feature="make_calls"><CallLogList /></FeatureGuard>} />
          <Route path="/calllogs/edit/:id" element={<FeatureGuard feature="make_calls"><CallLogEdit /></FeatureGuard>} />
          <Route path="/leads" element={<FeatureGuard feature="view_customers"><LeadList /></FeatureGuard>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <CallPopupProvider>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </CallPopupProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
