'use client'

import { useEffect, useState } from 'react'

const defaultForm = { name: '', description: '', price: '', categoryId: '', isSpecial: false }

export default function CookMenuPage() {
  const [menuData, setMenuData] = useState<any>({ isOnline: true, categories: [] })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [adding, setAdding] = useState(false)
  const [togglingCanteen, setTogglingCanteen] = useState(false)

  const fetchMenu = async () => {
    const res = await fetch('/api/canteen/menu')
    const data = await res.json()
    setMenuData(data.data || { isOnline: true, categories: [] })
    setLoading(false)
  }

  useEffect(() => { fetchMenu() }, [])

  const toggleItem = async (id: string, field: 'isSoldOut' | 'isAvailable', value: boolean) => {
    await fetch('/api/canteen/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value }),
    })
    fetchMenu()
  }

  const handleAdd = async () => {
    if (!form.name || !form.price || !form.categoryId) return
    setAdding(true)
    await fetch('/api/canteen/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
    })
    setShowAdd(false)
    setForm(defaultForm)
    fetchMenu()
    setAdding(false)
  }

  const toggleCanteen = async () => {
    setTogglingCanteen(true)
    await fetch('/api/canteen/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline: !menuData.isOnline }),
    })
    setMenuData((prev: any) => ({ ...prev, isOnline: !prev.isOnline }))
    setTogglingCanteen(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const allItems = menuData.categories.flatMap((c: any) => c.items || [])
  const totalItems = allItems.length
  const soldOutCount = allItems.filter((i: any) => i.isSoldOut).length

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
      <p className="text-sm text-gray-500">Manage items, availability, and canteen status</p>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={toggleCanteen} disabled={togglingCanteen}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-60 ${
          menuData.isOnline
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}>
        <span className={`w-2 h-2 rounded-full ${menuData.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        {togglingCanteen ? 'Updating...' : menuData.isOnline ? 'Canteen Online' : 'Canteen Offline'}
      </button>
      <button onClick={() => setShowAdd(true)}
        className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </button>
    </div>
  </div>

  {/* Stats */}
  <div className="grid grid-cols-3 gap-4 mb-6">
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
      <p className="text-xs text-gray-500 mt-1">Total Items</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-green-600">{totalItems - soldOutCount}</p>
      <p className="text-xs text-gray-500 mt-1">Available</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-red-600">{soldOutCount}</p>
      <p className="text-xs text-gray-500 mt-1">Sold Out</p>
    </div>
  </div>

  {/* Add Item Modal */}
  {showAdd && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Menu Item</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Item Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Masala Dosa"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Short description"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹) *</label>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="0.00" min="0"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category *</label>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900">
              <option value="">Select category...</option>
              {menuData.categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isSpecial" checked={form.isSpecial}
              onChange={e => setForm(f => ({ ...f, isSpecial: e.target.checked }))}
              className="w-4 h-4 accent-red-500" />
            <label htmlFor="isSpecial" className="text-sm text-gray-900">Mark as Daily Special</label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setShowAdd(false)}
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleAdd} disabled={adding || !form.name || !form.price || !form.categoryId}
            className="flex-1 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
            {adding ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Menu items by category */}
  <div className="space-y-6">
    {menuData.categories.map((cat: any) => (
      <div key={cat.id}>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{cat.name}</h2>
        {cat.items?.length === 0 ? (
          <p className="text-sm text-gray-500">No items in this category</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Item</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Price</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Available</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Sold Out</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Special</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cat.items?.map((item: any) => (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.isSoldOut ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                      </td>
                      <td className="text-center px-4 py-3 font-semibold text-gray-900">₹{item.price}</td>
                      <td className="text-center px-4 py-3">
                        <button onClick={() => toggleItem(item.id, 'isAvailable', !item.isAvailable)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.isAvailable ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="text-center px-4 py-3">
                        <button onClick={() => toggleItem(item.id, 'isSoldOut', !item.isSoldOut)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${item.isSoldOut ? 'bg-red-500' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.isSoldOut ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="text-center px-4 py-3">
                        {item.isSpecial && <span className="text-amber-500 text-lg">⭐</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
  )
}
