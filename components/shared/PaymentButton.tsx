// src/components/shared/PaymentButton.tsx
'use client'

import { useState } from 'react'

interface PaymentButtonProps {
  amount: number
  type: 'FEE' | 'CANTEEN' | 'WALLET_TOPUP'
  referenceId?: string
  userName: string
  userEmail: string
  label?: string
  onSuccess?: (paymentId: string) => void
  onFailure?: (error: any) => void
  className?: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentButton({
  amount,
  type,
  referenceId,
  userName,
  userEmail,
  label = 'Pay Now',
  onSuccess,
  onFailure,
  className,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false)

  const loadRazorpayScript = () =>
    new Promise<boolean>(resolve => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

  const handlePayment = async () => {
    setLoading(true)
    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Razorpay SDK failed to load')

      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, referenceId, amount }),
      })
      const { data } = await res.json()

      const options = {
        key: data.keyId,
        amount: data.amount * 100,
        currency: 'INR',
        name: 'Univa College',
        description: type === 'FEE' ? 'Semester Fee Payment' : type === 'CANTEEN' ? 'Canteen Order' : 'Wallet Top-up',
        order_id: data.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              type,
              referenceId,
              amount,
            }),
          })

          if (verifyRes.ok) {
            onSuccess?.(response.razorpay_payment_id)
          } else {
            onFailure?.('Verification failed')
          }
        },
        prefill: { name: userName, email: userEmail },
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        onFailure?.(response.error)
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Payment error:', err)
      onFailure?.(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={
        className ||
        'inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-all'
      }
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {label} — ₹{amount.toLocaleString('en-IN')}
        </>
      )}
    </button>
  )
}
