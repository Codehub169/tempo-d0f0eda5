const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { jwtSecret } = require('../config');
const authenticateToken = require('../middleware/authenticateToken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const signupValidationRules = () => [
    body('username').notEmpty().trim().escape().withMessage('Username is required.')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
];

const loginValidationRules = () => [
    body('username').notEmpty().trim().escape().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.')
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

const generateToken = (user) => {
    const payload = {
        user: {
            id: user.id,
            username: user.username
        }
    };
    return jwt.sign(payload, jwtSecret, { expiresIn: '5h' }); // Token expires in 5 hours
};

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signupValidationRules(), validate, async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check for existing user (model handles if this check is redundant due to DB constraint)
        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ errors: [{ username: 'User already exists' }] });
        }

        // Create new user
        const newUser = await userModel.createUser(username, password);

        // Create JWT
        const token = generateToken(newUser);
        
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username
            }
        });
    } catch (err) {
        console.error('Signup error:', err.message, err.stack);
        // Handle specific error from model if createUser throws 'Username already exists'
        if (err.message === 'Username already exists.') { 
             return res.status(400).json({ errors: [{ username: 'User already exists' }] });
        }
        res.status(500).json({ msg: 'Server error during signup.' });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginValidationRules(), validate, async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check for existing user
        const user = await userModel.findByUsername(username);
        if (!user) {
            return res.status(400).json({ errors: [{ general: 'Invalid credentials' }] });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ general: 'Invalid credentials' }] });
        }

        // Create JWT
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });
    } catch (err) {
        console.error('Login error:', err.message, err.stack);
        res.status(500).json({ msg: 'Server error during login.' });
    }
});

// @route   GET api/auth/verify-token
// @desc    Verify token and return user data if token is valid
// @access  Private (requires token)
router.get('/verify-token', authenticateToken, async (req, res) => {
    // If authenticateToken middleware passes, req.user is populated.
    // The token is verified, this route just confirms and returns fresh user data.
    try {
        const userFromDb = await userModel.findById(req.user.id);
        if (!userFromDb) {
            // This case means the user ID in a valid token no longer exists in DB.
            return res.status(404).json({ msg: 'User associated with this token not found.' });
        }
        res.json({
            id: userFromDb.id,
            username: userFromDb.username
            // Do not send password hash or sensitive info
        });
    } catch (error) {
        console.error('Verify token error:', error.message, error.stack);
        res.status(500).json({ msg: 'Server error during token verification.' });
    }
});

module.exports = router;
