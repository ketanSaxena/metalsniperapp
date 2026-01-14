import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * THIS IS THE SERVER-SIDE CRON JOB SCRIPT
 * Updated to handle Yahoo Finance API null results and improved error handling.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // 1. Security Check: Only allow Vercel Cron or authorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

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
      // Try both common Yahoo formats for metals
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
          
          // Filter out nulls often found in Yahoo Finance data arrays
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

    // Fetch for Silver (XAG)
    const silver = await fetchMetalData('XAG');
    const dip = ((silver.high20 - silver.price) / silver.high20) * 100;

    // Decision Logic v2.0
    let status = "🔴 RED - PAUSE";
    let color = "#f43f5e";
    let action = "DO NOT BUY. Move 4.5k to Mashreq Savings.";

    if (silver.rsi <= 40 && dip >= 6) {
      status = "🟢 GREEN - AGGRESSIVE BUY";
      color = "#10b981";
      action = "SNIPER ALERT: Deploy 4.5k + MAX 2 saved tranches.";
    } else if (silver.rsi < 65 && dip >= 2) {
      status = "🟡 YELLOW - WEEKLY BUY";
      color = "#f59e0b";
      action = "BUY 4.5k ONLY. Keep existing savings in bank.";
    }

    // 4. Send Email Notification
    await resend.emails.send({
      from: 'Metal Sniper <alerts@yourdomain.com>',
      to: [process.env.RECEIVER_EMAIL || ''],
      subject: `Weekly Alert: ${status} for Silver`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: ${color}; font-size: 24px; margin-top: 0;">${status}</h2>
          <p style="font-size: 18px; font-weight: bold;">Action: ${action}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p>Current Price: <strong>$${silver.price.toFixed(2)}</strong></p>
          <p>RSI Level: <strong>${silver.rsi.toFixed(1)}</strong></p>
          <p>20-Day High: $${silver.high20.toFixed(2)} (${dip.toFixed(1)}% dip)</p>
          <br />
          <p style="color: #666; font-size: 11px;">This alert follows the Expert v2.0 Strategy. 20-day high is used as the volatility anchor.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}