const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const { RESOURCE_STATUS, USER_ROLES, INDEXING_STATUS } = require('../utils/constants');
const { indexDocument, deleteIndexedVectors } = require('../utils/aiClient');

/**
 * @desc    Get all resources (approved only for general public/students)
 *          Supports keyword search, filters, pagination, and sorting
 * @route   GET /api/resources
 * @access  Public
 */
const getResources = async (req, res, next) => {
  try {
    const {
      search,
      department,
      semester,
      resourceType,
      subject,
      tag,
      sort = 'latest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // 1. By default, public browse shows only approved resources
    query.status = RESOURCE_STATUS.APPROVED;

    // 2. Keyword search across title, description, subject, or tags
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    // 3. Faceted filters
    if (department && department !== 'All') {
      query.department = department;
    }
    if (semester && semester !== 'All') {
      query.semester = Number(semester);
    }
    if (resourceType && resourceType !== 'All') {
      query.resourceType = resourceType;
    }
    if (subject && subject.trim() !== '') {
      query.subject = new RegExp(subject.trim(), 'i');
    }
    if (tag && tag.trim() !== '') {
      query.tags = tag.trim();
    }

    // 4. Sorting logic
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'popular') {
      sortOption = { downloadCount: -1, createdAt: -1 };
    } else if (sort === 'views') {
      sortOption = { viewsCount: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'title') {
      sortOption = { title: 1 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination and uploader details populated
    const [resources, totalCount] = await Promise.all([
      Resource.find(query)
        .populate('uploadedBy', 'name email department year')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Resource.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: resources.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single resource by ID & increment view count
 * @route   GET /api/resources/:id
 * @access  Public
 */
const getResourceById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate(
      'uploadedBy',
      'name email department year role'
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Academic resource not found',
      });
    }

    // Increment view count asynchronously
    resource.viewsCount += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload a new academic resource PDF
 * @route   POST /api/resources/upload
 * @access  Private (Logged in users)
 */
const uploadResource = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a valid PDF document file',
      });
    }

    const { title, description, subject, department, semester, resourceType } =
      req.body;

    let parsedTags = [];
    if (req.body.tags) {
      if (Array.isArray(req.body.tags)) {
        parsedTags = req.body.tags;
      } else if (typeof req.body.tags === 'string') {
        parsedTags = req.body.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    // Validate required fields
    if (
      !title ||
      !description ||
      !subject ||
      !department ||
      !semester ||
      !resourceType
    ) {
      // Remove uploaded file if validation fails
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'All metadata fields are required for uploading a resource',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const newResource = await Resource.create({
      title,
      description,
      subject,
      department,
      semester: Number(semester),
      resourceType,
      fileUrl,
      fileSize: req.file.size,
      fileOriginalName: req.file.originalname,
      uploadedBy: req.user._id,
      tags: parsedTags,
      status: RESOURCE_STATUS.PENDING, // Newly uploaded resources always start as pending
    });

    const populatedResource = await Resource.findById(newResource._id).populate(
      'uploadedBy',
      'name email department'
    );

    res.status(201).json({
      success: true,
      message:
        'Resource uploaded successfully! It is now pending administrative approval.',
      resource: populatedResource,
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * @desc    Get all resources uploaded by current logged in user
 * @route   GET /api/resources/my
 * @access  Private
 */
const getMyResources = async (req, res, next) => {
  try {
    const resources = await Resource.find({ uploadedBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update resource details
 * @route   PUT /api/resources/:id
 * @access  Private (Owner or Admin)
 */
const updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Check ownership or admin role
    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resource',
      });
    }

    const { title, description, subject, department, semester, resourceType, tags } =
      req.body;

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (subject) resource.subject = subject;
    if (department) resource.department = department;
    if (semester) resource.semester = Number(semester);
    if (resourceType) resource.resourceType = resourceType;
    if (tags) {
      resource.tags = Array.isArray(tags)
        ? tags
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const updatedResource = await resource.save();

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      resource: updatedResource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resource
 * @route   DELETE /api/resources/:id
 * @access  Private (Owner or Admin)
 */
const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resource',
      });
    }

    // Remove file from disk if present
    if (resource.fileUrl) {
      const filename = path.basename(resource.fileUrl);
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Clean up ChromaDB vector embeddings asynchronously
    deleteIndexedVectors(resource._id.toString()).catch((err) => {
      console.warn(`[AI Cleanup Warning] Failed to delete vectors for resource ${resource._id}:`, err.message);
    });

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Increment download count and serve file
 * @route   GET /api/resources/:id/download
 * @access  Public
 */
const downloadResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    const filename = path.basename(resource.fileUrl);
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Physical PDF file not found on server',
      });
    }

    // Increment download count
    resource.downloadCount += 1;
    await resource.save();

    res.download(filePath, resource.fileOriginalName || `${resource.title}.pdf`);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Automatically extracts, chunks, embeds, and indexes an approved PDF into ChromaDB
 * Safely updates MongoDB Resource indexingStatus without throwing or crashing Express.
 * 
 * @param {string|mongoose.Types.ObjectId} resourceId
 */
const triggerAutoIndexing = async (resourceId) => {
  try {
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      console.warn(`[AI Auto-Indexing] Resource ${resourceId} not found in database.`);
      return;
    }

    if (resource.status !== RESOURCE_STATUS.APPROVED) {
      console.log(`[AI Auto-Indexing] Skipping resource ${resourceId} because status is '${resource.status}' (not approved).`);
      return;
    }

    const filename = path.basename(resource.fileUrl);
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      console.error(`[AI Auto-Indexing Error] Physical file not found: ${filePath}`);
      resource.indexingStatus = INDEXING_STATUS.FAILED;
      resource.indexingError = 'Physical PDF file not found on server storage';
      await resource.save();
      return;
    }

    // Mark as processing
    resource.indexingStatus = INDEXING_STATUS.PROCESSING;
    resource.indexingError = null;
    await resource.save();

    console.log(`[AI Auto-Indexing] Starting pipeline for: "${resource.title}" (${resource._id})...`);

    // Call Python FastAPI microservice (POST /api/ai/index)
    const result = await indexDocument({
      resourceId: resource._id.toString(),
      filePath,
      filename: resource.fileOriginalName || filename,
    });

    console.log(
      `[AI Auto-Indexing Success] Resource "${resource.title}" (${resource._id}) -> ${result.vectors_stored || result.total_chunks} vectors stored in ChromaDB.`
    );

    // Update resource with successful indexing state
    resource.indexingStatus = INDEXING_STATUS.INDEXED;
    resource.indexedAt = new Date();
    resource.chunkCount = result.vectors_stored || result.total_chunks || 0;
    resource.indexingError = null;
    await resource.save();
  } catch (error) {
    console.error(`[AI Auto-Indexing Error] Failed to index resource ${resourceId}:`, error.message);
    try {
      await Resource.findByIdAndUpdate(resourceId, {
        indexingStatus: INDEXING_STATUS.FAILED,
        indexingError: error.message || 'AI Microservice indexing failed',
      });
    } catch (dbErr) {
      console.error('[AI Auto-Indexing DB Update Error]:', dbErr.message);
    }
  }
};

/**
 * @desc    Admin: Update resource approval status (approved / rejected / pending)
 *          Automatically triggers AI vector indexing immediately upon approval.
 * @route   PATCH /api/resources/:id/status
 * @access  Private (Admin only)
 */
const updateResourceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (
      ![
        RESOURCE_STATUS.APPROVED,
        RESOURCE_STATUS.REJECTED,
        RESOURCE_STATUS.PENDING,
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be approved, rejected, or pending.',
      });
    }

    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    resource.status = status;

    if (status === RESOURCE_STATUS.APPROVED) {
      resource.indexingStatus = INDEXING_STATUS.PROCESSING;
      await resource.save();

      // Trigger automatic AI indexing immediately in the background
      triggerAutoIndexing(resource._id);
    } else {
      // If rejected or set back to pending, reset indexing status & clean up vectors
      resource.indexingStatus = INDEXING_STATUS.PENDING;
      resource.indexingError = null;
      await resource.save();

      deleteIndexedVectors(resource._id.toString()).catch((err) => {
        console.warn(`[AI Cleanup Warning] Failed removing vectors for unapproved resource ${resource._id}:`, err.message);
      });
    }

    res.status(200).json({
      success: true,
      message:
        status === RESOURCE_STATUS.APPROVED
          ? `Resource approved and automatic AI indexing started.`
          : `Resource status updated to '${status}' successfully.`,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin: Manually re-trigger AI indexing for an approved resource
 * @route   POST /api/resources/:id/reindex
 * @access  Private (Admin only)
 */
const reindexResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    if (resource.status !== RESOURCE_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'Only approved resources can be indexed into the AI vector database',
      });
    }

    // Trigger indexing immediately
    triggerAutoIndexing(resource._id);

    res.status(200).json({
      success: true,
      message: 'AI vector indexing triggered successfully',
      resource,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResources,
  getResourceById,
  uploadResource,
  getMyResources,
  updateResource,
  deleteResource,
  downloadResource,
  updateResourceStatus,
  reindexResource,
  triggerAutoIndexing,
};
