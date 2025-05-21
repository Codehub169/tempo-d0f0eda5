import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@iconify/react';

const PersonalRecordsDisplay = () => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!token) {
        setIsLoading(false);
        setError('Not authorized to fetch personal records.');
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiService.getPersonalRecords(token);
        setRecords(data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch personal records.');
        console.error('Error fetching PRs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
  }, [token]);

  const recordIcons = {
    max_weight: 'fa6-solid:weight-hanging',
    max_reps: 'fa6-solid:hashtag',
    min_duration: 'fa6-solid:stopwatch',
    // Add more as PR types expand
  };

  const getRecordUnit = (recordType) => {
    switch(recordType) {
      case 'max_weight': return 'kg';
      case 'max_reps': return 'reps';
      case 'min_duration': return 'seconds';
      default: return '';
    }
  }

  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div><p>Loading Personal Records...</p></div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (records.length === 0) {
    return (
      <div style={styles.emptyStateContainer}>
        <Icon icon="mdi:trophy-broken" style={styles.emptyIcon} />
        <p style={styles.emptyText}>No personal records yet. Keep logging your workouts!</p>
      </div>
    );
  }

  return (
    <div className="personal-records-display card" style={styles.container}>
      <h2 style={styles.title}>
        <Icon icon="mdi:trophy-variant-outline" style={styles.titleIcon} />
        Personal Records
      </h2>
      <div style={styles.grid}>
        {records.map((record) => (
          <div key={record.id} className="card" style={styles.recordCard}>
            <div style={styles.recordHeader}>
              <Icon icon={recordIcons[record.record_type] || 'mdi:medal'} style={styles.recordTypeIcon} />
              <h3 style={styles.exerciseName}>{record.exercise_name}</h3>
            </div> 
            <p style={styles.recordValue}>
              {record.value} <span style={styles.unit}>{getRecordUnit(record.record_type)}</span>
            </p>
            <p style={styles.recordDetail}>Type: {record.record_type.replace('_', ' ')}</p>
            <p style={styles.recordDetail}>Date: {new Date(record.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: 'var(--surface-color)', // Using CSS variables from App.css
    borderRadius: 'var(--border-radius-lg, 8px)',
  },
  title: {
    textAlign: 'center',
    color: 'var(--primary-color)',
    marginBottom: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontFamily: 'var(--font-family-headings)',
  },
  titleIcon: {
    marginRight: '0.75rem',
    fontSize: '2.2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  recordCard: {
    backgroundColor: 'var(--background-color)',
    padding: '1.5rem',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--box-shadow-sm)',
    borderLeft: '5px solid var(--primary-color)',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  },
  recordHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  recordTypeIcon: {
    fontSize: '2rem',
    color: 'var(--primary-color)',
    marginRight: '1rem',
  },
  exerciseName: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: 'var(--text-color)',
    margin: 0,
  },
  recordValue: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    margin: '0.5rem 0',
    textAlign: 'center',
  },
  unit: {
    fontSize: '1rem',
    color: 'var(--text-color-muted)',
  },
  recordDetail: {
    fontSize: '0.9rem',
    color: 'var(--text-color-muted)',
    margin: '0.25rem 0',
    textTransform: 'capitalize',
  },
  emptyStateContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--border-radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: '4rem',
    color: 'var(--text-color-muted)',
    marginBottom: '1rem',
  },
  emptyText: {
    fontSize: '1.2rem',
    color: 'var(--text-color-muted)',
  },
};

export default PersonalRecordsDisplay;
