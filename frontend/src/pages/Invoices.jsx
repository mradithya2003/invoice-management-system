import { useState, useEffect } from 'react'
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '../api/invoiceApi'
import { getClients } from '../api/clientApi'

const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'overdue']

const statusColor = (status) => {
  const map = {
    paid: 'bg-green-100 text-green-700',
    sent: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const emptyForm = () => ({
  client_id: '',
  status: 'draft',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  tax_rate: 0,
  discount: 0,
  notes: '',
  items: [{ description: '', quantity: 1, unit_price: 0 }],
})

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editInvoice, setEditInvoice] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchClients()])
  }, [])

  const fetchInvoices = async () => {
    try {
      const data = await getInvoices()
      setInvoices(data.invoices || [])
    } catch {
      setError('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const data = await getClients()
      setClients(data.clients || [])
    } catch {
      // ignore
    }
  }

  const openCreate = () => {
    setEditInvoice(null)
    setForm(emptyForm())
    setError('')
    setShowModal(true)
  }

  const openEdit = (invoice) => {
    setEditInvoice(invoice)
    setForm({
      client_id: invoice.client_id || '',
      status: invoice.status || 'draft',
      issue_date: invoice.issue_date || '',
      due_date: invoice.due_date || '',
      tax_rate: invoice.tax_rate || 0,
      discount: invoice.discount || 0,
      notes: invoice.notes || '',
      items: invoice.items?.length
        ? invoice.items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price }))
        : [{ description: '', quantity: 1, unit_price: 0 }],
    })
    setError('')
    setShowModal(true)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleItemChange = (index, field, value) => {
    const updated = form.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setForm({ ...form, items: updated })
  }

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] })

  const removeItem = (index) =>
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) })

  const calculateSubtotal = () =>
    form.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0)

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const discounted = subtotal - (parseFloat(form.discount) || 0)
    const taxed = discounted + discounted * ((parseFloat(form.tax_rate) || 0) / 100)
    return taxed.toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.client_id) {
      setError('Please select a client.')
      return
    }

    setSaving(true)
    try {
      if (editInvoice) {
        await updateInvoice(editInvoice.id, form)
      } else {
        await createInvoice(form)
      }
      setShowModal(false)
      fetchInvoices()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save invoice.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return
    try {
      await deleteInvoice(id)
      setInvoices(invoices.filter(inv => inv.id !== id))
    } catch {
      alert('Failed to delete invoice.')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
        >
          + New Invoice
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No invoices yet.</p>
          <button onClick={openCreate} className="text-blue-600 hover:underline text-sm">
            Create your first invoice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Invoice #</th>
                <th className="px-6 py-3 text-left">Client</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Issue Date</th>
                <th className="px-6 py-3 text-left">Due Date</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-6 py-3">{inv.client_name || '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{inv.issue_date || '—'}</td>
                  <td className="px-6 py-3">{inv.due_date || '—'}</td>
                  <td className="px-6 py-3 space-x-2">
                    <button
                      onClick={() => openEdit(inv)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editInvoice ? 'Edit Invoice' : 'New Invoice'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded mb-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select
                    name="client_id"
                    value={form.client_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    name="issue_date"
                    value={form.issue_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={form.tax_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                  <input
                    type="number"
                    name="discount"
                    value={form.discount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Line Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="col-span-6 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        min="1"
                        className="col-span-2 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        className="col-span-3 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length === 1}
                        className="col-span-1 text-red-400 hover:text-red-600 text-lg leading-none disabled:opacity-30"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-right text-sm text-gray-700 space-y-1">
                  <p>Subtotal: <strong>${calculateSubtotal().toFixed(2)}</strong></p>
                  <p>Discount: <strong>-${parseFloat(form.discount || 0).toFixed(2)}</strong></p>
                  <p>Tax ({form.tax_rate}%): included</p>
                  <p className="text-base font-semibold">Total: ${calculateTotal()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
