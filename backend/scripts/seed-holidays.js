const { db } = require('../src/db/db');

async function seedHolidays() {
  try {
    const holidays = [
      ['2026-01-26', 'Republic Day', 'Public'],
      ['2026-08-15', 'Independence Day', 'Public'],
      ['2026-10-02', 'Gandhi Jayanti', 'Public'],
      ['2026-12-25', 'Christmas', 'Public'],
      ['2026-05-01', 'Labor Day', 'Public']
    ];

    for (const [date, title, type] of holidays) {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO holidays (date, title, type) VALUES (?, ?, ?)',
        args: [date, title, type]
      });
    }

    console.log('Successfully inserted sample holidays.');
    process.exit(0);
  } catch (error) {
    console.error('Error inserting holidays:', error.message);
    process.exit(1);
  }
}

seedHolidays();
