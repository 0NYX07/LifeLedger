const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password securely
    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    });

    const token = generateToken(user._id.toString());

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      },
      message: 'Account created successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly select passwordHash for verification
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id.toString());

    res.cookie('token', token, cookieOptions);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      },
      message: 'Logged in successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Log out current session
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
