'use client'

import { useEffect, useState } from 'react'
import PaymentButton from '@/components/shared/PaymentButton'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  isAvailable: boolean
  isSoldOut: boolean
  isSpecial: boolean
}

interface CartItem extends MenuItem {
  quantity: number
}

export default function CanteenPage() {
  const [menu, setMenu] = useState<{ isOnline: boolean; categories: any[] }>({ isOnline: true, categories: [] })
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('TAKEAWAY')
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'razorpay'>('wallet')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [placedOrder, setPlacedOrder] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu')
  const [specialInstructions, setSpecialInstructions] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/canteen/menu').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/canteen/orders').then(r => r.json()),
    ]).then(([menuData, userData, ordersData]) => {
      setMenu(menuData.data || { isOnline: true, categories: [] })
      setUser(userData.user)
      setOrders(ordersData.data || [])
      setLoading(false)
    })
  }, [])

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId)
      if (existing?.quantity === 1) return prev.filter(c => c.id !== itemId)
      return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const placeOrder = async () => {
    if (!cart.length) return
    const res = await fetch('/api/canteen/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
        orderType,
        paymentMethod,
        specialInstructions,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setPlacedOrder(data.data)
      setCart([])
      setOrders(prev => [data.data, ...prev])
      setActiveTab('orders')
    } else {
      alert(data.error)
    }
  }

  const statusColors: Record<string, string> = {
    PLACED: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-indigo-100 text-indigo-700',
    PREPARING: 'bg-amber-100 text-amber-700',
    READY_FOR_PICKUP: 'bg-green-100 text-green-700',
    SERVED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>


  return(
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Canteen</h1>
          <p className="text-sm text-gray-500">Browse menu and place orders</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${menu.isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {menu.isOnline ? '● Online' : '● Offline'}
          </span>
          <span className="text-sm text-gray-500">Wallet: <strong className="text-gray-900">₹{user?.walletBalance?.toFixed(2)}</strong></span>
        </div>
      </div>

      {!menu.isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          The canteen is currently offline. Please check back later.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {['menu', 'orders'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {tab} {tab === 'orders' && orders.length > 0 && <span className="ml-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">{orders.length}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Menu */}
          <div className="lg:col-span-2 space-y-6">
            {menu.categories.map((cat: any) => (
              <div key={cat.id}>
                <h2 className="text-base font-semibold text-gray-900 mb-3">{cat.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.items.map((item: MenuItem) => {
                    const inCart = cart.find(c => c.id === item.id)
                    return (
                      <div key={item.id} className={`bg-white border rounded-xl p-4 transition-all ${item.isSoldOut ? 'opacity-60' : 'hover:border-red-200'} ${item.isSpecial ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
                        {item.isSpecial && <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mb-2 inline-block">⭐ Daily Special</span>}
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                          </div>
                          <span className="text-sm font-bold text-gray-900 ml-2 flex-shrink-0">₹{item.price}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          {item.isSoldOut ? (
                            <span className="text-xs text-red-600 font-medium">Sold Out</span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Available</span>
                          )}
                          {!item.isSoldOut && (
                            inCart ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => removeFromCart(item.id)}
                                  className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-700">−</button>
                                <span className="text-sm font-semibold w-4 text-center">{inCart.quantity}</span>
                                <button onClick={() => addToCart(item)}
                                  className="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-700">+</button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)} disabled={!menu.isOnline}
                                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                                Add
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Your Order {cartCount > 0 && <span className="text-sm font-normal text-gray-500">({cartCount} items)</span>}
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm hover:bg-gray-200">−</button>
                          <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm hover:bg-gray-200">+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between font-bold text-gray-900 mb-4">
                    <span>Total</span>
                    <span>₹{cartTotal}</span>
                  </div>

                  {/* Order type */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Order Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['TAKEAWAY', 'DINE_IN'] as const).map(type => (
                        <button key={type} onClick={() => setOrderType(type)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${orderType === type ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}>
                          {type === 'TAKEAWAY' ? '📦 Takeaway' : '🪑 Dine-in'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Payment</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['wallet', 'razorpay'] as const).map(method => (
                        <button key={method} onClick={() => setPaymentMethod(method)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all ${paymentMethod === method ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300'}`}>
                          {method === 'wallet' ? '👛 Wallet' : '💳 Card/UPI'}
                        </button>
                      ))}
                    </div>
                    {paymentMethod === 'wallet' && user?.walletBalance < cartTotal && (
                      <p className="text-xs text-red-600 mt-1">Insufficient wallet balance</p>
                    )}
                  </div>

                  <textarea
                    placeholder="Special instructions (optional)"
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 rounded-lg mb-4 resize-none focus:outline-none focus:ring-1 focus:ring-red-500"
                    rows={2}
                  />

                  {paymentMethod === 'wallet' ? (
                    <button onClick={placeOrder} disabled={!menu.isOnline || (user?.walletBalance < cartTotal)}
                      className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                      Place Order — ₹{cartTotal}
                    </button>
                  ) : (
                    <PaymentButton
                      amount={cartTotal}
                      type="CANTEEN"
                      userName={user?.name}
                      userEmail={user?.email}
                      label="Pay & Order"
                      className="w-full py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                      onSuccess={() => placeOrder()}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📋</p>
              <p>No orders yet</p>
            </div>
          ) : (
            orders.map((order: any) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.confirmationNumber.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date(order.placedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-900">{item.menuItem?.name} × {item.quantity}</span>
                      <span className="text-gray-500">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Total: ₹{order.totalAmount}</span>
                  <span className={`text-xs font-medium ${order.orderType === 'DINE_IN' ? 'text-blue-600' : 'text-gray-600'}`}>
                    {order.orderType === 'DINE_IN' ? '🪑 Dine-in' : '📦 Takeaway'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  )

}
