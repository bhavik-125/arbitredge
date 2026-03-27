"""
Custom Gym-like Environment for Arbitrage Trading.
Simulates multi-market arbitrage opportunities for RL agent training.
"""

import numpy as np
from typing import Tuple, Dict, Optional, List
from dataclasses import dataclass
from enum import IntEnum

from utils import (
    generate_simulated_prices,
    create_dual_exchange_data,
    calculate_volatility,
    discretize_state,
    normalize_prices
)


class Action(IntEnum):
    """Trading actions available to the agent."""
    HOLD = 0
    BUY_EX1 = 1       # Buy on Exchange 1
    SELL_EX1 = 2      # Sell on Exchange 1
    BUY_EX2 = 3       # Buy on Exchange 2
    SELL_EX2 = 4      # Sell on Exchange 2
    ARBITRAGE_LONG = 5   # Buy Ex1, Sell Ex2 (when Ex1 < Ex2)
    ARBITRAGE_SHORT = 6  # Buy Ex2, Sell Ex1 (when Ex2 < Ex1)


@dataclass
class Position:
    """Represents current trading position."""
    quantity: float = 0.0
    avg_price: float = 0.0
    exchange: int = 0  # 0 = no position, 1 = Ex1, 2 = Ex2


@dataclass 
class MarketState:
    """Current market state representation."""
    price_ex1: float
    price_ex2: float
    spread: float
    spread_pct: float
    volatility_ex1: float
    volatility_ex2: float
    liquidity_ex1: float
    liquidity_ex2: float
    transaction_cost: float


