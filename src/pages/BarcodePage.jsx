import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

function BarcodeDisplay({ value }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || !value) return
    try {
      import('jsbarcode').then(({ default: JsBarcode }) => {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 2.5,
          height: 90,
          displayValue: true,
          fontSize: 14,
          margin: 12,
          background: '#ffffff',
          lineColor: '#1e293b',
        })
      })
    } catch (e) {
      console.error('Barcode error:', e)
    }
  }, [value])

  if (!value) return null
  return <svg ref={svgRef} className="mx-auto" />
}

function PrintLabel({ item, copies }) {
  const barcodeRefs = useRef([])

  useEffect(() => {
    if (!item) return
    const arr = Array.from({ length: copies }, (_, i) => i)
    arr.forEach((_, i) => {
      const el = barcodeRefs.current[i]
      if (el) {
        import('jsbarcode').then(({ default: JsBarcode }) => {
          JsBarcode(el, item.barcode || item.sku, {
            format: 'CODE128',
            width: 2,
            height: 70,
            displayValue: true,
            fontSize: 12,
            margin: 10,
            background: '#ffffff',
            lineColor: '#000000',
          })
        })
      }
    })
  }, [item, copies])

  if (!item) return null

  const arr = Array.from({ length: copies }, (_, i) => i)
  return (
    <div className="flex flex-wrap gap-4 p-6">
      {arr.map((_, i) => (
        <div key={i} className="border-2 border-gray-800 p-4 rounded-lg inline-block bg-white shadow-lg" style={{ width: '220px' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px', color: '#000', textAlign: 'center', wordBreak: 'break-word' }}>{item.name}</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '0 0 8px', textAlign: 'center', fontFamily: 'monospace' }}>{item.sku}</p>
          <svg ref={el => { barcodeRefs.current[i] = el }} />
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', margin: '8px 0 0', textAlign: 'center' }}>${item.price?.toFixed(2)}</p>
        </div>
      ))}
    </div>
  )
}

export default function BarcodePage({ onToast }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [copies, setCopies] = useState(1)
  const [manualCode, setManualCode] = useState('')
  const [scannedItem, setScannedItem] = useState(null)
  const [tab, setTab] = useState('print')
  const printAreaRef = useRef(null)

  useEffect(() => {
    api.listInventory().then(res => {
      if (res.success) setItems(res.data)
    })
  }, [])

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    return !q || i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
  })

  function handlePrint() {
    if (printAreaRef.current && selected) {
      const printContent = printAreaRef.current.innerHTML
      const printWindow = window.open('', '', 'width=800,height=600')
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode Labels</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
                @page { margin: 10mm; }
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `)
      printWindow.document.close()
      onToast?.({ type: 'success', message: `Printing ${copies} label(s) for ${selected.name}` })
    }
  }

  async function handleLookup() {
    const code = manualCode.trim()
    if (!code) {
      onToast?.({ type: 'error', message: 'Please enter a barcode' })
      return
    }
    const result = await api.lookupBarcode({ code })
    if (result.success && result.item) {
      setScannedItem(result.item)
      onToast?.({ type: 'success', message: `Found: ${result.item.name}` })
    } else {
      setScannedItem(null)
      onToast?.({ type: 'error', message: 'Item not found' })
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200/50 shrink-0 glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Barcode Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">Print labels and lookup items by barcode</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('print')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              tab === 'print'
                ? 'gradient-primary text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print Labels
            </div>
          </button>
          <button
            onClick={() => setTab('scan')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
              tab === 'scan'
                ? 'gradient-primary text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v4M7 7v10M11 7v10M15 7v10M19 7v4M19 13v4"/>
              </svg>
              Lookup Item
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {tab === 'print' ? (
          <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Item Selection */}
              <div className="glass rounded-2xl p-6 border border-white/40">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Select Item</h3>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or SKU..."
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                />
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {filtered.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                        selected?.id === item.id
                          ? 'gradient-primary text-white shadow-lg'
                          : 'bg-white/60 hover:bg-white text-gray-700 hover:scale-102'
                      }`}
                    >
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className={`text-xs mt-1 ${selected?.id === item.id ? 'text-white/80' : 'text-gray-500'}`}>
                        SKU: {item.sku} • Stock: {item.quantity}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Print Configuration */}
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6 border border-white/40">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Print Configuration</h3>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Number of Copies
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={copies}
                      onChange={e => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {selected && (
                    <button
                      onClick={handlePrint}
                      className="w-full gradient-success text-white px-6 py-3.5 rounded-xl font-semibold text-sm shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                        <rect x="6" y="14" width="12" height="8"/>
                      </svg>
                      Print {copies} Label{copies > 1 ? 's' : ''}
                    </button>
                  )}
                </div>

                {/* Preview */}
                {selected && (
                  <div className="glass rounded-2xl p-6 border border-white/40 animate-scale-in">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Preview</h3>
                    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                      <p className="text-center font-bold text-gray-900 mb-2">{selected.name}</p>
                      <p className="text-center text-sm text-gray-600 mb-3 font-mono">{selected.sku}</p>
                      <BarcodeDisplay value={selected.barcode || selected.sku} />
                      <p className="text-center font-bold text-gray-900 mt-3">${selected.price?.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden print area */}
            <div className="hidden">
              <div ref={printAreaRef}>
                {selected && <PrintLabel item={selected} copies={copies} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="glass rounded-2xl p-8 border border-white/40">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2"/>
                    <path d="M12 12h.01M17 12h.01M7 12h.01"/>
                  </svg>
                </div>
                Barcode Scanner Lookup
              </h3>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                  </svg>
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Using a barcode scanner?</p>
                    <p className="text-blue-700">Simply scan the barcode with your USB scanner. The barcode will automatically populate in the field below and trigger the lookup.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Scan or Enter Barcode
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    placeholder="Scan barcode or enter manually..."
                    autoFocus
                    className="flex-1 px-4 py-4 bg-white/80 border-2 border-gray-300 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                  <button
                    onClick={handleLookup}
                    className="gradient-primary text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    Lookup
                  </button>
                </div>
              </div>

              {/* Result */}
              {scannedItem && (
                <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 animate-scale-in">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{scannedItem.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">SKU: <span className="font-mono font-semibold">{scannedItem.sku}</span></p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block">Price</span>
                          <span className="font-bold text-gray-900">${scannedItem.price?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Stock</span>
                          <span className="font-bold text-gray-900">{scannedItem.quantity}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Category</span>
                          <span className="font-semibold text-gray-900 capitalize">{scannedItem.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
