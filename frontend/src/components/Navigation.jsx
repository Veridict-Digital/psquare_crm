import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useCallPopup } from '../context/CallPopupContext';
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
  const { isVisible, isRunning, isEndingCall, endCall } = useCallPopup();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = async () => {
    if ((isVisible || isRunning) && !isEndingCall) {
      try {
        await endCall();
      } catch (err) {
        console.error('Failed to end call on back navigation:', err);
      }
    }
    navigate(-1);
  };

  if (!isAuthenticated) {
    return null;
  }

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

    return allItems.filter((item) => {
      if (item.adminOnly) return user?.role === 'Admin';
      return !item.feature || hasPermission(item.feature);
    });
  };

  const navItems = getNavItems();

  return (
    <div
      className={`app-sidebar fixed left-0 top-0 h-full z-10 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          {isOpen && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-9 w-9 rounded-[12px] flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-blue-500 to-blue-400 shadow-soft">
                <Building2 className="h-4.5 w-4.5 h-5 w-5" />
              </div>
              <h1 className="text-lg font-bold app-sidebar__brand truncate">Psquare CRM</h1>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`app-sidebar__toggle p-2 rounded-xl transition-all duration-200 ${
              !isOpen && 'mx-auto'
            }`}
            title={!isOpen ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className={`h-5 w-5 transition-transform duration-200 ${!isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <button
          onClick={handleBack}
          disabled={isEndingCall}
          className={`app-sidebar__link flex items-center gap-3 w-full px-3 py-3 mb-6 group ${
            !isOpen ? 'justify-center' : ''
          } ${isEndingCall ? 'opacity-60 cursor-wait' : ''}`}
          title={!isOpen ? 'Go Back' : ''}
        >
          <ArrowLeft className="h-5 w-5 app-sidebar__icon" />
          {isOpen && <span className="text-sm font-medium">Back</span>}
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
                      className={`app-sidebar__link flex items-center gap-3 px-3 py-3 group ${
                        isActive ? 'is-active' : ''
                      } ${!isOpen ? 'justify-center' : ''}`}
                      title={!isOpen ? item.label : ''}
                    >
                      <Icon className="h-5 w-5 app-sidebar__icon shrink-0" />
                      {isOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                      {isActive && isOpen && <span className="app-sidebar__active-pip" />}
                    </Link>
                  </li>
                );
              });
            })()}

            <li className="my-4">
              <div className="app-sidebar__divider" />
            </li>

            <li>
              <button
                onClick={handleLogout}
                className={`app-sidebar__link app-sidebar__logout flex items-center gap-3 w-full px-3 py-3 group ${
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
