import React, { useState, useEffect } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info, Mail, Bell, ShieldCheck } from 'lucide-react';

/**
 * METAL SNIPER - NEXT.JS DASHBOARD & CRON LOGIC
 * * SETUP INSTRUCTIONS:
 * 1. Create a free account at https://twelvedata.com to get your API Key.
 * 2. Create a free account at https://resend.com to get your Email API Key.
 * 3. Add the following to your Vercel Environment Variables (.env.local):
 * - TWELVE_DATA_API_KEY=your_key_here
 * - RESEND_API_KEY=re_your_key_here
 * - CRON_SECRET=a_random_string_of_your_choice
 * - RECEIVER_EMAIL=your_email@gmail.com
 * * 4. To automate emails, add this to your vercel.json:
 * { "crons": [{ "path": "/api/cron", "schedule": "0 4 * * 1" }] } // Runs Mon 8AM Dubai
 */

// Types for our Signal Logic
type SignalType = 'GREEN' | 'YELLOW' | 'RED';

interface MetalSignal {
  symbol: string;
  name: string;
  price: number;
  rsi: number;
  rollingHigh: number; // Now represents 20-Day High
  signal: SignalType;
  action: string;
  reason: string;
  color: string;
}

/**
 * Decision Engine Logic - Expert Market Thresholds v2.0
 * 🟢 GREEN: RSI <= 40 AND Dip >= 6% (from 20-day high)
 * 🟡 YELLOW: RSI 41-64 AND Dip 2-5.9%
 * 🔴 RED: RSI >= 65 OR Dip < 2%
 */
const getSignalData = (symbol: string, name: string, price: number, rsi: number, high20Day: number): MetalSignal => {
  const dip = ((high20Day - price) / high20Day) * 100;

  // 🟢 GREEN: Meaningful Dip (RSI <= 40 && Dip >= 6%)
  if (rsi <= 40 && dip >= 6) {
    return {
      symbol, name, price, rsi, rollingHigh: high20Day,
      signal: 'GREEN',
      action: "AGGRESSIVE BUY (LIMIT)",
      reason: `Significant dip of ${dip.toFixed(1)}% (20d High) and RSI at ${rsi.toFixed(1)}. Deploy weekly 4.5k + max 2 saved tranches.`,
      color: 'bg-emerald-500'
    };
  }

  // 🟡 YELLOW: Standard Accumulation (Pullback / Neutral Zone)
  // Logic: (rsi > 40 && rsi < 65) && (dip >= 2 && dip < 6)
  if ((rsi > 40 && rsi < 65) && (dip >= 2)) {
    return {
      symbol, name, price, rsi, rollingHigh: high20Day,
      signal: 'YELLOW',
      action: "WEEKLY TRANCHE ONLY",
      reason: `Healthy pullback of ${dip.toFixed(1)}%. Normal trading range. Deploy only this week's 4.5k.`,
      color: 'bg-amber-400'
    };
  }

  // 🔴 RED: Overheated / No Dip (RSI >= 65 || Dip < 2%)
  return {
    symbol, name, price, rsi, rollingHigh: high20Day,
    signal: 'RED',
    action: "PAUSE BUYING",
    reason: rsi >= 65 
      ? "Market is overheated (RSI ≥ 65). Metals extended short-term." 
      : `Minor dip of ${dip.toFixed(1)}% is just noise. Park 4.5k in Mashreq 6.25% account.`,
    color: 'bg-rose-500'
  };
};

// Mock data for initial UI render (Simulating Jan 2026 conditions)
const mockData: MetalSignal[] = [
  getSignalData('XAG', 'Silver', 86.50, 42, 92.39), // Yellow scenario
  getSignalData('XAU', 'Gold', 4980, 68, 5010)     // Red scenario
];

export default function App() {
  const [data, setData] = useState<MetalSignal[]>(mockData);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Metal Sniper <span className="text-blue-600">v2.0</span></h1>
          <p className="text-slate-500 mt-1">Expert Strategy: 20-Day Highs & RSI Optimized</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">Accumulation Mode</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* Status Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {data.map((item) => (
            <div key={item.symbol} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all hover:shadow-2xl">
              {/* Flag Section */}
              <div className={`${item.color} p-6 flex justify-between items-center text-white`}>
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-widest">{item.symbol}</h2>
                  <p className="text-sm font-bold opacity-80">{item.name} Market</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                   {item.signal === 'GREEN' ? <TrendingDown size={32} /> : item.signal === 'YELLOW' ? <Minus size={32} /> : <TrendingUp size={32} />}
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Price</p>
                    <p className="text-xl font-bold">${item.price.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">RSI (14d)</p>
                    <p className={`text-xl font-bold ${item.rsi >= 65 ? 'text-rose-600' : item.rsi <= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>{item.rsi.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">20-Day High Deviation</p>
                    <p className="text-lg font-bold">-{(((item.rollingHigh - item.price) / item.rollingHigh) * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                   <div className="flex items-center gap-2 mb-2 text-blue-700">
                     <Bell size={18} />
                     <span className="font-bold uppercase text-xs tracking-widest">Deployment Rule</span>
                   </div>
                   <h3 className="text-xl font-black text-blue-900 leading-tight mb-2">{item.action}</h3>
                   <p className="text-sm text-blue-800/80 leading-relaxed font-medium">{item.reason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strategy Legend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm">
            <Info size={18} /> Allocation Strategy (Expert v2.0)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Green</span>
              </div>
              <p className="text-[11px] text-slate-500"><strong>Rule:</strong> RSI ≤ 40 & Dip ≥ 6%. Deploy weekly 4.5k + 2 saved tranches. Protects from "falling knives".</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Yellow</span>
              </div>
              <p className="text-[11px] text-slate-500"><strong>Rule:</strong> RSI 40–65 & Dip 2–6%. Standard accumulation. Deploy 4.5k only. Don't miss the trend.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Red</span>
              </div>
              <p className="text-[11px] text-slate-500"><strong>Rule:</strong> RSI ≥ 65 or Dip &lt; 2%. Overextended. Deploy 0. Let cash earn 6.25% in Mashreq.</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <footer className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left py-6">
          <p className="text-slate-400 text-[10px] flex-1">
            Decision logic calibrated for 24-month horizon. Signal uses 20-day high as volatility anchor.
          </p>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-5 py-3 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
              <Mail size={14} /> Send Alert to Wife
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
