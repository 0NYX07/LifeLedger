const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => process.env.JWT_SECRET || 'lifeledger_default_jwt_secret_key_2026';

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    // Fetch user without passwordHash
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User not found.'
      });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token.'
      });
    }

    next(err);
  }
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: '7d'
  });
};

module.exports = {
  authenticate,
  generateToken,
  get JWT_SECRET() {
    return getJwtSecret();
  }
};
