const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db } = require('../db/db');
const { getLogs, logActivity } = require('../db/logs');
const { getIo } = require('../socket');
const { emitUserCreated } = require('../socket/events');

exports.login = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Trim and Lowercase email for consistency
  email = email.trim().toLowerCase();
  console.log(`[DEBUG] Login attempt for: ${email}`);

  try {
    const result = await db.execute({
      sql: `
        SELECT u.id, u.name, u.email, u.password, u.role, u.profile_image, u.created_at, d.name as department_name, e.employee_code
        FROM users u 
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE LOWER(u.email) = ?
      `,
      args: [email]
    });


    const user = result.rows[0];
    if (!user) {
      console.log(`[DEBUG] No user found with email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`[DEBUG] User found. Stored Role: ${user.role}`);

    const passwordMatch = bcrypt.compareSync(password, user.password);
    console.log(`[DEBUG] Password match result: ${passwordMatch}`);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('[DEBUG] Token Payload:', { id: user.id, role: user.role.toLowerCase(), name: user.name });

    const token = jwt.sign(
      { id: user.id, role: user.role.toLowerCase(), name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('[DEBUG] Generated Token (prefix):', token.substring(0, 10));

    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role.toLowerCase(), 
        department: user.department_name,
        employee_id: user.employee_code,
        profile_image: user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e2e8f0&color=4f46e5`
      }
    });

  } catch (error) {
    console.error('[DEBUG] Login error detail:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }

};

exports.register = async (req, res) => {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    const { name, email, password, role, department_id, manager_id, salary } = req.body;
    if (!name || !email || !password || !department_id) {
      return res.status(400).json({ message: 'Please fill all fields (name, email, password, department)' });
    }

    try {
      // 1. Verify department exists
      const deptResult = await db.execute({
        sql: 'SELECT id FROM departments WHERE id = ?',
        args: [department_id]
      });
      
      if (deptResult.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid department' });
      }

      // 2. Check if user already exists
      const existingUser = await db.execute({
          sql: 'SELECT id FROM users WHERE LOWER(email) = ?',
          args: [email.toLowerCase().trim()]
      });

      if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'This email address is already registered. Please use a different email.' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const result = await db.execute({
        sql: 'INSERT INTO users (name, email, password, role, manager_id) VALUES (?, ?, ?, ?, ?)',
        args: [name, email.toLowerCase().trim(), passwordHash, (role || 'employee').toLowerCase(), manager_id || null]
      });
    const userId = result.lastInsertRowid;

    // Generate Employee ID (EMP001, EMP002...)
    const countResult = await db.execute('SELECT COUNT(*) as count FROM employees');
    const nextId = (countResult.rows[0].count + 1).toString().padStart(3, '0');
    const employeeCode = `EMP${nextId}`;

    // Insert into employees table
    await db.execute({
      sql: `INSERT INTO employees (user_id, name, role, department_id, employee_code, salary) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [userId, name, role || 'employee', department_id, employeeCode, salary || 0]
    });

    // Auto-assign leave balances
    const currentYear = new Date().getFullYear();
    await db.execute({
      sql: `INSERT INTO leave_balances (user_id, total_leaves, used_leaves, remaining_leaves, year) VALUES (?, 18, 0, 18, ?)`,
      args: [userId, currentYear]
    });
    
    // Broadcast user added
    try {
        emitUserCreated(getIo(), { action: 'newUserAdded', name, role: role || 'employee', employeeCode });
    } catch(e) { console.error('Socket error emitting newUserAdded', e); }

    res.status(201).json({
      message: 'User created successfully',
      id: userId?.toString()
    });

  } catch (error) {
    console.error('[DEBUG] Registration error detail:', error);
    res.status(400).json({ message: error.message });
  }
};
const https = require('https');

const httpsRequest = (options, postData) => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (res.statusCode >= 400) {
                        reject(new Error(parsed.message || `Status: ${res.statusCode}`));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    // GitHub access token response might not be JSON if requested as string
                    if (body.includes('access_token=')) {
                        const params = new URLSearchParams(body);
                        return resolve(Object.fromEntries(params));
                    }
                    resolve(body);
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
};

exports.githubLogin = (req, res) => {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const REDIRECT_URI = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback';
  
  if (!GITHUB_CLIENT_ID) {
      console.error('[AUTH] GITHUB_CLIENT_ID is not configured');
      return res.status(500).json({ error: 'GitHub OAuth not configured on server' });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=user:email`;
  console.log(`[AUTH] Redirecting to GitHub: ${githubAuthUrl}`);
  res.redirect(githubAuthUrl);
};

exports.githubCallback = async (req, res) => {
  const { code } = req.query;
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  console.log(`[AUTH] GitHub callback received. Code: ${code ? 'PRESENT' : 'MISSING'}`);

  if (!code) {
    return res.status(400).json({ message: 'GitHub authorization code missing' });
  }

  try {
    // 1. Exchange code for access token
    console.log('[AUTH] Exchanging code for access token...');
    const tokenData = await httpsRequest({
        hostname: 'github.com',
        path: '/login/oauth/access_token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }, {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code
    });

    const accessToken = tokenData.access_token;
    if (!accessToken) {
        console.error('[AUTH] Failed to obtain access token:', tokenData);
        throw new Error('Failed to obtain access token from GitHub');
    }

    // 2. Fetch User Profile
    console.log('[AUTH] Fetching GitHub user profile...');
    const githubUser = await httpsRequest({
        hostname: 'api.github.com',
        path: '/user',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'EMP-PRO-Backend'
        }
    });

    const githubId = githubUser.id.toString();
    const name = githubUser.name || githubUser.login;
    
    // 3. Fetch User Email (handle privacy)
    let email = githubUser.email;
    if (!email) {
        console.log('[AUTH] Email restricted. Fetching secondary emails...');
        const emails = await httpsRequest({
            hostname: 'api.github.com',
            path: '/user/emails',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'EMP-PRO-Backend'
            }
        });
        const primaryEmail = emails.find(e => e.primary && e.verified) || emails[0];
        email = primaryEmail?.email;
    }

    if (!email) {
        throw new Error('Could not retrieve email from GitHub profile');
    }

    email = email.toLowerCase().trim();
    console.log(`[AUTH] GitHub Identity: ${name} (${email})`);

    // 4. Check if user exists (by github_id or email)
    const existingUserResult = await db.execute({
      sql: 'SELECT id, role, name, email, github_id FROM users WHERE github_id = ? OR LOWER(email) = ?',
      args: [githubId, email]
    });

    let dbUser = existingUserResult.rows[0];

    if (!dbUser) {
        console.log('[AUTH] Creating new user for GitHub identity...');
        const dummyPassword = bcrypt.hashSync(Math.random().toString(36), 10);
        const userInsert = await db.execute({
            sql: 'INSERT INTO users (name, email, password, role, github_id) VALUES (?, ?, ?, ?, ?)',
            args: [name, email, dummyPassword, 'employee', githubId]
        });
        const userId = userInsert.lastInsertRowid;

        // Initialize Employee Profile
        const countResult = await db.execute('SELECT COUNT(*) as count FROM employees');
        const nextId = (countResult.rows[0].count + 1).toString().padStart(3, '0');
        const employeeCode = `EMP${nextId}`;
        
        await db.execute({
            sql: 'INSERT INTO employees (user_id, name, role, department_id, employee_code, salary) VALUES (?, ?, ?, ?, ?, ?)',
            args: [userId, name, 'employee', 1, employeeCode, 45000] // Default to Dept 1
        });

        // Initialize Leaves
        await db.execute({
            sql: 'INSERT INTO leave_balances (user_id, total_leaves, used_leaves, remaining_leaves, year) VALUES (?, 18, 0, 18, ?)',
            args: [userId, new Date().getFullYear()]
        });

        dbUser = { id: userId, name: name, email: email, role: 'employee' };
    } else if (!dbUser.github_id) {
        console.log('[AUTH] Linking GitHub ID to existing account...');
        await db.execute({
            sql: 'UPDATE users SET github_id = ? WHERE id = ?',
            args: [githubId, dbUser.id]
        });
    }

    // 5. Generate JWT
    console.log('[AUTH] Generating application JWT...');
    const token = jwt.sign(
      { id: dbUser.id, role: dbUser.role.toLowerCase(), name: dbUser.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 6. Finalize: Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log(`[AUTH] Success. Sending redirect to: ${frontendUrl}/login`);
    
    res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role.toLowerCase()
    }))}`);

  } catch (error) {
    console.error('[AUTH] GitHub Callback Critical Error:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Authentication failed. Please try again.')}`);
  }
};

exports.updateProfile = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        await db.execute({
            sql: 'UPDATE users SET name = ? WHERE id = ?',
            args: [name, userId]
        });
        
        await db.execute({
            sql: 'UPDATE employees SET name = ? WHERE user_id = ?',
            args: [name, userId]
        });

        res.json({ message: 'Profile updated successfully', name });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    try {
        const result = await db.execute({
            sql: 'SELECT password FROM users WHERE id = ?',
            args: [userId]
        });

        const user = result.rows[0];
        if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await db.execute({
            sql: 'UPDATE users SET password = ? WHERE id = ?',
            args: [hashedPassword, userId]
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
