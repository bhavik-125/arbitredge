"""
Training module for Q-Learning Arbitrage Agent.
Includes training loop, progress tracking, and model checkpointing.
"""

import numpy as np
from typing import Optional, Dict
import matplotlib.pyplot as plt
from tqdm import tqdm
import json
from pathlib import Path

from env import ArbitrageEnv, CryptoArbitrageEnv
from agent import QLearningAgent, DoubleQLearningAgent
from utils import calculate_trade_metrics


def train_agent(
    env: ArbitrageEnv,
    agent: QLearningAgent,
    n_episodes: int = 1000,
    max_steps_per_episode: int = 500,
    eval_interval: int = 50,
    checkpoint_interval: int = 100,
    checkpoint_dir: str = "./checkpoints",
    verbose: bool = True
) -> Dict:
    """
    Train Q-Learning agent on arbitrage environment.
    
    Args:
        env: Trading environment
        agent: Q-Learning agent
        n_episodes: Number of training episodes
        max_steps_per_episode: Maximum steps per episode
        eval_interval: Episodes between evaluation runs
        checkpoint_interval: Episodes between checkpoints
        checkpoint_dir: Directory to save checkpoints
        verbose: Whether to print progress
    
    Returns:
        Dictionary of training history
    """
    Path(checkpoint_dir).mkdir(parents=True, exist_ok=True)
    
    training_history = {
        'episode_rewards': [],
        'episode_profits': [],
        'episode_trades': [],
        'eval_rewards': [],
        'eval_profits': [],
        'epsilon_history': [],
        'best_reward': -np.inf
    }
    
    pbar = tqdm(range(n_episodes), desc="Training", disable=not verbose)
    
    for episode in pbar:
        state = env.reset()
        episode_reward = 0
        episode_steps = 0
        
        for step in range(max_steps_per_episode):
            # Select action
            valid_actions = env.get_valid_actions()
            action = agent.get_action(state, valid_actions, training=True)
            
            # Execute action
            next_state, reward, done, info = env.step(action)
            
            # Update agent
            agent.update(state, action, reward, next_state, done)
            
            episode_reward += reward
            episode_steps += 1
            state = next_state
            
            if done:
                break
        
        # Record episode statistics
        agent.record_episode(episode_reward, episode_steps)
        agent.decay_epsilon()
        
        final_capital = info['capital']
        profit = final_capital - env.initial_capital
        
        training_history['episode_rewards'].append(episode_reward)
        training_history['episode_profits'].append(profit)
        training_history['episode_trades'].append(len(env.trades))
        training_history['epsilon_history'].append(agent.epsilon)
        
        # Update progress bar
        pbar.set_postfix({
            'Profit': f'${profit:,.0f}',
            'Trades': len(env.trades),
            'ε': f'{agent.epsilon:.3f}'
        })
        
        # Evaluation
        if (episode + 1) % eval_interval == 0:
            eval_reward, eval_profit = evaluate_agent(env, agent, n_episodes=5)
            training_history['eval_rewards'].append(eval_reward)
            training_history['eval_profits'].append(eval_profit)
            
            if verbose:
                print(f"\n[Episode {episode+1}] Eval Reward: {eval_reward:.2f}, "
                      f"Eval Profit: ${eval_profit:,.2f}")
            
            # Save best model
            if eval_reward > training_history['best_reward']:
                training_history['best_reward'] = eval_reward
                agent.save(f"{checkpoint_dir}/best_model.json")
                if verbose:
                    print(f"✓ New best model saved!")
        
        # Checkpoint
        if (episode + 1) % checkpoint_interval == 0:
            agent.save(f"{checkpoint_dir}/checkpoint_ep{episode+1}.json")
    
    # Save final model and history
    agent.save(f"{checkpoint_dir}/final_model.json")
    
    with open(f"{checkpoint_dir}/training_history.json", 'w') as f:
        json.dump(training_history, f)
    
    if verbose:
        print("\n✓ Training complete!")
        print(f"Best eval reward: {training_history['best_reward']:.2f}")
    
    return training_history


def evaluate_agent(
    env: ArbitrageEnv,
    agent: QLearningAgent,
    n_episodes: int = 10,
    render: bool = False
) -> tuple[float, float]:
    """
    Evaluate agent performance without exploration.
    
    Args:
        env: Trading environment
        agent: Trained agent
        n_episodes: Number of evaluation episodes
        render: Whether to render episodes
    
    Returns:
        Tuple of (average_reward, average_profit)
    """
    total_rewards = []
    total_profits = []
    
    for _ in range(n_episodes):
        state = env.reset()
        episode_reward = 0
        done = False
        
        while not done:
            valid_actions = env.get_valid_actions()
            action = agent.get_action(state, valid_actions, training=False)
            next_state, reward, done, info = env.step(action)
            
            episode_reward += reward
            state = next_state
        
        profit = info['capital'] - env.initial_capital
        total_rewards.append(episode_reward)
        total_profits.append(profit)
    
    return np.mean(total_rewards), np.mean(total_profits)


