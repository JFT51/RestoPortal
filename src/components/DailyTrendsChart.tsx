import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData as ChartDataType,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'react-chartjs-2';
import { Check } from 'lucide-react';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DailyTrendsChartProps {
  data: {
    date: Date;
    enteringVisitors: number;
    passersby: number;
    dwellTime: number;
  }[];
}

interface MetricOption {
  id: string;
  label: string;
  color: string;
  type: 'bar' | 'line';
  yAxisID: string;
}

const METRICS: MetricOption[] = [
  { id: 'visitors', label: 'Visitors', color: 'rgb(47, 118, 34)', type: 'bar', yAxisID: 'yVisitors' },
  { id: 'passersby', label: 'Passersby', color: 'rgb(243, 151, 0)', type: 'line', yAxisID: 'yPassersby' },
  { id: 'captureRate', label: 'Capture Rate', color: 'rgb(59, 130, 246)', type: 'line', yAxisID: 'yPercentage' },
  { id: 'dwellTime', label: 'Dwell Time', color: 'rgb(190, 24, 93)', type: 'line', yAxisID: 'yTime' }
];

const DEFAULT_METRICS = ['visitors', 'captureRate'];

export function DailyTrendsChart({ data }: DailyTrendsChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS);

  // Get the last selected non-visitor metric for the right y-axis
  const activeRightAxis = useMemo(() => {
    const nonVisitorMetrics = selectedMetrics.filter(m => m !== 'visitors');
    return nonVisitorMetrics[nonVisitorMetrics.length - 1];
  }, [selectedMetrics]);

  const chartData = useMemo(() => {
    const dates = data.map(day => format(day.date, 'EEE dd MMM'));
    
    const datasets = selectedMetrics.map(metric => {
      const baseConfig = {
        label: METRICS.find(m => m.id === metric)?.label || '',
        data: data.map(d => {
          switch (metric) {
            case 'visitors':
              return d.enteringVisitors;
            case 'passersby':
              return d.passersby;
            case 'captureRate':
              return d.passersby > 0 
                ? (d.enteringVisitors / d.passersby) * 100 
                : 0;
            case 'dwellTime':
              return d.dwellTime;
            default:
              return 0;
          }
        }),
      };

      if (metric === 'visitors') {
        return {
          ...baseConfig,
          type: 'bar' as const,
          backgroundColor: METRICS.find(m => m.id === metric)?.color || '#000',
          borderColor: METRICS.find(m => m.id === metric)?.color || '#000',
          yAxisID: METRICS.find(m => m.id === metric)?.yAxisID || 'yVisitors',
          order: 1,
          datalabels: {
            display: true,
            color: 'rgb(17, 24, 39)',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: {
              weight: 'bold',
              size: 12
            },
            formatter: (value: number) => value.toLocaleString()
          }
        } as const;
      }

      return {
        ...baseConfig,
        type: 'line' as const,
        backgroundColor: METRICS.find(m => m.id === metric)?.color || '#000',
        borderColor: METRICS.find(m => m.id === metric)?.color || '#000',
        yAxisID: METRICS.find(m => m.id === metric)?.yAxisID || 'yVisitors',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: METRICS.find(m => m.id === metric)?.color || '#000',
        order: 0,
        datalabels: {
          display: false
        }
      } as const;
    });

    const chartData: ChartDataType<'bar' | 'line'> = {
      labels: dates,
      datasets
    };

    return chartData;
  }, [data, selectedMetrics]);

  // Calculate max values for each axis with some padding
  const maxValues = useMemo(() => {
    const maxVisitors = Math.max(...data.map(d => d.enteringVisitors));
    const maxPassersby = Math.max(...data.map(d => d.passersby));
    const maxCaptureRate = Math.max(...data.map(d => 
      d.passersby > 0 ? (d.enteringVisitors / d.passersby) * 100 : 0
    ));
    const maxDwellTime = Math.max(...data.map(d => d.dwellTime));

    // Calculate optimal step size for capture rate
    const captureRateStep = Math.ceil(maxCaptureRate / 10);
    const captureRateMax = Math.ceil(maxCaptureRate / captureRateStep) * captureRateStep;

    return {
      visitors: Math.ceil(maxVisitors * 1.1),
      passersby: Math.ceil(maxPassersby * 1.1),
      captureRateStep,
      captureRateMax: Math.max(captureRateMax, 5), // Ensure minimum of 5%
      dwellTime: Math.ceil(maxDwellTime * 1.1)
    };
  }, [data]);

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            weight: 'bold'
          }
        }
      },
      yVisitors: {
        type: 'linear',
        display: selectedMetrics.includes('visitors'),
        position: 'left',
        beginAtZero: true,
        max: maxValues.visitors,
        title: {
          display: true,
          text: 'Number of Visitors',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.06)'
        }
      },
      yPassersby: {
        type: 'linear',
        display: activeRightAxis === 'passersby',
        position: 'right',
        beginAtZero: true,
        max: maxValues.passersby,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Number of Passersby',
          font: {
            weight: 'bold'
          }
        }
      },
      yPercentage: {
        type: 'linear',
        display: activeRightAxis === 'captureRate',
        position: 'right',
        beginAtZero: true,
        max: maxValues.captureRateMax,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Capture Rate (%)',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          callback: (value) => `${value}%`,
          stepSize: maxValues.captureRateStep
        }
      },
      yTime: {
        type: 'linear',
        display: activeRightAxis === 'dwellTime',
        position: 'right',
        beginAtZero: true,
        max: maxValues.dwellTime,
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Dwell Time (minutes)',
          font: {
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
              if (label.includes('Rate')) {
                label += context.parsed.y.toFixed(1) + '%';
              } else if (label.includes('Time')) {
                label += Math.round(context.parsed.y) + ' min';
              } else {
                label += Math.round(context.parsed.y);
              }
            }
            return label;
          }
        }
      },
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Daily Trends',
        font: {
          size: 16,
          weight: 'bold'
        },
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex flex-wrap justify-center gap-3">
          {METRICS.map(metric => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetrics(prev => 
                prev.includes(metric.id)
                  ? prev.filter(id => id !== metric.id)
                  : [...prev, metric.id]
              )}
              className={`
                px-4 py-2 rounded-lg flex items-center gap-2.5
                transition-all duration-200 border-2
                ${selectedMetrics.includes(metric.id)
                  ? 'bg-white shadow-sm'
                  : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }
              `}
              style={{
                borderColor: selectedMetrics.includes(metric.id) 
                  ? metric.color 
                  : 'transparent'
              }}
            >
              <div 
                className="w-4 h-4 flex items-center justify-center rounded-sm"
                style={{ backgroundColor: metric.color }}
              >
                {selectedMetrics.includes(metric.id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="font-medium text-gray-700">
                {metric.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
}