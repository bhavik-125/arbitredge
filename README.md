# Q-Learning Arbitrage Trading System (QERS)

A complete reinforcement learning-based arbitrage trading system with Python ML backend and React frontend.

---

##  Overview

This system uses **Q-Learning** (tabular reinforcement learning) to learn optimal arbitrage trading strategies across multiple exchanges. It includes:

- **ML Environment**: Custom Gym-like environment simulating dual-exchange arbitrage
- **Q-Learning Agent**: Epsilon-greedy policy with experience replay
- **Backtesting Engine**: Compare RL agent vs naive baseline strategy
- **FastAPI Backend**: REST API serving predictions and mutual fund data
- **React Frontend**: Interactive dashboard with mutual funds integration

---

##  Project Structure

```
arbitredge/
├── ml/                          # Python ML System
│   ├── env.py                   # Trading environment (ArbitrageEnv)
│   ├── agent.py                 # Q-Learning agent
│   ├── train.py                 # Training loop
│   ├── test.py                  # Backtesting engine
│   ├── utils.py                 # Utilities and metrics
│   ├── requirements.txt         # Python dependencies
│   └── checkpoints/             # Saved models (auto-created)
├── server/                      # Backend API
│   ├── api.py                   # FastAPI server
│   ├── index.js                 # Express server (legacy)
│   └── qers.js                  # QERS algorithm (legacy)
├── src/                         # React Frontend
│   └── App.tsx                  # Main application
├── public/                      # Static files
└── package.json                 # Node.js dependencies
```

---

##  Quick Start

### 1. Install Python Dependencies

```bash
cd ml
pip install -r requirements.txt
```

### 2. Train the Q-Learning Agent

```bash
python train.py
```

**Output:**
- Trains for 1000 episodes
- Saves checkpoints to `./checkpoints/`
- Generates training curves plot
- Best model saved as `best_model.json`

**Training takes ~5-10 minutes**

### 3. Run Backtest

```bash
python test.py
```

**Output:**
- Compares RL agent vs baseline strategy
- Generates comparison plots
- Saves detailed report to `./test_results/`

### 4. Start FastAPI Backend

```bash
cd ..
python server/api.py
```

API runs on `http://localhost:8000`

**Interactive API Docs:** http://localhost:8000/docs

### 5. Start React Frontend

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

##  ML System Details

### State Space
- **Price Spread**: Difference between exchanges (discretized into bins)
- **Volatility**: Market volatility (rolling 20-day std dev)
- **Liquidity**: Market depth (0-1 scale)
- **Position**: Current holdings (none/ex1/ex2)

### Action Space
0. **HOLD** - Do nothing
1. **BUY_EX1** - Buy on Exchange 1
2. **SELL_EX1** - Sell on Exchange 1
3. **BUY_EX2** - Buy on Exchange 2
4. **SELL_EX2** - Sell on Exchange 2
5. **ARBITRAGE_LONG** - Buy Ex1, Sell Ex2
6. **ARBITRAGE_SHORT** - Buy Ex2, Sell Ex1

### Reward Function
```python
reward = (net_profit / initial_capital) * 2  # For arbitrage
reward -= transaction_costs / initial_capital  # Penalize costs
reward -= risk_penalty * volatility  # Penalize high-risk positions
```

### Q-Learning Update
```
Q(s,a) ← Q(s,a) + α[r + γ·max(Q(s',a')) - Q(s,a)]
```

**Hyperparameters:**
- Learning rate (α): 0.1
- Discount factor (γ): 0.99
- Epsilon decay: 0.995
- Initial epsilon: 1.0
- Min epsilon: 0.01

---

## 📊 Performance Metrics

The system tracks:

- **Total Profit**: Absolute return in dollars
- **Win Rate**: % of profitable trades
- **Sharpe Ratio**: Risk-adjusted returns
- **Max Drawdown**: Largest peak-to-trough decline
- **Profit Factor**: Gross profit / Gross loss

**Example Results:**
```
RL Agent:
  Average Profit: $2,450.32
  Win Rate: 68.5%
  Sharpe Ratio: 1.85
  Max Drawdown: 8.2%

Baseline Strategy:
  Average Profit: $1,820.15
  Win Rate: 62.3%
  Sharpe Ratio: 1.42
  Max Drawdown: 12.5%

RL Improvement: +34.6% profit vs baseline
```

---

##  API Endpoints

### GET `/api/arbitrage/signals`
Get current arbitrage trading signals.

**Response:**
```json
[
  {
    "symbol": "RELIANCE",
    "exchange_buy": "NSE",
    "exchange_sell": "BSE",
    "buy_price": 2980.50,
    "sell_price": 2995.75,
    "spread_pct": 0.51,
    "expected_profit": 1525.00,
    "confidence": 0.87,
    "action": "ARBITRAGE_LONG",
    "timestamp": "2026-03-27T10:00:00"
  }
]
```

### GET `/api/mutual-funds`
Get Indian mutual funds data.

**Query Params:**
- `category` (optional): Filter by category
- `min_return` (optional): Minimum 1Y return %

