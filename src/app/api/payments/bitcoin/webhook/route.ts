import { NextRequest, NextResponse } from 'next/server';
import { localDB } from '@/lib/local-db';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Verify webhook signature if provided by BlockCypher
    // Extract relevant data from the webhook
    const {
      address,
      confirmations,
      tx_hash,
      value
    } = payload;

    // Find the order associated with this address
    const orders = await localDB.getOrders();
    const order = orders.find(o => o.bitcoinPayment?.address === address);

    if (!order) {
      console.error('No order found for address:', address);
      return NextResponse.json({ success: false, error: 'Order not found' });
    }

    // Update order status based on confirmations
    if (confirmations >= 2) {
      const updatedPayment = {
        ...order.bitcoinPayment!,
        status: 'confirmed' as const,
        orderId: order.id,
        address: address,
        amount: order.bitcoinPayment!.amount,
        amountUSD: order.bitcoinPayment!.amountUSD,
        expiresAt: order.bitcoinPayment!.expiresAt,
        qrCode: order.bitcoinPayment!.qrCode,
        instructions: order.bitcoinPayment!.instructions,
      };

      await localDB.updateOrder(order.id, {
        ...order,
        status: 'processing',
        paymentStatus: 'completed',
        bitcoinPayment: updatedPayment
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Bitcoin webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}