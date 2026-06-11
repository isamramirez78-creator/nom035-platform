import { useEffect, useRef } from 'react';

interface RiskChartProps {
  data: { [key: string]: number };
}

export default function RiskChart({ data }: RiskChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    // Dynamic import of Chart.js to avoid SSR issues
    import('chart.js/auto').then((Chart) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      Chart.Chart.getChart(ctx)?.destroy();

      const labels = ['Sin Riesgo', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];
      const values = [
        data['sin-riesgo'] || 0,
        data['bajo'] || 0,
        data['medio'] || 0,
        data['alto'] || 0,
        data['muy-alto'] || 0
      ];

      new Chart.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#10b981', // green
              '#3b82f6', // blue  
              '#f59e0b', // amber
              '#f97316', // orange
              '#ef4444'  // red
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                  return `${context.label}: ${context.parsed} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }).catch(error => {
      console.error('Error loading Chart.js:', error);
    });
  }, [data]);

  return <canvas ref={canvasRef} />;
}
