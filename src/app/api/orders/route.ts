import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createOrder, getOrderById } from '@/lib/orders'
import { Order } from '@/models/Order'
import { connectDB } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, total, paymentMethod, shippingAddress } = await request.json()

    console.log('Received order data:', { items, total, paymentMethod, shippingAddress })

    // Validate required fields
    const missingFields = [];
    if (!items) missingFields.push('items');
    if (!total) missingFields.push('total');
    if (!paymentMethod) missingFields.push('paymentMethod');
    if (!shippingAddress) missingFields.push('shippingAddress');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate shipping address
    const requiredAddressFields = ['address', 'city', 'postalCode', 'country'];
    const missingAddressFields = requiredAddressFields.filter(field => !shippingAddress[field]);

    if (missingAddressFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required address fields: ${missingAddressFields.join(', ')}` },
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

    // Format shipping address to match schema
    const formattedAddress = {
      street: shippingAddress.address,
      city: shippingAddress.city,
      state: shippingAddress.state || 'N/A',
      zipCode: shippingAddress.postalCode,
      country: shippingAddress.country
    };

    const orderData = {
      userId: session.user.id!,
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      total,
      paymentMethod,
      shippingAddress: formattedAddress,
      status: 'pending',
      paymentStatus: 'pending'
    };

    console.log('=== Debug Info ===');
    console.log('Raw shipping address:', shippingAddress);
    console.log('Formatted address:', formattedAddress);
    console.log('Full order data:', orderData);
    console.log('=== End Debug Info ===');

    // Validate shipping address fields match the model
    const requiredShippingFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingShippingFields = requiredShippingFields.filter(field => !formattedAddress[field]);

    if (missingShippingFields.length > 0) {
      console.error('Missing shipping fields:', missingShippingFields);
      return NextResponse.json(
        { error: `Missing required shipping fields: ${missingShippingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('Creating order with formatted data:', orderData);

    // Ensure database connection
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const order = await createOrder(orderData)

    console.log('Order created:', order)

    return NextResponse.json({
      success: true,
      order
    })
  } catch (error) {
    console.error('Error creating order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: errorMessage },
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
    
    await connectDB()

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (orderId) {
      // Fetch specific order
      const order = await getOrderById(orderId)
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
      const orders = await Order.find({ userId: session.user.id })
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