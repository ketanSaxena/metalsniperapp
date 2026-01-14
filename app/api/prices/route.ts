import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/prices
 * Updated with enhanced headers and symbol list to resolve "No data returned" errors.
 * Now includes User-Agent headers to mimic a browser, which Yahoo Finance often requires.
 */

export async function GET() {
  try {
    // Helper for manual RSI calculation
    const calculateRSI = (prices: (number | null)[]) => {
      const validPrices = prices.filter((p): p is number => p !== null);
      if (validPrices.length < 15) return 50; 

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
      // Expanded variants to include Futures (SI=F, GC=F) and Forex (XAGUSD=X)
      const tickers = symbol === 'XAU' ? ['XAUUSD=X', 'GC=F'] : ['XAGUSD=X', 'SI=F', 'XAG=F'];
      
      const urls = tickers.map(t => 
        `https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=30d`
      );

      let lastError = null;
      for (const url of urls) {
        try {
          // IMPORTANT: Headers added to prevent Yahoo from blocking the request
          const res = await fetch(url, { 
            next: { revalidate: 0 },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (!res.ok) continue;

          const data = await res.json();
          
          if (!data?.chart?.result?.[0]) continue;

          const result = data.chart.result[0];
          const quotes = result.indicators.quote[0];
          const currentPrice = result.meta.regularMarketPrice;
          
          const highPrices = (quotes.high as (number | null)[]).filter((h): h is number => h !== null);
          const closePrices = (quotes.close as (number | null)[]);

          if (highPrices.length === 0 || !currentPrice) continue;

          const last20Highs = highPrices.slice(-20);
          const high20 = Math.max(...last20Highs);
          const rsi = calculateRSI(closePrices.slice(-15));

          return { price: currentPrice, rsi, high20 };
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error(`No data returned for ${symbol} after trying all variants.`);
    };

    // Execute fetches for both Gold and Silver
    const [gold, silver] = await Promise.all([
      fetchMetalData('XAU'),
      fetchMetalData('XAG')
    ]);

    return NextResponse.json({ gold, silver });

  } catch (error: any) {
    console.error('Price Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'Market data currently unavailable.' }, 
      { status: 500 }
    );
  }
}