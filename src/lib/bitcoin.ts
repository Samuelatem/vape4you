export interface BitcoinPayment {
  orderId: string;
  address: string;
  amount: string;
  amountUSD: number;
  status: 'pending' | 'confirmed' | 'failed';
  expiresAt: Date;
  qrCode: string;
  instructions: string[];
}

export async function createBitcoinPayment(
  orderId: string,
  amountUSD: number
): Promise<BitcoinPayment> {
  try {
    const walletAddress = process.env.BITCOIN_WALLET_ADDRESS;
    if (!walletAddress) {
      throw new Error('BITCOIN_WALLET_ADDRESS is not configured in environment variables');
    }

    // Get current BTC/USD rate
    const btcResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    );
    const btcData = await btcResponse.json();
    const btcRate = btcData.bitcoin.usd;
    const btcAmount = (amountUSD / btcRate).toFixed(8);

    // Generate payment data
    const paymentData: BitcoinPayment = {
      orderId,
      address: walletAddress,
      amount: btcAmount,
      amountUSD,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      qrCode: `bitcoin:${walletAddress}?amount=${btcAmount}`,
      instructions: [
        `Send exactly ${btcAmount} BTC to the address below`,
        'Always verify the address before sending',
        'Send the exact amount shown to complete your order',
        'Contact support if you need assistance'
      ]
    };

    return paymentData;
  } catch (error) {
    console.error('Error creating Bitcoin payment:', error);
    throw new Error('Failed to create Bitcoin payment');
  }
}