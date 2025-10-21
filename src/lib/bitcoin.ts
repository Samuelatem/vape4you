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
  console.log('Creating Bitcoin payment for order:', orderId, 'amount:', amountUSD);
  try {
    const walletAddress = process.env.BITCOIN_WALLET_ADDRESS;
    if (!walletAddress) {
      throw new Error('BITCOIN_WALLET_ADDRESS is not configured in environment variables');
    }

    // Get current BTC/USD rate
    let btcAmount: string;
    try {
      const btcResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      if (!btcResponse.ok) {
        throw new Error('Failed to fetch Bitcoin price');
      }
      const btcData = await btcResponse.json();
      if (!btcData?.bitcoin?.usd) {
        throw new Error('Invalid Bitcoin price data');
      }
      const btcRate = btcData.bitcoin.usd;
      btcAmount = (amountUSD / btcRate).toFixed(8);
      console.log('Bitcoin conversion:', { amountUSD, btcRate, btcAmount });
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      // Fallback to a fixed rate for testing
      btcAmount = (amountUSD / 30000).toFixed(8);
    }

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