const db = require('../db');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'Employee') {
            // Employee specific stats
            const attendance = await db.getAsync(
                'SELECT * FROM attendance WHERE employee_id = ? AND date = ?', 
                [userId, today]
            );
            
            const leaves = await db.getAsync(
                'SELECT COUNT(*) as count FROM leaves WHERE employee_id = ? AND status = "Pending"',
                [userId]
            );

            const bonuses = await db.getAsync(
                'SELECT SUM(bonus_amount) as total FROM bonuses WHERE employee_id = ?',
                [userId]
            );

            res.json({
                role: 'Employee',
                todaySession: attendance || null,
                pendingLeaves: leaves.count,
                totalBonuses: bonuses.total || 0,
                workHoursToday: attendance ? attendance.work_hours || 0 : 0
            });
        } else {
            // Admin/Manager stats
            const empCountResult = await db.getAsync('SELECT COUNT(*) as count FROM employees');
            const totalEmployees = empCountResult.count;

            const presentCountResult = await db.getAsync('SELECT COUNT(DISTINCT employee_id) as count FROM attendance WHERE date = ?', [today]);
            const employeesPresentToday = presentCountResult.count;

            const leaveCountResult = await db.getAsync(`
                SELECT COUNT(DISTINCT employee_id) as count 
                FROM leaves 
                WHERE status = 'Approved' AND start_date <= ? AND end_date >= ?
            `, [today, today]);
            const employeesOnLeave = leaveCountResult.count;

            const bonusResult = await db.getAsync('SELECT SUM(bonus_amount) as total FROM bonuses');
            const totalBonusesDistributed = bonusResult.total || 0;

            const hoursResult = await db.getAsync('SELECT SUM(work_hours) as total FROM attendance WHERE date = ?', [today]);
            const totalWorkingHoursToday = hoursResult.total || 0;

            // Trend data for charts
            const attendanceTrend = await db.allAsync(`
                SELECT date, COUNT(DISTINCT employee_id) as present 
                FROM attendance 
                GROUP BY date 
                ORDER BY date DESC LIMIT 5
            `);

            const leaveDistribution = await db.allAsync(`
                SELECT leave_type, COUNT(*) as count 
                FROM leaves 
                GROUP BY leave_type
            `);

            res.json({
                role: role,
                totalEmployees,
                employeesPresentToday,
                employeesOnLeave,
                totalBonusesDistributed,
                totalWorkingHoursToday,
                attendanceTrend: attendanceTrend.reverse(),
                leaveDistribution
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching dashboard stats" });
    }
};
