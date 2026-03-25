import { useState, createContext, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import {
  Home, LayoutDashboard, PenTool, List, Trophy,
  MessageSquare, FileText, LogOut, Menu, X, Moon, Sun
} from 'lucide-react';

// Theme context so children can react to dark mode
export const ThemeContext = createContext({ dark: false });
export const useTheme = () => useContext(ThemeContext);

export const useDarkMode = () => {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Add this useEffect to actually toggle the Tailwind 'dark' class on the HTML tag
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const toggle = () => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  };
  return [dark, toggle];
};

const Sidebar = ({ dark, toggleDark }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/write', icon: PenTool, label: 'Write New Problem' },
    { to: '/inventory', icon: List, label: 'Problem Inventory' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/feedback', icon: MessageSquare, label: 'Give Feedback' },
    { to: '/tests', icon: FileText, label: 'View Tests' },
  ];

  return (
    <div
      className={`h-screen text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      } bg-ucla-blue`} 
    >
      {/* 1. Header: Use conditional justify-center when collapsed */}
      <div className={`p-4 flex items-center flex-shrink-0 ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!collapsed && (
          <h1 className="text-xl font-bold tracking-wide text-ucla-gold">
            LAMT PROSE
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded transition-colors hover:bg-ucla-dark-blue flex-shrink-0"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        {links.map(link => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              /* 2. Nav Links: Conditionally apply padding and justification */
              className={`flex items-center py-3 transition-colors ${
                collapsed ? 'justify-center px-0' : 'px-4'
              } ${
                isActive
                  ? 'border-l-4 bg-ucla-dark-blue border-ucla-gold'
                  : 'hover:bg-ucla-dark-blue'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-ucla-gold' : ''}
              />
              {!collapsed && (
                <span className="ml-3 text-sm">{link.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 flex-shrink-0">
        <button
          onClick={toggleDark}
          /* 3. Bottom Buttons: Conditionally apply padding and justification */
          className={`flex items-center w-full py-3 hover:bg-ucla-dark-blue transition-colors rounded ${
            collapsed ? 'justify-center px-0' : 'px-4'
          }`}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && (
            <span className="ml-3 text-sm">
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center w-full py-3 hover:bg-red-600 transition-colors rounded mt-1 ${
            collapsed ? 'justify-center px-0' : 'px-4'
          }`}
          title="Sign Out"
        >
          <LogOut size={20} />
          {!collapsed && (
            <span className="ml-3 text-sm">Sign Out</span>
          )}
        </button>
      </div>
    </div>
  );
};
const Layout = ({ children }) => {
  const [dark, toggleDark] = useDarkMode();

  return (
    // Replaced `effectiveDark` with the actual `dark` state
    <ThemeContext.Provider value={{ dark }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar dark={dark} toggleDark={toggleDark} />
        <main
          // Replaced inline styles with standard Tailwind and dark: modifiers
          className="flex-1 overflow-y-auto transition-colors duration-300 bg-[#F0F4FF] text-[#1a202c] dark:bg-gray-900 dark:text-gray-100"
        >
          <div className="container mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default Layout;
