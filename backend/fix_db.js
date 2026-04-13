const { db } = require('./src/db/db');

(async () => {
    try {
        console.log('Running migrations...');
        try {
            await db.execute("ALTER TABLE leaves ADD COLUMN total_days REAL DEFAULT 0");
            console.log('Added total_days to leaves');
        } catch(e) { console.log('total_days might already exist'); }

        try {
            await db.execute("ALTER TABLE payroll ADD COLUMN month TEXT");
            console.log('Added month to payroll');
        } catch(e) { console.log('month might already exist'); }

        console.log('Migrations complete.');
    } catch(e) {
        console.error(e);
    }
})();
