const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const workoutModel = require('../models/workoutModel');
const { body, validationResult } = require('express-validator'); // For robust validation

// All routes in this file are protected and require authentication
router.use(authenticateToken);

const workoutValidationRules = () => [
    body('date').isISO8601().withMessage('Date must be a valid ISO8601 date (YYYY-MM-DD).'),
    body('exercise_name').notEmpty().trim().escape().withMessage('Exercise name is required.'),
    body('sets').isInt({ min: 0 }).withMessage('Sets must be a non-negative integer.'),
    body('reps').isInt({ min: 0 }).withMessage('Reps must be a non-negative integer.'),
    body('weight').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Weight must be a non-negative number.'),
    body('duration').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Duration must be a non-negative integer (in seconds).')
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param || 'general']: err.msg }));

    return res.status(400).json({
        errors: extractedErrors,
    });
};

// @route   POST api/workouts
// @desc    Log a new workout entry
// @access  Private
router.post('/', workoutValidationRules(), validate, async (req, res) => {
    // Validation errors handled by 'validate' middleware
    const { date, exercise_name, sets, reps, weight, duration } = req.body;
    const userId = req.user.id; // Extracted from token by authenticateToken middleware

    try {
        // Prepare entryData, ensuring numeric types and handling optional fields
        // express-validator already sanitizes and converts types based on rules (e.g. toInt, toFloat)
        const entryData = {
            date,
            exercise_name,
            sets: parseInt(sets, 10),
            reps: parseInt(reps, 10),
            weight: (weight === undefined || weight === null || weight === '') ? null : parseFloat(weight),
            duration: (duration === undefined || duration === null || duration === '') ? null : parseInt(duration, 10)
        };
        
        const newEntry = await workoutModel.createWorkoutEntry(userId, entryData);
        
        // Check for and record new personal records
        const personalRecordUpdate = await workoutModel.checkAndRecordPRs(userId, newEntry);

        res.status(201).json({ 
            message: 'Workout logged successfully.', 
            workoutEntry: newEntry,
            personalRecordUpdate // This will be the new PR object or null
        });
    } catch (err) {
        console.error('Log workout error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while logging workout.' }); // Send JSON response for errors too
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
        console.error('Get workout history error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while fetching workout history.' });
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
        console.error('Get personal records error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error while fetching personal records.' });
    }
});

// @route   GET api/workouts/progress/:exerciseName
// @desc    Get progress data for a specific exercise (e.g., weight lifted over time)
// @access  Private
router.get('/progress/:exerciseName', async (req, res) => {
    const userId = req.user.id;
    const { exerciseName } = req.params;

    if (!exerciseName || typeof exerciseName !== 'string' || exerciseName.trim() === '') {
        return res.status(400).json({ msg: 'Exercise name parameter is required.' });
    }

    try {
        const exerciseProgress = await workoutModel.getExerciseProgressData(userId, exerciseName.trim());

        if (!exerciseProgress) { // Model might throw error or return null/undefined on failure
             return res.status(500).json({ msg: 'Failed to retrieve exercise progress data.' });
        }
        // If model returns empty array for no data, this is fine.
        // The original code had a 404 check: if (exerciseProgress.length === 0) { ... }
        // This is usually preferred to distinguish "not found" from "error".
        // Let's re-add it, assuming empty array is a valid 'not found' scenario, not an error.
        if (exerciseProgress.length === 0) {
            return res.status(404).json({ msg: `No progress data found for exercise: ${exerciseName}` });
        }

        res.json(exerciseProgress);
    } catch (err) {
        console.error(`Error getting progress for ${exerciseName}:`, err.message, err.stack);
        res.status(500).json({ msg: `Server error while fetching progress for ${exerciseName}.` });
    }
});

module.exports = router;
