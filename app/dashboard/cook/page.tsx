'use client'

import { useEffect, useState, useCallback } from 'react'

const STATUS_FLOW = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP']

const statusColors: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PREPARING: 'bg-amber-100 text-amber-800 border-amber-200',
  READY_FOR_PICKUP: 'bg-green-100 text-green-800 border-green-200',
}

export default function CookDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/canteen/orders')
    const data = await res.json()
    setOrders(data.data || [])
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId)
    await fetch(`/api/canteen/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchOrders()
    setUpdatingOrder(null)
  }

  const markItemSoldOut = async (menuItemId: string) => {
    await fetch('/api/canteen/menu', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: menuItemId, isSoldOut: true }),
    })
    alert('Item marked as sold out')
  }

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  const getNextStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLACED: 'Accept Order',
      CONFIRMED: 'Start Preparing',
      PREPARING: 'Mark Ready',
    }
    return labels[status] || null
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const activeOrders = orders.filter(o => ['PLACED', 'CONFIRMED', 'PREPARING'].includes(o.status))
  const readyOrders = orders.filter(o => o.status === 'READY_FOR_PICKUP')

  return (
<div className="max-w-6xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
      <p className="text-xs text-gray-500">Auto-refreshes every 15s · Last: {lastRefresh.toLocaleTimeString()}</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex gap-3 text-sm">
        <span className="font-medium text-gray-900">{activeOrders.length} active</span>
        <span className="text-gray-500">·</span>
        <span className="text-green-600 font-medium">{readyOrders.length} ready</span>
      </div>
      <button onClick={fetchOrders}
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
        ↻ Refresh
      </button>
    </div>
  </div>

  {orders.length === 0 && (
    <div className="text-center py-24 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p className="text-5xl mb-4">🍳</p>
      <p className="text-lg font-medium">No active orders</p>
      <p className="text-sm">New orders will appear here automatically</p>
    </div>
  )}

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {orders.map((order: any) => {
      const nextStatus = getNextStatus(order.status)
      const nextLabel = getNextStatusLabel(order.status)
      const timeSince = Math.floor((Date.now() - new Date(order.placedAt).getTime()) / 60000)

      return (
        <div key={order.id} className={`bg-white border-2 rounded-xl p-5 ${statusColors[order.status] || 'border-gray-200'}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-bold text-gray-900 text-lg">#{order.confirmationNumber.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-gray-500">{order.user?.name} · {timeSince}m ago</p>
              <span className="text-xs font-medium text-gray-700">{order.orderType === 'DINE_IN' ? '🪑 Dine-in' : '📦 Takeaway'}</span>
            </div>
            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium border ${statusColors[order.status]}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-semibold text-gray-700">
                    {item.quantity}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.menuItem?.name}</span>
                </div>
                <button onClick={() => markItemSoldOut(item.menuItemId)}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors">
                  Sold out
                </button>
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-4 text-xs text-amber-800">
              📝 {order.specialInstructions}
            </div>
          )}

          {/* Action */}
          {nextStatus && nextLabel && (
            <button
              onClick={() => updateOrderStatus(order.id, nextStatus)}
              disabled={updatingOrder === order.id}
              className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-60 transition-all">
              {updatingOrder === order.id ? 'Updating...' : nextLabel}
            </button>
          )}

          {order.status === 'READY_FOR_PICKUP' && (
            <div className="text-center py-2 text-sm font-semibold text-green-700">
              ✓ Ready for pickup
            </div>
          )}
        </div>
      )
    })}
  </div>
</div>
  )
}
