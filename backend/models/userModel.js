const bcrypt = require('bcryptjs');
const { pool } = require('../config');

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing

const userModel = {
    /**
     * Creates a new user in the database.
     * @param {string} username - The username for the new user.
     * @param {string} password - The plain text password for the new user.
     * @returns {Promise<object>} The newly created user object (id, username, created_at).
     * @throws {Error} If there's an error during database operation or hashing.
     */
    async createUser(username, password) {
        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const query = {
                text: 'INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING id, username, created_at',
                values: [username, hashedPassword],
            };
            const { rows } = await pool.query(query);
            return rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            // Check for unique constraint violation (username already exists)
            if (error.code === '23505') { // PostgreSQL unique violation error code
                throw new Error('Username already exists.');
            }
            throw new Error('Failed to create user.');
        }
    },

    /**
     * Finds a user by their username.
     * This function is typically used during login to retrieve password_hash for comparison.
     * @param {string} username - The username to search for.
     * @returns {Promise<object|null>} The user object if found (including password_hash), otherwise null.
     */
    async findByUsername(username) {
        try {
            const query = {
                text: 'SELECT id, username, password_hash, created_at FROM users WHERE username = $1',
                values: [username],
            };
            const { rows } = await pool.query(query);
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw new Error('Database error while finding user.');
        }
    },

    /**
     * Finds a user by their ID.
     * Excludes password_hash for security when fetching user details for general purposes.
     * @param {number} id - The ID of the user to search for.
     * @returns {Promise<object|null>} The user object (id, username, created_at) if found, otherwise null.
     */
    async findById(id) {
        try {
            const query = {
                text: 'SELECT id, username, created_at FROM users WHERE id = $1',
                values: [id],
            };
            const { rows } = await pool.query(query);
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw new Error('Database error while finding user.');
        }
    }
};

module.exports = userModel;
