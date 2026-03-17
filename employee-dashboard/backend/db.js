const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database', 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'database', 'schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Check if database needs initialization
        // A simple check is to see if 'admins' table exists
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'", (err, row) => {
            if (err) {
                console.error("Error checking database schema", err);
            } else if (!row) {
                // Table doesn't exist, execute schema
                console.log("Initializing database schema from schema.sql...");
                const schema = fs.readFileSync(schemaPath, 'utf8');
                
                db.exec(schema, (err) => {
                    if (err) {
                        console.error("Error executing schema:", err.message);
                    } else {
                        console.log("Database schema initialized successfully.");
                    }
                });
            } else {
                console.log("Database schema already exists.");
            }
        });
    }
});

// Helper functions for Promises, making it easier to use async/await in controllers
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
};

db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
};

db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        this.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

module.exports = db;
