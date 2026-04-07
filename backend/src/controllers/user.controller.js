const { db } = require('../db/db');

exports.getAvailableUsers = async (req, res) => {
    const userId = req.user.id;
    const role = (req.user.role || 'employee').toLowerCase();

    console.log(`[DEBUG] Fetching available users for: ID=${userId}, Role=${role}`);

    try {
        // Fetch current user details first to get team_id and manager_id
        const userResult = await db.execute({
            sql: 'SELECT id, team_id, manager_id FROM users WHERE id = ?',
            args: [userId]
        });

        if (userResult.rows.length === 0) {
            console.log(`[DEBUG] User ${userId} not found in database.`);
            return res.status(404).json({ error: 'User not found' });
        }

        const currentUser = userResult.rows[0];
        let sql = 'SELECT id, name, role FROM users WHERE id != ?';
        let args = [userId];

        if (role === 'employee') {
            // Employee: return employees + managers
            sql += " AND role IN ('employee', 'manager')";
        } else if (role === 'manager') {
            // Manager: return employees
            sql += " AND role = 'employee'";
        }
        // Admin: return all users (already handled by SELECT ... WHERE id != ?)

        console.log(`[DEBUG] Executing SQL: ${sql} with args:`, args);

        const result = await db.execute({ sql, args });
        console.log(`[DEBUG] Found ${result.rows.length} available users.`);
        
        res.json(result.rows);
    } catch (error) {
        console.error('[ERROR] Get Available Users Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.execute({
            sql: 'SELECT id, name, email, role, profile_image FROM users WHERE id = ?',
            args: [userId]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        user.profile_image = user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e2e8f0&color=4f46e5`;
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
