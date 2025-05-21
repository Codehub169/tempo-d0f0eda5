const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const workoutModel = require('../models/workoutModel');

// All routes in this file are protected and require authentication
router.use(authenticateToken);

// @route   POST api/workouts
// @desc    Log a new workout entry
// @access  Private
router.post('/', async (req, res) => {
    const { date, exercise_name, sets, reps, weight, duration } = req.body;
    const userId = req.user.id; // Extracted from token by authenticateToken middleware

    // Basic validation
    if (!date || !exercise_name || typeof sets !== 'number' || typeof reps !== 'number') {
        return res.status(400).json({ msg: 'Please provide date, exercise name, sets, and reps.' });
    }
    if (weight < 0 || sets < 0 || reps < 0 || (duration && duration < 0)) {
        return res.status(400).json({ msg: 'Numeric workout values cannot be negative.' });
    }

    try {
        const entryData = { date, exercise_name, sets, reps, weight: weight || null, duration: duration || null };
        const newEntry = await workoutModel.createWorkoutEntry(userId, entryData);
        
        // Check for and record new personal records
        // workoutModel.checkAndRecordPRs expects the full workout entry object
        const personalRecordUpdate = await workoutModel.checkAndRecordPRs(userId, newEntry);

        res.status(201).json({ 
            message: 'Workout logged successfully', 
            workoutEntry: newEntry,
            personalRecordUpdate // This will be the new PR object or null
        });
    } catch (err) {
        console.error('Log workout error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/workouts/history
// @desc    Get workout history for the logged-in user
// @access  Private
router.get('/history', async (req, res) => {
    const userId = req.user.id;
    try {
        const history = await workoutModel.getWorkoutHistory(userId);
        res.json(history);
    } catch (err) {
        console.error('Get workout history error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/workouts/prs
// @desc    Get current personal records for the logged-in user
// @access  Private
router.get('/prs', async (req, res) => {
    const userId = req.user.id;
    try {
        const records = await workoutModel.getCurrentPersonalRecords(userId);
        res.json(records);
    } catch (err) {
        console.error('Get personal records error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/workouts/progress/:exerciseName
// @desc    Get progress data for a specific exercise (e.g., weight lifted over time)
// @access  Private
router.get('/progress/:exerciseName', async (req, res) => {
    const userId = req.user.id;
    const { exerciseName } = req.params;

    try {
        // Fetch all workout history for the user
        const allWorkouts = await workoutModel.getWorkoutHistory(userId);
        
        // Filter for the specific exercise
        const exerciseProgress = allWorkouts
            .filter(workout => workout.exercise_name.toLowerCase() === exerciseName.toLowerCase() && workout.weight != null)
            .map(workout => ({ date: workout.date, weight: workout.weight, reps: workout.reps, sets: workout.sets }))
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending for charting

        if (exerciseProgress.length === 0) {
            return res.status(404).json({ msg: `No progress data found for exercise: ${exerciseName}` });
        }

        res.json(exerciseProgress);
    } catch (err) {
        console.error(`Error getting progress for ${exerciseName}:`, err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
