import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      const res = await api.listTransactions({})
      if (res.success) setTransactions(res.data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = transactions.filter(tx => {
    const q = filter.toLowerCase()
    return !q || tx.item_name.toLowerCase().includes(q) || (tx.note || '').toLowerCase().includes(q) || tx.type.includes(q)
  })

  const typeLabel = { add: 'Stock In', remove: 'Stock Out', set: 'Set Qty' }
  const typeColor = {
    add: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    remove: 'bg-red-100 text-red-700 border-red-200',
    set: 'bg-teal-100 text-teal-700 border-teal-200',
  }

  return (
    <div className="p-6 space-y-4 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-500 text-sm">{transactions.length} stock movements recorded</p>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter transactions..."
          className="w-full bg-white/80 backdrop-blur-xl border border-white/30 rounded-xl pl-9 pr-4 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm" />
      </div>

      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl overflow-hidden flex flex-col min-h-0 shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center flex-1 text-slate-600 gap-2">
            <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading...
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 backdrop-blur-sm">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Note</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-slate-500">
                      <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                      {transactions.length === 0 ? 'No transactions yet. Adjust stock from the Inventory page.' : 'No results found'}
                    </td>
                  </tr>
                ) : filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-200/50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{tx.item_name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${typeColor[tx.type] || 'bg-slate-100 text-slate-700'}`}>
                        {typeLabel[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-bold ${tx.type === 'add' ? 'text-emerald-600' : tx.type === 'remove' ? 'text-red-600' : 'text-teal-600'}`}>
                        {tx.type === 'add' ? '+' : tx.type === 'remove' ? '-' : '='}{tx.quantity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{tx.note || '—'}</td>
                    <td className="px-5 py-3 text-right text-slate-600 text-xs whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
