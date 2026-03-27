"""
FastAPI Backend for Q-Learning Arbitrage Trading System.
Serves arbitrage signals, mutual fund data, and model status.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import numpy as np
from pathlib import Path
import json
from datetime import datetime

# Import ML components
import sys
sys.path.append('./ml')

from env import ArbitrageEnv
from agent import QLearningAgent
from utils import MUTUAL_FUNDS_DATA


# Initialize FastAPI app
app = FastAPI(
    title="QERS Trading API",
    description="Q-Learning Arbitrage Trading System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
AGENT: Optional[QLearningAgent] = None
ENV: Optional[ArbitrageEnv] = None
MODEL_LOADED = False
MODEL_PATH = "./checkpoints/best_model.json"


# Pydantic models
class ArbitrageSignal(BaseModel):
    symbol: str
    exchange_buy: str
    exchange_sell: str
    buy_price: float
    sell_price: float
    spread_pct: float
    expected_profit: float
    confidence: float
    action: str
    timestamp: str


class MutualFund(BaseModel):
    id: int
    name: str
    category: str
    nav: float
    aum: float
    return_1y: float
    return_3y: float
    return_5y: float
    risk: str
    rating: int
    min_investment: int
    expense_ratio: float
    fund_manager: str


class ModelStatus(BaseModel):
    loaded: bool
    model_path: str
    total_steps: int
    q_table_shape: List[int]
    epsilon: float
    last_updated: Optional[str]


class TradeRecommendation(BaseModel):
    action: str
    confidence: float
    expected_return: float
    risk_level: str
    reasoning: str


# Helper functions
def load_model():
    """Load trained Q-Learning model."""
    global AGENT, ENV, MODEL_LOADED
    
    try:
        if Path(MODEL_PATH).exists():
            AGENT = QLearningAgent.load(MODEL_PATH)
            ENV = ArbitrageEnv(
                initial_capital=100000.0,
                transaction_cost=0.001,
                n_state_bins=10,
                episode_length=500
            )
            MODEL_LOADED = True
            print(f"✓ Model loaded from {MODEL_PATH}")
        else:
            print(f"⚠ Model not found at {MODEL_PATH}")
            MODEL_LOADED = False
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        MODEL_LOADED = False


def generate_arbitrage_signals(n_signals: int = 5) -> List[ArbitrageSignal]:
    """Generate arbitrage signals using the trained model."""
    signals = []
    
    if not MODEL_LOADED or AGENT is None or ENV is None:
        # Return mock signals if model not loaded
        mock_symbols = ["RELIANCE", "HDFCBANK", "ICICIBANK", "TCS", "INFY"]
        for i, symbol in enumerate(mock_symbols[:n_signals]):
            base_price = np.random.uniform(100, 3000)
            spread = np.random.uniform(0.1, 0.5)
            buy_price = base_price
            sell_price = base_price * (1 + spread/100)
            
            signals.append(ArbitrageSignal(
                symbol=symbol,
                exchange_buy="NSE",
                exchange_sell="BSE" if i % 2 == 0 else "NSE Futures",
                buy_price=round(buy_price, 2),
                sell_price=round(sell_price, 2),
                spread_pct=round(spread, 3),
                expected_profit=round((sell_price - buy_price) * 100, 2),
                confidence=round(np.random.uniform(0.6, 0.95), 2),
                action="ARBITRAGE_LONG" if buy_price < sell_price else "ARBITRAGE_SHORT",
                timestamp=datetime.now().isoformat()
            ))
    else:
        # Use actual model to generate signals
        state = ENV.reset()
        
        for i in range(n_signals):
            market_state = ENV._get_market_state()
            valid_actions = ENV.get_valid_actions()
            
            # Get action from agent
            action_idx = AGENT.get_action(state, valid_actions, training=False)
            action_values = AGENT.get_action_values(state)
            confidence = float(np.max(action_values) / (np.max(action_values) + 1e-6))
            
            # Determine action name
            action_names = ["HOLD", "BUY_EX1", "SELL_EX1", "BUY_EX2", 
                          "SELL_EX2", "ARBITRAGE_LONG", "ARBITRAGE_SHORT"]
            action_name = action_names[action_idx]
            
            # Create signal
            if "ARBITRAGE" in action_name:
                symbol = ["RELIANCE", "HDFCBANK", "ICICIBANK", "TCS", "INFY"][i % 5]
                
                signals.append(ArbitrageSignal(
                    symbol=symbol,
                    exchange_buy="Exchange 1" if market_state.price_ex1 < market_state.price_ex2 else "Exchange 2",
                    exchange_sell="Exchange 2" if market_state.price_ex1 < market_state.price_ex2 else "Exchange 1",
                    buy_price=round(min(market_state.price_ex1, market_state.price_ex2), 2),
                    sell_price=round(max(market_state.price_ex1, market_state.price_ex2), 2),
                    spread_pct=round(market_state.spread_pct, 3),
                    expected_profit=round(market_state.spread * 100, 2),
                    confidence=round(confidence, 2),
                    action=action_name,
                    timestamp=datetime.now().isoformat()
                ))
            
            # Step environment
            state, _, done, _ = ENV.step(action_idx)
            
            if done:
                state = ENV.reset()
    
    return signals


# API Endpoints

@app.on_event("startup")
async def startup_event():
    """Load model on startup."""
    load_model()


@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "name": "QERS Trading API",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "arbitrage_signals": "/api/arbitrage/signals",
            "mutual_funds": "/api/mutual-funds",
            "model_status": "/api/model/status",
            "trade_recommendation": "/api/trade/recommend/{symbol}"
        }
    }


@app.get("/api/arbitrage/signals", response_model=List[ArbitrageSignal])
async def get_arbitrage_signals(limit: int = 10):
    """
    Get current arbitrage trading signals.
    
    Args:
        limit: Maximum number of signals to return
    
    Returns:
        List of arbitrage signals
    """
    try:
        signals = generate_arbitrage_signals(n_signals=min(limit, 20))
        return signals
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/mutual-funds", response_model=List[MutualFund])
async def get_mutual_funds(
    category: Optional[str] = None,
    min_return: Optional[float] = None
):
    """
    Get Indian mutual funds data.
    
    Args:
        category: Filter by category (e.g., "Large Cap", "ELSS")
        min_return: Minimum 1Y return percentage
    
    Returns:
        List of mutual funds
    """
    funds = MUTUAL_FUNDS_DATA.copy()
    
    # Apply filters
    if category:
        funds = [f for f in funds if f['category'].lower() == category.lower()]
    
    if min_return is not None:
        funds = [f for f in funds if f['return_1y'] >= min_return]
    
    return funds


@app.get("/api/model/status", response_model=ModelStatus)
async def get_model_status():
    """
    Get current model status and information.
    
    Returns:
        Model status information
    """
    if MODEL_LOADED and AGENT is not None:
        return ModelStatus(
            loaded=True,
            model_path=MODEL_PATH,
            total_steps=AGENT.total_steps,
            q_table_shape=list(AGENT.q_table.shape),
            epsilon=round(AGENT.epsilon, 4),
            last_updated=datetime.now().isoformat()
        )
    else:
        return ModelStatus(
            loaded=False,
            model_path=MODEL_PATH,
            total_steps=0,
            q_table_shape=[],
            epsilon=0.0,
            last_updated=None
        )


@app.get("/api/trade/recommend/{symbol}", response_model=TradeRecommendation)
async def get_trade_recommendation(symbol: str):
    """
    Get trade recommendation for a specific symbol.
    
    Args:
        symbol: Stock symbol
    
    Returns:
        Trade recommendation
    """
    if not MODEL_LOADED or AGENT is None or ENV is None:
        return TradeRecommendation(
            action="HOLD",
            confidence=0.5,
            expected_return=0.0,
            risk_level="MEDIUM",
            reasoning="Model not loaded. Using default recommendation."
        )
    
    try:
        # Get current state and action
        state = ENV._get_state()
        valid_actions = ENV.get_valid_actions()
        action_idx = AGENT.get_action(state, valid_actions, training=False)
        action_values = AGENT.get_action_values(state)
        
        action_names = ["HOLD", "BUY_EX1", "SELL_EX1", "BUY_EX2", 
                       "SELL_EX2", "ARBITRAGE_LONG", "ARBITRAGE_SHORT"]
        action = action_names[action_idx]
        
        confidence = float(np.max(action_values) / (np.max(action_values) + 1e-6))
        expected_return = float(action_values[action_idx] * 100)
        
        # Determine risk level
        market_state = ENV._get_market_state()
        avg_vol = (market_state.volatility_ex1 + market_state.volatility_ex2) / 2
        
        if avg_vol < 0.15:
            risk_level = "LOW"
        elif avg_vol < 0.30:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        # Generate reasoning
        if "ARBITRAGE" in action:
            reasoning = f"Arbitrage opportunity detected with {market_state.spread_pct:.2f}% spread. " \
                       f"Confidence: {confidence*100:.1f}%. Risk: {risk_level}."
        elif action == "HOLD":
            reasoning = "No significant arbitrage opportunity. Recommend holding position."
        else:
            reasoning = f"Suggested action: {action}. Market conditions favor this position."
        
        return TradeRecommendation(
            action=action,
            confidence=round(confidence, 2),
            expected_return=round(expected_return, 2),
            risk_level=risk_level,
            reasoning=reasoning
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/model/reload")
async def reload_model():
    """Reload the trained model."""
    load_model()
    return {"status": "success", "model_loaded": MODEL_LOADED}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting QERS Trading API...")
    print("📊 API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
