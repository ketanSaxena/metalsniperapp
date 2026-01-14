"use client";

import React, { useState, useEffect } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info, Mail, Bell, ShieldCheck, RefreshCw } from 'lucide-react';

/**
 * METAL SNIPER v2.0 - LIVE DASHBOARD
 * Now includes real-time data fetching from your API routes.
 */

type SignalType = 'GREEN' | 'YELLOW' | 'RED';

interface MetalSignal {
  symbol: string;
  name: string;
  price: number;
  rsi: number;
  rollingHigh: number;
  signal: SignalType;
  action: string;
  reason: string;
  color: string;
}

const getSignalData = (symbol: string, name: string, price: number, rsi: number, high20Day: number): MetalSignal => {
  const dip = ((high20Day - price) / high20Day) * 100;

  if (rsi <= 40 && dip >= 6) {
    return {
      symbol, name, price, rsi, rollingHigh: high20Day,
      signal: 'GREEN',
      action: "AGGRESSIVE BUY (LIMIT)",
      reason: `Significant dip of ${dip.toFixed(1)}% (20d High) and RSI at ${rsi.toFixed(1)}. Deploy weekly 4.5k + max 2 saved tranches.`,
      color: 'bg-emerald-500'
    };
  }

  if ((rsi > 40 && rsi < 65) && (dip >= 2)) {
    return {
      symbol, name, price, rsi, rollingHigh: high20Day,
      signal: 'YELLOW',
      action: "WEEKLY TRANCHE ONLY",
      reason: `Healthy pullback of ${dip.toFixed(1)}%. Normal trading range. Deploy only this week's 4.5k.`,
      color: 'bg-amber-400'
    };
  }

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

export default function App() {
  const [data, setData] = useState<MetalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLivePrices = async () => {
    setLoading(true);
    setError(null);
    try {
      // Note: We'll create this API route in Step 2 to proxy Twelve Data securely
      const response = await fetch('/api/prices');
      if (!response.ok) throw new Error('Failed to fetch market data');
      
      const result = await response.json();
      
      const updatedData = [
        getSignalData('XAG', 'Silver', result.silver.price, result.silver.rsi, result.silver.high20),
        getSignalData('XAU', 'Gold', result.gold.price, result.gold.rsi, result.gold.high20)
      ];
      
      setData(updatedData);
    } catch (err) {
      setError('Could not connect to market feed. Using cached/mock data.');
      // Fallback to mock data if API fails
      setData([
        getSignalData('XAG', 'Silver', 0, 0, 0),
        getSignalData('XAU', 'Gold', 0, 0, 0)
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Metal Sniper <span className="text-blue-600">v2.0</span></h1>
          <p className="text-slate-500 mt-1">Expert Strategy: 20-Day Highs & RSI Optimized</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchLivePrices}
            disabled={loading}
            className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{loading ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-medium flex items-center gap-2">
            <Info size={16} /> {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {data.map((item) => (
            <div key={item.symbol} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all hover:shadow-2xl">
              <div className={`${item.color} p-6 flex justify-between items-center text-white transition-colors duration-500`}>
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-widest">{item.symbol}</h2>
                  <p className="text-sm font-bold opacity-80">{item.name} Market</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                   {item.signal === 'GREEN' ? <TrendingDown size={32} /> : item.signal === 'YELLOW' ? <Minus size={32} /> : <TrendingUp size={32} />}
                </div>
              </div>

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

                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 min-h-[140px]">
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
              <p className="text-[11px] text-slate-500"><strong>Rule:</strong> RSI ≤ 40 & Dip ≥ 6%. Deploy weekly 4.5k + 2 saved tranches.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Yellow</span>
              </div>
              <p className="text-[11px] text-slate-500"><strong>Rule:</strong> RSI 40–65 & Dip 2–6%. Standard accumulation. Deploy 4.5k only.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Red</span>
              </div>
              <p className="text-[11px] text-slate-500"><strong>Rule:</strong> RSI ≥ 65 or Dip &lt; 2%. Overextended. Deploy 0.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}