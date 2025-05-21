const { pool } = require('../config');

const workoutModel = {
    /**
     * Creates a new workout entry for a user.
     * @param {number} userId - The ID of the user logging the workout.
     * @param {object} entryData - Object containing workout details.
     * @param {string} entryData.date - Date of the workout (YYYY-MM-DD).
     * @param {string} entryData.exercise_name - Name of the exercise.
     * @param {number} [entryData.sets] - Number of sets.
     * @param {number} [entryData.reps] - Number of reps.
     * @param {number} [entryData.weight] - Weight used.
     * @param {number} [entryData.duration] - Duration in seconds.
     * @returns {Promise<object>} The created workout entry.
     */
    async createWorkoutEntry(userId, { date, exercise_name, sets, reps, weight, duration }) {
        try {
            const query = {
                text: `INSERT INTO workout_entries(user_id, date, exercise_name, sets, reps, weight, duration)
                       VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                values: [userId, date, exercise_name, sets, reps, weight, duration],
            };
            const { rows } = await pool.query(query);
            return rows[0];
        } catch (error) {
            console.error('Error creating workout entry:', error);
            throw new Error('Failed to create workout entry.');
        }
    },

    /**
     * Retrieves all workout entries for a specific user, ordered by date descending.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array<object>>} A list of workout entries.
     */
    async getWorkoutHistory(userId) {
        try {
            const query = {
                text: 'SELECT * FROM workout_entries WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
                values: [userId],
            };
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('Error fetching workout history:', error);
            throw new Error('Failed to fetch workout history.');
        }
    },

    /**
     * Adds a new personal record for a user.
     * @param {number} userId - The ID of the user.
     * @param {object} prData - Object containing PR details.
     * @param {string} prData.exercise_name - Name of the exercise.
     * @param {string} prData.record_type - Type of record (e.g., 'max_weight').
     * @param {number} prData.value - Value of the record.
     * @param {string} prData.date - Date PR was achieved.
     * @param {number} [prData.workout_entry_id] - Optional ID of the workout entry that set this PR.
     * @returns {Promise<object>} The created personal record.
     */
    async addPersonalRecord(userId, { exercise_name, record_type, value, date, workout_entry_id }) {
        try {
            const query = {
                text: `INSERT INTO personal_records(user_id, exercise_name, record_type, value, date, workout_entry_id)
                       VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
                values: [userId, exercise_name, record_type, value, date, workout_entry_id],
            };
            const { rows } = await pool.query(query);
            return rows[0];
        } catch (error) {
            console.error('Error adding personal record:', error);
            throw new Error('Failed to add personal record.');
        }
    },

    /**
     * Retrieves the current best personal records for a user for each exercise and record type.
     * It selects the record with the highest value, and for ties, the most recent one.
     * @param {number} userId - The ID of the user.
     * @returns {Promise<Array<object>>} A list of current best personal records.
     */
    async getCurrentPersonalRecords(userId) {
        try {
            // Uses DISTINCT ON to get the top record for each group (user, exercise, type)
            // ordered by value (desc) and then date (desc) to break ties.
            const query = {
                text: `SELECT DISTINCT ON (exercise_name, record_type) 
                           id, user_id, exercise_name, record_type, value, date, workout_entry_id, created_at
                       FROM personal_records
                       WHERE user_id = $1
                       ORDER BY exercise_name, record_type, value DESC, date DESC;`,
                values: [userId],
            };
            const { rows } = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('Error fetching current personal records:', error);
            throw new Error('Failed to fetch current personal records.');
        }
    },

    /**
     * Gets the latest (best) personal record for a specific exercise and record type for a user.
     * @param {number} userId - The ID of the user.
     * @param {string} exerciseName - The name of the exercise.
     * @param {string} recordType - The type of record (e.g., 'max_weight').
     * @returns {Promise<object|null>} The personal record object if found, otherwise null.
     */
    async getLatestPersonalRecordForExercise(userId, exerciseName, recordType) {
        try {
            const query = {
                text: `SELECT * FROM personal_records
                       WHERE user_id = $1 AND exercise_name = $2 AND record_type = $3
                       ORDER BY value DESC, date DESC
                       LIMIT 1;`,
                values: [userId, exerciseName, recordType],
            };
            const { rows } = await pool.query(query);
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching latest PR for exercise:', error);
            throw new Error('Failed to fetch latest PR for exercise.');
        }
    },

    /**
     * Checks a new workout entry for potential personal records and records them if achieved.
     * Currently checks for 'max_weight' PRs.
     * @param {number} userId - The ID of the user.
     * @param {object} workoutEntry - The newly created workout entry object (must include id, exercise_name, weight, date).
     * @returns {Promise<object|null>} The new PR object if one was recorded, otherwise null.
     */
    async checkAndRecordPRs(userId, workoutEntry) {
        if (!workoutEntry || typeof workoutEntry.weight !== 'number' || workoutEntry.weight <= 0) {
            return null; // Not a weight-based exercise or no weight logged
        }

        try {
            const recordType = 'max_weight';
            const currentPR = await this.getLatestPersonalRecordForExercise(userId, workoutEntry.exercise_name, recordType);

            if (!currentPR || workoutEntry.weight > currentPR.value) {
                const newPRData = {
                    exercise_name: workoutEntry.exercise_name,
                    record_type: recordType,
                    value: workoutEntry.weight,
                    date: workoutEntry.date,
                    workout_entry_id: workoutEntry.id,
                };
                return await this.addPersonalRecord(userId, newPRData);
            }
            return null; // No new PR
        } catch (error) {
            console.error('Error checking/recording PRs:', error);
            // Don't let PR checking failure prevent workout logging flow, just log it.
            // Or rethrow if critical: throw new Error('Failed to check and record PRs.');
            return null;
        }
    }
};

module.exports = workoutModel;
