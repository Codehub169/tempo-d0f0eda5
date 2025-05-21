import React, { useState } from 'react';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@iconify/react';

const WorkoutForm = ({ onWorkoutLogged }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    exercise_name: '',
    sets: '',
    reps: '',
    weight: '',
    duration: '', // Optional, in minutes or seconds based on backend
    date: new Date().toISOString().split('T')[0], // Default to today
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('You must be logged in to log a workout.');
      return;
    }

    // Basic Validation
    if (!formData.exercise_name || !formData.date) {
      setError('Exercise name and date are required.');
      return;
    }
    if (formData.sets && isNaN(parseInt(formData.sets))) {
        setError('Sets must be a number.'); return;
    }
    if (formData.reps && isNaN(parseInt(formData.reps))) {
        setError('Reps must be a number.'); return;
    }
    if (formData.weight && isNaN(parseFloat(formData.weight))) {
        setError('Weight must be a number.'); return;
    }
    if (formData.duration && isNaN(parseInt(formData.duration))) {
        setError('Duration must be a number (e.g., in seconds or minutes).'); return;
    }

    setIsLoading(true);
    try {
      const workoutData = {
        ...formData,
        sets: formData.sets ? parseInt(formData.sets) : null,
        reps: formData.reps ? parseInt(formData.reps) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        duration: formData.duration ? parseInt(formData.duration) : null, // Assuming duration is stored as integer (e.g. seconds)
      };
      
      const newEntry = await apiService.logWorkout(token, workoutData);
      setSuccessMessage(`Workout logged successfully! ${newEntry.prUpdate ? newEntry.prUpdate : ''}`);
      setFormData({
        exercise_name: '', sets: '', reps: '', weight: '', duration: '',
        date: new Date().toISOString().split('T')[0],
      }); // Reset form
      if (onWorkoutLogged) {
        onWorkoutLogged(newEntry.entry);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to log workout.');
      console.error('Error logging workout:', err);
    } finally {
      setIsLoading(false);
      // Clear messages after a few seconds
      setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="workout-form card" style={styles.form}>
      <h2 style={styles.title}>
        <Icon icon="icon-park-outline:dumbbell" style={styles.titleIcon} /> 
        Log New Workout
      </h2>
      
      {error && <div className="error-message" style={styles.message}>{error}</div>}
      {successMessage && <div className="success-message" style={styles.message}>{successMessage}</div>}

      <div className="form-group" style={styles.formGroup}>
        <label htmlFor="exercise_name" style={styles.label}><Icon icon="mdi:weight-lifter" /> Exercise Name</label>
        <input type="text" id="exercise_name" name="exercise_name" value={formData.exercise_name} onChange={handleChange} required style={styles.input} placeholder="e.g., Bench Press" />
      </div>

      <div style={styles.gridContainer}>
        <div className="form-group" style={styles.formGroup}>
          <label htmlFor="sets" style={styles.label}><Icon icon="mdi:format-list-numbered" /> Sets</label>
          <input type="number" id="sets" name="sets" value={formData.sets} onChange={handleChange} style={styles.input} placeholder="e.g., 3" min="0"/>
        </div>
        <div className="form-group" style={styles.formGroup}>
          <label htmlFor="reps" style={styles.label}><Icon icon="mdi:repeat" /> Reps</label>
          <input type="number" id="reps" name="reps" value={formData.reps} onChange={handleChange} style={styles.input} placeholder="e.g., 10" min="0"/>
        </div>
      </div>

      <div style={styles.gridContainer}>
        <div className="form-group" style={styles.formGroup}>
          <label htmlFor="weight" style={styles.label}><Icon icon="mdi:weight-kilogram" /> Weight (kg)</label>
          <input type="number" step="0.01" id="weight" name="weight" value={formData.weight} onChange={handleChange} style={styles.input} placeholder="e.g., 100" min="0"/>
        </div>
        <div className="form-group" style={styles.formGroup}>
          <label htmlFor="duration" style={styles.label}><Icon icon="mdi:timer-sand" /> Duration (seconds)</label>
          <input type="number" id="duration" name="duration" value={formData.duration} onChange={handleChange} style={styles.input} placeholder="e.g., 60 (optional)" min="0"/>
        </div>
      </div>

      <div className="form-group" style={styles.formGroup}>
        <label htmlFor="date" style={styles.label}><Icon icon="mdi:calendar-today" /> Date</label>
        <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required style={styles.input} />
      </div>

      <button type="submit" className="btn btn-primary" disabled={isLoading} style={styles.submitButton}>
        {isLoading ? (
          <><Icon icon="eos-icons:loading" className="loading-icon" /> Logging...</>
        ) : (
          <><Icon icon="mdi:plus-circle-outline" /> Log Workout</>
        )}
      </button>
    </form>
  );
};

const styles = {
  form: {
    padding: '2rem',
    backgroundColor: 'var(--surface-color)',
    borderRadius: 'var(--border-radius-lg)',
  },
  title: {
    textAlign: 'center',
    color: 'var(--primary-color)',
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-family-headings)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.6rem',
  },
  titleIcon: {
    marginRight: '0.5rem',
    fontSize: '2rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: 'var(--text-color)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: 'var(--border-radius)',
    fontSize: '1rem',
    boxSizing: 'border-box',
    backgroundColor: 'var(--background-color)',
    color: 'var(--text-color)',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  submitButton: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1.1rem',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  message: {
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
  }
  // input:focus is handled by App.css
  // .btn, .btn-primary, .error-message, .success-message are styled in App.css
};

export default WorkoutForm;
