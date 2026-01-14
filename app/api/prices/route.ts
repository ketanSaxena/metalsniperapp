import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/prices
 * SWITCHED TO ALPHA VANTAGE / OPEN SOURCE FETCH 
 * Since Twelve Data now requires a paid 'Grow' plan for XAU/USD.
 */

// If you have an Alpha Vantage key, put it here. 
// Otherwise, we use a public fallback.
const AV_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo'; 

export async function GET() {
  try {
    // Helper to fetch from a free-tier compatible source
    // We are using Alpha Vantage for RSI and a public price feed for spot prices
    const fetchMetalData = async (metal: 'gold' | 'silver') => {
      const symbol = metal === 'gold' ? 'XAU' : 'XAG';
      
      // 1. Fetch Price & 20-Day High
      // Using a reliable public finance endpoint
      const priceUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}USD=X?interval=1d&range=30d`;
      const priceRes = await fetch(priceUrl);
      const priceData = await priceRes.json();
      
      const quotes = priceData.chart.result[0].indicators.quote[0];
      const currentPrice = priceData.chart.result[0].meta.regularMarketPrice;
      
      // Calculate 20-day high from the last 20 closing prices
      const last20Days = quotes.high.slice(-20);
      const high20 = Math.max(...last20Days);

      // 2. Fetch RSI 
      // We calculate RSI manually from the price data to avoid Twelve Data's paywall
      const closes = quotes.close.slice(-15); // Need 14 periods
      const rsi = calculateRSI(closes);

      return { price: currentPrice, rsi, high20 };
    };

    const [gold, silver] = await Promise.all([
      fetchMetalData('gold'),
      fetchMetalData('silver')
    ]);

    return NextResponse.json({ gold, silver });

  } catch (error: any) {
    console.error('Price Fetch Error:', error);
    return NextResponse.json({ error: 'Market data currently unavailable on free tier.' }, { status: 500 });
  }
}

// Simple RSI Calculation Utility
function calculateRSI(prices: number[]) {
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  const avgGain = gains / 14;
  const avgLoss = losses / 14;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}