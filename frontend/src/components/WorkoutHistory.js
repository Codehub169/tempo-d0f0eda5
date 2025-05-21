import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import apiService from '../services/apiService';
import { Icon } from '@iconify/react';

const WorkoutHistory = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) {
        setIsLoading(false);
        //setError('You must be logged in to view workout history.'); // Or rely on protected route
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiService.getWorkoutHistory(token);
        setHistory(data || []); 
      } catch (err) {
        console.error('Failed to fetch workout history:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load workout history.');
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [token]);

  if (isLoading) {
    return (
      <div className="loading-container" style={styles.centeredMessage}>
        <div className="loading-spinner"></div>
        <p>Loading workout history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message card" style={{ ...styles.centeredMessage, ...styles.cardStyles, padding: '20px' }}>
        <Icon icon="material-symbols:error-outline" style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--error-color)' }} />
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card" style={{ ...styles.centeredMessage, ...styles.cardStyles, padding: '30px 20px' }}>
        <Icon icon="mdi:weight-lifter" style={{ fontSize: '3rem', marginBottom: '15px', color: 'var(--primary-color)' }} />
        <h2>No Workouts Yet</h2>
        <p style={{color: 'var(--text-color-secondary)'}}>Start logging your workouts to see your history here!</p>
      </div>
    );
  }

  return (
    <div style={styles.historyContainer} className="card">
      <h2 style={styles.header}>
        <Icon icon="material-symbols:history" style={styles.headerIcon} />
        Workout History
      </h2>
      <ul style={styles.list}>
        {history.map((entry) => (
          <li key={entry.id} style={styles.listItem} className="card">
            <div style={styles.entryHeader}>
              <strong style={styles.exerciseName}>{entry.exercise_name}</strong>
              <span style={styles.date}>{new Date(entry.date).toLocaleDateString()}</span>
            </div>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <Icon icon="mdi:weight-kilogram" style={styles.detailIcon} />
                <span>{entry.weight || 0} kg</span>
              </div>
              <div style={styles.detailItem}>
                <Icon icon="mdi:counter" style={styles.detailIcon} />
                <span>{entry.sets} sets</span>
              </div>
              <div style={styles.detailItem}>
                <Icon icon="mdi:repeat" style={styles.detailIcon} />
                <span>{entry.reps} reps</span>
              </div>
              {entry.duration && (
                <div style={styles.detailItem}>
                  <Icon icon="mdi:timer-sand" style={styles.detailIcon} />
                  <span>{entry.duration} sec</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  historyContainer: {
    padding: '20px',
    borderRadius: 'var(--border-radius)',
    backgroundColor: 'var(--surface-color)', // Using CSS var from App.css
    boxShadow: 'var(--box-shadow)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.8rem',
    color: 'var(--primary-color)',
    marginBottom: '20px',
    borderBottom: '2px solid var(--primary-color-light)',
    paddingBottom: '10px',
  },
  headerIcon: {
    marginRight: '10px',
    fontSize: '2rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    backgroundColor: 'var(--background-color)',
    padding: '15px 20px',
    marginBottom: '15px',
    borderRadius: 'var(--border-radius)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    borderLeft: '5px solid var(--primary-color)',
  },
  // Hover effect (can be added with CSS class for better performance)
  // listItem:hover: { 
  //   transform: 'translateY(-3px)',
  //   boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  // },
  entryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  exerciseName: {
    fontSize: '1.3rem',
    color: 'var(--text-color)',
    fontWeight: '600',
  },
  date: {
    fontSize: '0.9rem',
    color: 'var(--text-color-secondary)',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    marginTop: '10px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.95rem',
    color: 'var(--text-color-secondary)',
    padding: '5px',
    background: 'var(--surface-color-light, #f8f9fa)', // Fallback if not defined
    borderRadius: '4px',
  },
  detailIcon: {
    marginRight: '8px',
    fontSize: '1.2em',
    color: 'var(--primary-color)',
  },
  centeredMessage: {
    textAlign: 'center',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStyles: {
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--box-shadow)',
  }
};

export default WorkoutHistory;
