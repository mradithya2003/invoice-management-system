import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInvoiceStats, getInvoices } from '../api/invoiceApi';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInvoiceStats(), getInvoices()])
      .then(([s, invoices]) => {
        setStats(s);
        setRecent(invoices.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) =>
    Number(n ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Loading…</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link
          to="/invoices/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + New Invoice
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Invoices', value: stats?.total ?? 0, color: 'text-indigo-600' },
          { label: 'Paid', value: stats?.paid ?? 0, color: 'text-green-600' },
          { label: 'Pending', value: stats?.pending ?? 0, color: 'text-yellow-600' },
          { label: 'Overdue', value: stats?.overdue ?? 0, color: 'text-red-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(stats?.total_paid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{fmt(stats?.total_outstanding)}</p>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No invoices yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Invoice #</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">
                      <Link to={`/invoices/${inv.id}`} className="text-indigo-600 hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-2">{inv.client_name}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_COLORS[inv.status] ?? ''
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">{fmt(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
