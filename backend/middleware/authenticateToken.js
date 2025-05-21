const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

/**
 * Middleware to authenticate JWT tokens.
 * Verifies the token provided in the Authorization header.
 * If valid, attaches the decoded user payload to `req.user`.
 * Responds with 401 if no token is provided, or 403 if the token is invalid.
 */
function authenticateToken(req, res, next) {
    // Get token from the Authorization header, expected format: "Bearer TOKEN"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token part

    if (token == null) {
        // No token provided
        return res.status(401).json({ message: 'Access token is missing or invalid.' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            // Token is invalid (e.g., expired, malformed, incorrect signature)
            console.error('JWT verification error:', err.message);
            return res.status(403).json({ message: 'Token is not valid.' });
        }
        // Token is valid, attach decoded user payload to the request object
        // The payload typically contains user ID and other non-sensitive info
        req.user = user;
        next(); // Proceed to the next middleware or route handler
    });
}

module.exports = authenticateToken;
