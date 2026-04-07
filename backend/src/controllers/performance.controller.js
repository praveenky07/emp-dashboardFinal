const { db } = require('../db/db');

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
            groupBy = "date(login_time)";
            labelFormat = { month: 'short', day: 'numeric' };
            break;
        case 'quarterly':
            interval = '-90 days';
            groupBy = "strftime('%m', login_time)";
            labelFormat = { month: 'short' };
            break;
        default: // weekly
            interval = '-7 days';
            groupBy = "date(login_time)";
            labelFormat = { month: 'short', day: 'numeric' };
    }

    try {
        const sql = `
            SELECT ${groupBy} as label_key, SUM(
                (julianday(COALESCE(logout_time, datetime('now'))) - julianday(login_time)) * 86400
            ) as duration
            FROM attendance 
            WHERE user_id = ? AND login_time >= date('now', ?)
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
