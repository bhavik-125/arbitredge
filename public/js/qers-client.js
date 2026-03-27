/**
 * QERS Frontend Client
 * Fetches QERS data from API and renders chart + table
 */

// Chart instance reference
let qersChart = null;

/**
 * Fetch QERS data from the API
 */
async function fetchQERS() {
  const container = document.getElementById('rankings-container');
  
  try {
    container.innerHTML = '<div class="loading">Loading QERS data...</div>';
    
    const response = await fetch('/api/qers');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    renderTable(data);
    renderChart(data);
    
  } catch (error) {
    console.error('Error fetching QERS:', error);
    container.innerHTML = `
      <div class="error">
        <p>Failed to load QERS data</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">${error.message}</p>
      </div>
    `;
  }
}

/**
 * Render the rankings table
 */
function renderTable(data) {
  const container = document.getElementById('rankings-container');
  
  const tableHTML = `
    <table class="rankings-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Ticker</th>
          <th>QERS Score</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(stock => `
          <tr>
            <td>
              <span class="rank-badge ${getRankClass(stock.rank)}">
                ${stock.rank}
              </span>
            </td>
            <td class="ticker">${stock.ticker}</td>
            <td class="qers-score">${stock.qers.toFixed(4)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  container.innerHTML = tableHTML;
}

/**
 * Get CSS class for rank badge
 */
function getRankClass(rank) {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return 'rank-default';
}

/**
 * Render the bar chart using Chart.js
 */
function renderChart(data) {
  const ctx = document.getElementById('qersChart').getContext('2d');
  
  // Destroy existing chart if any
  if (qersChart) {
    qersChart.destroy();
  }
  
  // Prepare data for chart
  const labels = data.map(stock => stock.ticker);
  const scores = data.map(stock => stock.qers);
  
  // Generate gradient colors
  const colors = data.map((_, index) => {
    const hue = 180 + (index * 30); // Cyan to purple range
    return `hsla(${hue}, 70%, 50%, 0.8)`;
  });
  
  const borderColors = data.map((_, index) => {
    const hue = 180 + (index * 30);
    return `hsla(${hue}, 70%, 60%, 1)`;
  });
  
  qersChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'QERS Score',
        data: scores,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#00d4ff',
          bodyColor: '#fff',
          borderColor: 'rgba(0, 212, 255, 0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              return `QERS: ${context.raw.toFixed(4)}`;
            },
            afterLabel: function(context) {
              return `Rank: #${context.dataIndex + 1}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#888',
            font: {
              weight: 'bold'
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#888'
          },
          title: {
            display: true,
            text: 'QERS Score',
            color: '#888'
          }
        }
      }
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', fetchQERS);
