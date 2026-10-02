const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Public Authentication Routes
 */
router.post('/register', registerUser);
router.post('/login', loginUser);

/**
 * Protected Authentication Routes (Require valid JWT Bearer token)
 */
router.get('/me', protect, getMe);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

module.exports = router;
