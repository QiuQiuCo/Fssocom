import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { pushItem, deleteItem as syncDeleteItem, pushTransaction } from '../lib/syncService'

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', category: '', quantity: 0, min_quantity: 0,
  price: 0, cost: 0, supplier: '', location: '', description: ''
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
      />
    </div>
  )
}

export default function InventoryPage({ user, onToast }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'stock' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [stockForm, setStockForm] = useState({ quantity: 1, type: 'add', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    setLoading(true)
    const res = await api.listInventory()
    if (res.success) setItems(res.data)
    setLoading(false)
  }

  // Generate unique barcode
  function generateBarcode() {
    const existingBarcodes = items.map(item => item.barcode).filter(Boolean)
    let newBarcode
    let attempts = 0
    
    do {
      // Generate 13-digit EAN-13 style barcode
      newBarcode = '2' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')
      attempts++
    } while (existingBarcodes.includes(newBarcode) && attempts < 100)
    
    return newBarcode
  }

  // Generate consistent color for location
  function getLocationColor(location) {
    if (!location) return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
      { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
      { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
      { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
      { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    ]
    
    // Generate consistent hash from location string
    let hash = 0
    for (let i = 0; i < location.length; i++) {
      hash = ((hash << 5) - hash) + location.charCodeAt(i)
      hash = hash & hash
    }
    
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]
  const locations = [...new Set(items.map(i => i.location).filter(Boolean))].sort()

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.includes(q)) || (item.supplier || '').toLowerCase().includes(q) ||
      (item.location || '').toLowerCase().includes(q)
    const matchCat = !categoryFilter || item.category === categoryFilter
    const matchLoc = !locationFilter || item.location === locationFilter
    return matchSearch && matchCat && matchLoc
  }).sort((a, b) => {
    // Sort by location first (alphabetically), then by name
    const locA = (a.location || '').toLowerCase()
    const locB = (b.location || '').toLowerCase()
    if (locA < locB) return -1
    if (locA > locB) return 1
    // If same location, sort by name
    return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
  })

  function openAdd() {
    const newBarcode = generateBarcode()
    setForm({ ...EMPTY_FORM, barcode: newBarcode })
    setModal('add')
  }

  function openEdit(item) {
    setSelected(item)
    setForm({ ...item })
    setModal('edit')
  }

  function openStock(item) {
    setSelected(item)
    setStockForm({ quantity: 1, type: 'add', note: '' })
    setModal('stock')
  }

  function openDelete(item) {
    setSelected(item)
    setModal('delete')
  }

  async function handleSave() {
    if (!form.name.trim() || !form.sku.trim()) {
      onToast('Name and SKU are required', 'error')
      return
    }
    setSaving(true)
    const data = {
      ...form,
      quantity: parseInt(form.quantity) || 0,
      min_quantity: parseInt(form.min_quantity) || 0,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
    }
    const res = modal === 'add' ? await api.createItem(data) : await api.updateItem(data)
    setSaving(false)
    if (res.success) {
      onToast(modal === 'add' ? 'Item added successfully' : 'Item updated successfully')
      setModal(null)
      loadItems()
      // Push to Supabase in background (get fresh item with updated_at)
      const fresh = modal === 'edit' ? { ...data } : { ...data, id: res.id }
      pushItem(fresh)
    } else {
      onToast(res.error || 'Failed to save item', 'error')
    }
  }

  async function handleStock() {
    if (!stockForm.quantity || stockForm.quantity < 1) {
      onToast('Enter a valid quantity', 'error')
      return
    }
    setSaving(true)
    const res = await api.adjustStock({
      id: selected.id,
      quantity: parseInt(stockForm.quantity),
      type: stockForm.type,
      note: stockForm.note,
      userId: user.id,
    })
    setSaving(false)
    if (res.success) {
      onToast(`Stock updated. New quantity: ${res.newQuantity}`)
      setModal(null)
      loadItems()
      // Push updated item + transaction to Supabase in background
      const updatedItem = { ...selected, quantity: res.newQuantity }
      pushItem(updatedItem)
      pushTransaction({
        item_name: selected.name,
        type: stockForm.type,
        quantity: parseInt(stockForm.quantity),
        note: stockForm.note,
        created_at: new Date().toISOString(),
      })
    } else {
      onToast(res.error || 'Failed to adjust stock', 'error')
    }
  }

  async function handleDelete() {
    setSaving(true)
    const res = await api.deleteItem({ id: selected.id })
    setSaving(false)
    if (res.success) {
      onToast('Item deleted')
      setModal(null)
      loadItems()
      // Delete from Supabase in background
      syncDeleteItem(selected.sku)
    } else {
      onToast(res.error || 'Failed to delete item', 'error')
    }
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl">👋</span>
          <h1 className="text-xl font-normal text-gray-700">
            Hello, <span className="font-semibold text-gray-900">{user.username}!</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search anything"
              className="w-72 bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Page Title and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inventory Management</h2>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} total items in stock</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all min-w-[180px]"
        >
          <option value="">All Locations</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all min-w-[160px]"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center flex-1 text-slate-600 gap-2">
            <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Loading inventory...
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Item Name</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Price</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Dealer Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">SKU / Barcode</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-16 text-slate-500">No items found</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      {item.location ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getLocationColor(item.location).bg} ${getLocationColor(item.location).text} border ${getLocationColor(item.location).border}`}>
                          {item.location}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      {item.supplier && <p className="text-xs text-slate-500 mt-0.5">{item.supplier}</p>}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-700 text-sm font-medium">${item.price?.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right text-slate-700 text-sm font-medium">${item.cost?.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-slate-700">{item.sku}</p>
                      {item.barcode && item.barcode !== item.sku && <p className="font-mono text-xs text-slate-500 mt-0.5">{item.barcode}</p>}
                    </td>
                    <td className="px-5 py-4">
                      {item.category && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{item.category}</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-sm text-slate-800">{item.quantity}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openStock(item)} title="Adjust Stock"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        </button>
                        <button onClick={() => openEdit(item)} title="Edit"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        {user.role === 'admin' && (
                          <button onClick={() => openDelete(item)} title="Delete"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add New Item' : 'Edit Item'} onClose={() => setModal(null)}>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Location & Item Name - First row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Location *</label>
                <input 
                  value={form.location} 
                  onChange={e => f('location', e.target.value)} 
                  placeholder="e.g. Shelf A1, Warehouse B"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Item Name *</label>
                <input 
                  value={form.name} 
                  onChange={e => f('name', e.target.value)} 
                  placeholder="e.g. Laptop Dell XPS"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* SKU & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU *</label>
                <input 
                  value={form.sku} 
                  onChange={e => f('sku', e.target.value)} 
                  placeholder="e.g. LAP-001"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <input 
                  value={form.category} 
                  onChange={e => f('category', e.target.value)} 
                  placeholder="e.g. Electronics"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Barcode with Generator Button */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Barcode</label>
              <div className="flex gap-2">
                <input 
                  value={form.barcode} 
                  onChange={e => f('barcode', e.target.value)} 
                  placeholder="Auto-generated"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => f('barcode', generateBarcode())}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all border border-slate-200"
                >
                  Generate
                </button>
              </div>
              {form.barcode && (
                <p className="text-xs text-slate-500 mt-1.5">Barcode: {form.barcode}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input 
                type="number" 
                min="0" 
                value={form.quantity} 
                onChange={e => f('quantity', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Customer Price & Dealer Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer Price ($)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={form.price} 
                  onChange={e => f('price', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dealer Price ($)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={form.cost} 
                  onChange={e => f('cost', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Supplier</label>
              <input 
                value={form.supplier} 
                onChange={e => f('supplier', e.target.value)} 
                placeholder="e.g. Dell Inc."
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => f('description', e.target.value)}
                rows={3}
                placeholder="Optional description..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all resize-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
              {saving ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Saving...</> : 'Save Item'}
            </button>
          </div>
        </Modal>
      )}

      {/* Stock Modal */}
      {modal === 'stock' && selected && (
        <Modal title={`Adjust Stock — ${selected.name}`} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div className="bg-slate-50 rounded-xl p-5 flex items-center gap-4 border border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Stock</p>
                <p className="text-3xl font-bold text-slate-800">{selected.quantity}</p>
              </div>
              <div className="flex-1 h-px bg-slate-200" />
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">SKU</p>
                <p className="text-sm font-mono text-slate-700">{selected.sku}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2.5">Operation</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button onClick={() => setStockForm(p => ({ ...p, type: 'add' }))}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                    stockForm.type === 'add'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  Add Stock
                </button>
                <button onClick={() => setStockForm(p => ({ ...p, type: 'remove' }))}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                    stockForm.type === 'remove'
                      ? 'bg-red-600 border-red-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  Remove Stock
                </button>
                <button onClick={() => setStockForm(p => ({ ...p, type: 'set' }))}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                    stockForm.type === 'set'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  Set Quantity
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity</label>
              <input 
                type="number" 
                min="1" 
                value={stockForm.quantity}
                onChange={e => setStockForm(p => ({ ...p, quantity: e.target.value }))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
              <input 
                value={stockForm.note}
                onChange={e => setStockForm(p => ({ ...p, note: e.target.value }))}
                placeholder="e.g. Stock received from supplier"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleStock} disabled={saving}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
              {saving ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Updating...</> : 'Update Stock'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && selected && (
        <Modal title="Delete Item" onClose={() => setModal(null)}>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <p className="text-lg text-slate-800 font-semibold">Delete "{selected.name}"?</p>
            <p className="text-slate-500 text-sm mt-2">This action cannot be undone. All data associated with this item will be permanently deleted.</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all disabled:opacity-50 shadow-sm">
              {saving ? 'Deleting...' : 'Delete Item'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
