import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * THIS IS THE SERVER-SIDE CRON JOB SCRIPT
 * Deployment Path: your-domain.com/api/cron
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const TD_API_KEY = process.env.TWELVE_DATA_API_KEY;

export async function GET(request: Request) {
  // 1. Security Check: Only allow Vercel Cron or authorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch Data (Example for Silver)
    // In production, fetch price and technical RSI from Twelve Data
    const priceRes = await fetch(`https://api.twelvedata.com/time_series?symbol=XAG/USD&interval=1day&outputsize=14&apikey=${TD_API_KEY}`);
    const rsiRes = await fetch(`https://api.twelvedata.com/rsi?symbol=XAG/USD&interval=1day&time_period=14&apikey=${TD_API_KEY}`);
    
    const priceData = await priceRes.json();
    const rsiData = await rsiRes.json();

    const currentPrice = parseFloat(priceData.values[0].close);
    const rsiValue = parseFloat(rsiData.values[0].rsi);
    const weeklyHigh = Math.max(...priceData.values.slice(0, 7).map((v: any) => parseFloat(v.high)));
    
    const dip = ((weeklyHigh - currentPrice) / weeklyHigh) * 100;

    // 3. Logic Execution
    let status = "🔴 RED - PEAK";
    let color = "#f43f5e";
    let action = "DO NOT BUY. Move 4.5k to Savings.";

    if (rsiValue < 45 && dip > 5) {
      status = "🟢 GREEN - STRONG BUY";
      color = "#10b981";
      action = "SNIPER ALERT: Deploy 4.5k + ALL SAVINGS.";
    } else if (rsiValue < 55 || dip > 3) {
      status = "🟡 YELLOW - MILD DIP";
      color = "#f59e0b";
      action = "BUY 4.5k ONLY. Keep existing savings idle.";
    }

    // 4. Send Email Notification
    await resend.emails.send({
      from: 'Metal Sniper <alerts@yourdomain.com>',
      to: [process.env.RECEIVER_EMAIL || ''],
      subject: `Weekly Update: ${status} for Silver`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: ${color}; font-size: 24px;">${status}</h2>
          <p style="font-size: 18px; font-weight: bold;">Action: ${action}</p>
          <hr />
          <p>Current Price: <strong>$${currentPrice.toFixed(2)}</strong></p>
          <p>RSI Level: <strong>${rsiValue.toFixed(1)}</strong></p>
          <p>Weekly High: $${weeklyHigh.toFixed(2)} (${dip.toFixed(1)}% dip)</p>
          <br />
          <p style="color: #666; font-size: 12px;">This is an automated alert based on your Sane-Madness strategy.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}