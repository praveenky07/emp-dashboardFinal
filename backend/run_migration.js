const { db } = require('./src/db/db');

async function migrate() {
    try {
        await db.execute('DROP TABLE IF EXISTS project_assignments');
        await db.execute('DROP TABLE IF EXISTS projects');
        await db.execute('DROP TABLE IF EXISTS teams');
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS teams(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                overall_productivity INTEGER DEFAULT 0
            )
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS projects(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                deadline DATETIME,
                team_id INTEGER,
                progress INTEGER DEFAULT 0,
                status TEXT DEFAULT 'On Track',
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES users(id),
                FOREIGN KEY(team_id) REFERENCES teams(id)
            )
        `);
        
        await db.execute(`
            CREATE TABLE IF NOT EXISTS project_assignments(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                employee_id INTEGER NOT NULL,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(employee_id) REFERENCES employees(id)
            )
        `);

        await db.execute("INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (1, 'Frontend Squad', 94)");
        await db.execute("INSERT OR IGNORE INTO teams (id, name, overall_productivity) VALUES (2, 'Backend Core', 88)");
        
        await db.execute("INSERT OR IGNORE INTO projects (id, name, description, deadline, team_id, progress, status, created_by) VALUES (1, 'Design Systems', 'Building out the new component library', date('now', '+5 days'), 1, 85, 'On Track', 1)");
        await db.execute("INSERT OR IGNORE INTO projects (id, name, description, deadline, team_id, progress, status, created_by) VALUES (2, 'Mobile Alpha', 'First release of the mobile app', date('now', '+3 days'), 1, 60, 'At Risk', 1)");

        // Try adding team_id column to users if it doesn't exist
        try {
             await db.execute("ALTER TABLE users ADD COLUMN team_id INTEGER references teams(id)");
        } catch (e) {
             console.log("team_id may already exist in users", e.message);
        }
        
        await db.execute("UPDATE users SET team_id = 1 WHERE role IN ('manager', 'employee')");

        console.log("Migration complete!");
    } catch(err) {
        console.error(err);
    }
}
migrate();
