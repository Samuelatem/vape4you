import { connectDB } from './db'
import { localDB } from './local-db'
import { Order } from '@/models/Order'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function createOrder(orderData: any) {
  if (isDevelopment) {
    return localDB.createOrder(orderData)
  }

  try {
    console.log('Connecting to MongoDB...')
    await connectDB()
    
    // Convert string IDs to ObjectIds if needed
    const userId = orderData.userId.toString()
    const items = orderData.items.map((item: any) => ({
      ...item,
      productId: item.productId.toString()
    }))

    console.log('Creating order with data:', {
      ...orderData,
      userId,
      items
    })

    const order = new Order({
      ...orderData,
      userId,
      items,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log('Saving order...')
    await order.save()
    console.log('Order saved successfully:', order)

    return order
  } catch (error) {
    console.error('Error creating order:', error)
    if (error instanceof Error) {
      if (error.message.includes('validation failed')) {
        throw new Error('Order validation failed: Please check all required fields')
      }
      if (error.message.includes('duplicate key')) {
        throw new Error('Order already exists')
      }
    }
    throw new Error('Failed to create order: Database error')
  }
}

export async function getOrderById(orderId: string) {
  if (isDevelopment) {
    return localDB.getOrderById(orderId)
  }

  try {
    await connectDB()
    const order = await Order.findById(orderId)
    return order
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

export async function updateOrder(orderId: string, updates: any) {
  if (isDevelopment) {
    return localDB.updateOrder(orderId, updates)
  }

  try {
    await connectDB()
    const order = await Order.findByIdAndUpdate(
      orderId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
    return order
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}