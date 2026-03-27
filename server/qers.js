/**
 * QERS - Quantum-Entropy Resonance Score Algorithm
 * A custom stock-ranking algorithm implementation
 */

// Hardcoded dataset as specified
export const stocks = [
  { ticker: "RELIANCE", sector: "Energy", V: 0.22, L: 0.95, D: 1.32 },
  { ticker: "HDFCBANK", sector: "Banking", V: 0.18, L: 0.97, D: 1.28 },
  { ticker: "ICICIBANK", sector: "Banking", V: 0.21, L: 0.96, D: 1.30 },
  { ticker: "TCS", sector: "IT", V: 0.17, L: 0.94, D: 1.27 },
  { ticker: "INFY", sector: "IT", V: 0.19, L: 0.95, D: 1.29 }
];

// QERS Algorithm Constants
export const ALPHA = 1.2;
export const BETA = 3.5;
export const GAMMA = 1.1;
export const DELTA = 2.3;

/**
 * Step 1: Calculate Sector Entropy (H_s)
 * p_i = V_i / sum(V in sector)
 * H_s = -Σ p_i * log(p_i)
 */
function calculateSectorEntropy(stocks) {
  const sectors = {};
  
  // Group stocks by sector
  stocks.forEach(stock => {
    if (!sectors[stock.sector]) {
      sectors[stock.sector] = [];
    }
    sectors[stock.sector].push(stock);
  });
  
  const sectorEntropy = {};
  
  for (const sector in sectors) {
    const sectorStocks = sectors[sector];
    const sumV = sectorStocks.reduce((sum, s) => sum + s.V, 0);
    
    let entropy = 0;
    sectorStocks.forEach(stock => {
      const p_i = stock.V / sumV;
      if (p_i > 0) {
        entropy -= p_i * Math.log(p_i);
      }
    });
    
    sectorEntropy[sector] = entropy;
  }
  
  return sectorEntropy;
}

/**
 * Step 2: Calculate Sector Mean Fractal (D_s)
 * D_s = average(D_i in sector)
 */
function calculateSectorMeanFractal(stocks) {
  const sectors = {};
  
  // Group stocks by sector
  stocks.forEach(stock => {
    if (!sectors[stock.sector]) {
      sectors[stock.sector] = [];
    }
    sectors[stock.sector].push(stock);
  });
  
  const sectorMeanFractal = {};
  
  for (const sector in sectors) {
    const sectorStocks = sectors[sector];
    const sumD = sectorStocks.reduce((sum, s) => sum + s.D, 0);
    sectorMeanFractal[sector] = sumD / sectorStocks.length;
  }
  
  return sectorMeanFractal;
}

/**
 * Step 3: Calculate QERS for each stock
 * QERS_i = (L_i^alpha * exp(-beta * V_i) / (H_s^gamma)) * |1 - D_i/D_s|^(-delta)
 */
function calculateQERS(stocks) {
  const sectorEntropy = calculateSectorEntropy(stocks);
  const sectorMeanFractal = calculateSectorMeanFractal(stocks);
  
  const results = stocks.map(stock => {
    const { ticker, sector, V, L, D } = stock;
    
    const H_s = sectorEntropy[sector];
    const D_s = sectorMeanFractal[sector];
    
    // QERS Formula components
    const liquidityFactor = Math.pow(L, ALPHA);
    const volatilityDecay = Math.exp(-BETA * V);
    const entropyFactor = Math.pow(H_s, GAMMA);
    
    // Handle edge case where D_i equals D_s
    const fractalDeviation = Math.abs(1 - D / D_s);
    const fractalFactor = fractalDeviation > 0 
      ? Math.pow(fractalDeviation, -DELTA) 
      : 1000; // Cap for edge case
    
    // Full QERS calculation
    let qers = (liquidityFactor * volatilityDecay / entropyFactor) * fractalFactor;
    
    // Normalize to reasonable range (0-100)
    qers = Math.min(qers, 100);
    
    return {
      ticker,
      sector,
      qers: parseFloat(qers.toFixed(4)),
      // Include intermediate values for debugging/analysis
      metadata: {
        H_s: parseFloat(H_s.toFixed(4)),
        D_s: parseFloat(D_s.toFixed(4)),
        liquidityFactor: parseFloat(liquidityFactor.toFixed(4)),
        volatilityDecay: parseFloat(volatilityDecay.toFixed(4)),
        fractalDeviation: parseFloat(fractalDeviation.toFixed(4))
      }
    };
  });
  
  // Sort by QERS descending
  results.sort((a, b) => b.qers - a.qers);
  
  // Add ranking
  return results.map((result, index) => ({
    ...result,
    rank: index + 1
  }));
}

/**
 * Get simplified QERS results (ticker and qers only)
 */
function getSimplifiedQERS() {
  const results = calculateQERS(stocks);
  return results.map(({ ticker, qers, rank }) => ({ ticker, qers, rank }));
}

/**
 * Get detailed QERS results (includes metadata)
 */
function getDetailedQERS() {
  return calculateQERS(stocks);
}

export {
  calculateSectorEntropy,
  calculateSectorMeanFractal,
  calculateQERS,
  getSimplifiedQERS,
  getDetailedQERS
};
