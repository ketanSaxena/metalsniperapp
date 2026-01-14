import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/prices
 * Updated to use Yahoo Finance fallback (Free Tier) with robust error handling.
 * This ensures the dashboard matches the logic used in the automated Cron alerts.
 */

export async function GET() {
  try {
    // Helper for manual RSI calculation
    const calculateRSI = (prices: (number | null)[]) => {
      const validPrices = prices.filter((p): p is number => p !== null);
      if (validPrices.length < 15) return 50; // Neutral fallback if data is thin

      let gains = 0;
      let losses = 0;
      for (let i = 1; i < validPrices.length; i++) {
        const diff = validPrices[i] - validPrices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }
      const avgGain = gains / 14;
      const avgLoss = losses / 14;
      return avgLoss === 0 ? 100 : 100 - (100 / (1 + (avgGain / avgLoss)));
    };

    const fetchMetalData = async (symbol: string) => {
      // Try both common Yahoo formats for metals to ensure a hit
      const variants = [`${symbol}USD=X`, `${symbol}=F`].map(s => 
        `https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=30d`
      );

      let lastError = null;
      for (const url of variants) {
        try {
          const res = await fetch(url, { next: { revalidate: 0 } });
          const data = await res.json();
          
          if (!data?.chart?.result?.[0]) continue;

          const result = data.chart.result[0];
          const quotes = result.indicators.quote[0];
          const currentPrice = result.meta.regularMarketPrice;
          
          // Filter out nulls often found in Yahoo Finance data arrays (holidays/gaps)
          const highPrices = (quotes.high as (number | null)[]).filter((h): h is number => h !== null);
          const closePrices = (quotes.close as (number | null)[]);

          if (highPrices.length === 0) continue;

          const last20Highs = highPrices.slice(-20);
          const high20 = Math.max(...last20Highs);
          const rsi = calculateRSI(closePrices.slice(-15));

          return { price: currentPrice, rsi, high20 };
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error(`No data returned for ${symbol}`);
    };

    // Execute fetches for both Gold and Silver
    const [gold, silver] = await Promise.all([
      fetchMetalData('XAU'),
      fetchMetalData('XAG')
    ]);

    // Return the data to the frontend
    return NextResponse.json({
      gold,
      silver
    });

  } catch (error: any) {
    console.error('Price Fetch Error:', error);
    return NextResponse.json(
      { error: 'Market data currently unavailable. Check logs.' }, 
      { status: 500 }
    );
  }
}