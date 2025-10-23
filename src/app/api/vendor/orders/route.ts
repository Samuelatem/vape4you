import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'
import { authOptions } from '@/lib/auth'
import { localDB } from '@/lib/local-db'
import { emitOrderUpdated } from '@/lib/socket'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to check role
    const user = await localDB.findUserByEmail(session.user.email)
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized - Vendor access required' }, { status: 401 })
    }
    
    // Get all orders from the database, seed demo orders if none exist
    let orders = await localDB.getOrders()
    if (orders.length === 0) {
      orders = await localDB.seedDemoOrders()
    }
    
    // Transform orders for display
    const transformedOrders = orders.map(order => ({
      id: order.id,
      customerName: order.shippingAddress ? 
        `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 
        'Unknown Customer',
      customerEmail: order.shippingAddress?.email || order.userId || 'N/A',
      total: order.total || 0,
      status: order.status || 'pending',
      paymentMethod: order.paymentMethod || 'Unknown',
      createdAt: order.createdAt || new Date().toISOString(),
      itemCount: order.items?.length || 0,
      items: order.items || []
    }))

    // Sort by creation date (newest first)
    transformedOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching vendor orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to check role
    const user = await localDB.findUserByEmail(session.user.email)
    if (!user || user.role !== 'vendor') {
      return NextResponse.json({ error: 'Unauthorized - Vendor access required' }, { status: 401 })
    }

    const { orderId, status, paymentStatus } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId and status' },
        { status: 400 }
      )
    }

    const updatedOrder = await localDB.updateOrderStatus(orderId, status, paymentStatus)
    
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Emit real-time update to vendor and customer
    try {
      emitOrderUpdated(updatedOrder)
    } catch (e) {
      console.error('Failed to emit order update', e)
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}