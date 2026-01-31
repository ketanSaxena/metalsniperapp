import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/prices
 * Updated to fetch Gold (XAU), Silver (XAG), and Nifty 50 (^NSEI).
 * Includes RSI calculation and 20-day high benchmarks for all assets.
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

    const fetchMarketData = async (symbol: string) => {
      // Define tickers for different asset classes
      let tickers: string[] = [];
      if (symbol === 'XAU') {
        tickers = ['XAUUSD=X', 'GC=F'];
      } else if (symbol === 'XAG') {
        tickers = ['XAGUSD=X', 'SI=F', 'XAG=F'];
      } else if (symbol === 'NIFTY50') {
        // %5ENSEI is the URL encoded version of ^NSEI
        tickers = ['^NSEI'];
      }
      
      const range = '1mo'; // 1 month is sufficient for 20-day high and RSI
      
      let lastError = null;
      for (const t of tickers) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(t)}?interval=1d&range=${range}`;
          
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

          // 20-Day High Calculation
          const last20Highs = highPrices.slice(-20);
          const high20 = Math.max(...last20Highs);
          
          // RSI Calculation (requires ~14-15 previous close points)
          const rsi = calculateRSI(closePrices.slice(-15));

          return { price: currentPrice, rsi, high20 };
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error(`No data returned for ${symbol} after trying all variants.`);
    };

    // Execute fetches for Gold, Silver, and Nifty 50
    const [gold, silver, nifty50] = await Promise.all([
      fetchMarketData('XAU'),
      fetchMarketData('XAG'),
      fetchMarketData('NIFTY50')
    ]);

    console.log(gold, silver, nifty50);

    return NextResponse.json({ gold, silver, nifty50 });

  } catch (error: any) {
    console.error('Price Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'Market data currently unavailable.' }, 
      { status: 500 }
    );
  }
}
