import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // For time-based x-axis
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Adapter for date/time scales
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@iconify/react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ProgressChart = ({ exerciseName }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const chartRef = useRef(null); // Ref for the chart instance

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!token || !exerciseName) {
        setIsLoading(false);
        if (!exerciseName) setError('Please select an exercise to view progress.');
        else setError('Not authorized.');
        setChartData(null);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiService.getExerciseProgress(token, exerciseName);

        if (data && data.length > 0) {
          // Ensure data is sorted by date for correct chart rendering
          const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

          setChartData({
            labels: sortedData.map(d => new Date(d.date)), // Use Date objects for time scale
            datasets: [
              {
                label: `Weight Lifted for ${exerciseName} (kg)`,
                data: sortedData.map(d => d.weight),
                fill: true,
                backgroundColor: 'rgba(75,192,192,0.2)',
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.1,
                pointRadius: 5,
                pointHoverRadius: 8,
              },
              // Potentially add another dataset for reps or volume
            ],
          });
        } else {
          setChartData(null); // No data found
          setError(`No progress data found for ${exerciseName}. Log some workouts!`);
        }
      } catch (err) {
        setError(err.message || `Failed to fetch progress for ${exerciseName}.`);
        setChartData(null);
        console.error('Error fetching progress data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();

    // Cleanup: Destroy chart instance if it exists
    return () => {
      if (chartRef.current) {
        // chartRef.current.destroy(); // react-chartjs-2 handles this internally
      }
    };
  }, [token, exerciseName]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            color: 'var(--text-color)', // Use CSS variable
            font: {
                family: 'var(--font-family-body)'
            }
        }
      },
      title: {
        display: true,
        text: `Progress for ${exerciseName || 'Exercise'}`, // Dynamic title
        color: 'var(--text-color)', // Use CSS variable
        font: {
            size: 18,
            family: 'var(--font-family-headings)'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y + ' kg';
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM dd, yyyy', // e.g., Aug 23, 2023
          displayFormats: {
            day: 'MMM dd'
          }
        },
        title: {
          display: true,
          text: 'Date',
          color: 'var(--text-color-muted)',
          font: {
            family: 'var(--font-family-body)'
            }
        },
        ticks: {
            color: 'var(--text-color-muted)'
        },
        grid: {
            color: 'var(--border-color-light, #eeeeee)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Weight (kg)',
          color: 'var(--text-color-muted)',
           font: {
            family: 'var(--font-family-body)'
            }
        },
        beginAtZero: true,
        ticks: {
            color: 'var(--text-color-muted)'
        },
        grid: {
            color: 'var(--border-color, #e0e0e0)'
        }
      },
    },
  };

  if (!exerciseName) {
      return (
        <div style={styles.container} className="card">
            <div style={styles.promptContainer}>
                <Icon icon="fluent:chart-multiple-24-regular" style={styles.promptIcon} />
                <p style={styles.promptText}>Select an exercise to view its progress chart.</p>
            </div>
        </div>
      )
  }

  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div><p>Loading Chart...</p></div>;
  }

  if (error && !chartData) {
    return <div className="error-message" style={styles.message}>{error}</div>;
  }

  if (!chartData) {
    return <div className="info-message" style={styles.message}>No data available to display chart for {exerciseName}.</div>;
  }

  return (
    <div className="progress-chart-container card" style={styles.container}>
      <div style={styles.chartWrapper}>
        <Line ref={chartRef} options={options} data={chartData} />
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1.5rem',
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--border-radius-lg)',
    minHeight: '400px', // Ensure container has a decent height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', 
  },
  chartWrapper: {
    position: 'relative',
    height: '350px', // Fixed height for the chart area or make it responsive
    width: '100%'
  },
  message: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.1rem'
  },
  promptContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-color-muted)'
  },
  promptIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  promptText: {
    fontSize: '1.2rem',
    textAlign: 'center'
  }
};

export default ProgressChart;
