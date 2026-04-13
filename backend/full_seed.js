const { db } = require('./src/db/db');

(async () => {
    try {
        console.log('--- STARTING PREMIUM PAYROLL SEEDING ---');

        // 1. Seed Users
        console.log('Seeding Users...');
        const users = [
            { id: 101, name: 'Rahul Sharma', role: 'employee', email: 'rahul@company.com', manager_id: 1 },
            { id: 102, name: 'Priya Verma', role: 'employee', email: 'priya@company.com', manager_id: 1 },
            { id: 103, name: 'Arjun Kapur', role: 'employee', email: 'arjun@company.com', manager_id: 1 }
        ];

        for (const u of users) {
             await db.execute({
                 sql: 'INSERT OR IGNORE INTO users (id, name, role, email, manager_id, password) VALUES (?, ?, ?, ?, ?, ?)',
                 args: [u.id, u.name, u.role, u.email, u.manager_id, '$2b$10$K7.vS8TjP.O7QvFfB6qW9.eT/2XQ6WfPzUv8v6fB6qW9.eT/2XQ6W'] // Sample hashed pwd
             });
        }

        // 2. Seed Salary Structure
        console.log('Seeding Salary Structures...');
        const structures = [
            { user_id: 101, basic: 45000, hra: 15000, bonus: 5000, tax_percent: 10 },
            { user_id: 102, basic: 42000, hra: 12000, bonus: 4500, tax_percent: 8 },
            { user_id: 103, basic: 48000, hra: 18000, bonus: 6000, tax_percent: 12 }
        ];

        for (const s of structures) {
            await db.execute({
                sql: 'INSERT OR REPLACE INTO salary_structure (user_id, basic, hra, bonus, tax_percent) VALUES (?, ?, ?, ?, ?)',
                args: [s.user_id, s.basic, s.hra, s.bonus, s.tax_percent]
            });
        }

        // 3. Seed Attendance for April 2026 (Month: 2026-04)
        console.log('Seeding Attendance records...');
        const currentMonth = '2026-04';
        
        // Rahul: 20 present, 1 leave, 1 absent (Total 22)
        // Priya: 18 present, 2 leave, 2 absent
        // Arjun: 21 present, 0 leave, 1 absent

        const seedAttendance = async (userId, present, leave) => {
            let day = 1;
            // Mark Present
            for (let i = 0; i < present; i++) {
                const date = `${currentMonth}-${day.toString().padStart(2, '0')}`;
                await db.execute({
                    sql: 'INSERT OR REPLACE INTO attendance (user_id, date, status, clock_in, clock_out) VALUES (?, ?, ?, ?, ?)',
                    args: [userId, date, 'Present', '09:00:00', '18:00:00']
                });
                day++;
            }
            // Mark Leave
            for (let i = 0; i < leave; i++) {
                const date = `${currentMonth}-${day.toString().padStart(2, '0')}`;
                await db.execute({
                    sql: 'INSERT OR REPLACE INTO attendance (user_id, date, status, clock_in, clock_out) VALUES (?, ?, ?, ?, ?)',
                    args: [userId, date, 'leave', '00:00:00', '00:00:00']
                });
                // Also add to leaves table to be consistent
                await db.execute({
                    sql: 'INSERT OR IGNORE INTO leaves (user_id, start_date, end_date, total_days, status, type, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    args: [userId, date, date, 1, 'Approved', 'Casual', 1]
                });
                day++;
            }
        };

        await seedAttendance(101, 20, 1);
        await seedAttendance(102, 18, 2);
        await seedAttendance(103, 21, 0);

        // 4. Generate Payroll
        console.log('Generating Payroll Records...');
        const employees = [101, 102, 103];
        for (const uid of employees) {
            // We use the existing controller logic via a simulated call or direct SQL here for speed
            const struct = (await db.execute({ sql: 'SELECT * FROM salary_structure WHERE user_id = ?', args: [uid] })).rows[0];
            const present = (await db.execute({ sql: "SELECT COUNT(*) as c FROM attendance WHERE user_id = ? AND date LIKE ? AND status='Present'", args: [uid, `${currentMonth}%`] })).rows[0].c;
            const leaves = (await db.execute({ sql: "SELECT COUNT(*) as c FROM attendance WHERE user_id = ? AND date LIKE ? AND status='leave'", args: [uid, `${currentMonth}%`] })).rows[0].c;
            
            const working_days = 22;
            const unpaid_days = Math.max(0, working_days - (present + leaves));
            
            const per_day = struct.basic / working_days;
            const deduction = Math.round(unpaid_days * per_day);
            const gross = struct.basic + struct.hra + struct.bonus;
            const tax = Math.round((gross * struct.tax_percent) / 100);
            const net = gross - deduction - tax;

            await db.execute({
                sql: 'INSERT OR REPLACE INTO payroll (user_id, month, working_days, present_days, leave_days, unpaid_days, gross_salary, deduction, tax, final_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                args: [uid, currentMonth, working_days, present, leaves, unpaid_days, gross, deduction, tax, net]
            });
        }

        console.log('--- SEEDING COMPLETE! System ready for April 2026 audits. ---');
    } catch (e) {
        console.error('Seeding Failed:', e);
    }
})();
