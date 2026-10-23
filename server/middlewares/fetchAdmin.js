const jwt = require('jsonwebtoken');

/**
 * fetchAdmin middleware
 * Reads the 'admin-auth-token' header, verifies it, and checks isAdmin flag.
 * Attaches decoded admin to req.admin.
 */
const fetchAdmin = (req, res, next) => {
  const token = req.header('admin-auth-token');
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Admin access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized as admin.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired admin token.' });
  }
};

module.exports = fetchAdmin;
