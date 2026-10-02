const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllAdminResources,
  getAdminStats,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { USER_ROLES } = require('../utils/constants');

// All routes here are restricted to Admin
router.use(protect);
router.use(authorize(USER_ROLES.ADMIN));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/resources', getAllAdminResources);

module.exports = router;
