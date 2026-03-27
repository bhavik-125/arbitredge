"""
Utility functions for the Q-Learning Arbitrage Trading System.
Includes data preprocessing, metrics calculation, and helper functions.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import json


@dataclass
class TradeMetrics:
    """Container for trading performance metrics."""
    total_profit: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    avg_profit_per_trade: float
    profit_factor: float


def calculate_sharpe_ratio(returns: np.ndarray, risk_free_rate: float = 0.02) -> float:
    """
    Calculate the Sharpe ratio of returns.
    
    Args:
        returns: Array of period returns
        risk_free_rate: Annual risk-free rate (default 2%)
    
    Returns:
        Annualized Sharpe ratio
    """
    if len(returns) < 2 or np.std(returns) == 0:
        return 0.0
    
    # Assuming daily returns, annualize
    excess_returns = returns - (risk_free_rate / 252)
    return np.sqrt(252) * np.mean(excess_returns) / np.std(excess_returns)


def calculate_max_drawdown(equity_curve: np.ndarray) -> float:
    """
    Calculate maximum drawdown from equity curve.
    
    Args:
        equity_curve: Array of portfolio values over time
    
    Returns:
        Maximum drawdown as a decimal (e.g., 0.15 for 15%)
    """
    if len(equity_curve) < 2:
        return 0.0
    
    peak = equity_curve[0]
    max_dd = 0.0
    
    for value in equity_curve:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak
        max_dd = max(max_dd, drawdown)
    
    return max_dd


def calculate_profit_factor(profits: List[float], losses: List[float]) -> float:
    """
    Calculate profit factor (gross profit / gross loss).
    
    Args:
        profits: List of profitable trade amounts
        losses: List of losing trade amounts (positive values)
    
    Returns:
        Profit factor ratio
    """
    total_profit = sum(profits) if profits else 0
    total_loss = sum(losses) if losses else 0
    
    if total_loss == 0:
        return float('inf') if total_profit > 0 else 0.0
    
    return total_profit / total_loss


def calculate_trade_metrics(
    trades: List[Dict],
    initial_capital: float = 100000.0
) -> TradeMetrics:
    """
    Calculate comprehensive trading metrics.
    
    Args:
        trades: List of trade dictionaries with 'profit' key
        initial_capital: Starting capital
    
    Returns:
        TradeMetrics object with all performance metrics
    """
    if not trades:
        return TradeMetrics(
            total_profit=0.0, total_trades=0, winning_trades=0,
            losing_trades=0, win_rate=0.0, sharpe_ratio=0.0,
            max_drawdown=0.0, avg_profit_per_trade=0.0, profit_factor=0.0
        )
    
    profits = [t['profit'] for t in trades if t['profit'] > 0]
    losses = [abs(t['profit']) for t in trades if t['profit'] < 0]
    all_profits = [t['profit'] for t in trades]
    
    # Build equity curve
    equity = [initial_capital]
    for t in trades:
        equity.append(equity[-1] + t['profit'])
    equity_curve = np.array(equity)
    
    # Calculate returns
    returns = np.diff(equity_curve) / equity_curve[:-1]
    
    return TradeMetrics(
        total_profit=sum(all_profits),
        total_trades=len(trades),
        winning_trades=len(profits),
        losing_trades=len(losses),
        win_rate=len(profits) / len(trades) if trades else 0.0,
        sharpe_ratio=calculate_sharpe_ratio(returns),
        max_drawdown=calculate_max_drawdown(equity_curve),
        avg_profit_per_trade=np.mean(all_profits),
        profit_factor=calculate_profit_factor(profits, losses)
    )


def normalize_prices(prices: np.ndarray) -> np.ndarray:
    """
    Normalize prices to [0, 1] range using min-max scaling.
    
    Args:
        prices: Array of prices
    
    Returns:
        Normalized prices
    """
    min_val = np.min(prices)
    max_val = np.max(prices)
    
    if max_val - min_val == 0:
        return np.zeros_like(prices)
    
    return (prices - min_val) / (max_val - min_val)


def calculate_volatility(prices: np.ndarray, window: int = 20) -> float:
    """
    Calculate rolling volatility (annualized standard deviation of returns).
    
    Args:
        prices: Array of prices
        window: Rolling window size
    
    Returns:
        Annualized volatility
    """
    if len(prices) < 2:
        return 0.0
    
    returns = np.diff(prices) / prices[:-1]
    
    if len(returns) < window:
        return np.std(returns) * np.sqrt(252)
    
    return np.std(returns[-window:]) * np.sqrt(252)


def calculate_spread(price1: float, price2: float) -> Tuple[float, float]:
    """
    Calculate price spread and spread percentage.
    
    Args:
        price1: First price (e.g., Exchange A)
        price2: Second price (e.g., Exchange B)
    
    Returns:
        Tuple of (absolute spread, percentage spread)
    """
    spread = abs(price1 - price2)
    spread_pct = (spread / min(price1, price2)) * 100 if min(price1, price2) > 0 else 0
    
    return spread, spread_pct


def discretize_state(
    spread: float,
    volatility: float,
    liquidity: float,
    n_bins: int = 10
) -> Tuple[int, int, int]:
    """
    Discretize continuous state variables into bins for Q-table.
    
    Args:
        spread: Price spread percentage
        volatility: Market volatility
        liquidity: Liquidity score (0-1)
        n_bins: Number of bins per dimension
    
    Returns:
        Tuple of discretized state indices
    """
    # Spread: 0-5% mapped to bins
    spread_bin = min(int(spread / 0.5), n_bins - 1)
    
    # Volatility: 0-100% annualized mapped to bins
    vol_bin = min(int(volatility * 10), n_bins - 1)
    
    # Liquidity: 0-1 mapped to bins
    liq_bin = min(int(liquidity * n_bins), n_bins - 1)
    
    return (spread_bin, vol_bin, liq_bin)


def generate_simulated_prices(
    base_price: float = 100.0,
    n_steps: int = 1000,
    volatility: float = 0.02,
    drift: float = 0.0001,
    seed: Optional[int] = None
) -> np.ndarray:
    """
    Generate simulated price series using Geometric Brownian Motion.
    
    Args:
        base_price: Starting price
        n_steps: Number of time steps
        volatility: Daily volatility
        drift: Daily drift (trend)
        seed: Random seed for reproducibility
    
    Returns:
        Array of simulated prices
    """
    if seed is not None:
        np.random.seed(seed)
    
    returns = np.random.normal(drift, volatility, n_steps)
    price_series = base_price * np.exp(np.cumsum(returns))
    
    return price_series


def create_dual_exchange_data(
    n_steps: int = 1000,
    base_price: float = 100.0,
    avg_spread: float = 0.003,
    spread_volatility: float = 0.001,
    seed: Optional[int] = None
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Create simulated price data for two exchanges with realistic spread dynamics.
    
    Args:
        n_steps: Number of time steps
        base_price: Starting price
        avg_spread: Average spread between exchanges
        spread_volatility: Volatility of the spread
        seed: Random seed
    
    Returns:
        Tuple of (exchange1_prices, exchange2_prices)
    """
    if seed is not None:
        np.random.seed(seed)
    
    # Generate base price movement
    base_returns = np.random.normal(0.0001, 0.02, n_steps)
    base_prices = base_price * np.exp(np.cumsum(base_returns))
    
    # Generate spread dynamics (mean-reverting)
    spreads = np.zeros(n_steps)
    spreads[0] = avg_spread
    
    for i in range(1, n_steps):
        # Mean-reverting spread with noise
        reversion = 0.1 * (avg_spread - spreads[i-1])
        noise = np.random.normal(0, spread_volatility)
        spreads[i] = max(0, spreads[i-1] + reversion + noise)
    
    # Create two exchange prices
    exchange1_prices = base_prices
    exchange2_prices = base_prices * (1 + spreads)
    
    return exchange1_prices, exchange2_prices