def plot_training_curves(history: Dict, save_path: Optional[str] = None):
    """
    Plot training curves from history.
    
    Args:
        history: Training history dictionary
        save_path: Path to save figure (optional)
    """
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Episode rewards
    axes[0, 0].plot(history['episode_rewards'], alpha=0.6, label='Episode Reward')
    if len(history['eval_rewards']) > 0:
        eval_x = np.arange(len(history['eval_rewards'])) * \
                 (len(history['episode_rewards']) / len(history['eval_rewards']))
        axes[0, 0].plot(eval_x, history['eval_rewards'], 'r-', 
                       linewidth=2, label='Eval Reward', marker='o')
    axes[0, 0].set_xlabel('Episode')
    axes[0, 0].set_ylabel('Total Reward')
    axes[0, 0].set_title('Training Rewards')
    axes[0, 0].legend()
    axes[0, 0].grid(True, alpha=0.3)
    
    # Episode profits
    axes[0, 1].plot(history['episode_profits'], alpha=0.6, label='Episode Profit')
    if len(history['eval_profits']) > 0:
        axes[0, 1].plot(eval_x, history['eval_profits'], 'r-', 
                       linewidth=2, label='Eval Profit', marker='o')
    axes[0, 1].axhline(y=0, color='k', linestyle='--', alpha=0.3)
    axes[0, 1].set_xlabel('Episode')
    axes[0, 1].set_ylabel('Profit ($)')
    axes[0, 1].set_title('Trading Profits')
    axes[0, 1].legend()
    axes[0, 1].grid(True, alpha=0.3)
    
    # Number of trades
    axes[1, 0].plot(history['episode_trades'], alpha=0.7, color='green')
    axes[1, 0].set_xlabel('Episode')
    axes[1, 0].set_ylabel('Number of Trades')
    axes[1, 0].set_title('Trades per Episode')
    axes[1, 0].grid(True, alpha=0.3)
    
    # Epsilon decay
    axes[1, 1].plot(history['epsilon_history'], color='orange')
    axes[1, 1].set_xlabel('Episode')
    axes[1, 1].set_ylabel('Epsilon')
    axes[1, 1].set_title('Exploration Rate Decay')
    axes[1, 1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"Training curves saved to {save_path}")
    else:
        plt.show()


def main():
    """Main training script."""
    print("=" * 60)
    print("Q-LEARNING ARBITRAGE TRADING SYSTEM - TRAINING")
    print("=" * 60)
    
    # Configuration
    config = {
        'env': {
            'initial_capital': 100000.0,
            'transaction_cost': 0.001,
            'slippage': 0.0005,
            'max_position_size': 0.2,
            'n_state_bins': 10,
            'episode_length': 500,
            'seed': 42
        },
        'agent': {
            'learning_rate': 0.1,
            'discount_factor': 0.99,
            'epsilon': 1.0,
            'epsilon_min': 0.01,
            'epsilon_decay': 0.995,
            'seed': 42
        },
        'training': {
            'n_episodes': 1000,
            'max_steps_per_episode': 500,
            'eval_interval': 50,
            'checkpoint_interval': 200,
            'checkpoint_dir': './checkpoints'
        }
    }
    
    # Save config
    Path(config['training']['checkpoint_dir']).mkdir(parents=True, exist_ok=True)
    with open(f"{config['training']['checkpoint_dir']}/config.json", 'w') as f:
        json.dump(config, f, indent=2)
    
    print("\n📊 Configuration:")
    print(f"  Initial Capital: ${config['env']['initial_capital']:,.0f}")
    print(f"  Transaction Cost: {config['env']['transaction_cost']*100:.2f}%")
    print(f"  Episodes: {config['training']['n_episodes']}")
    print(f"  Learning Rate: {config['agent']['learning_rate']}")
    print(f"  Discount Factor: {config['agent']['discount_factor']}")
    
    # Initialize environment and agent
    print("\n🏗️  Initializing environment and agent...")
    env = ArbitrageEnv(**config['env'])
    agent = QLearningAgent(
        state_bins=config['env']['n_state_bins'],
        n_actions=env.n_actions,
        **config['agent']
    )
    
    print(f"  State space: {agent.q_table.shape[:-1]}")
    print(f"  Action space: {agent.n_actions}")
    print(f"  Q-table size: {agent.q_table.size:,} parameters")
    
    # Train
    print("\n🚀 Starting training...\n")
    history = train_agent(env, agent, **config['training'])
    
    # Plot results
    print("\n📈 Generating training curves...")
    plot_training_curves(
        history,
        save_path=f"{config['training']['checkpoint_dir']}/training_curves.png"
    )
    
    # Summary statistics
    print("\n📊 Training Summary:")
    print(f"  Total Episodes: {len(history['episode_rewards'])}")
    print(f"  Best Eval Reward: {history['best_reward']:.2f}")
    print(f"  Final Epsilon: {history['epsilon_history'][-1]:.4f}")
    print(f"  Avg Final 100 Episodes Profit: ${np.mean(history['episode_profits'][-100:]):,.2f}")
    print(f"  Total Steps Trained: {agent.total_steps:,}")
    
    print("\n✅ Training complete! Models saved to:", config['training']['checkpoint_dir'])


if __name__ == "__main__":
    main()
