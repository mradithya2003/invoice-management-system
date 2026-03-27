import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getInvoiceStats, getInvoices } from '../api/invoiceApi'
import { getClients } from '../api/clientApi'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [clientCount, setClientCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, invoicesData, clientsData] = await Promise.all([
          getInvoiceStats(),
          getInvoices(),
          getClients(),
        ])
        setStats(statsData.stats)
        setRecentInvoices((invoicesData.invoices || []).slice(0, 5))
        setClientCount((clientsData.clients || []).length)
      } catch {
        // silently handle errors – user will see empty state
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statusColor = (status) => {
    const map = {
      paid: 'bg-green-100 text-green-700',
      sent: 'bg-blue-100 text-blue-700',
      draft: 'bg-gray-100 text-gray-700',
      overdue: 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        Welcome back, {user?.name}!
      </h1>
      <p className="text-gray-500 mb-6">Here&apos;s an overview of your business.</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Invoices" value={stats?.total ?? 0} color="bg-blue-50 text-blue-700" />
        <StatCard label="Paid" value={stats?.paid ?? 0} color="bg-green-50 text-green-700" />
        <StatCard label="Pending" value={stats?.pending ?? 0} color="bg-yellow-50 text-yellow-700" />
        <StatCard label="Overdue" value={stats?.overdue ?? 0} color="bg-red-50 text-red-700" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Total Clients</h2>
          <p className="text-4xl font-bold text-indigo-600">{clientCount}</p>
          <Link to="/clients" className="text-sm text-indigo-500 hover:underline mt-2 inline-block">
            Manage Clients →
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Draft Invoices</h2>
          <p className="text-4xl font-bold text-gray-600">{stats?.draft ?? 0}</p>
          <Link to="/invoices" className="text-sm text-indigo-500 hover:underline mt-2 inline-block">
            Manage Invoices →
          </Link>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-700">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No invoices yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Invoice #</th>
                <th className="px-6 py-3 text-left">Client</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono">{inv.invoice_number}</td>
                  <td className="px-6 py-3">{inv.client_name || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{inv.due_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-lg shadow p-5 ${color}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
