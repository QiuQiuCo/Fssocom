import { useState } from 'react'
import { api } from '../lib/api'

export default function SettingsPage({ user, onToast }) {
  const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!pwForm.old || !pwForm.new || !pwForm.confirm) {
      onToast('All fields are required', 'error'); return
    }
    if (pwForm.new !== pwForm.confirm) {
      onToast('New passwords do not match', 'error'); return
    }
    if (pwForm.new.length < 6) {
      onToast('Password must be at least 6 characters', 'error'); return
    }
    setSaving(true)
    const res = await api.changePassword({ userId: user.id, oldPassword: pwForm.old, newPassword: pwForm.new })
    setSaving(false)
    if (res.success) {
      onToast('Password changed successfully')
      setPwForm({ old: '', new: '', confirm: '' })
    } else {
      onToast(res.error || 'Failed to change password', 'error')
    }
  }

  const inputClass = "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account settings</p>
      </div>

      {/* Profile */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold text-slate-800 mb-4">Account Info</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold uppercase shadow-lg">
            {user.username[0]}
          </div>
          <div>
            <p className="text-slate-800 font-semibold text-lg">{user.username}</p>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
              user.role === 'admin'
                ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {user.role === 'admin' ? 'Administrator' : 'Staff'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold text-slate-800 mb-1">Change Password</h2>
        <p className="text-slate-500 text-sm mb-5">Choose a strong password with at least 6 characters</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showOld ? 'text' : 'password'} value={pwForm.old}
                onChange={e => setPwForm(p => ({ ...p, old: e.target.value }))}
                placeholder="Your current password"
                className={`${inputClass} pr-11`} />
              <button type="button" onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showOld
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={pwForm.new}
                onChange={e => setPwForm(p => ({ ...p, new: e.target.value }))}
                placeholder="At least 6 characters"
                className={`${inputClass} pr-11`} />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showNew
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input type="password" value={pwForm.confirm}
              onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className={inputClass} />
            {pwForm.confirm && pwForm.new !== pwForm.confirm && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Passwords do not match
              </p>
            )}
          </div>
          <button type="submit" disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg">
            {saving ? (
              <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Saving...</>
            ) : 'Update Password'}
          </button>
        </form>
      </div>

      {/* App Info */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg">
        <h2 className="font-semibold text-slate-800 mb-4">About</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Application</span>
            <span className="text-slate-800 font-medium">InventoryPro</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Version</span>
            <span className="text-slate-800 font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Database</span>
            <span className="text-slate-800 font-medium">SQLite (local)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Framework</span>
            <span className="text-slate-800 font-medium">Electron + React</span>
          </div>
        </div>
      </div>
    </div>
  )
}