def save_model_checkpoint(q_table: np.ndarray, filepath: str, metadata: Dict = None):
    """
    Save Q-table and metadata to file.
    
    Args:
        q_table: The Q-table to save
        filepath: Path to save file
        metadata: Optional metadata dict
    """
    checkpoint = {
        'q_table': q_table.tolist(),
        'shape': q_table.shape,
        'metadata': metadata or {}
    }
    
    with open(filepath, 'w') as f:
        json.dump(checkpoint, f)


def load_model_checkpoint(filepath: str) -> Tuple[np.ndarray, Dict]:
    """
    Load Q-table and metadata from file.
    
    Args:
        filepath: Path to checkpoint file
    
    Returns:
        Tuple of (q_table, metadata)
    """
    with open(filepath, 'r') as f:
        checkpoint = json.load(f)
    
    q_table = np.array(checkpoint['q_table'])
    metadata = checkpoint.get('metadata', {})
    
    return q_table, metadata


# Indian Mutual Fund Data (for frontend integration)
MUTUAL_FUNDS_DATA = [
    {
        "id": 1,
        "name": "SBI Bluechip Fund",
        "category": "Large Cap",
        "nav": 78.45,
        "aum": 45230.5,  # in Crores
        "return_1y": 18.72,
        "return_3y": 12.45,
        "return_5y": 14.82,
        "risk": "Moderate",
        "rating": 5,
        "min_investment": 500,
        "expense_ratio": 1.05,
        "fund_manager": "Sohini Andani"
    },
    {
        "id": 2,
        "name": "HDFC Top 100 Fund",
        "category": "Large Cap",
        "nav": 892.34,
        "aum": 32150.8,
        "return_1y": 21.35,
        "return_3y": 14.28,
        "return_5y": 16.45,
        "risk": "Moderate",
        "rating": 4,
        "min_investment": 500,
        "expense_ratio": 1.12,
        "fund_manager": "Prashant Jain"
    },
    {
        "id": 3,
        "name": "ICICI Prudential Technology Fund",
        "category": "Sectoral - Technology",
        "nav": 156.78,
        "aum": 12450.2,
        "return_1y": 32.45,
        "return_3y": 22.18,
        "return_5y": 28.92,
        "risk": "High",
        "rating": 5,
        "min_investment": 1000,
        "expense_ratio": 1.25,
        "fund_manager": "Varun Goel"
    },
    {
        "id": 4,
        "name": "Axis Long Term Equity Fund",
        "category": "ELSS",
        "nav": 72.56,
        "aum": 38920.4,
        "return_1y": 16.82,
        "return_3y": 11.45,
        "return_5y": 15.23,
        "risk": "Moderate-High",
        "rating": 4,
        "min_investment": 500,
        "expense_ratio": 0.98,
        "fund_manager": "Jinesh Gopani"
    },
    {
        "id": 5,
        "name": "Mirae Asset Large Cap Fund",
        "category": "Large Cap",
        "nav": 98.23,
        "aum": 42180.6,
        "return_1y": 19.45,
        "return_3y": 13.72,
        "return_5y": 17.28,
        "risk": "Moderate",
        "rating": 5,
        "min_investment": 1000,
        "expense_ratio": 0.85,
        "fund_manager": "Neelesh Surana"
    },
    {
        "id": 6,
        "name": "Parag Parikh Flexi Cap Fund",
        "category": "Flexi Cap",
        "nav": 62.45,
        "aum": 52340.9,
        "return_1y": 24.56,
        "return_3y": 18.34,
        "return_5y": 21.45,
        "risk": "Moderate-High",
        "rating": 5,
        "min_investment": 1000,
        "expense_ratio": 0.75,
        "fund_manager": "Rajeev Thakkar"
    },
    {
        "id": 7,
        "name": "Kotak Small Cap Fund",
        "category": "Small Cap",
        "nav": 234.56,
        "aum": 15620.3,
        "return_1y": 38.92,
        "return_3y": 28.45,
        "return_5y": 25.67,
        "risk": "Very High",
        "rating": 4,
        "min_investment": 1000,
        "expense_ratio": 1.45,
        "fund_manager": "Pankaj Tibrewal"
    },
    {
        "id": 8,
        "name": "Nippon India Growth Fund",
        "category": "Mid Cap",
        "nav": 3250.78,
        "aum": 24580.1,
        "return_1y": 28.34,
        "return_3y": 20.12,
        "return_5y": 18.95,
        "risk": "High",
        "rating": 4,
        "min_investment": 500,
        "expense_ratio": 1.18,
        "fund_manager": "Manish Gunwani"
    },
    {
        "id": 9,
        "name": "UTI Nifty 50 Index Fund",
        "category": "Index Fund",
        "nav": 145.23,
        "aum": 18920.5,
        "return_1y": 15.82,
        "return_3y": 11.25,
        "return_5y": 13.45,
        "risk": "Moderate",
        "rating": 4,
        "min_investment": 500,
        "expense_ratio": 0.20,
        "fund_manager": "Sharwan Goyal"
    },
    {
        "id": 10,
        "name": "Aditya Birla Sun Life Tax Relief 96",
        "category": "ELSS",
        "nav": 48.92,
        "aum": 16780.4,
        "return_1y": 22.45,
        "return_3y": 15.67,
        "return_5y": 17.82,
        "risk": "Moderate-High",
        "rating": 5,
        "min_investment": 500,
        "expense_ratio": 1.08,
        "fund_manager": "Anil Shah"
    }
]


def get_mutual_funds_json() -> str:
    """Return mutual funds data as JSON string."""
    return json.dumps(MUTUAL_FUNDS_DATA, indent=2)


if __name__ == "__main__":
    # Test utilities
    print("Testing utility functions...")
    
    # Generate sample data
    ex1, ex2 = create_dual_exchange_data(100, seed=42)
    print(f"Generated {len(ex1)} price points")
    print(f"Sample spreads: {(ex2[:5] - ex1[:5]) / ex1[:5] * 100}")
    
    # Test metrics
    sample_trades = [
        {'profit': 100}, {'profit': -50}, {'profit': 200},
        {'profit': -30}, {'profit': 150}
    ]
    metrics = calculate_trade_metrics(sample_trades)
    print(f"\nMetrics: Win Rate={metrics.win_rate:.2%}, Sharpe={metrics.sharpe_ratio:.2f}")
