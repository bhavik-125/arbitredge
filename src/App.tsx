import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Home, Briefcase, User, Bell, 
  Moon, Sun, TrendingUp, TrendingDown, 
  ArrowRight, Plus, Minus, ChevronDown, ChevronUp,
  LayoutGrid, List, PieChart, Activity, Zap, 
  Filter, ArrowLeftRight, Clock, ShieldCheck, AlertTriangle,
  LogOut, Eye, EyeOff, Lock, Mail, User as UserIcon, CheckCircle,
  BarChart3, RefreshCw, X, DollarSign, Smartphone,
  ArrowUpRight, ArrowDownRight, Award, History
} from 'lucide-react';

// --- MOCK DATA: FULL NIFTY 50 DATASET ---

const INITIAL_STOCKS = [
  { id: 1, symbol: 'RELIANCE', name: 'Reliance Industries', price: 2980.50, sector: 'Energy' },
  { id: 2, symbol: 'TCS', name: 'Tata Consultancy Svcs', price: 4120.00, sector: 'IT' },
  { id: 3, symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', price: 1450.75, sector: 'Finance' },
  { id: 4, symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1080.00, sector: 'Finance' },
  { id: 5, symbol: 'INFY', name: 'Infosys Limited', price: 1600.20, sector: 'IT' },
  { id: 6, symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1220.50, sector: 'Telecom' },
  { id: 7, symbol: 'SBIN', name: 'State Bank of India', price: 760.10, sector: 'Finance' },
  { id: 8, symbol: 'LICINDIA', name: 'LIC of India', price: 1040.00, sector: 'Insurance' },
  { id: 9, symbol: 'ITC', name: 'ITC Limited', price: 435.20, sector: 'FMCG' },
  { id: 10, symbol: 'L&T', name: 'Larsen & Toubro', price: 3650.00, sector: 'Construction' },
  { id: 11, symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2380.00, sector: 'FMCG' },
  { id: 12, symbol: 'TATAMOTORS', name: 'Tata Motors', price: 980.40, sector: 'Auto' },
  { id: 13, symbol: 'AXISBANK', name: 'Axis Bank', price: 1050.00, sector: 'Finance' },
  { id: 14, symbol: 'SUNPHARMA', name: 'Sun Pharma', price: 1550.60, sector: 'Pharma' },
  { id: 15, symbol: 'NTPC', name: 'NTPC Limited', price: 340.20, sector: 'Energy' },
  { id: 16, symbol: 'HCLTECH', name: 'HCL Technologies', price: 1520.00, sector: 'IT' },
  { id: 17, symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1780.00, sector: 'Finance' },
  { id: 18, symbol: 'TITAN', name: 'Titan Company', price: 3580.00, sector: 'Consumer' },
  { id: 19, symbol: 'ASIANPAINT', name: 'Asian Paints', price: 2850.00, sector: 'Consumer' },
  { id: 20, symbol: 'ULTRACEMCO', name: 'UltraTech Cement', price: 9800.00, sector: 'Materials' },
  { id: 21, symbol: 'POWERGRID', name: 'Power Grid Corp', price: 285.50, sector: 'Energy' },
  { id: 22, symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6800.00, sector: 'Finance' },
  { id: 23, symbol: 'MARUTI', name: 'Maruti Suzuki', price: 12400.00, sector: 'Auto' },
  { id: 24, symbol: 'ONGC', name: 'ONGC', price: 275.40, sector: 'Energy' },
  { id: 25, symbol: 'WIPRO', name: 'Wipro Limited', price: 480.00, sector: 'IT' },
  { id: 26, symbol: 'COALINDIA', name: 'Coal India', price: 450.60, sector: 'Materials' },
  { id: 27, symbol: 'NESTLEIND', name: 'Nestle India', price: 2550.00, sector: 'FMCG' },
  { id: 28, symbol: 'ADANIENT', name: 'Adani Enterprises', price: 3150.00, sector: 'Energy' },
  { id: 29, symbol: 'BEL', name: 'Bharat Electronics', price: 210.00, sector: 'Defense' },
  { id: 30, symbol: 'TATASTEEL', name: 'Tata Steel', price: 155.00, sector: 'Materials' },
  { id: 31, symbol: 'M&M', name: 'Mahindra & Mahindra', price: 1890.00, sector: 'Auto' },
  { id: 32, symbol: 'ADANIPORTS', name: 'Adani Ports', price: 1320.00, sector: 'Logistics' },
  { id: 33, symbol: 'JSWSTEEL', name: 'JSW Steel', price: 850.00, sector: 'Materials' },
  { id: 34, symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', price: 1620.00, sector: 'Finance' },
  { id: 35, symbol: 'GRASIM', name: 'Grasim Industries', price: 2250.00, sector: 'Materials' },
  { id: 36, symbol: 'HINDALCO', name: 'Hindalco', price: 620.00, sector: 'Materials' },
  { id: 37, symbol: 'DRREDDY', name: 'Dr. Reddy\'s Labs', price: 6100.00, sector: 'Pharma' },
  { id: 38, symbol: 'EICHERMOT', name: 'Eicher Motors', price: 3950.00, sector: 'Auto' },
  { id: 39, symbol: 'CIPLA', name: 'Cipla Limited', price: 1450.00, sector: 'Pharma' },
  { id: 40, symbol: 'TECHM', name: 'Tech Mahindra', price: 1280.00, sector: 'IT' },
  { id: 41, symbol: 'SBILIFE', name: 'SBI Life Insurance', price: 1480.00, sector: 'Insurance' },
  { id: 42, symbol: 'BPCL', name: 'BPCL', price: 610.00, sector: 'Energy' },
  { id: 43, symbol: 'HDFCLIFE', name: 'HDFC Life', price: 620.00, sector: 'Insurance' },
  { id: 44, symbol: 'BRITANNIA', name: 'Britannia Inds', price: 4900.00, sector: 'FMCG' },
  { id: 45, symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', price: 4600.00, sector: 'Auto' },
  { id: 46, symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', price: 6200.00, sector: 'Healthcare' },
  { id: 47, symbol: 'TATACONSUM', name: 'Tata Consumer', price: 1150.00, sector: 'FMCG' },
  { id: 48, symbol: 'INDUSINDBK', name: 'IndusInd Bank', price: 1520.00, sector: 'Finance' },
  { id: 49, symbol: 'DIVISLAB', name: 'Divi\'s Laboratories', price: 3700.00, sector: 'Pharma' },
  { id: 50, symbol: 'LTIM', name: 'LTIMindtree', price: 5100.00, sector: 'IT' },
].map(stock => ({
  ...stock,
  change: (Math.random() * 2 - 1).toFixed(2),
  isUp: Math.random() > 0.5,
  chartData: Array.from({length: 15}, () => stock.price * (0.95 + Math.random() * 0.1))
}));

// --- ARBITRAGE GENERATOR (FULL NIFTY 50 COVERAGE) ---
const generateArbitrageOpps = (stocks) => {
  return stocks.map((stock, index) => {
    const isCashFut = Math.random() > 0.5;
    const buyPrice = stock.price;
    // Spread between 0.1% and 1.2%
    const spreadPct = (Math.random() * 0.011) + 0.001; 
    const spread = buyPrice * spreadPct;
    const sellPrice = buyPrice + spread;
    const roi = (spreadPct * 100).toFixed(2);
    
    // Risk logic based on sector volatility sim
    const riskFactor = Math.random();
    const risk = riskFactor > 0.8 ? 'High' : (riskFactor > 0.5 ? 'Med' : 'Low');

    return {
      id: index + 1000,
      symbol: stock.symbol,
      type: isCashFut ? 'Cash-Fut' : 'Exchange',
      buyEx: isCashFut ? 'NSE' : (Math.random() > 0.5 ? 'NSE' : 'BSE'),
      sellEx: isCashFut ? 'NSE Fut' : (Math.random() > 0.5 ? 'BSE' : 'NSE'),
      buyPrice: parseFloat(buyPrice.toFixed(2)),
      sellPrice: parseFloat(sellPrice.toFixed(2)),
      spread: parseFloat(spread.toFixed(2)),
      roi: `${roi}%`,
      vol: Math.random() > 0.6 ? 'High' : (Math.random() > 0.3 ? 'Med' : 'Low'),
      strength: Math.min(100, Math.floor(parseFloat(roi) * 50) + 40),
      expiry: isCashFut ? '29 Mar' : 'Instant',
      risk: risk,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  });
};

const INITIAL_ARBITRAGE_OPPS = generateArbitrageOpps(INITIAL_STOCKS);

const INDICES_INITIAL = [
  { name: 'NIFTY 50', value: 22450.30 },
  { name: 'SENSEX', value: 73980.15 },
  { name: 'BANK NIFTY', value: 47820.00 },
  { name: 'NIFTY IT', value: 38100.45 },
];

// Start with ZERO holdings
const INITIAL_HOLDINGS = [];

// --- MUTUAL FUNDS DATA ---
const MUTUAL_FUNDS = [
  { id: 1, name: "SBI Bluechip Fund", category: "Large Cap", nav: 78.45, aum: 45230.5, return_1y: 18.72, return_3y: 12.45, return_5y: 14.82, risk: "Moderate", rating: 5, expense_ratio: 1.05, fund_manager: "Sohini Andani" },
  { id: 2, name: "HDFC Top 100 Fund", category: "Large Cap", nav: 892.34, aum: 32150.8, return_1y: 21.35, return_3y: 14.28, return_5y: 16.45, risk: "Moderate", rating: 4, expense_ratio: 1.12, fund_manager: "Prashant Jain" },
  { id: 3, name: "ICICI Prudential Technology Fund", category: "Sectoral - Technology", nav: 156.78, aum: 12450.2, return_1y: 32.45, return_3y: 22.18, return_5y: 28.92, risk: "High", rating: 5, expense_ratio: 1.25, fund_manager: "Varun Goel" },
  { id: 4, name: "Axis Long Term Equity Fund", category: "ELSS", nav: 72.56, aum: 38920.4, return_1y: 16.82, return_3y: 11.45, return_5y: 15.23, risk: "Moderate-High", rating: 4, expense_ratio: 0.98, fund_manager: "Jinesh Gopani" },
  { id: 5, name: "Mirae Asset Large Cap Fund", category: "Large Cap", nav: 98.23, aum: 42180.6, return_1y: 19.45, return_3y: 13.72, return_5y: 17.28, risk: "Moderate", rating: 5, expense_ratio: 0.85, fund_manager: "Neelesh Surana" },
  { id: 6, name: "Parag Parikh Flexi Cap Fund", category: "Flexi Cap", nav: 62.45, aum: 52340.9, return_1y: 24.56, return_3y: 18.34, return_5y: 21.45, risk: "Moderate-High", rating: 5, expense_ratio: 0.75, fund_manager: "Rajeev Thakkar" },
  { id: 7, name: "Kotak Small Cap Fund", category: "Small Cap", nav: 234.56, aum: 15620.3, return_1y: 38.92, return_3y: 28.45, return_5y: 25.67, risk: "Very High", rating: 4, expense_ratio: 1.45, fund_manager: "Pankaj Tibrewal" },
  { id: 8, name: "Nippon India Growth Fund", category: "Mid Cap", nav: 3250.78, aum: 24580.1, return_1y: 28.34, return_3y: 20.12, return_5y: 18.95, risk: "High", rating: 4, expense_ratio: 1.18, fund_manager: "Manish Gunwani" },
  { id: 9, name: "UTI Nifty 50 Index Fund", category: "Index Fund", nav: 145.23, aum: 18920.5, return_1y: 15.82, return_3y: 11.25, return_5y: 13.45, risk: "Moderate", rating: 4, expense_ratio: 0.20, fund_manager: "Sharwan Goyal" },
  { id: 10, name: "Aditya Birla Sun Life Tax Relief 96", category: "ELSS", nav: 48.92, aum: 16780.4, return_1y: 22.45, return_3y: 15.67, return_5y: 17.82, risk: "Moderate-High", rating: 5, expense_ratio: 1.08, fund_manager: "Anil Shah" }
];

// --- STYLES (Plain CSS) ---

const styles = `
  :root {
    --primary: #0052FF;
    --primary-dark: #0039B3;
    --primary-light: #E0E9FF;
    --bg-app: #F4F6F8;
    --bg-card: #FFFFFF;
    --bg-hover: #F8F9FB;
    --text-main: #303342;
    --text-sub: #7E8296;
    --border: #E8EAED;
    --green: #00C076;
    --green-bg: #E6FAF1;
    --red: #FF4757;
    --red-bg: #FFF0F1;
    --warning: #F5A623;
    --warning-bg: #FFF8E6;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.08);
    --radius: 12px;
    --nav-width: 260px;
    --header-height: 72px;
    --font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --input-bg: #FFFFFF;
  }

  [data-theme="dark"] {
    --primary: #4C85FF;
    --primary-dark: #3A66CC;
    --primary-light: #182235;
    --bg-app: #0D0E12;
    --bg-card: #18191E;
    --bg-hover: #212229;
    --text-main: #EAECEF;
    --text-sub: #8E92A3;
    --border: #2B2D36;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.6);
    --green-bg: rgba(0, 192, 118, 0.15);
    --red-bg: rgba(255, 71, 87, 0.15);
    --warning-bg: rgba(245, 166, 35, 0.15);
    --input-bg: #212229;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; outline: none; }
  
  body {
    font-family: var(--font-family);
    background-color: var(--bg-app);
    color: var(--text-main);
    transition: background-color 0.3s ease, color 0.3s ease;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  /* Animations */
  .fade-in { animation: fadeIn 0.4s ease-out; }
  .slide-up { animation: slideUp 0.4s ease-out; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse-green { 0% { background-color: rgba(0, 192, 118, 0.2); } 100% { background-color: transparent; } }
  @keyframes pulse-red { 0% { background-color: rgba(255, 71, 87, 0.2); } 100% { background-color: transparent; } }

  .flash-green { animation: pulse-green 0.5s ease-out; }
  .flash-red { animation: pulse-red 0.5s ease-out; }

  /* Auth Screens */
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--bg-app) 0%, var(--bg-card) 100%);
    padding: 20px;
  }
  
  .auth-card {
    background: var(--bg-card);
    padding: 40px;
    border-radius: 20px;
    box-shadow: var(--shadow-md);
    width: 100%;
    max-width: 440px;
    border: 1px solid var(--border);
  }

  .auth-input-group { margin-bottom: 20px; }
  .auth-label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem; color: var(--text-main); }
  .auth-input-wrapper { position: relative; }
  .auth-input {
    width: 100%; padding: 12px 16px; padding-left: 44px;
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--input-bg); color: var(--text-main); font-size: 1rem;
    transition: all 0.2s;
  }
  .auth-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
  .auth-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-sub); }

  /* App Layout */
  .app-container { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar {
    width: var(--nav-width);
    background-color: var(--bg-card);
    border-right: 1px solid var(--border);
    position: fixed;
    height: 100vh;
    display: flex;
    flex-direction: column;
    z-index: 100;
  }

  .logo-area {
    height: var(--header-height);
    display: flex;
    align-items: center;
    padding: 0 28px;
    gap: 12px;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.5px;
  }

  .nav-links { flex: 1; padding: 24px 16px; display: flex; flex-direction: column; gap: 8px; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 10px;
    color: var(--text-sub);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    font-size: 0.95rem;
  }

  .nav-item:hover { background-color: var(--bg-hover); color: var(--text-main); }
  .nav-item.active { background-color: var(--primary-light); color: var(--primary); font-weight: 600; }
  
  /* Header */
  .main-content {
    flex: 1;
    margin-left: var(--nav-width);
    padding: 32px;
    padding-top: calc(var(--header-height) + 32px);
    width: 100%;
    /* overflow-x: hidden; */
  }

  .header {
    height: var(--header-height);
    background-color: rgba(var(--bg-card-rgb), 0.85);
    border-bottom: 1px solid var(--border);
    position: fixed;
    top: 0; right: 0; left: var(--nav-width);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    z-index: 90;
    backdrop-filter: blur(12px);
    background: var(--bg-card); /* Fallback */
  }

  .search-bar {
    display: flex;
    align-items: center;
    background-color: var(--bg-app);
    padding: 0 16px;
    border-radius: 12px;
    width: 420px;
    height: 48px;
    border: 1px solid transparent;
    transition: all 0.2s;
  }
  .search-bar:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-light); background: var(--input-bg); }
  .search-input { border: none; background: transparent; flex: 1; margin-left: 12px; font-size: 0.95rem; color: var(--text-main); }

  /* Common UI */
  .card {
    background-color: var(--bg-card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.2s;
    /* overflow: hidden; */
  }
  .card:hover { box-shadow: var(--shadow-md); }

  .section-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }

  .btn {
    padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer;
    border: none; transition: all 0.2s; font-size: 0.95rem;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    white-space: nowrap;
  }
  .btn:active { transform: scale(0.98); }
  .btn-primary { background-color: var(--primary); color: white; box-shadow: 0 4px 12px rgba(0,82,255,0.2); }
  .btn-primary:hover { background-color: var(--primary-dark); box-shadow: 0 6px 16px rgba(0,82,255,0.3); }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
  .btn-outline:hover { border-color: var(--text-main); background: var(--bg-hover); }
  .btn-ghost { background: transparent; color: var(--text-sub); padding: 8px; }
  .btn-ghost:hover { background: var(--bg-hover); color: var(--text-main); }

  .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
  .badge-green { background-color: var(--green-bg); color: var(--green); }
  .badge-red { background-color: var(--red-bg); color: var(--red); }
  .badge-yellow { background-color: var(--warning-bg); color: var(--warning); }
  
  .text-green { color: var(--green) !important; }
  .text-red { color: var(--red) !important; }

  /* Tables */
  .table-wrapper { overflow-x: auto; width: 100%; }
  .data-table { width: 100%; border-collapse: collapse; min-width: 600px; }
  .data-table th { text-align: left; color: var(--text-sub); font-size: 0.85rem; font-weight: 600; padding: 16px; border-bottom: 1px solid var(--border); text-transform: uppercase; letter-spacing: 0.5px; }
  .data-table td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 0.95rem; color: var(--text-main); }
  .data-table tr:hover td { background-color: var(--bg-hover); }

  /* Notification Toast */
  .toast-container {
    position: fixed; bottom: 24px; right: 24px; z-index: 200;
    display: flex; flex-direction: column; gap: 12px; pointer-events: none;
  }
  .toast {
    background: var(--bg-card); border: 1px solid var(--border); padding: 16px;
    border-radius: 12px; box-shadow: var(--shadow-md); min-width: 300px;
    display: flex; gap: 12px; align-items: flex-start;
    animation: slideUp 0.3s ease-out; pointer-events: all;
    border-left: 4px solid var(--primary);
  }
  
  .toast div { color: var(--text-main); }

  /* Arbitrage UI */
  .arb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
  .arb-card { position: relative; overflow: hidden; border-left: 4px solid var(--primary); transition: transform 0.2s; }
  .arb-card:hover { transform: translateY(-4px); }
  .strength-meter { height: 6px; background: var(--border); border-radius: 3px; margin-top: 12px; overflow: hidden; }
  .strength-fill { height: 100%; background: linear-gradient(90deg, var(--warning), var(--green)); border-radius: 3px; }
  
  /* Indices */
  .indices-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px; }
  .portfolio-hero { background: linear-gradient(120deg, var(--primary), #002880); color: white; border: none; padding: 32px; position: relative; overflow: hidden; }
  .portfolio-hero::after { content: ''; position: absolute; top: -60px; right: -60px; width: 240px; height: 240px; background: rgba(255,255,255,0.08); border-radius: 50%; }

  /* Responsive */
  @media (max-width: 1200px) {
    .indices-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 1024px) {
    .main-content { padding: 24px; padding-top: 100px; }
    .indices-grid { grid-template-columns: repeat(2, 1fr); }
  }
  
  @media (max-width: 768px) {
    .sidebar { width: 100%; height: auto; bottom: 0; top: auto; flex-direction: row; border-right: none; border-top: 1px solid var(--border); padding: 0; justify-content: space-around; position: fixed; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); }
    .logo-area { display: none; }
    .nav-links { flex-direction: row; padding: 8px; width: 100%; justify-content: space-around; }
    .nav-item { padding: 8px; border-radius: 8px; flex-direction: column; gap: 4px; font-size: 0.7rem; }
    .nav-item span { display: block; font-size: 0.7rem; }
    .main-content { margin-left: 0; padding: 16px; padding-bottom: 90px; padding-top: 90px; }
    .header { left: 0; padding: 0 16px; }
    .search-bar { display: none; }
    .indices-grid { grid-template-columns: 1fr; }
    .arb-grid { grid-template-columns: 1fr; }
    .dashboard-grid { grid-template-columns: 1fr !important; }
    .portfolio-hero { padding: 20px; }
  }
`;

// --- HELPER COMPONENTS ---

const Sparkline = ({ data, color, width = 80, height = 30 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{overflow: 'visible'}}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) * (width / (data.length - 1))} cy={height - ((data[data.length - 1] - min) / range) * height} r="2.5" fill={color} />
    </svg>
  );
};

// --- HOOKS ---

// Hook to simulate live market data updates - FASTER & SMOOTHER
const useMarketSimulation = (initialStocks, initialOpps, initialIndices) => {
  const [stocks, setStocks] = useState(initialStocks);
  const [opps, setOpps] = useState(initialOpps);
  const [indices, setIndices] = useState(initialIndices);

  useEffect(() => {
    // Faster interval for realism (800ms)
    const interval = setInterval(() => {
      // 1. Update Stocks with slightly higher volatility
      setStocks(prev => prev.map(stock => {
        const volatility = 0.008; // Increased volatility
        const changePct = (Math.random() * volatility * 2) - volatility; 
        const newPrice = Math.max(0.05, stock.price * (1 + changePct));
        const newChange = parseFloat(stock.change) + (changePct * 100);
        
        return {
          ...stock,
          price: newPrice,
          change: newChange.toFixed(2),
          isUp: newChange >= 0,
          chartData: [...stock.chartData.slice(1), newPrice]
        };
      }));

      // 2. Update Arbitrage with Trend Logic
      setOpps(prev => prev.map(opp => {
        const volatility = 0.005;
        const buyShift = (Math.random() * volatility * 2) - volatility;
        const sellShift = (Math.random() * volatility * 2) - volatility;
        
        const newBuy = Math.max(0.05, opp.buyPrice * (1 + buyShift));
        const newSell = Math.max(0.05, opp.sellPrice * (1 + sellShift));
        const spread = newSell - newBuy;
        const roi = ((spread / newBuy) * 100).toFixed(2);
        
        // Determine spread trend
        const isSpreadIncreasing = spread > opp.spread;

        return {
          ...opp,
          buyPrice: newBuy,
          sellPrice: newSell,
          spread: spread,
          roi: `${roi}%`,
          strength: Math.min(100, Math.max(10, Math.floor(parseFloat(roi) * 100) + 50)),
          trend: isSpreadIncreasing ? 'up' : 'down'
        };
      }));

      // 3. Update Indices
      setIndices(prev => prev.map(idx => ({
        ...idx,
        value: idx.value * (1 + (Math.random() * 0.003 - 0.0015))
      })));

    }, 800); // 800ms update for lively market feel

    return () => clearInterval(interval);
  }, []);

  return { stocks, opps, indices };
};

// --- AUTHENTICATION COMPONENTS ---

const LoginView = ({ onLogin, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin({ name: 'Alexander Pierce', email: email || 'user@arbitredge.com' });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px'}}>ArbitrEdge</h1>
          <p style={{color: 'var(--text-sub)'}}>Enterprise Grade Trading Intelligence</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-icon" size={18} />
              <input 
                type="email" 
                className="auth-input" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-icon" size={18} />
              <input 
                type="password" 
                className="auth-input" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginBottom: '16px'}}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>
        <div style={{textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-sub)'}}>
          Don't have an account? <span onClick={onSwitchToRegister} style={{color: 'var(--primary)', fontWeight: 600, cursor: 'pointer'}}>Register Now</span>
        </div>
      </div>
    </div>
  );
};

const RegisterView = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister({ name: formData.name, email: formData.email });
  };

  return (
    <div className="auth-container slide-up">
      <div className="auth-card">
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px'}}>ArbitrEdge</h1>
          <p style={{color: 'var(--text-sub)'}}>Create your professional account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Full Name</label>
            <div className="auth-input-wrapper">
              <UserIcon className="auth-icon" size={18} />
              <input 
                type="text" 
                className="auth-input" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-icon" size={18} />
              <input 
                type="email" 
                className="auth-input" 
                placeholder="name@company.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-icon" size={18} />
              <input 
                type="password" 
                className="auth-input" 
                placeholder="Create a strong password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{width: '100%', marginBottom: '16px'}}>
            Create Account
          </button>
        </form>
        <div style={{textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-sub)'}}>
          Already have an account? <span onClick={onSwitchToLogin} style={{color: 'var(--primary)', fontWeight: 600, cursor: 'pointer'}}>Sign In</span>
        </div>
      </div>
    </div>
  );
};

