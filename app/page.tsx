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
  ChevronRight,
  X,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Scale
} from 'lucide-react';

/**
 * METAL SNIPER v2.1 - LIVE DASHBOARD
 * Includes Metals + Nifty 50 Trend Analysis
 * Updated with specific logic for Index vs Commodities
 * Features Strategy Explanation Drawer
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
  type: 'METAL' | 'EQUITY';
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

// deprecated
const getNiftySignal = (price: number, rsi: number, high20Day: number): MarketSignal => {
  const dip = high20Day > 0 ? ((high20Day - price) / high20Day) * 100 : 0;
  
  if (rsi < 45 && dip > 4) {
    return {
      symbol: 'NIFTY50', name: 'Nifty 50 Index', price, rsi, rollingHigh: high20Day, type: 'EQUITY',
      signal: 'GREEN', action: "ACCUMULATE INDEX",
      reason: `Index corrected ${dip.toFixed(1)}%. RSI at ${rsi.toFixed(1)} indicates a strong mean-reversion opportunity.`,
      color: 'bg-emerald-500'
    };
  }
  if (rsi >= 45 && rsi < 60) {
    return {
      symbol: 'NIFTY50', name: 'Nifty 50 Index', price, rsi, rollingHigh: high20Day, type: 'EQUITY',
      signal: 'YELLOW', action: "SIT TIGHT / SIP",
      reason: "Index is in a neutral momentum zone. Maintain existing SIPs, no lump sum deployment.",
      color: 'bg-amber-400'
    };
  }
  return {
    symbol: 'NIFTY50', name: 'Nifty 50 Index', price, rsi, rollingHigh: high20Day, type: 'EQUITY',
    signal: 'RED', action: "AVOID FRESH BUYS",
    reason: rsi >= 60 ? "Index momentum is overextended (RSI > 60)." : `Minor dip of ${dip.toFixed(1)}% is insufficient for entry.`,
    color: 'bg-rose-500'
  };
};

const getEquitySignal = (symbol: string, name: string, subtitle: string, price: number, rsi: number, high20Day: number): MarketSignal => {
  const dip = high20Day > 0 ? ((high20Day - price) / high20Day) * 100 : 0;
  
  if (rsi < 45 && dip > 4) {
    return {
      symbol, name, subtitle, price, rsi, rollingHigh: high20Day, type: 'EQUITY',
      signal: 'GREEN', action: "ACCUMULATE INDEX",
      reason: `Asset corrected ${dip.toFixed(1)}%. RSI at ${rsi.toFixed(1)} indicates a strong mean-reversion opportunity.`,
      color: 'bg-emerald-500'
    };
  }
  if (rsi >= 45 && rsi < 60) {
    return {
      symbol, name, subtitle, price, rsi, rollingHigh: high20Day, type: 'EQUITY',
      signal: 'YELLOW', action: "SIT TIGHT / SIP",
      reason: "Asset is in a neutral momentum zone. Maintain existing SIPs, no lump sum deployment.",
      color: 'bg-amber-400'
    };
  }
  return {
    symbol, name, subtitle, price, rsi, rollingHigh: high20Day, type: 'EQUITY',
    signal: 'RED', action: "AVOID FRESH BUYS",
    reason: rsi >= 60 ? "Momentum is overextended (RSI > 60)." : `Minor dip of ${dip.toFixed(1)}% is insufficient for entry.`,
    color: 'bg-rose-500'
  };
};

export default function App() {
  const [data, setData] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Watchlist State
  const [watchlist, setWatchlist] = useState({
    Gold: true,
    Silver: true,
    Nifty50: true,
    EdelweissMidcapDirect: false,
  });

  const toggleWatchlist = (key: keyof typeof watchlist) => {
    setWatchlist(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
        getEquitySignal('NIFTY50', 'Nifty 50 Index', 'Benchmark Index', result.nifty50.price, result.nifty50.rsi, result.nifty50.high20),
        getEquitySignal('EDELWEISS MIDCAP', 'Edelweiss Mid Cap Direct Fund', 'Benchmark Index', result.edelweissMidcapDirect.price, result.edelweissMidcapDirect.rsi, result.edelweissMidcapDirect.high20),
      ];
      
      setData(updatedData);
    } catch (err) {
      setError('Market feed unavailable. Using mock data for display.');
      setData([
        getMetalSignal('XAG', 'Silver', 31.20, 35.0, 34.80),
        getMetalSignal('XAU', 'Gold', 2650.50, 68.0, 2750.00),
        getEquitySignal('NIFTY50', 'Nifty 50 Index', 'Benchmark Index', 25320.65, 52.0, 26373.20),
        getEquitySignal('EDELWEISS MIDCAP', 'Edelweiss Mid Cap Direct Fund', 'Benchmark Index', 1, 1, 1)
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
  }, []);

  // Close drawer on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredData = data.filter(item => {
    if (item.symbol === 'XAU') return watchlist.Gold;
    if (item.symbol === 'XAG') return watchlist.Silver;
    if (item.symbol === 'NIFTY50') return watchlist.Nifty50;
    if (item.symbol === 'EDELWEISS MIDCAP') return watchlist.EdelweissMidcapDirect;
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col">
      {/* Side Drawer Backdrop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Strategy Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-8 sticky top-0 bg-white/95 py-2 backdrop-blur-sm border-b border-slate-100 -mx-4 px-4">
            <h2 className="text-xl font-black flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Strategy Guide
            </h2>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <article className="prose prose-slate max-w-none space-y-8">
            <header className="bg-blue-600 rounded-3xl p-8 text-white">
              <h1 className="text-2xl font-black mb-2 text-white">📊 The Smart Dip-Investing Strategy Explained Simply</h1>
              <p className="opacity-90 font-medium">Maximize your returns by buying the dips and skipping the peaks.</p>
            </header>

            <section>
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Activity size={18} className="text-blue-600" /> The Core Idea
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Instead of investing your monthly amount all at once, you <strong>split it into daily parts</strong> and only invest when the market gives you a good deal.
              </p>
            </section>

            <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold mb-4">🔄 How It Works</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">1</div>
                  <p><strong>Set Your Monthly Budget:</strong> Example: ₹50,000 per month.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">2</div>
                  <p><strong>Split Into Daily Parts:</strong> ₹50,000 ÷ 22 trading days = <strong>₹2,273 per day</strong>. This is your "daily investment token".</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-bold">Three Market Conditions:</h3>
              
              <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <p className="font-black text-emerald-700 uppercase tracking-wider text-xs mb-1">🟢 GREEN ZONE (BUY MORE)</p>
                <p className="text-sm font-bold text-slate-800">Condition: Price dropped ≥6% AND RSI &lt; 40</p>
                <p className="text-sm text-slate-600 mt-1"><strong>Action:</strong> Invest TODAY'S ₹2,273 + ALL PREVIOUS DAYS YOU SKIPPED.</p>
              </div>

              <div className="border-l-4 border-amber-400 pl-4 py-1">
                <p className="font-black text-amber-600 uppercase tracking-wider text-xs mb-1">🟡 YELLOW ZONE (BUY NORMAL)</p>
                <p className="text-sm font-bold text-slate-800">Condition: Price between -2% to -6% from high</p>
                <p className="text-sm text-slate-600 mt-1"><strong>Action:</strong> Invest only TODAY'S ₹2,273.</p>
              </div>

              <div className="border-l-4 border-rose-500 pl-4 py-1">
                <p className="font-black text-rose-600 uppercase tracking-wider text-xs mb-1">🔴 RED ZONE (SKIP)</p>
                <p className="text-sm font-bold text-slate-800">Condition: Price &lt;2% from high OR RSI &gt; 65</p>
                <p className="text-sm text-slate-600 mt-1"><strong>Action:</strong> SKIP investing today. Save cash for future green days.</p>
              </div>
            </section>

            <section className="bg-slate-900 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-400">
                <ChevronRight /> Real World Example
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] md:text-xs">
                  <thead>
                    <tr className="border-b border-white/20 text-slate-400">
                      <th className="pb-2 text-left">Day</th>
                      <th className="pb-2 text-left">Signal</th>
                      <th className="pb-2 text-left">Action</th>
                      <th className="pb-2 text-right">Saved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr>
                      <td className="py-2">1</td>
                      <td className="py-2 text-rose-400 font-bold">RED 🔴</td>
                      <td className="py-2">Skip</td>
                      <td className="py-2 text-right">₹2,273</td>
                    </tr>
                    <tr>
                      <td className="py-2">2</td>
                      <td className="py-2 text-amber-400 font-bold">YELLOW 🟡</td>
                      <td className="py-2">Invest ₹2,273</td>
                      <td className="py-2 text-right">₹2,273</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-black">3</td>
                      <td className="py-2 text-emerald-400 font-bold">GREEN 🟢</td>
                      <td className="py-2 font-bold">Invest ₹4,546</td>
                      <td className="py-2 text-right font-bold text-emerald-400">₹0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-4 italic font-medium">
                "Bought MORE units when cheap, FEWER when expensive. Same ₹50,000 budget."
              </p>
            </section>

            {/* Strategic Warning in Drawer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
              <ShieldAlert className="text-amber-600 shrink-0" size={24} />
              <div>
                <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Disclaimer & Risk</p>
                <p className="text-xs text-amber-700 leading-relaxed italic">
                  This strategy is for educational purposes only. It is intended solely for the personal use of the creator. Investing in Mutual Funds, Commodities, and Indices involves market risks. Past performance is not indicative of future results.
                </p>
              </div>
            </div>

            <section className="pb-12 space-y-4">
              <h3 className="text-lg font-bold">🎮 Think Of It Like:</h3>
              <p className="text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                You're a smart shopper in a mall:<br/>
                <span className="text-rose-600 font-bold">🔴 RED</span> = Full price → Wait for sale<br/>
                <span className="text-amber-600 font-bold">🟡 YELLOW</span> = 10% off → Buy normal amount<br/>
                <span className="text-emerald-600 font-bold">🟢 GREEN</span> = 50% off → Stock up heavily!<br/>
                <strong>Same money, more stuff.</strong>
              </p>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Got It, Let's Sniper!
              </button>
            </section>
          </article>
        </div>
      </div>

      <header className="max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-200">
              <Activity size={20} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sniper<span className="text-blue-600">v2.1</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm italic">Multi-Asset Strategic Accumulation</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-95 text-slate-600"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold">Strategy Guide</span>
          </button>
          
          <button 
            onClick={fetchLivePrices}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-bold">{loading ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full flex-grow">
        {/* Watchlist Selection UI */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl">
                <BarChart3 className="text-blue-600 w-5 h-5" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Watchlist</h2>
            </div>
            
            <div className="flex flex-wrap gap-8">
              {/* Metals Group */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metals</span>
                <div className="flex gap-4">
                  {['Gold', 'Silver'].map((asset) => (
                    <label key={asset} className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                          ${watchlist[asset as keyof typeof watchlist] 
                            ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-100' 
                            : 'border-slate-300 group-hover:border-blue-400'}`}
                        onClick={() => toggleWatchlist(asset as keyof typeof watchlist)}
                      >
                        {watchlist[asset as keyof typeof watchlist] && <Check className="text-white w-3.5 h-3.5" strokeWidth={4} />}
                      </div>
                      <span className={`text-xs font-bold ${watchlist[asset as keyof typeof watchlist] ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {asset}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Equity Group */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Equity</span>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {['Nifty50', 'Midcap', 'Midcap150 Momentum 50'].map((asset) => (
                    <label key={asset} className="flex items-center gap-2 cursor-pointer group">
                      <div 
                        className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center
                          ${watchlist[asset as keyof typeof watchlist] 
                            ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-100' 
                            : 'border-slate-300 group-hover:border-blue-400'}`}
                        onClick={() => toggleWatchlist(asset as keyof typeof watchlist)}
                      >
                        {watchlist[asset as keyof typeof watchlist] && <Check className="text-white w-3.5 h-3.5" strokeWidth={4} />}
                      </div>
                      <span className={`text-xs font-bold ${watchlist[asset as keyof typeof watchlist] ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {asset}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-medium flex items-center gap-2 mb-6">
            <Info size={16} /> {error}
          </div>
        )}

        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredData.map((item) => (
              <div key={item.symbol} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 flex flex-col h-full transition-all hover:scale-[1.01]">
                <div className={`${item.color} p-6 text-white transition-colors duration-700`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70 bg-black/10 px-2 py-1 rounded-md">
                        {item.type}
                      </span>
                      <h2 className="text-2xl font-black mt-2 leading-tight uppercase tracking-tight">{item.name}</h2>
                      {item.subtitle && (
                        <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-wider">{item.subtitle}</p>
                      )}
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      {item.signal === 'GREEN' ? <TrendingDown size={28} /> : item.signal === 'YELLOW' ? <Minus size={28} /> : <TrendingUp size={28} />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold opacity-90 mt-2">
                    <span className="bg-white/10 px-2 py-1 rounded-lg">Ticker: {item.symbol}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-white"></div>
                      Live
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-grow space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-1">Price</p>
                      <p className="text-xl font-bold italic">
                        {item.symbol === 'XAU' || item.symbol === 'XAG' ? '$' : '₹'}{item.price.toLocaleString()}
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
                        20-Day Rolling High
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold">
                          {item.symbol === 'XAU' || item.symbol === 'XAG' ? '$' : '₹'}{item.rollingHigh.toLocaleString()}
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 flex flex-col items-center justify-center text-center px-6 mb-12">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Activity className="text-slate-300 w-12 h-12" />
            </div>
            <h3 className="text-xl font-black text-slate-400">Your Watchlist is Empty</h3>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Select assets from the toggle menu above to start tracking market opportunities.</p>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto w-full pt-8 pb-12 mt-auto border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] font-black tracking-widest text-slate-900 uppercase mb-3 flex items-center gap-2">
              <Scale size={14} className="text-blue-600" /> Legal Disclaimer
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium uppercase tracking-tight">
              This application is not a registered investment advisor. The information provided is solely for the personal use and research of the creator. It does NOT constitute financial advice to buy or sell securities, commodities, or index funds. All investments are subject to market risks. Please consult with a certified financial professional before making any deployment decisions.
            </p>
          </div>
          <div className="md:text-right flex flex-col md:items-end justify-start">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">
              © 2025 KETAN SAXENA — BUILT FOR SCALE
            </p>
            <div className="flex items-center gap-1.5 group">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Author Website :</span>
              <a 
                href="https://meetketan.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest border-b-2 border-blue-100 group-hover:border-blue-600"
              >
                meetketan.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
