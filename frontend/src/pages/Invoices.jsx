import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../api/invoiceApi';
import { getClients } from '../api/clientApi';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = {
  client_id: '',
  status: 'draft',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  tax_rate: 0,
  discount: 0,
  notes: '',
  items: [{ description: '', quantity: 1, unit_price: 0 }],
};

function calcTotals(items, taxRate, discount) {
  const subtotal = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
  const taxAmount = (subtotal * Number(taxRate)) / 100;
  const total = subtotal + taxAmount - Number(discount);
  return { subtotal, taxAmount, total };
}

// ---- Invoice Form Modal ----
function InvoiceModal({ initial, clients, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { subtotal, taxAmount, total } = calcTotals(form.items, form.tax_rate, form.discount);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const setItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm((f) => ({ ...f, items }));
  };

  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { description: '', quantity: 1, unit_price: 0 }],
    }));

  const removeItem = (index) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        subtotal,
        tax_amount: taxAmount,
        total,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {initial ? 'Edit Invoice' : 'New Invoice'}
        </h2>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                required
                value={form.client_id}
                onChange={(e) => setField('client_id', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {['draft', 'sent', 'paid', 'overdue'].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={form.issue_date}
                onChange={(e) => setField('issue_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setField('due_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-indigo-600 hover:underline"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => setItem(i, 'description', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => setItem(i, 'quantity', e.target.value)}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => setItem(i, 'unit_price', e.target.value)}
                    className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                    disabled={form.items.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tax_rate}
                onChange={(e) => setField('tax_rate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setField('discount', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({form.tax_rate}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount</span>
              <span>-${Number(form.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | invoice object
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([getInvoices(), getClients()])
      .then(([invs, cls]) => {
        setInvoices(invs);
        setClients(cls);
      })
      .finally(() => setLoading(false));
  }, []);

  const reload = () =>
    getInvoices().then(setInvoices).catch(() => {});

  const handleSave = async (payload) => {
    if (modal?.id) {
      await updateInvoice(modal.id, payload);
    } else {
      await createInvoice(payload);
    }
    await reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    setDeleting(id);
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = (inv) => {
    setModal({
      ...inv,
      items: inv.items?.length
        ? inv.items
        : [{ description: '', quantity: 1, unit_price: 0 }],
    });
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <button
          onClick={() => setModal('new')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + New Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          No invoices yet. Create your first invoice!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Status', 'Total', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-indigo-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.client_name}</td>
                  <td className="px-4 py-3">{inv.issue_date}</td>
                  <td className="px-4 py-3">{inv.due_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[inv.status] ?? ''
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{fmt(inv.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(inv)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        disabled={deleting === inv.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <InvoiceModal
          initial={modal === 'new' ? null : modal}
          clients={clients}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
