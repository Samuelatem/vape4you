'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bitcoin, CreditCard, Smartphone, Banknote, Copy, CheckCircle, Clock, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const paymentIcons = {
  bitcoin: Bitcoin
}

const paymentColors = {
  bitcoin: 'bg-orange-500'
}

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof paymentIcons>('bitcoin')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
    const orderParam = searchParams?.get('order')
    const methodParam = searchParams?.get('method') || 'bitcoin'
    
    setOrderId(orderParam)
    setPaymentMethod(methodParam as keyof typeof paymentIcons)
  }, [searchParams])

  useEffect(() => {
    if (!mounted || !orderId) return

    if (!orderId || !paymentMethod) {
      setError('Missing order or payment method information')
      setTimeout(() => router.push('/cart'), 3000)
      return
    }

    const fetchPaymentData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/payments/bitcoin?orderId=${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Payment fetch failed: ${response.status}`)
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Payment not found')
        }

        setPaymentData(data.payment)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load payment details'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [mounted, orderId, paymentMethod, router])

  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        setCopied(key)
        setTimeout(() => setCopied(null), 2000)
      } else {
        // Fallback for mobile browsers that don't support clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopied(key)
        setTimeout(() => setCopied(null), 2000)
      }
    } catch (error) {
      console.error('Failed to copy:', error)
      // Show a fallback message for mobile
      alert(`Copy this: ${text}`)
    }
  }

  // Show loading until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => router.push('/cart')} variant="outline" className="w-full">
              Back to Cart
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Payment not found</p>
          <Button onClick={() => router.push('/cart')} className="mt-4">
            Back to Cart
          </Button>
        </div>
      </div>
    )
  }

  const PaymentIcon = paymentIcons[paymentMethod] || Bitcoin
  const colorClass = paymentColors[paymentMethod] || 'bg-orange-500'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className={`${colorClass} text-white p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PaymentIcon className="w-8 h-8 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold capitalize">
                    {paymentMethod} Payment
                  </h1>
                  <p className="text-white/90">Order #{orderId}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-200">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  <span className="text-sm">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Instructions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Instructions
                </h2>
                
                <div className="space-y-3">
                  {paymentData.instructions.map((instruction: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{instruction}</p>
                    </div>
                  ))}
                </div>

                {/* Payment-specific details */}
                <div className="mt-6 space-y-4">
                  {paymentMethod === 'bitcoin' && (
                    <>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Bitcoin Address:</span>
                          <Button
                            onClick={() => copyToClipboard(paymentData.address, 'address')}
                            variant="ghost"
                            size="sm"
                          >
                            {copied === 'address' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <code className="text-sm bg-white p-2 rounded border block break-all">
                          {paymentData.address}
                        </code>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Amount (BTC):</span>
                          <Button
                            onClick={() => copyToClipboard(paymentData.amount, 'amount')}
                            variant="ghost"
                            size="sm"
                          >
                            {copied === 'amount' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <code className="text-lg font-bold text-orange-600">
                          {paymentData.amount} BTC
                        </code>
                        <p className="text-sm text-gray-600 mt-1">
                          ≈ {formatPrice(paymentData.amountUSD)}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Only Bitcoin payments are supported */}
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Status
                </h2>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-semibold text-yellow-800">Waiting for Payment</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your order will be processed once payment is confirmed.
                  </p>
                </div>

                {/* QR Code for Bitcoin payment */}
                <div className="text-center mb-6">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 inline-block max-w-full">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto">
                      <img
                        src={`https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=${encodeURIComponent(paymentData.qrCode)}&choe=UTF-8`}
                        alt="Bitcoin Payment QR Code"
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-2 text-xs sm:text-sm text-gray-600 break-all">
                      <p className="font-medium">{paymentData.amount} BTC</p>
                      <p className="text-xs opacity-75">Scan with your Bitcoin wallet</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Payment will be automatically detected</p>
                  <p>• You will receive an email confirmation</p>
                  <p>• Processing may take a few minutes</p>
                  <p>• Contact support if you need assistance</p>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    onClick={() => router.push(`/orders/${orderId}`)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    View Order Details
                  </Button>
                  <Button
                    onClick={() => router.push('/products')}
                    variant="outline"
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}