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
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const queryClient = new QueryClient();

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerNew />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/edit/:id" element={<CustomerEdit />} />
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<OrderNew />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/orders/edit/:id" element={<OrderEdit />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductNew />} />
          <Route path="/products/edit/:id" element={<ProductEdit />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/product-combinations" element={<ProductCombinations />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/users/new" element={<UserEdit />} />
          <Route path="/users/edit/:id" element={<UserEdit />} />
          <Route path="/calllogs" element={<CallLogList />} />
          <Route path="/calllogs/edit/:id" element={<CallLogEdit />} />
          <Route path="/leads" element={<LeadList />} />
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
