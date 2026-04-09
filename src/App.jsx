import { useState, useEffect } from 'react'
import './App.css'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InventoryPage from './pages/InventoryPage'
import BarcodePage from './pages/BarcodePage'
import TransactionsPage from './pages/TransactionsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import { fullSync, onSyncStateChange, getSyncState, supabaseEnabled } from './lib/syncService'
import { supabaseEnabled as sbEnabled } from './lib/supabaseConfig'

function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [toast, setToast] = useState(null)
  const [syncState, setSyncState] = useState(getSyncState())

  // Subscribe to sync state changes
  useEffect(() => {
    const unsub = onSyncStateChange(setSyncState)
    return unsub
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem('inv_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  // Run full sync whenever user logs in
  useEffect(() => {
    if (user) {
      fullSync()
    }
  }, [user])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    sessionStorage.setItem('inv_user', JSON.stringify(userData))
    setPage('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    sessionStorage.removeItem('inv_user')
    setPage('dashboard')
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-white">
        <TitleBar showControls />
        <LoginPage onLogin={handleLogin} />
      </div>
    )
  }

  const pageComponents = {
    dashboard: <DashboardPage user={user} onToast={showToast} />,
    inventory: <InventoryPage user={user} onToast={showToast} />,
    barcode: <BarcodePage user={user} onToast={showToast} />,
    transactions: <TransactionsPage user={user} onToast={showToast} />,
    users: <UsersPage user={user} onToast={showToast} />,
    settings: <SettingsPage user={user} onToast={showToast} />,
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <TitleBar showControls />
      <div className="flex-1 p-3 overflow-hidden">
        <div className="h-full bg-white rounded-2xl shadow-lg overflow-hidden flex">
          <Sidebar user={user} page={page} onPage={setPage} onLogout={handleLogout} syncState={syncState} />
          <main className="flex-1 overflow-auto bg-gray-50">
            <div className="animate-fade-in h-full">
              {pageComponents[page] || pageComponents.dashboard}
            </div>
          </main>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-lg text-sm font-medium border
          ${toast.type === 'success' ? 'bg-white text-emerald-700 border-emerald-200' : ''}
          ${toast.type === 'error' ? 'bg-white text-red-700 border-red-200' : ''}
          ${toast.type === 'info' ? 'bg-white text-indigo-700 border-indigo-200' : ''}
        `}>
          {toast.type === 'success' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {toast.type === 'error' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
          {toast.type === 'info' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
