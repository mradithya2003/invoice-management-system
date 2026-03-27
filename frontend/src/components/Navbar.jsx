import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/clients', label: 'Clients' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-indigo-600 font-bold text-lg">Invoice Manager</span>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive
                  ? 'text-indigo-600 font-semibold text-sm'
                  : 'text-gray-600 hover:text-indigo-600 text-sm transition'
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user && <span className="text-sm text-gray-600 hidden md:inline">{user.name}</span>}
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
