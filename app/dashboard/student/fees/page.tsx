'use client'

import { useEffect, useState } from 'react'
import PaymentButton from '@/components/shared/PaymentButton'

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState('')
  const [walletTx, setWalletTx] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/students/fees').then(r => r.json()),
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/students/wallet').then(r => r.json()),
    ]).then(([feeData, userData, walletData]) => {
      setFees(feeData.data || [])
      setUser(userData.user)
      setWalletTx(walletData.data || [])
      setLoading(false)
    })
  }, [])

  const handleFeePaymentSuccess = (feeId: string) => {
    setFees(prev => prev.map(f => f.id === feeId ? { ...f, status: 'PAID', paidAt: new Date() } : f))
  }

  const handleWalletTopupSuccess = (paymentId: string) => {
    setUser((prev: any) => ({ ...prev, walletBalance: prev.walletBalance + parseFloat(topupAmount) }))
    setTopupAmount('')
    alert('Wallet topped up successfully!')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>

  const totalDue = fees.filter(f => f.status === 'DUE').reduce((s: number, f: any) => s + f.amount, 0)

  return (
<div className="max-w-5xl mx-auto">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
      <p className="text-sm text-gray-500">Manage your fee payments and wallet</p>
    </div>
  </div>

  {/* Stats Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
      <p className="text-2xl font-bold text-gray-900">₹{user?.walletBalance?.toFixed(2)}</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Total Due</p>
      <p className={`text-2xl font-bold ${totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{totalDue.toFixed(2)}</p>
    </div>
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">Paid This Year</p>
      <p className="text-2xl font-bold text-gray-900">
        ₹{fees.filter(f => f.status === 'PAID').reduce((s: number, f: any) => s + f.amount, 0).toFixed(2)}
      </p>
    </div>
  </div>

  {/* Main Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Fee list */}
    <div className="lg:col-span-2">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Fee Records</h2>
      <div className="space-y-3">
        {fees.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No fee records found
          </div>
        )}
        {fees.map((fee: any) => (
          <div key={fee.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{fee.description}</p>
                {fee.dueDate && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {fee.paidAt && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Paid on {new Date(fee.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">₹{fee.amount.toLocaleString('en-IN')}</p>
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 font-medium ${
                  fee.status === 'PAID' 
                    ? 'bg-green-100 text-green-700' 
                    : fee.status === 'DUE' 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {fee.status}
                </span>
              </div>
            </div>
            {fee.status === 'DUE' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <PaymentButton
                  amount={fee.amount}
                  type="FEE"
                  referenceId={fee.id}
                  userName={user?.name}
                  userEmail={user?.email}
                  label="Pay Fee"
                  onSuccess={() => handleFeePaymentSuccess(fee.id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Wallet top-up */}
    <div className="lg:col-span-1">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Top-up Wallet</h2>
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm text-gray-500 mb-4">Add money to your campus wallet for canteen orders</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[100, 200, 500].map(amt => (
            <button 
              key={amt} 
              onClick={() => setTopupAmount(String(amt))}
              className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                topupAmount === String(amt) 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
              }`}>
              ₹{amt}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={topupAmount}
          onChange={e => setTopupAmount(e.target.value)}
          placeholder="Custom amount"
          min="10"
          max="5000"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
        />
        {topupAmount && parseFloat(topupAmount) > 0 && (
          <PaymentButton
            amount={parseFloat(topupAmount)}
            type="WALLET_TOPUP"
            userName={user?.name}
            userEmail={user?.email}
            label="Top-up Wallet"
            className="w-full py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all"
            onSuccess={handleWalletTopupSuccess}
          />
        )}
      </div>

      {/* Transaction history */}
      {walletTx.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Transactions</h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden">
            {walletTx.slice(0, 8).map((tx: any) => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
</div>
  )

}
