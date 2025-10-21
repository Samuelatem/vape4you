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
    const db = await connectDB()
    console.log('MongoDB connection state:', db.connection.readyState)
    
    if (db.connection.readyState !== 1) {
      throw new Error('Database connection is not ready. Current state: ' + db.connection.readyState)
    }
    
    // Format and validate the data
    const formattedData = {
      ...orderData,
      userId: new mongoose.Types.ObjectId(orderData.userId),
      items: orderData.items.map((item: any) => ({
        ...item,
        productId: new mongoose.Types.ObjectId(item.productId),
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress: {
        street: orderData.shippingAddress.street || orderData.shippingAddress.address,
        city: orderData.shippingAddress.city,
        state: orderData.shippingAddress.state || 'N/A',
        zipCode: orderData.shippingAddress.postalCode,
        country: orderData.shippingAddress.country
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log('Creating order with formatted data:', JSON.stringify(formattedData, null, 2))

    const order = new Order(formattedData)

    // Validate the order data
    const validationError = order.validateSync()
    if (validationError) {
      console.error('Validation error:', validationError)
      throw new Error(`Order validation failed: ${Object.values(validationError.errors).map((e: any) => e.message).join(', ')}`)
    }

    console.log('Saving order...')
    const savedOrder = await order.save()
    console.log('Order saved successfully:', savedOrder)
    return savedOrder
  } catch (error: any) {
    console.error('Error creating order:', {
      error: error,
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    })

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      throw new Error(`Order validation failed: ${Object.values(error.errors).map(e => (e as any).message).join(', ')}`)
    }
    if (error.name === 'MongoServerError' && error.code === 11000) {
      throw new Error('Order already exists')
    }
    if (error.name === 'MongooseServerSelectionError') {
      throw new Error('Failed to connect to database. Please try again later.')
    }
    if (error.name === 'MongooseError') {
      throw new Error(`Database error: ${error.message}`)
    }
    
    throw new Error(`Failed to create order: ${error.message || 'Unknown database error'}`)
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