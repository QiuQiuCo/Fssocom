import { supabase, supabaseEnabled } from './supabaseConfig'

// Sync states: 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
let syncListeners = []
let syncState = supabaseEnabled ? 'idle' : 'offline'

export function onSyncStateChange(cb) {
  syncListeners.push(cb)
  return () => { syncListeners = syncListeners.filter(l => l !== cb) }
}

function setState(s) {
  syncState = s
  syncListeners.forEach(l => l(s))
}

export function getSyncState() {
  return syncState
}

// Push a single inventory item to Supabase (upsert by sku)
export async function pushItem(item) {
  if (!supabaseEnabled || !supabase) return
  try {
    const { error } = await supabase
      .from('inventory')
      .upsert({
        sku: item.sku,
        name: item.name,
        barcode: item.barcode,
        category: item.category,
        quantity: item.quantity,
        min_quantity: item.min_quantity,
        price: item.price,
        cost: item.cost,
        supplier: item.supplier,
        location: item.location,
        description: item.description,
        updated_at: item.updated_at || new Date().toISOString(),
      }, { onConflict: 'sku' })
    if (error) throw error
  } catch (err) {
    console.error('[Sync] pushItem error:', err.message)
  }
}

// Delete an item from Supabase by sku
export async function deleteItem(sku) {
  if (!supabaseEnabled || !supabase) return
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('sku', sku)
    if (error) throw error
  } catch (err) {
    console.error('[Sync] deleteItem error:', err.message)
  }
}

// Push a transaction record to Supabase
export async function pushTransaction(tx) {
  if (!supabaseEnabled || !supabase) return
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        item_name: tx.item_name,
        type: tx.type,
        quantity: tx.quantity,
        note: tx.note,
        created_at: tx.created_at || new Date().toISOString(),
      })
    if (error) throw error
  } catch (err) {
    console.error('[Sync] pushTransaction error:', err.message)
  }
}

// Full sync: pull from Supabase and merge into SQLite
// Supabase wins if its updated_at is newer
export async function fullSync() {
  if (!supabaseEnabled || !supabase) return
  setState('syncing')
  try {
    // 1. Fetch all inventory from Supabase
    const { data: remoteItems, error } = await supabase
      .from('inventory')
      .select('*')
    if (error) throw error

    // 2. Fetch all local inventory
    const localRes = await window.api.listInventory()
    if (!localRes.success) throw new Error(localRes.error)
    const localItems = localRes.data

    const localBySku = Object.fromEntries(localItems.map(i => [i.sku, i]))

    // 3. For each remote item, upsert into SQLite if newer
    for (const remote of remoteItems) {
      const local = localBySku[remote.sku]
      const remoteTime = new Date(remote.updated_at || 0).getTime()
      const localTime = local ? new Date(local.updated_at || 0).getTime() : 0

      if (!local) {
        // New item from cloud — insert into SQLite
        await window.api.createItem({
          name: remote.name,
          sku: remote.sku,
          barcode: remote.barcode || remote.sku,
          category: remote.category || '',
          quantity: remote.quantity || 0,
          min_quantity: remote.min_quantity || 0,
          price: remote.price || 0,
          cost: remote.cost || 0,
          supplier: remote.supplier || '',
          location: remote.location || '',
          description: remote.description || '',
        })
      } else if (remoteTime > localTime) {
        // Cloud is newer — update SQLite
        await window.api.updateItem({
          id: local.id,
          name: remote.name,
          sku: remote.sku,
          barcode: remote.barcode || remote.sku,
          category: remote.category || '',
          quantity: remote.quantity || 0,
          min_quantity: remote.min_quantity || 0,
          price: remote.price || 0,
          cost: remote.cost || 0,
          supplier: remote.supplier || '',
          location: remote.location || '',
          description: remote.description || '',
        })
      }
    }

    // 4. Push any local items not in Supabase (local-only items go to cloud)
    const remoteBySku = Object.fromEntries(remoteItems.map(i => [i.sku, i]))
    for (const local of localItems) {
      if (!remoteBySku[local.sku]) {
        await pushItem(local)
      }
    }

    setState('synced')
  } catch (err) {
    console.error('[Sync] fullSync error:', err.message)
    setState('error')
  }
}
