const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  uploadResource,
  getMyResources,
  updateResource,
  deleteResource,
  downloadResource,
  updateResourceStatus,
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { USER_ROLES } = require('../utils/constants');

// Public Resource Browsing & Search
router.get('/', getResources);

// Protected: Current user's uploads (Must be before /:id to prevent route shadowing)
router.get('/my/uploads', protect, getMyResources);

// Protected: Upload PDF Resource
router.post('/upload', protect, upload.single('file'), uploadResource);

// Resource download (increments counter and streams file)
router.get('/:id/download', downloadResource);

// Single Resource details (public)
router.get('/:id', getResourceById);

// Resource update / delete (Owner or Admin)
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);

// Admin only: Approve / Reject resource
router.patch(
  '/:id/status',
  protect,
  authorize(USER_ROLES.ADMIN),
  updateResourceStatus
);

module.exports = router;
