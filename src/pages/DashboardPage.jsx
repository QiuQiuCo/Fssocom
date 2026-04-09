import { useState, useEffect } from 'react'
import { api } from '../lib/api'

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 flex items-start gap-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage({ user }) {
  const [stats, setStats] = useState(null)
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, inv] = await Promise.all([api.getDashboardStats(), api.listInventory()])
      if (s.success) setStats(s.data)
      if (inv.success) setInventory(inv.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-slate-600">
          <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Loading...
        </div>
      </div>
    )
  }

  const lowStockItems = inventory.filter(i => i.quantity <= i.min_quantity && i.min_quantity > 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold">{user.username}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Items"
          value={stats?.totalItems ?? 0}
          sub="SKUs in inventory"
          color="bg-blue-500/10"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
        />
        <StatCard
          label="Inventory Value"
          value={`$${(stats?.totalValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="At retail price"
          color="bg-emerald-500/10"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <StatCard
          label="Low Stock"
          value={stats?.lowStock ?? 0}
          sub="Items need restocking"
          color="bg-amber-500/10"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        />
        <StatCard
          label="Categories"
          value={[...new Set(inventory.map(i => i.category).filter(Boolean))].length}
          sub="Product categories"
          color="bg-violet-500/10"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Low Stock Alert */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm">Low Stock Alerts</h2>
            <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
              {lowStockItems.length} items
            </span>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <p className="text-sm mt-2">All items are well stocked</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-amber-600">{item.quantity}</p>
                    <p className="text-xs text-slate-500">min: {item.min_quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 text-sm">Recent Activity</h2>
          </div>
          {(!stats?.recentTransactions || stats.recentTransactions.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              <p className="text-sm mt-2">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.item_name}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`shrink-0 ml-2 text-xs font-semibold px-2 py-1 rounded-lg ${
                    tx.type === 'add' ? 'bg-emerald-100 text-emerald-700' :
                    tx.type === 'remove' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {tx.type === 'add' ? '+' : tx.type === 'remove' ? '-' : '='}{tx.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Items Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="font-semibold text-slate-800 text-sm">Inventory Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Price</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody>
              {inventory.slice(0, 8).map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200/50 hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-5 py-3 text-slate-600 font-mono text-xs">{item.sku}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-2 py-1 rounded-md font-medium">{item.category || '—'}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${item.quantity <= item.min_quantity && item.min_quantity > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-700">${item.price?.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-600">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
