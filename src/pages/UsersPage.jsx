import { useState, useEffect } from 'react'
import { api } from '../lib/api'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h2 className="font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/** Format an ISO date string or null for display. */
function formatExpiry(expiresAt) {
  if (!expiresAt) return null
  const d = new Date(expiresAt)
  const now = new Date()
  const expired = d < now
  const label = d.toLocaleDateString()
  return { label, expired }
}

export default function UsersPage({ user, onToast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', role: 'staff', expires_at: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const res = await api.listUsers()
    if (res.success) setUsers(res.data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.username.trim() || !form.password.trim()) {
      onToast('Username and password are required', 'error')
      return
    }
    setSaving(true)
    const payload = {
      username: form.username.trim(),
      password: form.password,
      role: form.role,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    }
    const res = await api.createUser(payload)
    setSaving(false)
    if (res.success) {
      onToast('User created successfully')
      setModal(null)
      setForm({ username: '', password: '', role: 'staff', expires_at: '' })
      loadUsers()
    } else {
      onToast(res.error || 'Failed to create user', 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const res = await api.deleteUser({ id: deleteTarget.id })
    setSaving(false)
    if (res.success) {
      onToast('User deleted')
      setDeleteTarget(null)
      loadUsers()
    } else {
      onToast(res.error || 'Failed to delete user', 'error')
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm">Manage system users and permissions</p>
        </div>
        <button
          onClick={() => { setForm({ username: '', password: '', role: 'staff', expires_at: '' }); setModal('create') }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-600 gap-2">
          <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading...
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Expires</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const expiry = formatExpiry(u.expires_at)
                return (
                  <tr key={u.id} className="border-b border-slate-200/50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0 shadow-md">
                          {u.username[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.username}</p>
                          {u.id === user.id && <p className="text-xs text-emerald-600 font-medium">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        u.role === 'admin'
                          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {expiry ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          expiry.expired
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {expiry.expired ? 'Expired ' : ''}{expiry.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {u.id !== user.id && (
                        <button onClick={() => setDeleteTarget(u)}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {modal === 'create' && (
        <Modal title="Add New User" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="e.g. john_doe"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Set a password"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all">
                <option value="staff">Staff</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Account Expiry <span className="text-slate-400 normal-case font-normal">(leave blank = never expires)</span>
              </label>
              <input
                type="date"
                value={form.expires_at}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg">
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete User" onClose={() => setDeleteTarget(null)}>
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <p className="text-slate-800 font-semibold">Delete user "{deleteTarget.username}"?</p>
            <p className="text-slate-500 text-sm mt-1">This action cannot be undone.</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all disabled:opacity-50 shadow-lg">
              {saving ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
