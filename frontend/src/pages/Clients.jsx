import { useEffect, useState } from 'react';
import { getClients, createClient, updateClient, deleteClient } from '../api/clientApi';

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', address: '' };

function ClientModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {initial ? 'Edit Client' : 'New Client'}
        </h2>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'name', label: 'Full Name *', type: 'text', required: true },
            { name: 'email', label: 'Email *', type: 'email', required: true },
            { name: 'phone', label: 'Phone', type: 'text', required: false },
            { name: 'company', label: 'Company', type: 'text', required: false },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
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
              {saving ? 'Saving…' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | client object
  const [deleting, setDeleting] = useState(null);

  const reload = () => getClients().then(setClients).catch(() => {});

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const handleSave = async (payload) => {
    if (modal?.id) {
      await updateClient(modal.id, payload);
    } else {
      await createClient(payload);
    }
    await reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client?')) return;
    setDeleting(id);
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={() => setModal('new')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          No clients yet. Add your first client!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Phone', 'Company', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.company || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal(c)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
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
        <ClientModal
          initial={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