// --- MAIN CONTENT COMPONENTS ---

const DashboardView = ({ stocks, indices, holdings, onStockClick }) => {
  const totalValue = holdings.reduce((acc, h) => {
    const stock = stocks.find(s => s.symbol === h.symbol) || { price: h.avg };
    return acc + (stock.price * h.qty);
  }, 0);
  
  const investedValue = holdings.reduce((acc, h) => acc + (h.avg * h.qty), 0);
  const totalPnL = totalValue - investedValue;
  const totalPnLPct = investedValue > 0 ? (totalPnL / investedValue) * 100 : 0;

  return (
  <div className="fade-in">
    <div className="section-title">Market Overview</div>
    <div className="indices-grid">
      {indices.map((idx, i) => {
        const isUp = Math.random() > 0.4;
        return (
          <div key={i} className="card index-card" style={{padding: '24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px'}}>
              <span style={{fontWeight:600, color:'var(--text-sub)'}}>{idx.name}</span>
              {isUp ? <TrendingUp size={20} className="text-green"/> : <TrendingDown size={20} className="text-red"/>}
            </div>
            <div style={{fontSize:'1.75rem', fontWeight:700, letterSpacing: '-0.5px'}}>{idx.value.toFixed(2)}</div>
            <div className={isUp ? 'text-green' : 'text-red'} style={{fontSize:'0.9rem', fontWeight:600, marginTop:'4px'}}>
              {isUp ? '+' : '-'}{(Math.random() * 100).toFixed(2)} ({(Math.random()).toFixed(2)}%)
            </div>
          </div>
        )
      })}
    </div>

    <div className="dashboard-grid" style={{display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
        <div className="card portfolio-hero">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', position: 'relative', zIndex: 2, flexWrap: 'wrap', gap: '20px'}}>
            <div>
              <div style={{color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: '8px'}}>Total Portfolio Value</div>
              <div style={{fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px'}}>₹{totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div style={{fontSize: '0.95rem', marginTop: '8px', fontWeight: 500, color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.1)', width: 'fit-content', padding: '4px 12px', borderRadius: '20px'}}>
                {totalPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />} 
                {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toFixed(2)} ({totalPnLPct.toFixed(2)}%)
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{opacity: 0.8, fontSize: '0.9rem'}}>Invested Amount</div>
              <div style={{fontSize: '1.4rem', fontWeight: 600}}>₹{investedValue.toLocaleString()}</div>
            </div>
          </div>
          <div style={{marginTop: '40px', display: 'flex', gap: '16px', position: 'relative', zIndex: 2}}>
             <button className="btn" style={{background:'rgba(255,255,255,0.2)', color:'white', border: '1px solid rgba(255,255,255,0.3)'}}>
               <Plus size={18} /> Add Funds
             </button>
             <button className="btn" style={{background:'white', color:'var(--primary)'}}>
               <ArrowRight size={18} /> Analytics
             </button>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <span>Portfolio Holdings</span>
            <button className="btn btn-ghost btn-sm">View All <ArrowRight size={16} /></button>
          </div>
          <div className="table-wrapper">
          {holdings.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px 0', color: 'var(--text-sub)'}}>
              Your portfolio is empty. <br/>Start trading to see your holdings here.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th style={{textAlign:'right'}}>Qty</th>
                  <th style={{textAlign:'right'}}>Avg Price</th>
                  <th style={{textAlign:'right'}}>LTP</th>
                  <th style={{textAlign:'right'}}>P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const stock = stocks.find(s => s.symbol === h.symbol) || { price: h.avg, change: 0 };
                  const pnl = (stock.price - h.avg) * h.qty;
                  const pnlPercent = ((stock.price - h.avg) / h.avg) * 100;
                  return (
                    <tr key={h.id} style={{cursor: 'pointer'}} onClick={() => onStockClick(stock)}>
                      <td>
                        <div style={{fontWeight:600}}>{h.symbol}</div>
                        <div style={{fontSize:'0.8rem', color:'var(--text-sub)'}}>Invested</div>
                      </td>
                      <td style={{textAlign:'right'}}>{h.qty}</td>
                      <td style={{textAlign:'right'}}>₹{h.avg.toFixed(2)}</td>
                      <td style={{textAlign:'right', fontWeight: 600}}>₹{stock.price.toFixed(2)}</td>
                      <td className={pnl >= 0 ? 'text-green' : 'text-red'} style={{textAlign:'right', fontWeight:600}}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)} <span style={{fontSize:'0.8rem', opacity: 0.8}}>({pnlPercent.toFixed(2)}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </div>

      <div className="card" style={{height: 'fit-content'}}>
        <div className="section-title">My Watchlist</div>
        {stocks.slice(0, 6).map(s => (
          <div key={s.id} onClick={() => onStockClick(s)} style={{padding:'16px 0', borderBottom:'1px solid var(--border)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontWeight:600, marginBottom: '2px'}}>{s.symbol}</div>
              <div style={{fontSize:'0.8rem', color:'var(--text-sub)'}}>{s.name}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontWeight:600}}>₹{s.price.toFixed(2)}</div>
              <div className={s.isUp ? 'text-green' : 'text-red'} style={{fontSize:'0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'}}>
                {s.isUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {s.change}%
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-outline" style={{width:'100%', marginTop:'20px'}}>+ Add New</button>
      </div>
    </div>
  </div>
  );
};

const ArbitrageView = ({ opps, onTrade }) => {
  const [filter, setFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  
  const filteredOpps = useMemo(() => {
    let result = opps.filter(o => {
      if (filter === 'All') return true;
      if (filter === 'High Profit') return parseFloat(o.roi) > 0.5;
      if (filter === 'Low Risk') return o.risk === 'Low';
      if (filter === 'High Volume') return o.vol === 'High';
      if (filter === 'Expiring Soon') return o.expiry === 'Instant' || o.expiry === 'Today';
      return true;
    });
    // Sort by Opportunity Strength
    return result.sort((a,b) => b.strength - a.strength);
  }, [opps, filter]);

  const bestOpp = filteredOpps[0] || {};
  const avgSpread = (filteredOpps.reduce((acc, curr) => acc + curr.spread, 0) / (filteredOpps.length || 1)).toFixed(2);
  const highestProfit = Math.max(...filteredOpps.map(o => parseFloat(o.roi) || 0)).toFixed(2);

  return (
    <div className="slide-up">
      <div style={{background: 'linear-gradient(90deg, var(--bg-card), var(--bg-app))', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '24px'}}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: '16px'}}>
          <div>
            <div className="badge badge-green" style={{marginBottom: '8px', width: 'fit-content', display: 'flex', gap: '4px', alignItems: 'center'}}>
               <Zap size={12} fill="currentColor"/> LIVE SCANNER ACTIVE
            </div>
            <h1 style={{fontSize:'1.8rem', fontWeight: 800, marginBottom:'4px', color: 'var(--text-main)'}}>Institutional Arbitrage Desk</h1>
          </div>
          <div style={{display: 'flex', gap: '32px', flexWrap: 'wrap'}}>
             <div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 500}}>Live Opps</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700}}>{filteredOpps.length}</div>
             </div>
             <div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 500}}>Highest Profit</div>
                <div className="text-green" style={{fontSize: '1.5rem', fontWeight: 700}}>{highestProfit}%</div>
             </div>
             <div>
                <div style={{fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 500}}>Avg Spread</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700}}>₹{avgSpread}</div>
             </div>
          </div>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px'}}>
        <div style={{display:'flex', gap:'12px', overflowX: 'auto', paddingBottom: '4px'}}>
          {['All', 'High Profit', 'Low Risk', 'High Volume', 'Expiring Soon'].map(f => (
            <button 
              key={f} 
              className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
              style={{borderRadius:'20px', padding:'8px 20px', whiteSpace: 'nowrap', fontSize: '0.85rem'}}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{display: 'flex', gap: '8px', border: '1px solid var(--border)', padding: '4px', borderRadius: '8px'}}>
          <button onClick={() => setViewMode('table')} className="btn" style={{padding: '8px', background: viewMode === 'table' ? 'var(--bg-hover)' : 'transparent'}}><List size={18} /></button>
          <button onClick={() => setViewMode('card')} className="btn" style={{padding: '8px', background: viewMode === 'card' ? 'var(--bg-hover)' : 'transparent'}}><LayoutGrid size={18} /></button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="card" style={{padding: 0, overflow: 'hidden'}}>
          <div className="table-wrapper">
            <table className="data-table" style={{fontSize: '0.9rem'}}>
              <thead style={{background: 'var(--bg-hover)'}}>
                <tr>
                  <th style={{paddingLeft: '24px'}}>Rank</th>
                  <th>Symbol</th>
                  <th>Strategy</th>
                  <th>Buy Ex</th>
                  <th>Sell Ex</th>
                  <th style={{textAlign: 'right'}}>Spread</th>
                  <th style={{textAlign: 'right'}}>ROI</th>
                  <th style={{textAlign: 'center'}}>Risk</th>
                  <th style={{paddingRight: '24px'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpps.map((opp, idx) => (
                  <tr key={opp.id} style={{background: idx === 0 && filter === 'All' ? 'var(--warning-bg)' : 'transparent'}}>
                     <td style={{paddingLeft: '24px'}}>
                        {idx === 0 ? <Award className="text-green" size={20} /> : <span style={{fontWeight:600, color: 'var(--text-sub)', marginLeft: '4px'}}>#{idx+1}</span>}
                     </td>
                    <td style={{fontWeight: 600}}>
                      {opp.symbol}
                      {idx === 0 && <span style={{marginLeft: '8px', fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle'}}>TOP</span>}
                    </td>
                    <td>{opp.type}</td>
                    <td className="text-green" style={{fontWeight: 500}}>₹{opp.buyPrice.toFixed(2)} <span style={{fontSize: '0.75rem', color: 'var(--text-sub)'}}>({opp.buyEx})</span></td>
                    <td className="text-red" style={{fontWeight: 500}}>₹{opp.sellPrice.toFixed(2)} <span style={{fontSize: '0.75rem', color: 'var(--text-sub)'}}>({opp.sellEx})</span></td>
                    <td className="text-green" style={{textAlign: 'right', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'}}>
                      {opp.trend === 'up' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} +₹{opp.spread.toFixed(2)}
                    </td>
                    <td style={{textAlign: 'right', fontWeight: 600}}>{opp.roi}</td>
                    <td style={{textAlign: 'center'}}>
                      <span className={`badge ${opp.risk === 'Low' ? 'badge-green' : opp.risk === 'Med' ? 'badge-yellow' : 'badge-red'}`}>{opp.risk}</span>
                    </td>
                    <td style={{paddingRight: '24px'}}>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button className="btn btn-primary" style={{padding: '6px 12px', fontSize: '0.8rem', flex: 1}} onClick={() => onTrade(opp, 'Arbitrage')}>Execute</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="arb-grid">
          {filteredOpps.map((opp, idx) => (
            <div key={opp.id} className="card arb-card" style={{borderColor: idx === 0 ? 'var(--green)' : 'transparent', borderWidth: idx===0 ? '2px' : '0px', borderLeftWidth: '4px'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <div className="badge badge-yellow" style={{fontSize: '0.7rem'}}>{opp.type}</div>
                <div style={{color:'var(--text-sub)', fontSize:'0.85rem', display: 'flex', gap: '4px', alignItems: 'center'}}>
                   <Clock size={14} /> {opp.expiry}
                </div>
              </div>
              
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
                <div>
                   <div style={{fontSize:'1.3rem', fontWeight:800, marginBottom: '4px', display:'flex', alignItems:'center', gap: '8px'}}>
                     {opp.symbol}
                     {idx === 0 && <Award size={18} className="text-green" />}
                   </div>
                   <div style={{fontSize:'0.8rem', color: 'var(--text-sub)'}}>{opp.vol} Volume</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'0.8rem', color:'var(--text-sub)', marginBottom: '2px'}}>Net Spread</div>
                  <div className="text-green" style={{fontWeight:800, fontSize:'1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'}}>
                    {opp.trend === 'up' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>} +₹{opp.spread.toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{marginBottom:'24px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.85rem', marginBottom:'6px'}}>
                  <span style={{fontWeight: 500, color: 'var(--text-sub)'}}>Opportunity Strength</span>
                  <span style={{fontWeight:700}}>{opp.strength}%</span>
                </div>
                <div className="strength-meter">
                  <div className="strength-fill" style={{width: `${opp.strength}%`, background: opp.strength > 80 ? 'var(--green)' : 'var(--warning)'}}></div>
                </div>
              </div>

              <div style={{display: 'flex', gap: '8px'}}>
                 <button className="btn btn-primary" style={{flex: 1}} onClick={() => onTrade(opp, 'Arbitrage')}>Execute</button>
                 <button className="btn btn-outline" style={{padding: '0 12px'}}><Eye size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrdersView = ({ orders }) => {
  const [activeTab, setActiveTab] = useState('Equity');
  const filteredOrders = orders.filter(o => activeTab === 'Equity' ? o.type !== 'Arbitrage' : o.type === 'Arbitrage');

  return (
    <div className="fade-in card">
      <div className="section-title">Order History</div>
      <div style={{display:'flex', gap:'24px', borderBottom:'1px solid var(--border)', marginBottom:'24px'}}>
        {['Equity', 'Arbitrage'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{padding:'16px 0', background:'none', border:'none', borderBottom: t===activeTab ? '3px solid var(--primary)' : '3px solid transparent', color: t===activeTab ? 'var(--primary)' : 'var(--text-sub)', fontWeight:600, cursor:'pointer', fontSize: '1rem'}}>{t} Orders</button>
        ))}
      </div>
      
      {filteredOrders.length === 0 ? (
        <div style={{textAlign: 'center', padding: '60px', color: 'var(--text-sub)'}}>No {activeTab.toLowerCase()} orders executed yet.</div>
      ) : (
        <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Symbol</th>
              <th>Type</th>
              <th>Action</th>
              <th style={{textAlign: 'right'}}>Price</th>
              <th style={{textAlign: 'right'}}>P&L (Sim)</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <tr key={o.id}>
                <td style={{color: 'var(--text-sub)', fontSize: '0.85rem'}}>{new Date(o.id).toLocaleTimeString()}</td>
                <td style={{fontWeight: 600}}>{o.symbol}</td>
                <td>{o.strategy || 'Limit'}</td>
                <td style={{fontWeight: 600}} className={o.action === 'Buy' || o.action === 'Arbitrage' ? 'text-green' : 'text-red'}>{o.action}</td>
                <td style={{textAlign: 'right', fontWeight: 600}}>₹{o.price}</td>
                <td className={o.isProfit ? 'text-green' : 'text-red'} style={{textAlign: 'right', fontWeight: 600}}>{o.pnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

const MutualFundsView = () => {
  const [funds, setFunds] = useState(MUTUAL_FUNDS);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('return_1y');

  const categories = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'ELSS', 'Flexi Cap', 'Index Fund', 'Sectoral - Technology'];

  const filteredFunds = useMemo(() => {
    let result = filterCategory === 'All' ? funds : funds.filter(f => f.category === filterCategory);
    return result.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [funds, filterCategory, sortBy]);

  const getRiskColor = (risk) => {
    if (risk === 'Moderate' || risk === 'Low') return 'var(--green)';
    if (risk === 'Moderate-High') return 'var(--warning)';
    return 'var(--red)';
  };

  const getRatingStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="fade-in">
      <div className="card" style={{marginBottom: '24px'}}>
        <div className="section-title" style={{marginBottom: '20px'}}>Indian Mutual Funds</div>
        
        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center'}}>
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1}}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '8px 16px',
                  background: filterCategory === cat ? 'var(--primary)' : 'var(--bg-hover)',
                  color: filterCategory === cat ? '#fff' : 'var(--text-main)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="return_1y">1Y Returns</option>
            <option value="return_3y">3Y Returns</option>
            <option value="return_5y">5Y Returns</option>
            <option value="aum">AUM</option>
            <option value="expense_ratio">Expense Ratio</option>
          </select>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px'}}>
        {filteredFunds.map(fund => (
          <div key={fund.id} className="card" style={{padding: '20px', position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', top: 0, right: 0, background: 'var(--primary-light)', padding: '6px 12px', borderBottomLeftRadius: '8px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600}}>
              {fund.category}
            </div>
            
            <div style={{marginTop: '8px'}}>
              <h3 style={{fontSize: '1.1rem', marginBottom: '6px', color: 'var(--text-main)', fontWeight: 600}}>{fund.name}</h3>
              <div style={{fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px'}}>
                Managed by {fund.fund_manager}
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', marginBottom: '16px'}}>
              <div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px'}}>NAV</div>
                <div style={{fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)'}}>₹{fund.nav.toFixed(2)}</div>
              </div>
              <div style={{textAlign: 'right'}}>
                <div style={{fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px'}}>1Y Return</div>
                <div style={{fontSize: '1.3rem', fontWeight: 700, color: fund.return_1y > 15 ? 'var(--green)' : 'var(--warning)'}}>
                  {fund.return_1y > 0 ? '+' : ''}{fund.return_1y.toFixed(2)}%
                </div>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px'}}>
              <div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px'}}>3Y Return</div>
                <div style={{fontSize: '0.95rem', fontWeight: 600, color: fund.return_3y > 12 ? 'var(--green)' : 'var(--text-main)'}}>
                  {fund.return_3y > 0 ? '+' : ''}{fund.return_3y.toFixed(2)}%
                </div>
              </div>
              <div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px'}}>5Y Return</div>
                <div style={{fontSize: '0.95rem', fontWeight: 600, color: fund.return_5y > 14 ? 'var(--green)' : 'var(--text-main)'}}>
                  {fund.return_5y > 0 ? '+' : ''}{fund.return_5y.toFixed(2)}%
                </div>
              </div>
              <div>
                <div style={{fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '4px'}}>AUM</div>
                <div style={{fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)'}}>
                  ₹{(fund.aum / 1000).toFixed(1)}K Cr
                </div>
              </div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-sub)'}}>Risk</div>
                  <div style={{fontSize: '0.9rem', fontWeight: 600, color: getRiskColor(fund.risk)}}>{fund.risk}</div>
                </div>
                <div style={{borderLeft: '1px solid var(--border)', paddingLeft: '12px'}}>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-sub)'}}>Rating</div>
                  <div style={{fontSize: '1rem', color: 'var(--warning)'}}>{getRatingStars(fund.rating)}</div>
                </div>
                <div style={{borderLeft: '1px solid var(--border)', paddingLeft: '12px'}}>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-sub)'}}>Expense</div>
                  <div style={{fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)'}}>{fund.expense_ratio}%</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFunds.length === 0 && (
        <div className="card" style={{textAlign: 'center', padding: '60px'}}>
          <div style={{fontSize: '3rem', marginBottom: '16px'}}>🔍</div>
          <div style={{color: 'var(--text-sub)'}}>No funds found matching your criteria</div>
        </div>
      )}
    </div>
  );
};

const StocksView = ({ stocks, onStockClick, onTrade }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('name');
  
  const filteredStocks = useMemo(() => {
    let result = stocks.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sort === 'price') result.sort((a,b) => b.price - a.price);
    if (sort === 'change') result.sort((a,b) => parseFloat(b.change) - parseFloat(a.change));
    return result;
  }, [searchTerm, sort, stocks]);

  return (
    <div className="fade-in card">
      <div className="section-title" style={{flexWrap: 'wrap', gap: '16px'}}>
        <span>NIFTY 50 Stocks</span>
        <div style={{display:'flex', gap:'12px', flexWrap: 'wrap'}}>
          <div className="search-bar" style={{width: '280px', background:'var(--bg-app)', border: '1px solid var(--border)'}}>
            <Search size={16} color="var(--text-sub)" />
            <input 
              placeholder="Search stocks..." 
              className="search-input" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{padding:'8px 16px'}} onClick={() => setSort(s => s === 'price' ? 'name' : 'price')}>
             <Filter size={16} /> Price
          </button>
          <button className="btn btn-outline" style={{padding:'8px 16px'}} onClick={() => setSort(s => s === 'change' ? 'name' : 'change')}>
             <TrendingUp size={16} /> Gainers
          </button>
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Sector</th>
              <th style={{textAlign:'right'}}>Price</th>
              <th style={{textAlign:'right'}}>Change</th>
              <th style={{textAlign:'right'}}>7 Day Trend</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map(stock => (
              <tr key={stock.id} style={{cursor:'pointer'}} onClick={() => onStockClick(stock)}>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
                     <div style={{width:'42px', height:'42px', borderRadius:'10px', background:'var(--bg-app)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', border: '1px solid var(--border)'}}>
                       {stock.symbol[0]}
                     </div>
                     <div>
                       <div style={{fontWeight:600, color:'var(--text-main)'}}>{stock.symbol}</div>
                       <div style={{fontSize:'0.85rem', color:'var(--text-sub)'}}>{stock.name}</div>
                     </div>
                  </div>
                </td>
                <td><span className="badge" style={{background:'var(--bg-app)', color:'var(--text-sub)', border:'1px solid var(--border)'}}>{stock.sector}</span></td>
                <td style={{textAlign:'right', fontWeight:600}}>₹{stock.price.toFixed(2)}</td>
                <td className={stock.isUp ? 'text-green' : 'text-red'} style={{textAlign:'right', fontWeight:500}}>{stock.change}%</td>
                <td style={{textAlign:'right'}}>
                  <div style={{display:'flex', justifyContent:'flex-end'}}>
                    <Sparkline data={stock.chartData} color={stock.isUp ? 'var(--green)' : 'var(--red)'} />
                  </div>
                </td>
                <td style={{textAlign:'right'}}>
                  <button 
                    className="btn btn-outline btn-sm" 
                    style={{borderRadius:'20px'}}
                    onClick={(e) => { e.stopPropagation(); onTrade(stock, 'Buy'); }}
                  >
                    Trade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockDetailView = ({ stock, onBack, onTrade }) => {
  if (!stock) return null;
  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn btn-ghost" style={{marginBottom:'20px', paddingLeft:0}}>
        <ArrowRight size={18} style={{transform: 'rotate(180deg)'}} /> Back to Stocks
      </button>

      <div className="card" style={{marginBottom:'32px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'40px', flexWrap: 'wrap', gap: '20px'}}>
          <div style={{display:'flex', gap:'24px', alignItems:'center'}}>
            <div style={{width:'72px', height:'72px', borderRadius:'16px', background:'var(--bg-app)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'2rem', border:'1px solid var(--border)'}}>
               {stock.symbol[0]}
            </div>
            <div>
              <h1 style={{fontSize:'2.2rem', fontWeight:800, marginBottom:'4px'}}>{stock.name}</h1>
              <div style={{color:'var(--text-sub)', display:'flex', gap:'8px', alignItems:'center', fontSize: '1rem'}}>
                {stock.symbol} <span style={{width:'4px', height:'4px', background:'var(--text-sub)', borderRadius:'50%'}}></span> NSE
              </div>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'2.5rem', fontWeight:800}}>₹{stock.price.toFixed(2)}</div>
            <div className={stock.isUp ? 'text-green' : 'text-red'} style={{fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'8px', fontWeight: 600}}>
              {stock.isUp ? <TrendingUp size={20}/> : <TrendingDown size={20}/>} {stock.change}%
            </div>
          </div>
        </div>

        {/* Big Chart Area */}
        <div style={{height:'400px', background:'var(--bg-app)', borderRadius:'16px', position:'relative', overflow:'hidden', marginBottom:'32px', border: '1px solid var(--border)'}}>
           <div style={{position:'absolute', top:'20px', left:'20px', display:'flex', gap:'8px'}}>
             {['1D', '1W', '1M', '1Y', '5Y'].map((t,i) => (
               <button key={t} style={{padding:'6px 12px', borderRadius:'8px', border:'none', background: i===2 ? 'var(--bg-card)' : 'transparent', fontWeight:600, fontSize:'0.85rem', boxShadow: i===2 ? 'var(--shadow-sm)' : 'none', cursor:'pointer', color: 'var(--text-main)'}}>{t}</button>
             ))}
           </div>
           <svg width="100%" height="100%" viewBox="0 0 1000 350" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                   <stop offset="0%" stopColor={stock.isUp ? "var(--green)" : "var(--red)"} stopOpacity="0.1"/>
                   <stop offset="100%" stopColor={stock.isUp ? "var(--green)" : "var(--red)"} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,300 C200,280 400,320 600,200 S800,100 1000,150 L1000,350 L0,350 Z" fill="url(#chartFill)" />
              <path d="M0,300 C200,280 400,320 600,200 S800,100 1000,150" fill="none" stroke={stock.isUp ? 'var(--green)' : 'var(--red)'} strokeWidth="3" vectorEffect="non-scaling-stroke" />
           </svg>
        </div>

        <div style={{display:'flex', gap:'32px', borderBottom:'1px solid var(--border)', marginBottom:'32px'}}>
          {['Overview', 'News', 'Financials', 'Holdings'].map((t, i) => (
             <button key={t} style={{padding:'16px 0', background:'none', border:'none', borderBottom: i===0 ? '3px solid var(--primary)' : '3px solid transparent', color: i===0 ? 'var(--primary)' : 'var(--text-sub)', fontWeight:600, cursor:'pointer', fontSize: '1rem'}}>{t}</button>
          ))}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'32px'}}>
          <div>
            <div className="section-title">Fundamentals</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
              {[
                {l:'Market Cap', v:'₹18,50,200 Cr'}, {l:'P/E Ratio', v:'24.50'},
                {l:'P/B Ratio', v:'4.20'}, {l:'Dividend Yield', v:'0.85%'},
                {l:'Sector P/E', v:'28.10'}, {l:'Book Value', v:'₹450.20'}
              ].map(f => (
                <div key={f.l} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--text-sub)'}}>{f.l}</span>
                  <span style={{fontWeight:600}}>{f.v}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{background:'var(--bg-app)', padding:'32px', borderRadius:'16px', height:'fit-content', border: '1px solid var(--border)'}}>
             <div className="section-title">Execute Order</div>
             <div style={{marginBottom:'20px'}}>
                <label style={{display:'block', fontSize:'0.9rem', color:'var(--text-sub)', marginBottom:'8px', fontWeight: 500}}>Quantity (Shares)</label>
                <input type="number" defaultValue="1" style={{width:'100%', padding:'16px', borderRadius:'10px', border:'1px solid var(--border)', outline:'none', fontSize:'1.1rem', background: 'var(--input-bg)', color: 'var(--text-main)'}} />
             </div>
             <div style={{marginBottom:'32px'}}>
                <label style={{display:'block', fontSize:'0.9rem', color:'var(--text-sub)', marginBottom:'8px', fontWeight: 500}}>Limit Price</label>
                <input type="number" value={stock.price.toFixed(2)} readOnly style={{width:'100%', padding:'16px', borderRadius:'10px', border:'1px solid var(--border)', outline:'none', fontSize:'1.1rem', background: 'var(--input-bg)', color: 'var(--text-main)'}} />
             </div>
             <div style={{display:'flex', gap:'16px'}}>
               <button onClick={() => onTrade(stock, 'Buy')} className="btn" style={{flex:1, background:'var(--green)', color: 'white', fontSize: '1.1rem', padding: '16px'}}>BUY</button>
               <button onClick={() => onTrade(stock, 'Sell')} className="btn" style={{flex:1, background:'var(--red)', color: 'white', fontSize: '1.1rem', padding: '16px'}}>SELL</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function ArbitrEdge() {
  const [theme, setTheme] = useState('light');
  const [authView, setAuthView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [orders, setOrders] = useState([]);

  // Use Dynamic Market Data Simulation
  const { stocks, opps, indices } = useMarketSimulation(INITIAL_STOCKS, INITIAL_ARBITRAGE_OPPS, INDICES_INITIAL);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogin = (userData) => { setUser(userData); setAuthView('app'); setView('dashboard'); };
  const handleRegister = (userData) => { setUser(userData); setAuthView('app'); setView('dashboard'); };

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setView('detail');
    window.scrollTo(0,0);
  };

  const handleTrade = (asset, type) => {
    const isArbitrage = type === 'Arbitrage';
    const price = isArbitrage ? asset.spread : asset.price;
    const qty = isArbitrage ? 1 : 10; // Default mock qty
    
    // Simulate execution price with minimal slippage
    const executionPrice = parseFloat(price * (isArbitrage ? 1 : (Math.random() > 0.5 ? 1.001 : 0.999))).toFixed(2);
    
    // Simulating P&L for the notification and order history
    const pnlVal = (Math.random() * 50 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2);
    const isProfit = isArbitrage || pnlVal > 0;
    
    // 1. Create Order Record
    const newOrder = {
      id: Date.now(),
      symbol: asset.symbol,
      type: isArbitrage ? 'Arbitrage' : 'Equity',
      strategy: type, // 'Buy', 'Sell', 'Arbitrage'
      action: isArbitrage ? 'Arbitrage' : type,
      price: executionPrice,
      qty: qty,
      pnl: isArbitrage ? `+₹${asset.spread.toFixed(2)}` : `${pnlVal > 0 ? '+' : ''}₹${pnlVal}`,
      isProfit: isProfit
    };
    
    setOrders(prev => [newOrder, ...prev]);

    // 2. Update Holdings (Only for Buy Equity)
    if (type === 'Buy') {
      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === asset.symbol);
        if (existing) {
          // Weighted Average Price Calculation
          const totalCost = (existing.qty * existing.avg) + (qty * parseFloat(executionPrice));
          const totalQty = existing.qty + qty;
          const newAvg = totalCost / totalQty;
          return prev.map(h => h.symbol === asset.symbol ? { ...h, qty: totalQty, avg: newAvg } : h);
        } else {
          return [...prev, { id: Date.now(), symbol: asset.symbol, qty: qty, avg: parseFloat(executionPrice) }];
        }
      });
    }

    // 3. Notification
    const notif = {
      id: Date.now(),
      title: `${isArbitrage ? 'Arbitrage' : 'Order'} Executed`,
      msg: `${type === 'Arbitrage' ? 'Locked Spread' : type} ${qty} ${asset.symbol} @ ₹${executionPrice}`,
      pnl: newOrder.pnl,
      isProfit: isProfit
    };

    setNotifications(prev => [...prev, notif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 4000);
  };

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'stocks', icon: Activity, label: 'Stocks' },
    { id: 'arbitrage', icon: Zap, label: 'Arbitrage' },
    { id: 'mutual', icon: PieChart, label: 'Mutual Funds' },
    { id: 'orders', icon: List, label: 'Orders' },
  ];

  if (authView === 'login') return <><style>{styles}</style><LoginView onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} /></>;
  if (authView === 'register') return <><style>{styles}</style><RegisterView onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} /></>;

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        
        {/* Notifications */}
        <div className="toast-container">
          {notifications.map(n => (
            <div key={n.id} className="toast" style={{borderLeftColor: n.isProfit ? 'var(--green)' : 'var(--red)'}}>
               <CheckCircle size={24} className={n.isProfit ? 'text-green' : 'text-red'} />
               <div>
                 <div style={{fontWeight: 600, fontSize: '0.9rem'}}>{n.title}</div>
                 <div style={{fontSize: '0.85rem', color: 'var(--text-sub)'}}>{n.msg}</div>
                 <div className={n.isProfit ? 'text-green' : 'text-red'} style={{fontWeight: 700, marginTop: '4px'}}>
                   P&L: {n.pnl}
                 </div>
               </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <nav className="sidebar">
          <div className="logo-area">
            <span style={{color:'var(--primary)'}}>Arbitr</span>Edge.
          </div>
          <div className="nav-links">
            {navItems.map(item => (
              <div 
                key={item.id} 
                className={`nav-item ${view === item.id || (item.id === 'stocks' && view === 'detail') ? 'active' : ''}`}
                onClick={() => { setView(item.id); setSelectedStock(null); window.scrollTo(0,0); }}
              >
                <item.icon size={20} /> <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{padding:'24px', marginTop:'auto', borderTop:'1px solid var(--border)'}}>
            <div className="card" style={{padding:'12px', display:'flex', alignItems:'center', gap:'12px', background:'var(--bg-app)', border:'none', cursor: 'pointer', transition: 'background 0.2s'}} onClick={() => { setUser(null); setAuthView('login'); }}>
               <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'var(--primary-dark)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 600}}>
                 {user?.name?.charAt(0) || 'U'}
               </div>
               <div style={{flex:1, overflow: 'hidden'}}>
                 <div style={{fontSize:'0.9rem', fontWeight:600, whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{user?.name}</div>
                 <div style={{fontSize:'0.75rem', color:'var(--text-sub)'}}>Sign Out</div>
               </div>
               <LogOut size={16} color="var(--text-sub)" />
            </div>
          </div>
        </nav>

        {/* Header */}
        <header className="header">
          <div className="search-bar">
            <Search size={18} color="var(--text-sub)" />
            <input type="text" className="search-input" placeholder="Search stocks, indices, derivatives..." />
            <span style={{color:'var(--text-sub)', fontSize:'0.8rem', marginRight:'8px', fontWeight: 600}}>⌘K</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
            <button className="btn btn-outline" style={{padding:'10px', border:'none', borderRadius: '50%'}} onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div style={{position:'relative'}}>
              <Bell size={20} color="var(--text-main)" style={{cursor:'pointer'}} />
              <div style={{position:'absolute', top: 0, right: 0, width:'8px', height:'8px', borderRadius:'50%', background:'var(--red)', border: '2px solid var(--bg-card)'}}></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {view === 'dashboard' && <DashboardView stocks={stocks} indices={indices} holdings={holdings} onStockClick={handleStockClick} />}
          {view === 'stocks' && <StocksView stocks={stocks} onStockClick={handleStockClick} onTrade={handleTrade} />}
          {view === 'arbitrage' && <ArbitrageView opps={opps} onTrade={handleTrade} />}
          {view === 'detail' && <StockDetailView stock={selectedStock} onBack={() => setView('stocks')} onTrade={handleTrade} />}
          {view === 'orders' && <OrdersView orders={orders} />}
          {view === 'mutual' && <MutualFundsView />}
        </main>
      </div>
    </>
  );
}