**Response:**
```json
[
  {
    "id": 1,
    "name": "SBI Bluechip Fund",
    "category": "Large Cap",
    "nav": 78.45,
    "return_1y": 18.72,
    "risk": "Moderate",
    "rating": 5
  }
]
```

### GET `/api/model/status`
Get Q-Learning model status.

**Response:**
```json
{
  "loaded": true,
  "total_steps": 125000,
  "q_table_shape": [10, 10, 10, 3, 7],
  "epsilon": 0.0523
}
```

---

##  Frontend Features

### Mutual Funds Dashboard
- **10 Indian Funds**: SBI, HDFC, ICICI, Axis, Mirae, Parag Parikh, etc.
- **Category Filtering**: Large Cap, Mid Cap, Small Cap, ELSS, Index Funds
- **Sortable**: By 1Y/3Y/5Y returns, AUM, expense ratio
- **Rich Display**: NAV, returns, risk ratings, fund managers

### Arbitrage View
- Real-time opportunities from Nifty 50 stocks
- Cash-Futures and Exchange arbitrage
- Risk indicators and ROI calculation

### Stock Trading
- Full Nifty 50 coverage
- Live price simulation
- Order execution and tracking

---

##  Configuration

Edit `ml/train.py` to customize:

```python
config = {
    'env': {
        'initial_capital': 100000.0,
        'transaction_cost': 0.001,  # 0.1%
        'slippage': 0.0005,         # 0.05%
        'max_position_size': 0.2,   # 20% of capital
        'episode_length': 500
    },
    'agent': {
        'learning_rate': 0.1,
        'discount_factor': 0.99,
        'epsilon_decay': 0.995
    },
    'training': {
        'n_episodes': 1000
    }
}
```

---

##  Advanced Features

### 1. Deep Q-Learning (DQN)
Replace Q-table with neural network:

```python
# In agent.py - add DQNAgent class
class DQNAgent:
    def __init__(self, state_dim, n_actions):
        self.model = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, n_actions)
        )
```

**Benefits:**
- Handle continuous state spaces
- Better generalization
- Scales to complex environments

### 2. Live Trading Integration

```python
# In env.py - add RealDataEnv
class RealDataEnv(ArbitrageEnv):
    def __init__(self, api_key):
        self.api = BinanceAPI(api_key)
    
    def _get_market_state(self):
        # Fetch real-time prices
        price_ex1 = self.api.get_price('BTCUSDT', 'binance')
        price_ex2 = self.api.get_price('BTCUSDT', 'kraken')
        ...
```

### 3. Risk Management

```python
# Add position sizing based on Kelly Criterion
def calculate_position_size(win_rate, avg_win, avg_loss):
    kelly = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
    return max(0, min(kelly, 0.25))  # Cap at 25%
```

### 4. Multi-Asset Support

```python
# Train on multiple assets simultaneously
envs = [
    ArbitrageEnv(symbol='BTC/USD'),
    ArbitrageEnv(symbol='ETH/USD'),
    ArbitrageEnv(symbol='RELIANCE.NS')
]

# Use parallel training
from multiprocessing import Pool
with Pool(3) as p:
    results = p.map(train_agent, envs)
```

---

##  Visualization Examples

### Training Curves
![Training Curves](./checkpoints/training_curves.png)
- Episode rewards over time
- Profit progression
- Epsilon decay
- Trade frequency

### Backtest Comparison
![Comparison](./test_results/comparison.png)
- Equity curves: RL vs Baseline
- Risk metrics comparison
- Win rate analysis

---

##  Important Notes

### For Production Use:

1. **Risk Management**: 
   - Implement stop-loss mechanisms
   - Position size limits
   - Maximum daily loss caps

2. **Data Quality**:
   - Use real market data (not simulations)
   - Handle missing data
   - Account for trading hours

3. **Transaction Costs**:
   - Include actual broker fees
   - Account for tax implications
   - Model slippage accurately

4. **Compliance**:
   - Follow SEBI regulations (India)
   - SEC regulations (US)
   - Exchange-specific rules

5. **Testing**:
   - Paper trade before live deployment
   - Out-of-sample validation
   - Stress testing in crisis scenarios

---

##  Troubleshooting

### Model not loading
```bash
# Check if model exists
ls -la ./checkpoints/best_model.json

# Retrain if missing
python ml/train.py
```

### API connection refused
```bash
# Check if FastAPI is running
lsof -i :8000

# Start API
python server/api.py
```

### Frontend not updating
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

##  References

- **Q-Learning**: Watkins, C.J.C.H. (1989). "Learning from Delayed Rewards"
- **Double Q-Learning**: van Hasselt, H. (2010). "Double Q-learning"
- **Arbitrage Theory**: Cont, R. & Tankov, P. (2004). "Financial Modelling with Jump Processes"

---
##  Contributing

Contributions welcome! Areas for improvement:
- Implement Deep Q-Learning (DQN)
- Add more asset classes
- Improve risk models
- Real-time data connectors
- Portfolio optimization

---

##  Acknowledgments

- OpenAI Gym for environment design patterns
- FastAPI for modern Python APIs
- React community for UI components

---
**Ready to deploy? Start with paper trading and gradually scale up! **
....
