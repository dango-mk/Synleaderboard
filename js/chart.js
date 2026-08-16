/**
 * Charting Engine using Chart.js
 * Renders 12-race Score Difference Progression Chart (Y-Axis: Score Diff, X-Axis: Race Number).
 */

let currentChartInstance = null;

function renderMatchTrendChart(canvasId, match) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (currentChartInstance) {
    currentChartInstance.destroy();
    currentChartInstance = null;
  }

  if (!match || !match.races || match.races.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.fillText('レース推移データが存在しません', canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = match.races.map(r => `R${r.raceNum}`);
  const cumDiffs = match.races.map(r => r.cumDiff);

  const ctx = canvas.getContext('2d');

  // Gradient fill for score difference
  const positiveGrad = ctx.createLinearGradient(0, 0, 0, 300);
  positiveGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  positiveGrad.addColorStop(1, 'rgba(56, 189, 248, 0.05)');

  // Point colors depending on whether leading or behind
  const pointColors = cumDiffs.map(d => d >= 0 ? '#38BDF8' : '#F43F5E');

  currentChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '累積得点差',
          data: cumDiffs,
          borderColor: function(context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return '#38BDF8';
            
            // Dynamic border color: Cyan if positive, Rose if negative
            const zeroY = chart.scales.y.getPixelForValue(0);
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            const zeroRatio = Math.max(0, Math.min(1, (zeroY - chartArea.top) / (chartArea.bottom - chartArea.top)));
            
            gradient.addColorStop(0, '#38BDF8');
            gradient.addColorStop(zeroRatio, '#38BDF8');
            gradient.addColorStop(zeroRatio, '#F43F5E');
            gradient.addColorStop(1, '#F43F5E');
            return gradient;
          },
          backgroundColor: positiveGrad,
          borderWidth: 3.5,
          tension: 0.35,
          fill: {
            target: 'origin',
            above: 'rgba(56, 189, 248, 0.2)',
            below: 'rgba(244, 63, 94, 0.2)'
          },
          pointBackgroundColor: pointColors,
          pointBorderColor: '#0F172A',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#E2E8F0',
            font: { family: "'Inter', 'Noto Sans JP', sans-serif", size: 13, weight: 'bold' },
            boxWidth: 12
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            title: function(tooltipItems) {
              return `レース ${tooltipItems[0].label}`;
            },
            label: function(context) {
              const diffVal = context.parsed.y;
              const index = context.dataIndex;
              const race = match.races[index];
              const diffStr = diffVal > 0 ? `+${diffVal} リード` : diffVal < 0 ? `${diffVal} ビハインド` : '同点 0';
              return `累積得点差: ${diffStr}`;
            },
            afterLabel: function(context) {
              const index = context.dataIndex;
              const race = match.races[index];
              if (!race) return '';
              const rDiffStr = race.diff > 0 ? `+${race.diff}` : `${race.diff}`;
              const posStr = race.positions && race.positions.length > 0 ? ` [順位: ${race.positions.join(',')}]` : '';
              return `このレース獲得点: ${race.homeScore} - ${race.awayScore} (${rDiffStr}pt)${posStr}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'レース数 (Race 1 〜 12)',
            color: '#94A3B8',
            font: { family: "'Inter', sans-serif", size: 12, weight: '600' }
          },
          grid: {
            color: 'rgba(51, 65, 85, 0.4)',
            tickColor: 'transparent'
          },
          ticks: {
            color: '#CBD5E1',
            font: { family: "'Inter', sans-serif", size: 12, weight: 'bold' }
          }
        },
        y: {
          title: {
            display: true,
            text: '累積点数差 (リード / ビハインド)',
            color: '#94A3B8',
            font: { family: "'Inter', sans-serif", size: 12, weight: '600' }
          },
          grid: {
            color: function(context) {
              if (context.tick.value === 0) return '#64748B'; // Highlight 0 baseline
              return 'rgba(51, 65, 85, 0.3)';
            },
            lineWidth: function(context) {
              return context.tick.value === 0 ? 2 : 1;
            }
          },
          ticks: {
            color: '#CBD5E1',
            font: { family: "'Inter', sans-serif", size: 12 },
            callback: function(value) {
              return value > 0 ? `+${value}` : `${value}`;
            }
          }
        }
      }
    }
  });
}

window.ChartEngine = {
  renderMatchTrendChart
};
