const mongoose = require('mongoose');
const { RESOURCE_TYPES, RESOURCE_STATUS, INDEXING_STATUS } = require('../utils/constants');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Resource description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject name or course code is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8'],
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: RESOURCE_TYPES,
        message: '{VALUE} is not a supported resource type',
      },
    },
    fileUrl: {
      type: String,
      required: [true, 'Resource PDF file path/URL is required'],
    },
    fileSize: {
      type: Number,
      default: 0, // in bytes
    },
    fileOriginalName: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        RESOURCE_STATUS.PENDING,
        RESOURCE_STATUS.APPROVED,
        RESOURCE_STATUS.REJECTED,
      ],
      default: RESOURCE_STATUS.PENDING,
      index: true,
    },
    indexingStatus: {
      type: String,
      enum: [
        INDEXING_STATUS.PENDING,
        INDEXING_STATUS.PROCESSING,
        INDEXING_STATUS.INDEXED,
        INDEXING_STATUS.FAILED,
      ],
      default: INDEXING_STATUS.PENDING,
      index: true,
    },
    indexingError: {
      type: String,
      default: null,
    },
    indexedAt: {
      type: Date,
      default: null,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast keyword search across title, subject, description, tags
resourceSchema.index({
  title: 'text',
  subject: 'text',
  description: 'text',
  tags: 'text',
});

// Additional indexes for filtering
resourceSchema.index({ department: 1, semester: 1, resourceType: 1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
