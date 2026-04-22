'use client'

import { useEffect, useState, useCallback } from 'react'

export default function ServerDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [serving, setServing] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/canteen/orders?status=READY_FOR_PICKUP')
    const data = await res.json()
    setOrders(data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const serveOrder = async (orderId: string, confirmationNumber: string) => {
    if (verifyingOrder === orderId) {
      // Verify the code matches
      const shortCode = confirmationNumber.slice(-8).toUpperCase()
      if (verifyCode.toUpperCase() !== shortCode) {
        alert('Order number does not match!')
        return
      }
    }

    setServing(orderId)
    await fetch(`/api/canteen/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SERVED' }),
    })
    setOrders(prev => prev.filter(o => o.id !== orderId))
    setServing(null)
    setVerifyingOrder(null)
    setVerifyCode('')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Ready to Serve</h1>
      <p className="text-sm text-gray-500">Orders waiting for pickup · auto-refreshes every 10s</p>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-green-600">{orders.length}</span>
      <span className="text-sm text-gray-500">orders ready</span>
      <button onClick={fetchOrders} 
        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all">
        ↻ Refresh
      </button>
    </div>
  </div>

  {orders.length === 0 ? (
    <div className="text-center py-24 text-gray-500 bg-white border border-gray-200 rounded-xl">
      <p className="text-5xl mb-4">✅</p>
      <p className="text-lg font-medium">All clear!</p>
      <p className="text-sm">No orders ready for pickup right now</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {orders.map((order: any) => (
        <div key={order.id} className="bg-white border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                #{order.confirmationNumber.slice(-8).toUpperCase()}
              </p>
              <p className="text-sm text-gray-500">{order.user?.name}</p>
              <p className="text-xs text-gray-500">{order.orderType === 'DINE_IN' ? '🪑 Dine-in' : '📦 Takeaway'}</p>
            </div>
            <span className="inline-block px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">Ready</span>
          </div>

          {/* Order items */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">
                  <span className="text-gray-500 mr-1">×{item.quantity}</span>
                  {item.menuItem?.name}
                </span>
                <span className="text-gray-500">₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            {order.specialInstructions && (
              <p className="text-xs text-amber-700 border-t border-gray-200 pt-1 mt-1">
                📝 {order.specialInstructions}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-sm mb-4">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
          </div>

          {/* Verify & Serve */}
          {verifyingOrder === order.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                placeholder="Enter order # to confirm"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center font-mono uppercase focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-gray-900"
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setVerifyingOrder(null); setVerifyCode('') }}
                  className="py-2 text-sm border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => serveOrder(order.id, order.confirmationNumber)} disabled={serving === order.id}
                  className="py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 font-semibold transition-all">
                  {serving === order.id ? 'Confirming...' : 'Confirm & Serve'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setVerifyingOrder(order.id)}
              className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all">
              Mark as Served
            </button>
          )}
        </div>
      ))}
    </div>
  )}
</div>
  )
}
