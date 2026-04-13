const { db } = require('./src/db/db');

(async () => {
    try {
        console.log('Seeding default salary structures for all users...');
        const usersRes = await db.execute('SELECT id, role FROM users');
        const users = usersRes.rows;

        let inserted = 0;
        for (const user of users) {
             const exist = await db.execute({ sql: 'SELECT user_id FROM salary_structure WHERE user_id = ?', args: [user.id] });
             if (exist.rows.length === 0) {
                 const basic = user.role === 'admin' ? 80000 : user.role === 'manager' ? 60000 : 40000;
                 const hra = basic * 0.2;
                 const bonus = basic * 0.1;
                 const tax_percent = user.role === 'admin' ? 15 : 10;
                 
                 await db.execute({
                     sql: 'INSERT INTO salary_structure (user_id, basic, hra, bonus, tax_percent) VALUES (?, ?, ?, ?, ?)',
                     args: [user.id, basic, hra, bonus, tax_percent]
                 });
                 inserted++;
             }
        }
        console.log(`Successfully seeded ${inserted} users.`);
    } catch (e) {
        console.error(e);
    }
})();
