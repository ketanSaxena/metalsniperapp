import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/prices
 * This route fetches real-time data for Gold and Silver from Twelve Data.
 * It calculates the 20-day high and retrieves the current RSI (14).
 */

const TD_API_KEY = process.env.TWELVE_DATA_API_KEY;

export async function GET() {
  if (!TD_API_KEY) {
    return NextResponse.json({ error: 'API Key missing' }, { status: 500 });
  }

  try {
    // 1. Define the assets we need
    const symbols = ['XAU/USD', 'XAG/USD'];
    
    // 2. Fetch Time Series (to get current price and 20-day high)
    // interval=1day, outputsize=20 gives us the last 20 trading days
    const fetchMarketData = async (symbol: string) => {
      const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=20&apikey=${TD_API_KEY}`;
      const rsiUrl = `https://api.twelvedata.com/rsi?symbol=${symbol}&interval=1day&time_period=14&apikey=${TD_API_KEY}`;

      const [priceRes, rsiRes] = await Promise.all([
        fetch(url),
        fetch(rsiUrl)
      ]);

      const priceData = await priceRes.json();
      const rsiData = await rsiRes.json();

      if (priceData.status === 'error' || rsiData.status === 'error') {
        throw new Error(priceData.message || rsiData.message || 'Twelve Data API Error');
      }

      const values = priceData.values;
      const currentPrice = parseFloat(values[0].close);
      const rsiValue = parseFloat(rsiData.values[0].rsi);
      
      // Calculate 20-day high
      const high20Day = Math.max(...values.map((v: any) => parseFloat(v.high)));

      return {
        price: currentPrice,
        rsi: rsiValue,
        high20: high20Day
      };
    };

    // 3. Execute fetches for both Gold and Silver
    const [gold, silver] = await Promise.all([
      fetchMarketData('XAU/USD'),
      fetchMarketData('XAG/USD')
    ]);

    // 4. Return formatted JSON to the Canvas frontend
    return NextResponse.json({
      gold,
      silver
    });

  } catch (error: any) {
    console.error('Price Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}