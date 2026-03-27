"""
Q-Learning Agent for Arbitrage Trading.
Implements tabular Q-learning with epsilon-greedy exploration.
"""

import numpy as np
from typing import Tuple, List, Dict, Optional
import json
from pathlib import Path


class QLearningAgent:
    """
    Tabular Q-Learning agent for arbitrage trading.
    
    Features:
    - Epsilon-greedy exploration with decay
    - Experience replay (optional)
    - Q-table persistence
    - Training statistics tracking
    """
    
    def __init__(
        self,
        state_bins: int = 10,
        n_actions: int = 7,
        n_position_states: int = 3,
        learning_rate: float = 0.1,
        discount_factor: float = 0.99,
        epsilon: float = 1.0,
        epsilon_min: float = 0.01,
        epsilon_decay: float = 0.995,
        seed: Optional[int] = None
    ):
        """
        Initialize Q-Learning agent.
        
        Args:
            state_bins: Number of bins for each state dimension
            n_actions: Number of possible actions
            n_position_states: Number of position states (0=none, 1=ex1, 2=ex2)
            learning_rate: Q-value update rate (alpha)
            discount_factor: Future reward discount (gamma)
            epsilon: Initial exploration rate
            epsilon_min: Minimum exploration rate
            epsilon_decay: Epsilon decay per episode
            seed: Random seed
        """
        self.state_bins = state_bins
        self.n_actions = n_actions
        self.n_position_states = n_position_states
        self.learning_rate = learning_rate
        self.discount_factor = discount_factor
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay
        
        if seed is not None:
            np.random.seed(seed)
        
        # Initialize Q-table with small random values
        # State: (spread_bin, vol_bin, liq_bin, position)
        self.q_table = np.random.uniform(
            low=-0.01, high=0.01,
            size=(state_bins, state_bins, state_bins, n_position_states, n_actions)
        )
        
        # Training statistics
        self.training_stats = {
            'episode_rewards': [],
            'episode_lengths': [],
            'epsilon_history': [],
            'q_value_history': []
        }
        
        self.total_steps = 0
    
    def get_action(
        self,
        state: Tuple[int, int, int, int],
        valid_actions: List[int] = None,
        training: bool = True
    ) -> int:
        """
        Select action using epsilon-greedy policy.
        
        Args:
            state: Current state tuple
            valid_actions: List of valid action indices (optional)
            training: Whether to use exploration
        
        Returns:
            Selected action index
        """
        if valid_actions is None:
            valid_actions = list(range(self.n_actions))
        
        # Epsilon-greedy exploration
        if training and np.random.random() < self.epsilon:
            return np.random.choice(valid_actions)
        
        # Greedy action selection
        q_values = self.q_table[state]
        
        # Mask invalid actions
        masked_q = np.full(self.n_actions, -np.inf)
        for a in valid_actions:
            masked_q[a] = q_values[a]
        
        return int(np.argmax(masked_q))
    
    def update(
        self,
        state: Tuple[int, int, int, int],
        action: int,
        reward: float,
        next_state: Tuple[int, int, int, int],
        done: bool
    ):
        """
        Update Q-value using Q-learning update rule.
        
        Q(s,a) = Q(s,a) + α * (r + γ * max(Q(s',a')) - Q(s,a))
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Resulting state
            done: Whether episode ended
        """
        current_q = self.q_table[state][action]
        
        if done:
            target = reward
        else:
            next_max_q = np.max(self.q_table[next_state])
            target = reward + self.discount_factor * next_max_q
        
        # Q-learning update
        self.q_table[state][action] += self.learning_rate * (target - current_q)
        self.total_steps += 1
    
    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
    
    def record_episode(self, total_reward: float, episode_length: int):
        """Record episode statistics."""
        self.training_stats['episode_rewards'].append(total_reward)
        self.training_stats['episode_lengths'].append(episode_length)
        self.training_stats['epsilon_history'].append(self.epsilon)
        self.training_stats['q_value_history'].append(np.mean(np.abs(self.q_table)))
    
    def get_policy(self) -> np.ndarray:
        """
        Extract greedy policy from Q-table.
        
        Returns:
            Array of optimal actions for each state
        """
        return np.argmax(self.q_table, axis=-1)
    
    def save(self, filepath: str):
        """
        Save agent to file.
        
        Args:
            filepath: Path to save file
        """
        checkpoint = {
            'q_table': self.q_table.tolist(),
            'state_bins': self.state_bins,
            'n_actions': self.n_actions,
            'n_position_states': self.n_position_states,
            'learning_rate': self.learning_rate,
            'discount_factor': self.discount_factor,
            'epsilon': self.epsilon,
            'epsilon_min': self.epsilon_min,
            'epsilon_decay': self.epsilon_decay,
            'total_steps': self.total_steps,
            'training_stats': self.training_stats
        }
        
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(checkpoint, f)
        
        print(f"Agent saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> 'QLearningAgent':
        """
        Load agent from file.
        
        Args:
            filepath: Path to checkpoint file
        
        Returns:
            Loaded QLearningAgent instance
        """
        with open(filepath, 'r') as f:
            checkpoint = json.load(f)
        
        agent = cls(
            state_bins=checkpoint['state_bins'],
            n_actions=checkpoint['n_actions'],
            n_position_states=checkpoint['n_position_states'],
            learning_rate=checkpoint['learning_rate'],
            discount_factor=checkpoint['discount_factor'],
            epsilon=checkpoint['epsilon'],
            epsilon_min=checkpoint['epsilon_min'],
            epsilon_decay=checkpoint['epsilon_decay']
        )
        
        agent.q_table = np.array(checkpoint['q_table'])
        agent.total_steps = checkpoint['total_steps']
        agent.training_stats = checkpoint['training_stats']
        
        print(f"Agent loaded from {filepath}")
        return agent
    
    def get_state_value(self, state: Tuple[int, int, int, int]) -> float:
        """Get maximum Q-value for a state (state value)."""
        return np.max(self.q_table[state])
    
    def get_action_values(self, state: Tuple[int, int, int, int]) -> np.ndarray:
        """Get all action values for a state."""
        return self.q_table[state].copy()


class DoubleQLearningAgent(QLearningAgent):
    """
    Double Q-Learning agent to reduce overestimation bias.
    Maintains two Q-tables and randomly updates one using the other for target.
    """
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Second Q-table
        self.q_table_b = np.random.uniform(
            low=-0.01, high=0.01,
            size=self.q_table.shape
        )
    
    def get_action(
        self,
        state: Tuple[int, int, int, int],
        valid_actions: List[int] = None,
        training: bool = True
    ) -> int:
        """Select action using combined Q-values."""
        if valid_actions is None:
            valid_actions = list(range(self.n_actions))
        
        if training and np.random.random() < self.epsilon:
            return np.random.choice(valid_actions)
        
        # Use average of both Q-tables
        combined_q = (self.q_table[state] + self.q_table_b[state]) / 2
        
        masked_q = np.full(self.n_actions, -np.inf)
        for a in valid_actions:
            masked_q[a] = combined_q[a]
        
        return int(np.argmax(masked_q))
    
    def update(
        self,
        state: Tuple[int, int, int, int],
        action: int,
        reward: float,
        next_state: Tuple[int, int, int, int],
        done: bool
    ):
        """Double Q-learning update."""
        # Randomly choose which table to update
        if np.random.random() < 0.5:
            # Update Q_a using Q_b for target
            current_q = self.q_table[state][action]
            
            if done:
                target = reward
            else:
                # Use Q_a to select action, Q_b to evaluate
                best_action = np.argmax(self.q_table[next_state])
                target = reward + self.discount_factor * self.q_table_b[next_state][best_action]
            
            self.q_table[state][action] += self.learning_rate * (target - current_q)
        else:
            # Update Q_b using Q_a for target
            current_q = self.q_table_b[state][action]
            
            if done:
                target = reward
            else:
                best_action = np.argmax(self.q_table_b[next_state])
                target = reward + self.discount_factor * self.q_table[next_state][best_action]
            
            self.q_table_b[state][action] += self.learning_rate * (target - current_q)
        
        self.total_steps += 1
    
    def save(self, filepath: str):
        """Save both Q-tables."""
        checkpoint = {
            'q_table': self.q_table.tolist(),
            'q_table_b': self.q_table_b.tolist(),
            'state_bins': self.state_bins,
            'n_actions': self.n_actions,
            'n_position_states': self.n_position_states,
            'learning_rate': self.learning_rate,
            'discount_factor': self.discount_factor,
            'epsilon': self.epsilon,
            'epsilon_min': self.epsilon_min,
            'epsilon_decay': self.epsilon_decay,
            'total_steps': self.total_steps,
            'training_stats': self.training_stats
        }
        
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(checkpoint, f)
    
    @classmethod
    def load(cls, filepath: str) -> 'DoubleQLearningAgent':
        """Load Double Q-Learning agent."""
        with open(filepath, 'r') as f:
            checkpoint = json.load(f)
        
        agent = cls(
            state_bins=checkpoint['state_bins'],
            n_actions=checkpoint['n_actions'],
            n_position_states=checkpoint['n_position_states'],
            learning_rate=checkpoint['learning_rate'],
            discount_factor=checkpoint['discount_factor'],
            epsilon=checkpoint['epsilon'],
            epsilon_min=checkpoint['epsilon_min'],
            epsilon_decay=checkpoint['epsilon_decay']
        )
        
        agent.q_table = np.array(checkpoint['q_table'])
        agent.q_table_b = np.array(checkpoint['q_table_b'])
        agent.total_steps = checkpoint['total_steps']
        agent.training_stats = checkpoint['training_stats']
        
        return agent


if __name__ == "__main__":
    # Test the agent
    print("Testing QLearningAgent...")
    
    agent = QLearningAgent(state_bins=10, n_actions=7, seed=42)
    
    # Simulate some updates
    for _ in range(100):
        state = (np.random.randint(10), np.random.randint(10), 
                 np.random.randint(10), np.random.randint(3))
        action = agent.get_action(state, training=True)
        next_state = (np.random.randint(10), np.random.randint(10),
                     np.random.randint(10), np.random.randint(3))
        reward = np.random.randn()
        agent.update(state, action, reward, next_state, False)
    
    print(f"Total steps: {agent.total_steps}")
    print(f"Q-table shape: {agent.q_table.shape}")
    print(f"Mean Q-value: {np.mean(agent.q_table):.4f}")
    
    # Test save/load
    agent.save("/tmp/test_agent.json")
    loaded_agent = QLearningAgent.load("/tmp/test_agent.json")
    print(f"Loaded Q-table matches: {np.allclose(agent.q_table, loaded_agent.q_table)}")
