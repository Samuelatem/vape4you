import { NextRequest, NextResponse } from 'next/server';
import { createBitcoinPayment } from '@/lib/bitcoin';
import { localDB } from '@/lib/local-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      );
    }

    const order = await localDB.getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order.payment) {
      // Create new payment if not exists
      const paymentData = await createBitcoinPayment(orderId, order.total);
      await localDB.updateOrder(orderId, {
        ...order,
        payment: paymentData
      });
      return NextResponse.json({
        success: true,
        payment: paymentData
      });
    }

    // Return existing payment data
    return NextResponse.json({
      success: true,
      payment: order.payment
    });
  } catch (error) {
    console.error('Bitcoin payment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Order ID and amount required' },
        { status: 400 }
      );
    }

    const paymentAmount = parseFloat(amount.toString());
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment amount' },
        { status: 400 }
      );
    }
    
    console.log('Creating Bitcoin payment for order:', orderId, 'amount:', paymentAmount);
    
    // Create real Bitcoin payment with unique address
    const paymentData = await createBitcoinPayment(orderId, paymentAmount);
    
    if (!paymentData || !paymentData.address) {
      console.error('Failed to create Bitcoin payment address');
      return NextResponse.json(
        { success: false, error: 'Failed to create Bitcoin payment. Please check server configuration.' },
        { status: 500 }
      );
    }
    
    console.log('Payment data created:', paymentData);
    
    // Update the order with payment information
    const order = await localDB.getOrderById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    await localDB.updateOrder(orderId, {
      ...order,
      payment: paymentData
    });
    
    console.log('Order updated with payment details');
    
    return NextResponse.json({
      success: true,
      payment: paymentData,
      message: 'Please send the exact Bitcoin amount to the provided address.'
    })
  } catch (error) {
    console.error('Bitcoin payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: `Failed to process Bitcoin payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}