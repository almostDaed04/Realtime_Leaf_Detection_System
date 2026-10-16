const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Verify JWT and attach user to request.
 * Rejects with 401 if token is missing, invalid, or expired.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user to ensure they still exist and are active
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (user.accountStatus === 'disabled') {
      return res.status(403).json({ error: 'Account has been disabled.' });
    }

    if (user.accountStatus === 'deactivated') {
      // If deactivation period expired, automatically reactivate
      if (user.deactivatedUntil && user.deactivatedUntil.getTime() <= Date.now()) {
        user.accountStatus = 'active';
        user.deactivatedAt = undefined;
        user.deactivatedUntil = undefined;
        user.deactivationReason = undefined;
        await user.save();
      } else {
        return res.status(403).json({
          error: 'Your account is temporarily deactivated.',
          isDeactivated: true,
          deactivatedUntil: user.deactivatedUntil,
          deactivatedAt: user.deactivatedAt,
          deactivationReason: user.deactivationReason,
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * Middleware factory: Require a specific role.
 * Must be used after requireAuth.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    next();
  };
};

/**
 * Generate a JWT for a given user.
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2d' }
  );
};

module.exports = { requireAuth, requireRole, generateToken };