class ArbitrageEnv:
    """
    Reinforcement Learning Environment for Arbitrage Trading.
    
    Features:
    - Dual exchange price simulation
    - Transaction costs and slippage
    - Liquidity constraints
    - Risk-adjusted rewards
    
    State Space:
    - Price spread between exchanges
    - Volatility on each exchange
    - Liquidity levels
    - Current position
    
    Action Space:
    - Hold, Buy/Sell on each exchange, Execute arbitrage
    """
    
    def __init__(
        self,
        initial_capital: float = 100000.0,
        transaction_cost: float = 0.001,  # 0.1% per trade
        slippage: float = 0.0005,          # 0.05% slippage
        max_position_size: float = 0.2,    # Max 20% of capital per position
        n_state_bins: int = 10,
        episode_length: int = 500,
        seed: Optional[int] = None
    ):
        """
        Initialize the arbitrage environment.
        
        Args:
            initial_capital: Starting capital
            transaction_cost: Cost per trade (percentage)
            slippage: Price slippage (percentage)
            max_position_size: Maximum position as fraction of capital
            n_state_bins: Number of bins for state discretization
            episode_length: Length of each episode
            seed: Random seed
        """
        self.initial_capital = initial_capital
        self.transaction_cost = transaction_cost
        self.slippage = slippage
        self.max_position_size = max_position_size
        self.n_state_bins = n_state_bins
        self.episode_length = episode_length
        self.seed = seed
        
        # Action and state space dimensions
        self.n_actions = len(Action)
        self.state_shape = (n_state_bins, n_state_bins, n_state_bins, 3)  # spread, vol, liq, position
        
        # Initialize state
        self.reset()
    
    def reset(self) -> Tuple[int, int, int, int]:
        """
        Reset environment to initial state.
        
        Returns:
            Initial state tuple
        """
        # Generate new price series
        self.prices_ex1, self.prices_ex2 = create_dual_exchange_data(
            n_steps=self.episode_length + 100,  # Extra for warmup
            base_price=100.0,
            avg_spread=0.003,
            spread_volatility=0.001,
            seed=self.seed
        )
        
        # Generate liquidity time series (random walk around 0.7)
        np.random.seed(self.seed)
        self.liquidity_ex1 = np.clip(
            0.7 + np.cumsum(np.random.normal(0, 0.01, len(self.prices_ex1))),
            0.3, 1.0
        )
        self.liquidity_ex2 = np.clip(
            0.7 + np.cumsum(np.random.normal(0, 0.01, len(self.prices_ex1))),
            0.3, 1.0
        )
        
        # Reset trading state
        self.capital = self.initial_capital
        self.position = Position()
        self.current_step = 50  # Skip warmup period
        self.trades: List[Dict] = []
        self.equity_history = [self.initial_capital]
        self.done = False
        
        return self._get_state()
    
    def _get_market_state(self) -> MarketState:
        """Get current market conditions."""
        t = self.current_step
        
        price_ex1 = self.prices_ex1[t]
        price_ex2 = self.prices_ex2[t]
        spread = abs(price_ex2 - price_ex1)
        spread_pct = spread / min(price_ex1, price_ex2) * 100
        
        # Calculate recent volatility
        lookback = 20
        vol_ex1 = calculate_volatility(self.prices_ex1[t-lookback:t+1])
        vol_ex2 = calculate_volatility(self.prices_ex2[t-lookback:t+1])
        
        return MarketState(
            price_ex1=price_ex1,
            price_ex2=price_ex2,
            spread=spread,
            spread_pct=spread_pct,
            volatility_ex1=vol_ex1,
            volatility_ex2=vol_ex2,
            liquidity_ex1=self.liquidity_ex1[t],
            liquidity_ex2=self.liquidity_ex2[t],
            transaction_cost=self.transaction_cost
        )
    
    def _get_state(self) -> Tuple[int, int, int, int]:
        """
        Get discretized state for Q-table lookup.
        
        Returns:
            Tuple of state indices (spread_bin, vol_bin, liq_bin, position_bin)
        """
        market = self._get_market_state()
        
        # Discretize continuous values
        spread_bin, vol_bin, liq_bin = discretize_state(
            market.spread_pct,
            (market.volatility_ex1 + market.volatility_ex2) / 2,
            (market.liquidity_ex1 + market.liquidity_ex2) / 2,
            self.n_state_bins
        )
        
        # Position state: 0 = no position, 1 = long Ex1, 2 = long Ex2
        position_bin = self.position.exchange
        
        return (spread_bin, vol_bin, liq_bin, position_bin)
    
    def _calculate_trade_cost(self, trade_value: float, liquidity: float) -> float:
        """Calculate total transaction cost including slippage adjusted for liquidity."""
        base_cost = trade_value * self.transaction_cost
        # Higher slippage when liquidity is low
        adjusted_slippage = self.slippage * (1 + (1 - liquidity))
        slippage_cost = trade_value * adjusted_slippage
        return base_cost + slippage_cost
    
    def step(self, action: int) -> Tuple[Tuple[int, int, int, int], float, bool, Dict]:
        """
        Execute action and return new state, reward, done, info.
        
        Args:
            action: Action to execute (0-6)
        
        Returns:
            Tuple of (new_state, reward, done, info)
        """
        market = self._get_market_state()
        reward = 0.0
        info = {'action': Action(action).name, 'trade': None}
        
        # Calculate maximum tradeable amount
        max_trade_value = self.capital * self.max_position_size
        
        # Execute action
        if action == Action.HOLD:
            # Small negative reward for holding (opportunity cost)
            reward = -0.001
            
        elif action == Action.BUY_EX1:
            if self.position.exchange == 0:  # No current position
                quantity = max_trade_value / market.price_ex1
                cost = self._calculate_trade_cost(max_trade_value, market.liquidity_ex1)
                self.capital -= (max_trade_value + cost)
                self.position = Position(quantity, market.price_ex1, 1)
                reward = -cost / self.initial_capital  # Penalize transaction cost
                
        elif action == Action.SELL_EX1:
            if self.position.exchange == 1:  # Have position on Ex1
                sale_value = self.position.quantity * market.price_ex1
                cost = self._calculate_trade_cost(sale_value, market.liquidity_ex1)
                profit = sale_value - (self.position.quantity * self.position.avg_price) - cost
                self.capital += sale_value - cost
                
                self.trades.append({
                    'type': 'SELL_EX1',
                    'profit': profit,
                    'price': market.price_ex1,
                    'quantity': self.position.quantity
                })
                
                reward = profit / self.initial_capital
                self.position = Position()
                info['trade'] = self.trades[-1]
                
        elif action == Action.BUY_EX2:
            if self.position.exchange == 0:
                quantity = max_trade_value / market.price_ex2
                cost = self._calculate_trade_cost(max_trade_value, market.liquidity_ex2)
                self.capital -= (max_trade_value + cost)
                self.position = Position(quantity, market.price_ex2, 2)
                reward = -cost / self.initial_capital
                
        elif action == Action.SELL_EX2:
            if self.position.exchange == 2:
                sale_value = self.position.quantity * market.price_ex2
                cost = self._calculate_trade_cost(sale_value, market.liquidity_ex2)
                profit = sale_value - (self.position.quantity * self.position.avg_price) - cost
                self.capital += sale_value - cost
                
                self.trades.append({
                    'type': 'SELL_EX2',
                    'profit': profit,
                    'price': market.price_ex2,
                    'quantity': self.position.quantity
                })
                
                reward = profit / self.initial_capital
                self.position = Position()
                info['trade'] = self.trades[-1]
                
        elif action == Action.ARBITRAGE_LONG:
            # Buy on Ex1 (cheaper), Sell on Ex2 (more expensive)
            if self.position.exchange == 0 and market.price_ex1 < market.price_ex2:
                quantity = max_trade_value / market.price_ex1
                
                buy_cost = self._calculate_trade_cost(max_trade_value, market.liquidity_ex1)
                sell_value = quantity * market.price_ex2
                sell_cost = self._calculate_trade_cost(sell_value, market.liquidity_ex2)
                
                gross_profit = sell_value - max_trade_value
                net_profit = gross_profit - buy_cost - sell_cost
                
                self.capital += net_profit
                
                self.trades.append({
                    'type': 'ARBITRAGE_LONG',
                    'profit': net_profit,
                    'spread_captured': market.spread_pct,
                    'quantity': quantity
                })
                
                # Larger reward for successful arbitrage
                reward = (net_profit / self.initial_capital) * 2
                info['trade'] = self.trades[-1]
                
        elif action == Action.ARBITRAGE_SHORT:
            # Buy on Ex2 (cheaper), Sell on Ex1 (more expensive)
            if self.position.exchange == 0 and market.price_ex2 < market.price_ex1:
                quantity = max_trade_value / market.price_ex2
                
                buy_cost = self._calculate_trade_cost(max_trade_value, market.liquidity_ex2)
                sell_value = quantity * market.price_ex1
                sell_cost = self._calculate_trade_cost(sell_value, market.liquidity_ex1)
                
                gross_profit = sell_value - max_trade_value
                net_profit = gross_profit - buy_cost - sell_cost
                
                self.capital += net_profit
                
                self.trades.append({
                    'type': 'ARBITRAGE_SHORT',
                    'profit': net_profit,
                    'spread_captured': market.spread_pct,
                    'quantity': quantity
                })
                
                reward = (net_profit / self.initial_capital) * 2
                info['trade'] = self.trades[-1]
        
        # Add risk penalty for high volatility positions
        if self.position.exchange != 0:
            vol = market.volatility_ex1 if self.position.exchange == 1 else market.volatility_ex2
            risk_penalty = -0.0001 * vol
            reward += risk_penalty
        
        # Track equity
        position_value = 0
        if self.position.exchange == 1:
            position_value = self.position.quantity * market.price_ex1
        elif self.position.exchange == 2:
            position_value = self.position.quantity * market.price_ex2
        
        self.equity_history.append(self.capital + position_value)
        
        # Advance time
        self.current_step += 1
        
        # Check if episode is done
        self.done = (
            self.current_step >= len(self.prices_ex1) - 1 or
            self.capital <= 0.5 * self.initial_capital  # Stop if lost 50%
        )
        
        # Final reward adjustment for episode end
        if self.done:
            final_equity = self.capital + position_value
            total_return = (final_equity - self.initial_capital) / self.initial_capital
            reward += total_return * 10  # Bonus/penalty for final performance
        
        info['capital'] = self.capital
        info['equity'] = self.equity_history[-1]
        info['step'] = self.current_step
        
        return self._get_state(), reward, self.done, info
    
    def get_valid_actions(self) -> List[int]:
        """Get list of valid actions given current state."""
        market = self._get_market_state()
        valid = [Action.HOLD]
        
        if self.position.exchange == 0:
            # Can open new positions
            valid.extend([Action.BUY_EX1, Action.BUY_EX2])
            
            # Can do arbitrage if spread exists
            if market.price_ex1 < market.price_ex2 and market.spread_pct > 0.1:
                valid.append(Action.ARBITRAGE_LONG)
            if market.price_ex2 < market.price_ex1 and market.spread_pct > 0.1:
                valid.append(Action.ARBITRAGE_SHORT)
                
        elif self.position.exchange == 1:
            valid.append(Action.SELL_EX1)
        elif self.position.exchange == 2:
            valid.append(Action.SELL_EX2)
        
        return [a.value for a in valid] if isinstance(valid[0], Action) else valid


