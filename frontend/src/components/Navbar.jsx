import { Link, useNavigate } from 'react-router-dom'
import { logout as logoutApi } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutApi()
    } finally {
      logout()
      navigate('/login')
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-bold text-blue-600">
            InvoiceApp
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition">
              Dashboard
            </Link>
            <Link to="/invoices" className="text-sm text-gray-600 hover:text-blue-600 transition">
              Invoices
            </Link>
            <Link to="/clients" className="text-sm text-gray-600 hover:text-blue-600 transition">
              Clients
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 hidden sm:inline">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
