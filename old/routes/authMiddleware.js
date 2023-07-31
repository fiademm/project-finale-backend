const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and user role
const authenticateJWT = (requiredRole) => (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }

    req.user = user;

    // Check if the required role is specified and if the user has the required role
    if (requiredRole && req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  });
};

module.exports = authenticateJWT;