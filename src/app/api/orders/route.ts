import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { localDB } from '@/lib/local-db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, total, paymentMethod, shippingAddress } = await request.json()

    if (!items || !total || !paymentMethod || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating order with data:', {
      userId: session.user.id,
      items,
      total,
      paymentMethod,
      shippingAddress
    })

    const order = await localDB.createOrder({
      userId: session.user.id!,
      items,
      total,
      paymentMethod,
      shippingAddress,
      status: 'pending'
    })

    console.log('Order created:', order)

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (orderId) {
      // Fetch specific order
      const order = await localDB.getOrderById(orderId)
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        order
      })
    } else {
      // Fetch all user orders
      const orders = await localDB.getUserOrders(session.user.id!)
      return NextResponse.json({
        success: true,
        orders
      })
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}