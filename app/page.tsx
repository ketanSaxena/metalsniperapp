"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Bell, 
  RefreshCw, 
  Activity, 
  BarChart3,
  ChevronRight
} from 'lucide-react';

/**
 * METAL SNIPER v2.1 - LIVE DASHBOARD
 * Includes Metals + Nifty 50 Trend Analysis
 * Updated with specific logic for Index vs Commodities
 */

type SignalType = 'GREEN' | 'YELLOW' | 'RED';

interface MarketSignal {
  symbol: string;
  name: string;
  price: number;
  rsi: number;
  rollingHigh: number;
  signal: SignalType;
  action: string;
  reason: string;
  color: string;
  type: 'METAL' | 'INDEX';
}

const getMetalSignal = (symbol: string, name: string, price: number, rsi: number, high20Day: number): MarketSignal => {
  const dip = high20Day > 0 ? ((high20Day - price) / high20Day) * 100 : 0;

  if (rsi <= 40 && dip >= 6) {
    return {
      symbol, name, price, rsi, rollingHigh: high20Day, type: 'METAL',
      signal: 'GREEN', action: "AGGRESSIVE BUY",
      reason: `Significant dip of ${dip.toFixed(1)}% from 20d High. RSI oversold at ${rsi.toFixed(1)}. Deploy weekly 4.5k + tranches.`,
      color: 'bg-emerald-500'
    };
  }
  if ((rsi > 40 && rsi < 65) && (dip >= 2)) {
    return {
      symbol, name, price, rsi, rollingHigh: high20Day, type: 'METAL',
      signal: 'YELLOW', action: "STANDARD TRANCHE",
      reason: `Healthy pullback of ${dip.toFixed(1)}%. Normal range. Deploy base allocation only.`,
      color: 'bg-amber-400'
    };
  }
  return {
    symbol, name, price, rsi, rollingHigh: high20Day, type: 'METAL',
    signal: 'RED', action: "PAUSE BUYING",
    reason: rsi >= 65 ? "Market overheated (RSI ≥ 65)." : `Noise dip of ${dip.toFixed(1)}%. Park funds in high-yield account.`,
    color: 'bg-rose-500'
  };
};

const getNiftySignal = (price: number, rsi: number, high20Day: number): MarketSignal => {
  const dip = high20Day > 0 ? ((high20Day - price) / high20Day) * 100 : 0;
  
  // Nifty specific logic: Often shows strength by staying near highs.
  // We use slightly tighter RSI thresholds for Index buying.
  if (rsi < 45 && dip > 4) {
    return {
      symbol: 'NIFTY50', name: 'Nifty 50 Index', price, rsi, rollingHigh: high20Day, type: 'INDEX',
      signal: 'GREEN', action: "ACCUMULATE INDEX",
      reason: `Index corrected ${dip.toFixed(1)}%. RSI at ${rsi.toFixed(1)} indicates a strong mean-reversion opportunity.`,
      color: 'bg-emerald-500'
    };
  }
  if (rsi >= 45 && rsi < 60) {
    return {
      symbol: 'NIFTY50', name: 'Nifty 50 Index', price, rsi, rollingHigh: high20Day, type: 'INDEX',
      signal: 'YELLOW', action: "SIT TIGHT / SIP",
      reason: "Index is in a neutral momentum zone. Maintain existing SIPs, no lump sum deployment.",
      color: 'bg-amber-400'
    };
  }
  return {
    symbol: 'NIFTY50', name: 'Nifty 50 Index', price, rsi, rollingHigh: high20Day, type: 'INDEX',
    signal: 'RED', action: "AVOID FRESH BUYS",
    reason: rsi >= 60 ? "Index momentum is overextended (RSI > 60)." : `Minor dip of ${dip.toFixed(1)}% is insufficient for entry.`,
    color: 'bg-rose-500'
  };
};

