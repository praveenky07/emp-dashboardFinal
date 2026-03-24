const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('[DEBUG] Auth Header:', authHeader);
  console.log('[DEBUG] Extracted Token:', token ? `${token.substring(0, 10)}...` : 'None');

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[DEBUG] JWT Verification Error:', err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    
    console.log('[DEBUG] Decoded User:', user);
    req.user = user;
    next();
  });
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Convert everything to lowercase to ensure case-insensitive match
    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (allowedRoles.length && !allowedRoles.includes(userRole)) {
      console.log(`[DEBUG] Role Authorization Failed. User Role: ${userRole}, Allowed: ${allowedRoles}`);
      return res.status(403).json({ error: "Forbidden: You do not have the required permissions" });
    }
    
    next();
  };
};

module.exports = { protect, authorize };

