const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token containing the user id and role
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} role - Role of the user ('student' | 'admin')
 * @returns {string} - Signed JWT string
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = generateToken;
