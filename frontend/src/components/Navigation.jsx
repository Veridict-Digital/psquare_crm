import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
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

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/products', label: 'Products', icon: '🛍️' },
    { path: '/users', label: 'Users', icon: '👤' },
    { path: '/calllogs', label: 'Call Logs', icon: '📞' },
    { path: '/profile', label: 'Profile', icon: '👨‍💼' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-blue-600 text-white shadow-lg z-10 transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-4">
        {/* Header with toggle button */}
        <div className="flex items-center justify-between mb-6">
          {isOpen && <h1 className="text-xl font-bold">Psquare CRM</h1>}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-blue-500 transition-colors duration-200"
          >
            <svg
              className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center ${isOpen ? 'px-4' : 'justify-center'} py-3 rounded-lg transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                  title={!isOpen ? item.label : ''}
                >
                  <span className={`text-lg ${isOpen ? 'mr-3' : ''}`}>{item.icon}</span>
                  {isOpen && <span className="transition-opacity duration-200">{item.label}</span>}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className={`flex items-center w-full ${isOpen ? 'px-4' : 'justify-center'} py-3 text-left text-blue-100 hover:bg-blue-500 hover:text-white rounded-lg transition-colors duration-200`}
                title={!isOpen ? 'Logout' : ''}
              >
                <span className={`text-lg ${isOpen ? 'mr-3' : ''}`}>🚪</span>
                {isOpen && <span className="transition-opacity duration-200">Logout</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Navigation;

