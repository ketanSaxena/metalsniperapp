import { NextResponse } from 'next/server';

/**
 * API ROUTE: /api/prices
 * Fetches Gold (XAU), Silver (XAG), and Nifty 50 (^NSEI)
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

    // Helper for SMA calculation
    const calculateSMA = (prices: (number | null)[], period: number) => {
      const validPrices = prices.filter((p): p is number => p !== null);
      if (validPrices.length < period) return validPrices[validPrices.length - 1] || 0;
      const slice = validPrices.slice(-period);
      const sum = slice.reduce((a, b) => a + b, 0);
      return sum / period;
    };

    const fetchMarketData = async (symbol: string, type: 'METAL' | 'INDEX') => {
      // Determine tickers and range based on asset type
      // Indices like Nifty need more history for 50-day SMA
      const ticker = type === 'INDEX' ? '^NSEI' : (symbol === 'XAU' ? 'XAUUSD=X' : 'XAGUSD=X');
      const range = type === 'INDEX' ? '60d' : '30d'; 
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`;

      try {
        const res = await fetch(url, { 
          next: { revalidate: 0 },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (!data?.chart?.result?.[0]) throw new Error('No data structure returned');

        const result = data.chart.result[0];
        const quotes = result.indicators.quote[0];
        const currentPrice = result.meta.regularMarketPrice;
        const closePrices = (quotes.close as (number | null)[]);

        if (!currentPrice || closePrices.length === 0) throw new Error('Missing price data');

        const rsi = calculateRSI(closePrices.slice(-15));

        if (type === 'METAL') {
          const highPrices = (quotes.high as (number | null)[]).filter((h): h is number => h !== null);
          const last20Highs = highPrices.slice(-20);
          const high20 = Math.max(...last20Highs);
          return { price: currentPrice, rsi, high20 };
        } else {
          // Nifty logic: 50-day SMA
          const sma50 = calculateSMA(closePrices, 50);
          return { price: currentPrice, rsi, sma50 };
        }
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
        throw e;
      }
    };

    // Execute fetches for Gold, Silver, and Nifty
    const [gold, silver, nifty] = await Promise.all([
      fetchMarketData('XAU', 'METAL'),
      fetchMarketData('XAG', 'METAL'),
      fetchMarketData('NIFTY', 'INDEX')
    ]);

    return NextResponse.json({ gold, silver, nifty });

  } catch (error: any) {
    console.error('Price Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'Market data currently unavailable.' }, 
      { status: 500 }
    );
  }
}
