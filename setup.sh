#!/bin/bash

echo "=================================="
echo "QERS Trading System - Quick Start"
echo "=================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Setup Python environment
echo "📦 Setting up Python environment..."
cd ml
python3 -m pip install -q -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✓ Python dependencies installed"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Train model (optional - comment out if you want to skip)
echo ""
read -p "Train Q-Learning model now? (takes ~5-10 min) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Training Q-Learning agent..."
    python3 train.py
    
    if [ $? -eq 0 ]; then
        echo "✓ Training complete!"
        
        # Run backtest
        echo ""
        read -p "Run backtest now? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔬 Running backtest..."
            python3 test.py
        fi
    else
        echo "❌ Training failed"
        exit 1
    fi
fi

cd ..

# Setup Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install
if [ $? -eq 0 ]; then
    echo "✓ Node.js dependencies installed"
else
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "To start the system:"
echo ""
echo "1. Start FastAPI backend:"
echo "   python server/api.py"
echo "   (Runs on http://localhost:8000)"
echo ""
echo "2. Start React frontend:"
echo "   npm run dev"
echo "   (Runs on http://localhost:5173)"
echo ""
echo "3. API Documentation:"
echo "   http://localhost:8000/docs"
echo ""
echo "=================================="
