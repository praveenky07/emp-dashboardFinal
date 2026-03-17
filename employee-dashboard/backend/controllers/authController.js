const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        // First check employees table
        let user = await db.getAsync('SELECT * FROM employees WHERE username = ?', [username]);
        let role = user ? user.role : null;

        // If not found in employees, check admins table
        if (!user) {
            user = await db.getAsync('SELECT * FROM admins WHERE username = ?', [username]);
            role = 'Admin'; // Admins from admins table are always Admin role
        }

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: role },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name || user.username,
                    role: role
                },
                token
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
