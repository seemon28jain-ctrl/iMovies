const jwt = require('jsonwebtoken');

/**
 * fetchUser middleware
 * Reads the 'auth-token' header, verifies it, and attaches decoded user to req.user.
 */
const fetchUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = fetchUser;
