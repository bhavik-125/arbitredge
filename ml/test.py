"""
Testing and backtesting module for Q-Learning Arbitrage Agent.
Includes performance evaluation, comparison with baselines, and visualization.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import json

from env import ArbitrageEnv, CryptoArbitrageEnv
from agent import QLearningAgent
from utils import calculate_trade_metrics, TradeMetrics


class NaiveArbitrageStrategy:
    """
    Baseline strategy: Execute arbitrage whenever spread exceeds threshold.
    """
    
    def __init__(self, spread_threshold: float = 0.2):
        """
        Initialize naive strategy.
        
        Args:
            spread_threshold: Minimum spread % to trigger arbitrage
        """
        self.spread_threshold = spread_threshold
    
    def get_action(self, market_state) -> int:
        """
        Select action based on simple rules.
        
        Returns:
            Action index (from env.Action enum)
        """
        # Action indices: HOLD=0, BUY_EX1=1, SELL_EX1=2, BUY_EX2=3, 
        #                 SELL_EX2=4, ARBITRAGE_LONG=5, ARBITRAGE_SHORT=6
        
        if market_state.spread_pct > self.spread_threshold:
            if market_state.price_ex1 < market_state.price_ex2:
                return 5  # ARBITRAGE_LONG
            else:
                return 6  # ARBITRAGE_SHORT
        
        return 0  # HOLD


def backtest_agent(
    env: ArbitrageEnv,
    agent: QLearningAgent,
    n_episodes: int = 10,
    seed: Optional[int] = None
) -> Tuple[List[Dict], List[float], List[float]]:
    """
    Backtest trained agent.
    
    Args:
        env: Trading environment
        agent: Trained agent
        n_episodes: Number of test episodes
        seed: Random seed
    
    Returns:
        Tuple of (all_trades, equity_curves, episode_profits)
    """
    if seed is not None:
        env.seed = seed
    
    all_trades = []
    equity_curves = []
    episode_profits = []
    
    for ep in range(n_episodes):
        state = env.reset()
        done = False
        
        while not done:
            valid_actions = env.get_valid_actions()
            action = agent.get_action(state, valid_actions, training=False)
            next_state, reward, done, info = env.step(action)
            state = next_state
        
        all_trades.extend(env.trades)
        equity_curves.append(env.equity_history)
        profit = info['capital'] - env.initial_capital
        episode_profits.append(profit)
    
    return all_trades, equity_curves, episode_profits


def backtest_baseline(
    env: ArbitrageEnv,
    strategy: NaiveArbitrageStrategy,
    n_episodes: int = 10,
    seed: Optional[int] = None
) -> Tuple[List[Dict], List[float], List[float]]:
    """
    Backtest baseline strategy.
    
    Args:
        env: Trading environment
        strategy: Baseline strategy
        n_episodes: Number of test episodes
        seed: Random seed
    
    Returns:
        Tuple of (all_trades, equity_curves, episode_profits)
    """
    if seed is not None:
        env.seed = seed
    
    all_trades = []
    equity_curves = []
    episode_profits = []
    
    for ep in range(n_episodes):
        state = env.reset()
        done = False
        
        while not done:
            market_state = env._get_market_state()
            action = strategy.get_action(market_state)
            
            # Check if action is valid
            valid_actions = env.get_valid_actions()
            if action not in valid_actions:
                action = 0  # HOLD if invalid
            
            next_state, reward, done, info = env.step(action)
            state = next_state
        
        all_trades.extend(env.trades)
        equity_curves.append(env.equity_history)
        profit = info['capital'] - env.initial_capital
        episode_profits.append(profit)
    
    return all_trades, equity_curves, episode_profits


def compare_strategies(
    env: ArbitrageEnv,
    agent: QLearningAgent,
    baseline: NaiveArbitrageStrategy,
    n_episodes: int = 20,
    seed: int = 42
) -> Dict:
    """
    Compare RL agent with baseline strategy.
    
    Args:
        env: Trading environment
        agent: Trained RL agent
        baseline: Baseline strategy
        n_episodes: Number of test episodes
        seed: Random seed
    
    Returns:
        Comparison results dictionary
    """
    print("🔬 Running backtests...\n")
    
    # Backtest RL agent
    print("Testing RL Agent...")
    rl_trades, rl_equity, rl_profits = backtest_agent(env, agent, n_episodes, seed)
    rl_metrics = calculate_trade_metrics(rl_trades, env.initial_capital)
    
    # Backtest baseline
    print("Testing Baseline Strategy...")
    bl_trades, bl_equity, bl_profits = backtest_baseline(env, baseline, n_episodes, seed)
    bl_metrics = calculate_trade_metrics(bl_trades, env.initial_capital)
    
    # Calculate statistics
    results = {
        'rl': {
            'avg_profit': np.mean(rl_profits),
            'std_profit': np.std(rl_profits),
            'total_trades': len(rl_trades),
            'metrics': rl_metrics,
            'equity_curves': rl_equity,
            'profits': rl_profits
        },
        'baseline': {
            'avg_profit': np.mean(bl_profits),
            'std_profit': np.std(bl_profits),
            'total_trades': len(bl_trades),
            'metrics': bl_metrics,
            'equity_curves': bl_equity,
            'profits': bl_profits
        }
    }
    
    return results


def plot_comparison(results: Dict, save_path: Optional[str] = None):
    """
    Plot comparison between RL agent and baseline.
    
    Args:
        results: Comparison results from compare_strategies()
        save_path: Path to save figure
    """
    fig = plt.figure(figsize=(18, 10))
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # 1. Equity curves
    ax1 = fig.add_subplot(gs[0, :2])
    for i, curve in enumerate(results['rl']['equity_curves'][:5]):
        ax1.plot(curve, alpha=0.4, color='blue', linewidth=1)
    ax1.plot(np.mean(results['rl']['equity_curves'], axis=0), 
             color='darkblue', linewidth=2, label='RL Agent (avg)')
    
    for i, curve in enumerate(results['baseline']['equity_curves'][:5]):
        ax1.plot(curve, alpha=0.4, color='red', linewidth=1)
    ax1.plot(np.mean(results['baseline']['equity_curves'], axis=0),
             color='darkred', linewidth=2, label='Baseline (avg)')
    
    ax1.axhline(y=100000, color='k', linestyle='--', alpha=0.3, label='Initial Capital')
    ax1.set_xlabel('Time Steps')
    ax1.set_ylabel('Portfolio Value ($)')
    ax1.set_title('Equity Curves Comparison')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # 2. Profit distribution
    ax2 = fig.add_subplot(gs[0, 2])
    ax2.boxplot([results['rl']['profits'], results['baseline']['profits']],
                labels=['RL Agent', 'Baseline'])
    ax2.axhline(y=0, color='k', linestyle='--', alpha=0.3)
    ax2.set_ylabel('Profit ($)')
    ax2.set_title('Profit Distribution')
    ax2.grid(True, alpha=0.3, axis='y')
    
    # 3. Metrics comparison - Bar chart
    ax3 = fig.add_subplot(gs[1, :])
    metrics_names = ['Total Profit', 'Win Rate', 'Sharpe Ratio', 'Profit Factor']
    rl_vals = [
        results['rl']['metrics'].total_profit,
        results['rl']['metrics'].win_rate * 100,
        results['rl']['metrics'].sharpe_ratio,
        results['rl']['metrics'].profit_factor
    ]
    bl_vals = [
        results['baseline']['metrics'].total_profit,
        results['baseline']['metrics'].win_rate * 100,
        results['baseline']['metrics'].sharpe_ratio,
        results['baseline']['metrics'].profit_factor
    ]
    
    x = np.arange(len(metrics_names))
    width = 0.35
    
    ax3.bar(x - width/2, rl_vals, width, label='RL Agent', color='blue', alpha=0.7)
    ax3.bar(x + width/2, bl_vals, width, label='Baseline', color='red', alpha=0.7)
    ax3.set_ylabel('Value')
    ax3.set_title('Performance Metrics Comparison')
    ax3.set_xticks(x)
    ax3.set_xticklabels(metrics_names)
    ax3.legend()
    ax3.grid(True, alpha=0.3, axis='y')
    
    # 4. Trading statistics
    ax4 = fig.add_subplot(gs[2, 0])
    stats_data = [
        ['Total Trades', results['rl']['total_trades'], results['baseline']['total_trades']],
        ['Winning Trades', results['rl']['metrics'].winning_trades, 
         results['baseline']['metrics'].winning_trades],
        ['Losing Trades', results['rl']['metrics'].losing_trades,
         results['baseline']['metrics'].losing_trades]
    ]
    
    table = ax4.table(cellText=stats_data, colLabels=['Metric', 'RL', 'Baseline'],
                     cellLoc='center', loc='center', bbox=[0, 0, 1, 1])
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1, 2)
    ax4.axis('off')
    ax4.set_title('Trading Statistics')
    
    # 5. Risk metrics
    ax5 = fig.add_subplot(gs[2, 1])
    risk_data = [
        ['Max Drawdown', f"{results['rl']['metrics'].max_drawdown*100:.2f}%",
         f"{results['baseline']['metrics'].max_drawdown*100:.2f}%"],
        ['Avg Profit/Trade', f"${results['rl']['metrics'].avg_profit_per_trade:.2f}",
         f"${results['baseline']['metrics'].avg_profit_per_trade:.2f}"],
        ['Sharpe Ratio', f"{results['rl']['metrics'].sharpe_ratio:.3f}",
         f"{results['baseline']['metrics'].sharpe_ratio:.3f}"]
    ]
    
    table2 = ax5.table(cellText=risk_data, colLabels=['Metric', 'RL', 'Baseline'],
                      cellLoc='center', loc='center', bbox=[0, 0, 1, 1])
    table2.auto_set_font_size(False)
    table2.set_fontsize(9)
    table2.scale(1, 2)
    ax5.axis('off')
    ax5.set_title('Risk Metrics')
    
    # 6. Summary
    ax6 = fig.add_subplot(gs[2, 2])
    
    # Determine winner
    rl_score = (
        (results['rl']['avg_profit'] > results['baseline']['avg_profit']) +
        (results['rl']['metrics'].sharpe_ratio > results['baseline']['metrics'].sharpe_ratio) +
        (results['rl']['metrics'].max_drawdown < results['baseline']['metrics'].max_drawdown) +
        (results['rl']['metrics'].win_rate > results['baseline']['metrics'].win_rate)
    )
    
    winner = "RL Agent" if rl_score >= 3 else "Baseline"
    winner_color = 'blue' if winner == "RL Agent" else 'red'
    
    summary_text = f"""
    WINNER: {winner}
    
    RL Agent:
    • Avg Profit: ${results['rl']['avg_profit']:.2f}
    • Sharpe: {results['rl']['metrics'].sharpe_ratio:.3f}
    • Win Rate: {results['rl']['metrics'].win_rate*100:.1f}%
    
    Baseline:
    • Avg Profit: ${results['baseline']['avg_profit']:.2f}
    • Sharpe: {results['baseline']['metrics'].sharpe_ratio:.3f}
    • Win Rate: {results['baseline']['metrics'].win_rate*100:.1f}%
    """
    
    ax6.text(0.5, 0.5, summary_text, transform=ax6.transAxes,
            fontsize=10, verticalalignment='center', horizontalalignment='center',
            bbox=dict(boxstyle='round', facecolor=winner_color, alpha=0.1))
    ax6.axis('off')
    ax6.set_title('Summary')
    
    plt.suptitle('RL Agent vs Baseline Strategy - Backtest Comparison', 
                 fontsize=16, fontweight='bold', y=0.995)
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"\n✓ Comparison plot saved to {save_path}")
    else:
        plt.show()


def generate_report(results: Dict, save_path: str = "./test_results"):
    """
    Generate detailed test report.
    
    Args:
        results: Comparison results
        save_path: Directory to save report
    """
    Path(save_path).mkdir(parents=True, exist_ok=True)
    
    report = {
        'rl_agent': {
            'average_profit': float(results['rl']['avg_profit']),
            'std_profit': float(results['rl']['std_profit']),
            'total_trades': int(results['rl']['total_trades']),
            'winning_trades': int(results['rl']['metrics'].winning_trades),
            'losing_trades': int(results['rl']['metrics'].losing_trades),
            'win_rate': float(results['rl']['metrics'].win_rate),
            'sharpe_ratio': float(results['rl']['metrics'].sharpe_ratio),
            'max_drawdown': float(results['rl']['metrics'].max_drawdown),
            'profit_factor': float(results['rl']['metrics'].profit_factor),
            'avg_profit_per_trade': float(results['rl']['metrics'].avg_profit_per_trade)
        },
        'baseline': {
            'average_profit': float(results['baseline']['avg_profit']),
            'std_profit': float(results['baseline']['std_profit']),
            'total_trades': int(results['baseline']['total_trades']),
            'winning_trades': int(results['baseline']['metrics'].winning_trades),
            'losing_trades': int(results['baseline']['metrics'].losing_trades),
            'win_rate': float(results['baseline']['metrics'].win_rate),
            'sharpe_ratio': float(results['baseline']['metrics'].sharpe_ratio),
            'max_drawdown': float(results['baseline']['metrics'].max_drawdown),
            'profit_factor': float(results['baseline']['metrics'].profit_factor),
            'avg_profit_per_trade': float(results['baseline']['metrics'].avg_profit_per_trade)
        }
    }
    
    with open(f"{save_path}/backtest_report.json", 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"✓ Report saved to {save_path}/backtest_report.json")


def main():
    """Main testing script."""
    print("=" * 60)
    print("Q-LEARNING ARBITRAGE TRADING SYSTEM - BACKTESTING")
    print("=" * 60)
    
    # Load trained agent
    model_path = "./checkpoints/best_model.json"
    
    if not Path(model_path).exists():
        print(f"\n❌ Error: Model not found at {model_path}")
        print("Please train the model first using train.py")
        return
    
    print(f"\n📂 Loading model from {model_path}...")
    agent = QLearningAgent.load(model_path)
    
    # Initialize environment
    print("🏗️  Initializing test environment...")
    env = ArbitrageEnv(
        initial_capital=100000.0,
        transaction_cost=0.001,
        slippage=0.0005,
        max_position_size=0.2,
        n_state_bins=10,
        episode_length=500,
        seed=123  # Different seed for testing
    )
    
    # Initialize baseline
    baseline = NaiveArbitrageStrategy(spread_threshold=0.2)
    
    # Run comparison
    print("\n🔬 Running strategy comparison...")
    results = compare_strategies(env, agent, baseline, n_episodes=20, seed=123)
    
    # Print results
    print("\n" + "=" * 60)
    print("BACKTEST RESULTS")
    print("=" * 60)
    
    print("\n🤖 RL Agent:")
    print(f"  Average Profit: ${results['rl']['avg_profit']:,.2f} ± ${results['rl']['std_profit']:,.2f}")
    print(f"  Total Trades: {results['rl']['total_trades']}")
    print(f"  Win Rate: {results['rl']['metrics'].win_rate*100:.2f}%")
    print(f"  Sharpe Ratio: {results['rl']['metrics'].sharpe_ratio:.3f}")
    print(f"  Max Drawdown: {results['rl']['metrics'].max_drawdown*100:.2f}%")
    print(f"  Profit Factor: {results['rl']['metrics'].profit_factor:.3f}")
    
    print("\n📊 Baseline Strategy:")
    print(f"  Average Profit: ${results['baseline']['avg_profit']:,.2f} ± ${results['baseline']['std_profit']:,.2f}")
    print(f"  Total Trades: {results['baseline']['total_trades']}")
    print(f"  Win Rate: {results['baseline']['metrics'].win_rate*100:.2f}%")
    print(f"  Sharpe Ratio: {results['baseline']['metrics'].sharpe_ratio:.3f}")
    print(f"  Max Drawdown: {results['baseline']['metrics'].max_drawdown*100:.2f}%")
    print(f"  Profit Factor: {results['baseline']['metrics'].profit_factor:.3f}")
    
    # Performance improvement
    profit_improvement = ((results['rl']['avg_profit'] - results['baseline']['avg_profit']) / 
                         abs(results['baseline']['avg_profit']) * 100 if results['baseline']['avg_profit'] != 0 else 0)
    
    print(f"\n💡 RL Agent Improvement: {profit_improvement:+.2f}% profit vs baseline")
    
    # Generate visualizations
    print("\n📈 Generating comparison plots...")
    plot_comparison(results, save_path="./test_results/comparison.png")
    
    # Generate report
    print("\n📄 Generating detailed report...")
    generate_report(results, save_path="./test_results")
    
    print("\n✅ Testing complete! Results saved to ./test_results/")


if __name__ == "__main__":
    main()
