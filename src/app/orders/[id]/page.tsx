'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Package, ArrowLeft, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { formatDistance } from 'date-fns'

interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  price: number
}

interface Order {
  _id: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  createdAt: string
  updatedAt: string
  trackingNumber?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pending',
    description: 'Your order is being processed'
  },
  processing: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Processing',
    description: 'Your order is being prepared for shipment'
  },
  shipped: {
    icon: Truck,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Shipped',
    description: 'Your order is on its way'
  },
  delivered: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Delivered',
    description: 'Your order has been delivered'
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelled',
    description: 'Your order has been cancelled'
  }
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = useCallback(async () => {
    if (!params?.id) {
      router.push('/orders')
      return
    }
    
    try {
      const response = await fetch(`/api/orders?id=${params.id}`)
      const data = await response.json()

      if (data.success && data.order) {
        // Transform the order data to match our interface
        const transformedOrder: Order = {
          _id: data.order.id,
          items: data.order.items,
          total: data.order.total,
          status: data.order.status || 'pending',
          paymentMethod: data.order.paymentMethod,
          shippingAddress: data.order.customerInfo || data.order.shippingAddress,
          createdAt: data.order.createdAt,
          updatedAt: data.order.updatedAt,
          trackingNumber: data.order.trackingNumber
        }
        setOrder(transformedOrder)
      } else {
        console.error('Order not found')
        router.push('/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      router.push('/orders')
    } finally {
      setLoading(false)
    }
  }, [params?.id, router])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchOrder()
  }, [session, status, router, params?.id, fetchOrder])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!session || !order) {
    return null
  }

  const StatusIcon = statusConfig[order.status].icon

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/orders')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Order #{order._id}</h1>
          <p className="text-gray-600 mt-2">
            Placed {formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex-shrink-0 w-20 h-20 relative">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-gray-600">{formatPrice(item.price)} each</p>
                    </div>
                    <div className="text-lg font-medium text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Status & Details */}
          <div className="space-y-6">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className={`border rounded-lg p-4 ${statusConfig[order.status].color}`}>
                <div className="flex items-center mb-2">
                  <StatusIcon className="w-6 h-6 mr-2" />
                  <span className="font-semibold">{statusConfig[order.status].label}</span>
                </div>
                <p className="text-sm">{statusConfig[order.status].description}</p>
              </div>
              
              {order.trackingNumber && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">Tracking Number</p>
                  <p className="text-purple-600 font-mono">{order.trackingNumber}</p>
                </div>
              )}
            </motion.div>

            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
              <div className="text-gray-600">
                <p className="font-medium text-gray-900">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </motion.div>

            {/* Payment Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Information</h2>
              <p className="text-gray-600">
                <span className="font-medium">Payment Method:</span> {order.paymentMethod}
              </p>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Order Total:</span> {formatPrice(order.total)}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}