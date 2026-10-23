const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const emailService = require('../services/emailService');

/* ═══════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════ */

/**
 * Sign a JWT token valid for 7 days.
 * @param {object} payload - Data to embed in the token.
 * @returns {string} Signed JWT string.
 */
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

/* ═══════════════════════════════════════════════════════════════════
   User Authentication
═══════════════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/register
 * Register a new user and dispatch a Brevo activation email.
 * User must verify their email before they can sign in.
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check for duplicate username or email
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already in use.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate secure crypto verification token and 6-digit OTP (valid for 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpires: verificationExpires,
      verificationOtp,
      verificationOtpExpires: verificationExpires,
    });
    await user.save();

    // Dispatch activation email containing BOTH OTP & Clickable Link via Brevo
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken, user.username, verificationOtp);
    } catch (mailErr) {
      console.warn('[registerUser] Verification email notice:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Account created! A 6-digit OTP code and activation link have been sent to your email.',
      email: user.email,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: false,
      },
    });
  } catch (err) {
    console.error('[registerUser]', err.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * POST /api/auth/verify-otp
 * Validates the 6-digit OTP entered by the user in the verification window.
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email address and 6-digit OTP code are required.',
      });
    }

    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be exactly 6 digits.',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found matching this email address.',
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: 'Your account is already verified! Please sign in.',
      });
    }

    // Verify OTP match
    if (!user.verificationOtp || user.verificationOtp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP code. Please check your email and try again.',
      });
    }

    // Verify OTP expiration
    if (user.verificationOtpExpires && user.verificationOtpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The OTP code has expired. Please click Resend Code to obtain a fresh OTP.',
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    const tokenPayload = {
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: false,
    };
    const jwtToken = signToken(tokenPayload);

    res.json({
      success: true,
      message: 'Account verified successfully! Welcome to iMovies. 🎟️',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    console.error('[verifyOtp]', err.message);
    res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

/**
 * GET/POST /api/auth/verify-email
 * Validates the email verification token (or OTP) and marks user as verified.
 */
const verifyEmail = async (req, res) => {
  try {
    // If an OTP was provided in the request body, delegate to verifyOtp
    if (req.body && req.body.otp) {
      return verifyOtp(req, res);
    }

    const token = req.query.token || req.body.token;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: 'Verification token is required.' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      const expiredUser = await User.findOne({ verificationToken: token });
      if (expiredUser) {
        return res.status(400).json({
          success: false,
          message: 'Verification link has expired. Please request a new verification email.',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    const tokenPayload = {
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: false,
    };
    const jwtToken = signToken(tokenPayload);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your account.',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    console.error('[verifyEmail]', err.message);
    res.status(500).json({ success: false, message: 'Server error during email verification.' });
  }
};

/**
 * POST /api/auth/resend-verification
 * Re-dispatches account verification OTP and link via Brevo.
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an unverified account exists with that email, a new verification link has been sent.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified. Please sign in.',
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationExpires;
    user.verificationOtp = verificationOtp;
    user.verificationOtpExpires = verificationExpires;
    await user.save();

    await emailService.sendVerificationEmail(user.email, verificationToken, user.username, verificationOtp);

    res.json({
      success: true,
      message: 'A fresh 6-digit OTP code and verification link have been dispatched to your email.',
    });
  } catch (err) {
    console.error('[resendVerificationEmail]', err.message);
    res.status(500).json({ success: false, message: 'Error resending verification email.' });
  }
};

/**
 * POST /api/auth/login
 * Login an existing user. Rejects unverified accounts.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: new RegExp(`^${cleanIdentifier}$`, 'i') },
      ],
    });

    if (!user) {
      // Check if it's an admin signing in via the user form
      const admin = await Admin.findOne({
        $or: [
          { email: cleanIdentifier },
          { username: new RegExp(`^${cleanIdentifier}$`, 'i') },
        ],
      });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);
        if (isMatch) {
          const token = signToken({
            id: admin._id,
            email: admin.email,
            username: admin.username,
            isAdmin: true,
          });
          return res.json({
            success: true,
            isAdmin: true,
            message: 'Admin login successful.',
            token,
            admin: { id: admin._id, username: admin.username, email: admin.email },
            user: { id: admin._id, username: admin.username, email: admin.email, isAdmin: true },
          });
        }
      }
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials.' });
    }

    // Enforce email verification: users MUST authenticate through email
    if (user.isVerified === false) {
      return res.status(403).json({
        success: false,
        isVerified: false,
        message: 'Please verify your email address before logging in. Check your inbox for the activation link.',
      });
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: false,
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    console.error('[loginUser]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/auth/validate
 * Validate the user token and return decoded user info.
 */
const validateToken = (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    console.error('[validateToken]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Initiates password reset flow by generating a 30-minute token.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide your account email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    // Generate 30-minute crypto reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    console.log(`[auth] Password reset requested for ${user.email}. Dispatching reset link via Brevo.`);

    try {
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.username);
    } catch (mailErr) {
      console.warn('[forgotPassword] Email dispatch warning:', mailErr.message);
    }

    res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email. Please check your inbox.',
    });
  } catch (err) {
    console.error('[forgotPassword]', err.message);
    res.status(500).json({ success: false, message: 'Server error during password reset request.' });
  }
};

/**
 * POST /api/auth/reset-password
 * Validates reset token and sets new user password.
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, password } = req.body;
    const pwd = newPassword || password;

    if (!token || !pwd) {
      return res
        .status(400)
        .json({ success: false, message: 'Token and new password are required.' });
    }

    if (pwd.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(pwd, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('[resetPassword]', err.message);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};

/* ═══════════════════════════════════════════════════════════════════
   Admin Authentication
═══════════════════════════════════════════════════════════════════ */

/**
 * POST /api/auth/admin/register
 * Register a new admin. Hashes password and issues an admin JWT.
 */
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required.' });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin username or email already in use.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = new Admin({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    await admin.save();

    const token = signToken({
      id: admin._id,
      email: admin.email,
      username: admin.username,
      isAdmin: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully.',
      token,
      admin: { id: admin._id, username: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error('[registerAdmin]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * POST /api/auth/admin/login
 * Login an admin. Returns a signed JWT with isAdmin: true.
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const cleanIdentifier = email.trim().toLowerCase();
    const admin = await Admin.findOne({
      $or: [
        { email: cleanIdentifier },
        { username: new RegExp(`^${cleanIdentifier}$`, 'i') },
      ],
    });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = signToken({
      id: admin._id,
      email: admin.email,
      username: admin.username,
      isAdmin: true,
    });

    res.json({
      success: true,
      isAdmin: true,
      message: 'Admin login successful.',
      token,
      admin: { id: admin._id, username: admin.username, email: admin.email },
      user: { id: admin._id, username: admin.username, email: admin.email, isAdmin: true },
    });
  } catch (err) {
    console.error('[loginAdmin]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * GET /api/auth/admin/validate
 * Validate the admin token and return decoded admin info.
 */
const validateAdminToken = (req, res) => {
  try {
    res.json({
      success: true,
      admin: req.admin,
    });
  } catch (err) {
    console.error('[validateAdminToken]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  validateToken,
  verifyEmail,
  verifyOtp,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  registerAdmin,
  loginAdmin,
  validateAdminToken,
};
