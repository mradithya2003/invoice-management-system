import { useState, useEffect } from 'react'
import { getClients, createClient, updateClient, deleteClient } from '../api/clientApi'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const data = await getClients()
      setClients(data.clients || [])
    } catch {
      setError('Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditClient(null)
    setForm({ name: '', email: '', phone: '', company: '', address: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (client) => {
    setEditClient(client)
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
    })
    setError('')
    setShowModal(true)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Client name is required.')
      return
    }

    setSaving(true)
    try {
      if (editClient) {
        await updateClient(editClient.id, form)
      } else {
        await createClient(form)
      }
      setShowModal(false)
      fetchClients()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return
    try {
      await deleteClient(id)
      setClients(clients.filter(c => c.id !== id))
    } catch {
      alert('Failed to delete client.')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
        >
          + Add Client
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No clients yet.</p>
          <button onClick={openCreate} className="text-blue-600 hover:underline text-sm">
            Add your first client
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Company</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{client.name}</td>
                  <td className="px-6 py-3">{client.company || '—'}</td>
                  <td className="px-6 py-3">{client.email || '—'}</td>
                  <td className="px-6 py-3">{client.phone || '—'}</td>
                  <td className="px-6 py-3 space-x-2">
                    <button
                      onClick={() => openEdit(client)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">{editClient ? 'Edit Client' : 'New Client'}</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded mb-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { label: 'Name *', name: 'name', type: 'text', placeholder: 'Client name' },
                { label: 'Company', name: 'company', type: 'text', placeholder: 'Company name' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'email@example.com' },
                { label: 'Phone', name: 'phone', type: 'text', placeholder: '+1 (555) 000-0000' },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Street, City, State, ZIP"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
