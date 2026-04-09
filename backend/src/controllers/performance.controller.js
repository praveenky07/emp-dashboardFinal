const { db } = require('../db/db');
const { logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitReviewSubmitted } = require('../socket/events');
const notificationService = require('../services/notification.service');

exports.getPerformanceData = async (req, res) => {
    const userId = req.user.id;
    const { range = 'weekly' } = req.query;

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

        // REMOVED: Dummy data generation. System now reflects real DB data only factor.
        result.rows.forEach(row => {
            let label;
            if (range === 'quarterly') {
                const monthIdx = parseInt(row.label_key) - 1;
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                label = months[monthIdx];
            } else {
                label = new Date(row.label_key).toLocaleDateString('en-US', labelFormat);
            }
            labels.push(label);
            data.push(Math.max(0, Math.floor(row.duration)));
        });

        res.json({ labels, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitReview = async (req, res) => {
    const { userId, rating, feedback, tags, period } = req.body;
    const reviewerId = req.user.id;
    const role = req.user.role?.toLowerCase();

    if (!userId || !rating || !period) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const targetUserResult = await db.execute({
            sql: 'SELECT manager_id FROM users WHERE id = ?',
            args: [userId]
        });

        if (targetUserResult.rows.length === 0) return res.status(404).json({ error: 'Target employee not found' });

        const targetManagerId = targetUserResult.rows[0].manager_id;
        if (role !== 'admin' && Number(targetManagerId) !== Number(reviewerId)) {
            return res.status(403).json({ error: 'Forbidden: You can only review your direct reports.' });
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
        await notificationService.createNotification(userId, 'performance', `New performance evaluation: ${rating}/5 for ${period}`, { reviewerId, period });

        res.status(201).json({ message: 'Review submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReviewsByEmployeeId = async (req, res) => {
    const { employeeId } = req.params;
    const requesterId = req.user.id;
    const role = (req.user.role || '').toLowerCase();

    try {
        const targetUserResult = await db.execute({
            sql: 'SELECT manager_id FROM users WHERE id = ?',
            args: [employeeId]
        });

        if (targetUserResult.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

        const targetManagerId = targetUserResult.rows[0].manager_id;
        if (role !== 'admin' && Number(targetManagerId) !== Number(requesterId) && Number(employeeId) !== Number(requesterId)) {
            return res.status(403).json({ error: 'Forbidden: Unauthorized access.' });
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

        res.json(result.rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]') })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTeamReviews = async (req, res) => {
    const managerId = req.user.id;
    const role = (req.user.role || '').toLowerCase();

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
        res.json(result.rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]') })));
    } catch (error) { res.status(500).json({ error: error.message }); }
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

        res.json(result.rows.map(row => ({ ...row, tags: JSON.parse(row.tags || '[]') })));
    } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.submitBonus = async (req, res) => {
    const { employeeId, amount, reason } = req.body;
    const managerId = req.user.id;
    const role = req.user.role?.toLowerCase();

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

        await notificationService.createNotification(employeeId, 'performance', `Bonus awarded: $${amount}.`, { managerId, amount });
        res.status(201).json({ message: 'Bonus awarded' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getBonusHistory = async (req, res) => {
    const { employeeId } = req.params;
    const requesterId = req.user.id;
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
    } catch (error) { res.status(500).json({ error: error.message }); }
};
