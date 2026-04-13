const { db } = require('./src/db/db');

const usersToSeed = [1, 2, 3, 4, 6, 13, 14, 101, 102, 103];
const months = ['2026-02', '2026-03', '2026-04'];

async function safeExec(sql, args = []) {
    try {
        return await db.execute({ sql, args });
    } catch (e) {
        console.warn(`[SKIP] ${sql.substring(0, 30)}... : ${e.message}`);
    }
}

(async () => {
    try {
        console.log('--- ENTERPRISE SQUAD DATA POPULATION ---');

        // 1. Core attendance and payroll
        for (const userId of usersToSeed) {
            const basic = 60000;
            await safeExec('INSERT OR REPLACE INTO salary_structure (user_id, basic, hra, bonus, tax_percent) VALUES (?, ?, ?, ?, ?)', [userId, basic, basic*0.3, basic*0.1, 10]);

            for (const month of months) {
                const datePrefix = `${month}-`;
                for (let d = 1; d <= 22; d++) {
                    const date = datePrefix + d.toString().padStart(2, '0');
                    await safeExec('INSERT OR REPLACE INTO attendance (user_id, date, status, clock_in, clock_out, total_hours) VALUES (?, ?, ?, ?, ?, ?)', 
                        [userId, date, 'Present', `${date}T09:00:00Z`, `${date}T18:00:00Z`, 9]);
                }
                const gross = basic * 1.4;
                await safeExec('INSERT OR REPLACE INTO payroll (user_id, month, working_days, present_days, leave_days, unpaid_days, gross_salary, deduction, tax, final_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, month, 22, 22, 0, 0, gross, 0, (gross*0.1), gross*0.9]);
            }
        }

        // 2. Projects
        console.log('Populating Projects...');
        await safeExec('INSERT OR IGNORE INTO projects (id, name, description, deadline, created_by) VALUES (?, ?, ?, ?, ?)', 
            [1, 'Cloud Ledger Migration', 'Enterprise Resource Planning overhaul.', '2026-06-30', 1]);
        await safeExec('INSERT OR IGNORE INTO projects (id, name, description, deadline, created_by) VALUES (?, ?, ?, ?, ?)', 
            [2, 'Security Patch 4.2', 'Patching critical vulnerabilities in auth.', '2026-04-20', 1]);
        
        // 3. Project Assignments
        await safeExec('INSERT OR IGNORE INTO project_assignments (project_id, employee_id) VALUES (?, ?)', [1, 3]);
        await safeExec('INSERT OR IGNORE INTO project_assignments (project_id, employee_id) VALUES (?, ?)', [1, 101]);
        await safeExec('INSERT OR IGNORE INTO project_assignments (project_id, employee_id) VALUES (?, ?)', [2, 3]);

        // 4. Tasks
        console.log('Populating Tasks...');
        await safeExec('INSERT INTO tasks (title, assigned_to, assigned_by, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            ['Submit Q1 Tax Declaraion', 3, 1, 'High', 'Pending', '2026-04-15']);
        await safeExec('INSERT INTO tasks (title, assigned_to, assigned_by, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            ['Audit User Logs', 4, 1, 'Medium', 'Pending', '2026-04-18']);
        await safeExec('INSERT INTO tasks (title, assigned_to, assigned_by, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
            ['Refactor Attendance Logic', 101, 1, 'High', 'In Progress', '2026-04-22']);

        // 5. Meetings
        console.log('Populating Meetings...');
        const mDate = new Date().toISOString();
        await safeExec('INSERT INTO meetings (id, purpose, duration, category, created_by, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['meet_1', 'Project Alpha Kickoff', 45, 'Technical', 1, 'scheduled', mDate]);
        await safeExec('INSERT INTO meetings (id, purpose, duration, category, created_by, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['meet_2', 'Weekly Management Sync', 30, 'Administrative', 1, 'scheduled', mDate]);

        // 6. User Stats
        await safeExec('UPDATE users SET productivity_score = 92 WHERE id = 1');
        await safeExec('UPDATE users SET productivity_score = 88 WHERE id = 101');

        console.log('--- ENHANCED SEEDING COMPLETE! ---');
    } catch (e) {
        console.error('Master Seeding Error:', e);
    }
})();