export default function App() {
  const [data, setData] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLivePrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/prices');
      if (!response.ok) throw new Error('Failed to fetch market data');
      
      const result = await response.json();
      
      const updatedData = [
        getMetalSignal('XAG', 'Silver', result.silver.price, result.silver.rsi, result.silver.high20),
        getMetalSignal('XAU', 'Gold', result.gold.price, result.gold.rsi, result.gold.high20),
        getNiftySignal(result.nifty50.price, result.nifty50.rsi, result.nifty50.high20)
      ];
      
      setData(updatedData);
    } catch (err) {
      setError('Market feed unavailable. Using mock data for display.');
      setData([
        getMetalSignal('XAG', 'Silver', 31.20, 35.0, 34.80),
        getMetalSignal('XAU', 'Gold', 2650.50, 68.0, 2750.00),
        getNiftySignal(25320.65, 52.0, 26373.20)
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
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sniper<span className="text-blue-600">v2.1</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm italic">Metals Strategy + Nifty 50 Trend Index</p>
        </div>
        
        <button 
          onClick={fetchLivePrices}
          disabled={loading}
          className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-bold">{loading ? 'Syncing...' : 'Refresh Markets'}</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-medium flex items-center gap-2 mb-6">
            <Info size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {data.map((item) => (
            <div key={item.symbol} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 flex flex-col h-full transition-all hover:scale-[1.01]">
              <div className={`${item.color} p-6 text-white transition-colors duration-700`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70 bg-black/10 px-2 py-1 rounded-md">
                      {item.type}
                    </span>
                    <h2 className="text-4xl font-black mt-1 leading-none">{item.symbol}</h2>
                  </div>
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                    {item.signal === 'GREEN' ? <TrendingDown size={28} /> : item.signal === 'YELLOW' ? <Minus size={28} /> : <TrendingUp size={28} />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm font-bold opacity-90">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-white"></div>
                    Market Live
                  </div>
                </div>
              </div>

              <div className="p-6 flex-grow space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Current Price</p>
                    <p className="text-xl font-bold italic">
                      {item.type === 'INDEX' ? '₹' : '$'}{item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">RSI (14d)</p>
                    <p className={`text-xl font-bold ${item.rsi >= 65 ? 'text-rose-600' : item.rsi <= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.rsi.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">
                      20-Day Rolling High Benchmark
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold">
                        {item.type === 'INDEX' ? '₹' : '$'}{item.rollingHigh.toLocaleString()}
                      </p>
                      <span className="text-xs font-black bg-rose-100 text-rose-700 px-2 py-1 rounded-lg">
                        -{(((item.rollingHigh - item.price) / item.rollingHigh) * 100).toFixed(1)}% Dip
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex-grow">
                  <div className="flex items-center gap-2 mb-2 text-blue-700">
                    <Bell size={16} />
                    <span className="font-black uppercase text-[10px] tracking-widest text-blue-600">Strategic Protocol</span>
                  </div>
                  <h3 className="text-lg font-black text-blue-900 leading-tight mb-2 uppercase tracking-tight">
                    {item.action}
                  </h3>
                  <p className="text-xs text-blue-800/70 leading-relaxed font-semibold">
                    {item.reason}
                  </p>
                </div>
                
                <button className="w-full py-3 rounded-2xl border-2 border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all text-xs font-bold flex items-center justify-center gap-2">
                  Technical Analytics <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-sm uppercase tracking-wider">
              <BarChart3 size={18} className="text-blue-500" /> Capital Allocation Rules
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Green', color: 'bg-emerald-500', text: 'Deployment Zone. Metals: 4.5k + tranches. Index: Target 10% cash deployment.' },
                { label: 'Yellow', color: 'bg-amber-400', text: 'Base Tranche. Only weekly 4.5k for metals. Normal SIP for Index. No extra buys.' },
                { label: 'Red', color: 'bg-rose-500', text: 'Conservation Zone. RSI overextended or dip too shallow. Park cash in 6.25% account.' }
              ].map(rule => (
                <div key={rule.label} className="flex gap-4">
                  <div className={`w-1.5 rounded-full ${rule.color} shrink-0`} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-1">{rule.label} Signal</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{rule.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={120} />
            </div>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-blue-400">
              <Info size={18} /> Intelligent Engine Status
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs text-slate-400 font-medium">Calculation Model</span>
                <span className="text-xs font-bold">20-Day Rolling Benchmark</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs text-slate-400 font-medium">Price Feed Accuracy</span>
                <span className="text-xs font-bold">Yahoo Finance (99.9%)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-xs text-slate-400 font-medium">Nifty Currency</span>
                <span className="text-xs font-bold">INR (₹)</span>
              </div>
              <div className="pt-4">
                <p className="text-[10px] text-slate-500 leading-relaxed italic font-medium">
                  Note: v2.1 introduces the Nifty 50 Index. Unlike metals, index logic favors trend preservation. 
                  Fresh buys are suggested only on significant RSI pullbacks to maintain favorable risk-reward.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
