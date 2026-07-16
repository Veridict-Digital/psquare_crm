import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard,
  Calendar,
  Package,
  ShoppingBag,
  Calculator,
  Gift,
  Users,
  Phone,
  User,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  Building2,
} from 'lucide-react';

const Navigation = () => {
  const { isAuthenticated, logout, user, hasPermission } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  // Define navigation items based on permissions
  const getNavItems = () => {
    const allItems = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, feature: 'view_dashboard' },
      { path: '/customers', label: 'Appointment', icon: Calendar, feature: 'view_customers' },
      { path: '/orders', label: 'Orders', icon: Package, feature: 'view_orders' },
      { path: '/products', label: 'Products', icon: ShoppingBag, feature: 'view_products' },
      { path: '/products/pricing', label: 'Calculator', icon: Calculator, feature: 'view_products' },
      { path: '/product-combinations', label: "Combo's", icon: Gift, feature: 'manage_combos' },
      { path: '/users', label: 'Users', icon: Users, feature: 'manage_users' },
      { path: '/calllogs', label: 'Call Logs', icon: Phone, feature: 'make_calls' },
      { path: '/profile', label: 'Profile', icon: User },
    ];

    return allItems.filter(item => !item.feature || hasPermission(item.feature));
  };

  const navItems = getNavItems();

  return (
    <div className={`fixed left-0 top-0 h-full bg-[#1a2332] text-white shadow-2xl z-10 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-20'
    }`}>
      <div className="p-4">
        {/* Header with toggle button */}
        <div className="flex items-center justify-between mb-8">
          {isOpen && (
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-400" />
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
                Psquare CRM
              </h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg hover:bg-white/10 transition-all duration-200 ${
              !isOpen && 'mx-auto'
            }`}
            title={!isOpen ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-200 ${!isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-3 w-full px-3 py-3 mb-6 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200 group ${
            !isOpen ? 'justify-center' : ''
          }`}
          title={!isOpen ? 'Go Back' : ''}
        >
          <ArrowLeft className="h-5 w-5 text-gray-400 group-hover:text-white" />
          {isOpen && <span className="text-sm font-medium transition-opacity duration-200">Back</span>}
        </button>

        <nav>
          <ul className="space-y-1">
            {(() => {
              const isPathActive = (itemPath) => {
                const current = location.pathname;
                if (current === itemPath) return true;
                if (itemPath === '/products') {
                  return current.startsWith('/products') && !current.startsWith('/products/pricing');
                }
                return current.startsWith(itemPath + '/');
              };

              return navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.path);
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      } ${!isOpen ? 'justify-center' : ''}`}
                      title={!isOpen ? item.label : ''}
                    >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                    {isOpen && (
                      <span className="text-sm font-medium transition-opacity duration-200">
                        {item.label}
                      </span>
                    )}
                    {isActive && isOpen && (
                      <div className="ml-auto w-1.5 h-8 bg-white rounded-full"></div>
                    )}
                  </Link>
                </li>
              );
            });
          })()}
            
            {/* Divider */}
            <li className="my-4">
              <div className="h-px bg-white/10"></div>
            </li>
            
            {/* Logout Button */}
            <li>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-all duration-200 text-gray-300 hover:bg-red-600/20 hover:text-red-300 group ${
                  !isOpen ? 'justify-center' : ''
                }`}
                title={!isOpen ? 'Logout' : ''}
              >
                <LogOut className="h-5 w-5" />
                {isOpen && <span className="text-sm font-medium">Logout</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Navigation;