class CryptoArbitrageEnv(ArbitrageEnv):
    """
    Extended environment for crypto arbitrage with higher volatility
    and 24/7 market simulation.
    """
    
    def __init__(self, **kwargs):
        # Crypto has higher volatility and transaction costs
        kwargs.setdefault('transaction_cost', 0.002)  # 0.2%
        kwargs.setdefault('slippage', 0.001)  # 0.1%
        super().__init__(**kwargs)
    
    def reset(self):
        """Reset with higher volatility price generation."""
        self.prices_ex1, self.prices_ex2 = create_dual_exchange_data(
            n_steps=self.episode_length + 100,
            base_price=50000.0,  # BTC-like price
            avg_spread=0.005,    # Higher spread
            spread_volatility=0.002,
            seed=self.seed
        )
        
        # Higher volatility liquidity
        np.random.seed(self.seed)
        self.liquidity_ex1 = np.clip(
            0.6 + np.cumsum(np.random.normal(0, 0.02, len(self.prices_ex1))),
            0.2, 1.0
        )
        self.liquidity_ex2 = np.clip(
            0.6 + np.cumsum(np.random.normal(0, 0.02, len(self.prices_ex1))),
            0.2, 1.0
        )
        
        self.capital = self.initial_capital
        self.position = Position()
        self.current_step = 50
        self.trades = []
        self.equity_history = [self.initial_capital]
        self.done = False
        
        return self._get_state()


if __name__ == "__main__":
    # Test the environment
    print("Testing ArbitrageEnv...")
    
    env = ArbitrageEnv(seed=42)
    state = env.reset()
    print(f"Initial state: {state}")
    
    total_reward = 0
    for i in range(100):
        # Random valid action
        valid_actions = env.get_valid_actions()
        action = np.random.choice(valid_actions)
        
        new_state, reward, done, info = env.step(action)
        total_reward += reward
        
        if info.get('trade'):
            print(f"Step {i}: {info['action']} -> Profit: {info['trade']['profit']:.2f}")
        
        if done:
            print(f"Episode done at step {i}")
            break
    
    print(f"\nTotal reward: {total_reward:.4f}")
    print(f"Final capital: ${env.capital:.2f}")
    print(f"Total trades: {len(env.trades)}")
