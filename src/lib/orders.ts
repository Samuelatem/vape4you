import { connectDB } from './db'
import { localDB } from './local-db'
import { Order } from '@/models/Order'

const isDevelopment = process.env.NODE_ENV === 'development'

export async function createOrder(orderData: any) {
  if (isDevelopment) {
    return localDB.createOrder(orderData)
  }

  try {
    await connectDB()
    const order = new Order({
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    await order.save()
    return order
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
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