import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import WorkoutForm from '../components/WorkoutForm';
import WorkoutHistory from '../components/WorkoutHistory';
import PersonalRecordsDisplay from '../components/PersonalRecordsDisplay';
import ProgressChart from '../components/ProgressChart';
import { Icon } from '@iconify/react';
import './DashboardPage.css'; // For specific dashboard styles

const DashboardPage = () => {
  const { user } = useAuth();
  // State to trigger re-fetch in child components (WorkoutHistory, PersonalRecordsDisplay)
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // State for the ProgressChart component
  const [chartExerciseInput, setChartExerciseInput] = useState('');
  const [selectedExerciseForChart, setSelectedExerciseForChart] = useState('');
  const [userName, setUserName] = useState('User');

  useEffect(() => {
    if (user && user.username) {
      setUserName(user.username);
    }
  }, [user]);

  // Callback for WorkoutForm, triggers data refresh in other components
  const handleWorkoutLogged = (newEntry) => {
    setRefreshTrigger(prev => prev + 1);
    // Optionally, set the chart to the newly logged exercise
    if (newEntry && newEntry.exercise_name) {
      setChartExerciseInput(newEntry.exercise_name);
      setSelectedExerciseForChart(newEntry.exercise_name);
    }
  };

  const handleChartExerciseInputChange = (e) => {
    setChartExerciseInput(e.target.value);
  };

  const handleShowChart = (e) => {
    e.preventDefault();
    if (chartExerciseInput.trim()) {
      setSelectedExerciseForChart(chartExerciseInput.trim());
    } else {
        alert('Please enter an exercise name to view its progress chart.');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <Icon icon="ion:fitness-outline" style={{ fontSize: '2.5rem', marginRight: '10px' }} />
          <h1>Welcome back, {userName}!</h1>
          <p>Ready to crush your goals today?</p>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
          alt="Fitness motivation" 
          className="dashboard-header-image"
        />
      </header>

      <div className="dashboard-grid">
        {/* Section for logging new workouts */}
        <section className="dashboard-section workout-form-section card">
          <h2 className="section-title">
            <Icon icon="icon-park-outline:add-one" style={{ marginRight: '8px' }} />
            Log New Workout
          </h2>
          <WorkoutForm onWorkoutLogged={handleWorkoutLogged} />
        </section>

        {/* Section for displaying workout history */}
        <section className="dashboard-section workout-history-section card">
          <h2 className="section-title">
            <Icon icon="material-symbols:history" style={{ marginRight: '8px' }} />
            Workout History
          </h2>
          {/* The key prop ensures WorkoutHistory re-fetches data when refreshTrigger changes */}
          <WorkoutHistory key={`history-${refreshTrigger}`} />
        </section>

        {/* Section for displaying personal records */}
        <section className="dashboard-section personal-records-section card">
          <h2 className="section-title">
            <Icon icon="mdi:trophy-award" style={{ marginRight: '8px' }} />
            Personal Records
          </h2>
          {/* The key prop ensures PersonalRecordsDisplay re-fetches data when refreshTrigger changes */}
          <PersonalRecordsDisplay key={`prs-${refreshTrigger}`} />
        </section>

        {/* Section for displaying progress charts */}
        <section className="dashboard-section progress-chart-section card">
          <h2 className="section-title">
            <Icon icon="lucide:line-chart" style={{ marginRight: '8px' }} />
            Progress Chart
          </h2>
          <form onSubmit={handleShowChart} className="chart-select-form">
            <div className="form-group">
              <label htmlFor="chartExercise">Exercise Name:</label>
              <input 
                type="text" 
                id="chartExercise"
                value={chartExerciseInput} 
                onChange={handleChartExerciseInputChange} 
                placeholder="E.g., Bench Press"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <Icon icon="mdi:chart-line" style={{ marginRight: '5px' }} /> Show Progress
            </button>
          </form>
          {selectedExerciseForChart ? (
            <ProgressChart exerciseName={selectedExerciseForChart} key={`chart-${selectedExerciseForChart}`} />
          ) : (
            <p className="chart-prompt">
              <Icon icon="mdi:information-outline" style={{ marginRight: '5px' }} />
              Enter an exercise name above and click 'Show Progress' to view a chart.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
