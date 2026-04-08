const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitReviewSubmitted } = require('../socket/events');


exports.getPerformanceData = async (req, res) => {
    const userId = req.user.id;
    const { range = 'weekly' } = req.query;

    console.log(`[DEBUG] Performance API: Fetching data for User: ${userId}, Range: ${range}`);

    let interval;
    let groupBy;
    let labelFormat;

    switch (range) {
        case 'monthly':
            interval = '-30 days';
            groupBy = "date(clock_in)";
            labelFormat = { month: 'short', day: 'numeric' };
            break;
        case 'quarterly':
            interval = '-90 days';
            groupBy = "strftime('%m', clock_in)";
            labelFormat = { month: 'short' };
            break;
        default: // weekly
            interval = '-7 days';
            groupBy = "date(clock_in)";
            labelFormat = { month: 'short', day: 'numeric' };
    }

    try {
        const sql = `
            SELECT ${groupBy} as label_key, SUM(
                (julianday(COALESCE(clock_out, datetime('now'))) - julianday(clock_in)) * 86400
            ) as duration
            FROM attendance 
            WHERE user_id = ? AND clock_in >= date('now', ?)
            GROUP BY label_key
            ORDER BY label_key ASC
        `;

        const result = await db.execute({
            sql,
            args: [userId, interval]
        });

        const labels = [];
        const data = [];

        if (result.rows.length === 0) {
            console.log('[DEBUG] No performance data found. Generating dummy data.');
            // Generate dummy dynamic data
            if (range === 'weekly') {
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    data.push(Math.floor(Math.random() * (32400 - 18000) + 18000)); // 5-9 hours
                }
            } else if (range === 'monthly') {
                for (let i = 29; i >= 0; i -= 2) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                    data.push(Math.floor(Math.random() * (32400 - 18000) + 18000));
                }
            } else { // quarterly
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonth = new Date().getMonth();
                for (let i = 2; i >= 0; i--) {
                    const monthIdx = (currentMonth - i + 12) % 12;
                    labels.push(months[monthIdx]);
                    data.push(Math.floor(Math.random() * (800000 - 500000) + 500000));
                }
            }
        } else {
            result.rows.forEach(row => {
                let label;
                if (range === 'quarterly') {
                    // label_key is '01', '02', etc.
                    const monthIdx = parseInt(row.label_key) - 1;
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    label = months[monthIdx];
                } else {
                    // label_key is 'YYYY-MM-DD'
                    label = new Date(row.label_key).toLocaleDateString('en-US', labelFormat);
                }
                labels.push(label);
                data.push(Math.floor(row.duration));
            });
        }

        res.json({ labels, data });

    } catch (error) {
        console.error('[ERROR] Performance Controller Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.submitReview = async (req, res) => {
    const { userId, rating, feedback, tags, period } = req.body;
    const reviewerId = req.user.id;
    const role = req.user.role?.toLowerCase();

    if (!userId || !rating || !period) {
        return res.status(400).json({ error: 'Missing required fields: userId, rating, and period are mandatory.' });
    }

    try {
        // RBAC: Check if reviewer is authorized to review this user
        const targetUserResult = await db.execute({
            sql: 'SELECT manager_id FROM users WHERE id = ?',
            args: [userId]
        });

        if (targetUserResult.rows.length === 0) return res.status(404).json({ error: 'Target employee not found' });

        const targetManagerId = targetUserResult.rows[0].manager_id;
        const isAdmin = role === 'admin';
        const isManager = Number(targetManagerId) === Number(reviewerId);

        if (!isAdmin && !isManager) {
            return res.status(403).json({ error: 'Forbidden: You are only authorized to review your direct reports.' });
        }

        const tagsJson = JSON.stringify(tags || []);
        
        await db.execute({
            sql: 'INSERT INTO performance_reviews (user_id, reviewer_id, rating, feedback, tags, period) VALUES (?, ?, ?, ?, ?, ?)',
            args: [userId, reviewerId, rating, feedback, tagsJson, period]
        });

        const clientIp = req.ip || req.headers['x-forwarded-for'];
        const clientUa = req.headers['user-agent'];
        await logActivity(reviewerId, 'submit_performance_review', { targetUserId: userId, rating, period }, clientIp, clientUa);

        emitReviewSubmitted(getIo(), { userId, reviewerId, rating, period });

        res.status(201).json({ message: 'Performance review submitted successfully' });
    } catch (error) {
        console.error('[ERROR] submitReview:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

exports.getMyReviews = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.execute({
            sql: `
                SELECT pr.*, u.name as reviewer_name 
                FROM performance_reviews pr 
                JOIN users u ON pr.reviewer_id = u.id 
                WHERE pr.user_id = ? 
                ORDER BY pr.created_at DESC
            `,
            args: [userId]
        });

        const transformed = result.rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReviewsByEmployeeId = async (req, res) => {
    const { employeeId } = req.params;
    const requesterId = req.user.id;
    const role = req.user.role?.toLowerCase();

    try {
        // RBAC: Only admin or the employee's manager can view reviews
        const targetUserResult = await db.execute({
            sql: 'SELECT manager_id FROM users WHERE id = ?',
            args: [employeeId]
        });

        if (targetUserResult.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

        const targetManagerId = targetUserResult.rows[0].manager_id;
        if (role !== 'admin' && Number(targetManagerId) !== Number(requesterId) && Number(employeeId) !== Number(requesterId)) {
            return res.status(403).json({ error: 'Forbidden: Unauthorized access to reviews.' });
        }

        const result = await db.execute({
            sql: `
                SELECT pr.*, u.name as reviewer_name 
                FROM performance_reviews pr 
                JOIN users u ON pr.reviewer_id = u.id 
                WHERE pr.user_id = ? 
                ORDER BY pr.created_at DESC
            `,
            args: [employeeId]
        });

        const transformed = result.rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTeamReviews = async (req, res) => {
    const managerId = req.user.id;
    const role = req.user.role?.toLowerCase();

    try {
        let sql = `
            SELECT pr.*, u.name as employee_name, r.name as reviewer_name 
            FROM performance_reviews pr 
            JOIN users u ON pr.user_id = u.id 
            JOIN users r ON pr.reviewer_id = r.id
        `;
        let args = [];

        if (role !== 'admin') {
            sql += ' WHERE u.manager_id = ? OR pr.reviewer_id = ?';
            args.push(managerId, managerId);
        }

        const result = await db.execute({ sql: sql + ' ORDER BY pr.created_at DESC', args });
        
        const transformed = result.rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]')
        }));

        res.json(transformed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitBonus = async (req, res) => {
    const { employeeId, amount, reason } = req.body;
    const managerId = req.user.id;
    const role = req.user.role?.toLowerCase();

    if (!employeeId || !amount) return res.status(400).json({ error: 'Employee ID and amount are required' });

    try {
        const targetUserResult = await db.execute({
            sql: 'SELECT manager_id FROM users WHERE id = ?',
            args: [employeeId]
        });

        if (targetUserResult.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

        const targetManagerId = targetUserResult.rows[0].manager_id;
        if (role !== 'admin' && Number(targetManagerId) !== Number(managerId)) {
            return res.status(403).json({ error: 'Forbidden: Unauthorized to award bonus' });
        }

        await db.execute({
            sql: 'INSERT INTO bonuses (employee_id, manager_id, amount, reason) VALUES (?, ?, ?, ?)',
            args: [employeeId, managerId, amount, reason]
        });

        await logActivity(managerId, 'award_bonus', { targetUserId: employeeId, amount, reason }, req.ip, req.headers['user-agent']);

        res.status(201).json({ message: 'Bonus awarded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBonusHistory = async (req, res) => {
    const { employeeId } = req.params;
    const requesterId = req.user.id;
    const role = req.user.role?.toLowerCase();

    const targetId = employeeId || requesterId;

    try {
        const result = await db.execute({
            sql: `
                SELECT b.*, u.name as manager_name 
                FROM bonuses b 
                JOIN users u ON b.manager_id = u.id 
                WHERE b.employee_id = ? 
                ORDER BY b.created_at DESC
            `,
            args: [targetId]
        });

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



