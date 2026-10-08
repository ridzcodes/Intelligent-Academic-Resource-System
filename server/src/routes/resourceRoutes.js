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
  reindexResource,
} = require('../controllers/resourceController');
const { recommendResources } = require('../controllers/aiController');
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

// Content-based AI recommendations for a specific resource
router.get('/:id/recommendations', recommendResources);

// Single Resource details (public)
router.get('/:id', getResourceById);

// Resource update / delete (Owner or Admin)
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);

// Admin only: Approve / Reject resource (automatically triggers AI indexing when approved)
router.patch(
  '/:id/status',
  protect,
  authorize(USER_ROLES.ADMIN),
  updateResourceStatus
);

// Admin only: Manually trigger re-indexing for an approved resource
router.post(
  '/:id/reindex',
  protect,
  authorize(USER_ROLES.ADMIN),
  reindexResource
);

module.exports = router;
