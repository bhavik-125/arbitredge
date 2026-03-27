/**
 * Express Backend Server for ArbitrEdge with QERS Integration
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSimplifiedQERS, getDetailedQERS } from './qers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// -------------------------------------------
// API Routes
// -------------------------------------------

/**
 * GET /api/qers
 * Returns QERS scores for all stocks, sorted by score (descending)
 * Response format: [{ ticker, qers, rank }, ...]
 */
app.get('/api/qers', (req, res) => {
  try {
    const results = getSimplifiedQERS();
    res.json(results);
  } catch (error) {
    console.error('Error calculating QERS:', error);
    res.status(500).json({ error: 'Failed to calculate QERS scores' });
  }
});

/**
 * GET /api/qers/detailed
 * Returns detailed QERS data including intermediate calculations
 */
app.get('/api/qers/detailed', (req, res) => {
  try {
    const results = getDetailedQERS();
    res.json(results);
  } catch (error) {
    console.error('Error calculating detailed QERS:', error);
    res.status(500).json({ error: 'Failed to calculate detailed QERS scores' });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`QERS API Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/qers          - Get QERS rankings`);
  console.log(`  GET /api/qers/detailed - Get detailed QERS data`);
  console.log(`  GET /api/health        - Health check`);
});
