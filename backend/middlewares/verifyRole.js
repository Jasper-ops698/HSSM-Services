const jwt = require('jsonwebtoken');

// Middleware to verify roles
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Extract token from the Authorization header
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Unauthorized' });

      // Verify and decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user data to request object

      // Check if the user's role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient role' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      res.status(401).json({ message: 'Unauthorized', error: error.message });
    }
  };
};

module.exports = verifyRole;