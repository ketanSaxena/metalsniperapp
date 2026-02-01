# Sniper v2.1: Multi-Asset Strategic Investment Dashboard

Sniper is a specialized financial dashboard designed for the "Smart Dip-Investing" strategy. Instead of traditional SIPs (Systematic Investment Plans) that buy blindly on a fixed date, Sniper identifies local market corrections using RSI and 20-day high benchmarks to optimize entry points for Gold, Silver, and Equity Indices.

## 🚀 Technical Stack

- Frontend: React (Vite) with Tailwind CSS.
- Icons: Lucide-React.
- Backend: Next.js API Routes (Route Handlers).
- Data Source: Yahoo Finance API integration for live spot prices and historical candles.
- State Management: React Hooks (useState/useEffect) with local Watchlist persistence.

## 🏗️ Deployment & Setup

Environment Variables:
Ensure your environment supports Next.js API routes if deploying to Vercel.

Install Dependencies:
```
npm install lucide-react clsx tailwind-merge
```

### API Implementation:
The /api/prices route handles the heavy lifting of fetching data from Yahoo Finance and calculating the RSI/Rolling Highs server-side to prevent CORS issues.

## 📊 Investment Philosophy

The app is built on a "Daily Token" allocation model:

The Budget: Divide your monthly investment capital by 22 (trading days).

#### The Logic:
```
RED (Overheated): Skip buying. Save the daily token in a "bank."

YELLOW (Neutral): Deploy only today's token.

GREEN (Sale): Deploy today's token + all previously saved "Red Day" tokens.
```
This ensures you accumulate the maximum number of units when the market is at a local bottom.

## 🛠️ Features

**1. Watchlist Management**

Users can toggle between different asset groups:

Metals: Gold (XAU), Silver (XAG).

Equity: Nifty 50, Nifty Midcap 100, and the Edelweiss Nifty Midcap150 Momentum 50 index.

**2. Live Signal Engine**

The app calculates real-time signals based on:

- RSI (14-period): Identifying overbought (>65) or oversold (<40) conditions.
- 20-Day Drawdown: Measuring the current price against the rolling 20-day high to identify "Sale" percentages (e.g., >6% for metals, >4% for indices).

**3. Integrated Legal Safety**

Built-in disclaimers and risk warnings to ensure the tool remains classified as a "Personal Usage Dashboard" rather than a licensed advisory platform.

## ⚖️ Legal Disclaimer

This application is NOT a registered investment advisor. It is intended solely for personal use. Mutual funds, stocks, and commodities are subject to market risks. The "Sniper" strategy is a mathematical approach to capital deployment and does not guarantee profits.

---
- Author: **Ketan Saxena**
- Website: **[meetketan.com](https://meetketan.com)**
