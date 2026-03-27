"""
Quick visualization script to plot Q-table heatmap and policy visualization.
Run after training to inspect learned Q-values.
"""

import numpy as np
import matplotlib.pyplot as plt
import json
from pathlib import Path

def load_qtable(model_path="./checkpoints/best_model.json"):
    """Load Q-table from saved model."""
    with open(model_path, 'r') as f:
        checkpoint = json.load(f)
    return np.array(checkpoint['q_table'])

def plot_qtable_heatmap(q_table, save_path="./checkpoints/qtable_heatmap.png"):
    """
    Plot Q-table as heatmaps.
    
    Shows learned values for each state-action pair.
    """
    # Average over volatility and liquidity dimensions
    # Result: (spread, position, action)
    q_avg = q_table.mean(axis=(1, 2))
    
    action_names = ["HOLD", "BUY_EX1", "SELL_EX1", "BUY_EX2", 
                   "SELL_EX2", "ARB_LONG", "ARB_SHORT"]
    position_names = ["No Position", "Long Ex1", "Long Ex2"]
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    for pos_idx, pos_name in enumerate(position_names):
        ax = axes[pos_idx]
        
        # Get Q-values for this position state
        data = q_avg[:, pos_idx, :]
        
        im = ax.imshow(data, cmap='RdYlGn', aspect='auto')
        ax.set_xlabel('Action', fontsize=12)
        ax.set_ylabel('Price Spread (bins)', fontsize=12)
        ax.set_title(f'Q-Values: {pos_name}', fontsize=14, fontweight='bold')
        
        # Set ticks
        ax.set_xticks(range(len(action_names)))
        ax.set_xticklabels(action_names, rotation=45, ha='right')
        ax.set_yticks(range(0, 10, 2))
        
        # Add colorbar
        plt.colorbar(im, ax=ax, label='Q-Value')
        
        # Annotate max Q-value for each spread bin
        for i in range(data.shape[0]):
            max_action = np.argmax(data[i])
            ax.plot(max_action, i, 'r*', markersize=10)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    print(f"✓ Q-table heatmap saved to {save_path}")
    plt.show()

def plot_learned_policy(q_table, save_path="./checkpoints/learned_policy.png"):
    """
    Visualize the learned policy (best action for each state).
    """
    # Get best action for each state
    policy = np.argmax(q_table, axis=-1)
    
    # Average over liquidity dimension for visualization
    policy_avg = np.round(policy.mean(axis=2)).astype(int)
    
    action_names = ["HOLD", "BUY_EX1", "SELL_EX1", "BUY_EX2", 
                   "SELL_EX2", "ARB_LONG", "ARB_SHORT"]
    position_names = ["No Position", "Long Ex1", "Long Ex2"]
    
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    
    for pos_idx, pos_name in enumerate(position_names):
        ax = axes[pos_idx]
        
        data = policy_avg[:, :, pos_idx]
        
        im = ax.imshow(data, cmap='tab10', aspect='auto', vmin=0, vmax=6)
        ax.set_xlabel('Volatility (bins)', fontsize=12)
        ax.set_ylabel('Price Spread (bins)', fontsize=12)
        ax.set_title(f'Policy: {pos_name}', fontsize=14, fontweight='bold')
        
        # Add text annotations
        for i in range(data.shape[0]):
            for j in range(data.shape[1]):
                action_idx = data[i, j]
                text = action_names[action_idx][:3]  # Abbreviate
                ax.text(j, i, text, ha='center', va='center',
                       color='white', fontsize=8, fontweight='bold')
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax, ticks=range(7))
        cbar.set_label('Action', fontsize=10)
        cbar.ax.set_yticklabels([a[:8] for a in action_names], fontsize=8)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches='tight')
    print(f"✓ Learned policy saved to {save_path}")
    plt.show()

def analyze_qtable_stats(q_table):
    """Print Q-table statistics."""
    print("\n" + "="*50)
    print("Q-TABLE ANALYSIS")
    print("="*50)
    
    print(f"\nShape: {q_table.shape}")
    print(f"Total parameters: {q_table.size:,}")
    
    print(f"\nQ-value statistics:")
    print(f"  Mean: {np.mean(q_table):.4f}")
    print(f"  Std:  {np.std(q_table):.4f}")
    print(f"  Min:  {np.min(q_table):.4f}")
    print(f"  Max:  {np.max(q_table):.4f}")
    
    # Action preferences
    action_names = ["HOLD", "BUY_EX1", "SELL_EX1", "BUY_EX2", 
                   "SELL_EX2", "ARB_LONG", "ARB_SHORT"]
    
    best_actions = np.argmax(q_table, axis=-1).flatten()
    action_counts = np.bincount(best_actions, minlength=7)
    
    print(f"\nAction preferences (% of states):")
    for idx, (name, count) in enumerate(zip(action_names, action_counts)):
        pct = count / len(best_actions) * 100
        bar = '█' * int(pct / 2)
        print(f"  {name:12s}: {pct:5.1f}% {bar}")
    
    # High-value states
    top_states = np.unravel_index(
        np.argsort(q_table.max(axis=-1).flatten())[-10:],
        q_table.shape[:-1]
    )
    
    print(f"\nTop 10 high-value states:")
    print(f"  (Spread, Vol, Liq, Pos)")
    for i in range(10):
        s = tuple(idx[-(i+1)] for idx in top_states)
        max_q = q_table[s].max()
        best_action = action_names[q_table[s].argmax()]
        print(f"  {s} → {best_action:12s} (Q={max_q:.3f})")
    
    print("\n" + "="*50 + "\n")

def main():
    """Main visualization function."""
    model_path = "./checkpoints/best_model.json"
    
    if not Path(model_path).exists():
        print(f"❌ Model not found at {model_path}")
        print("Please train the model first using: python train.py")
        return
    
    print("📊 Loading Q-table...")
    q_table = load_qtable(model_path)
    
    print("📈 Generating visualizations...\n")
    
    # Statistics
    analyze_qtable_stats(q_table)
    
    # Heatmaps
    plot_qtable_heatmap(q_table)
    
    # Policy
    plot_learned_policy(q_table)
    
    print("\n✅ Visualization complete!")
    print("Check ./checkpoints/ for generated plots.")

if __name__ == "__main__":
    main()
