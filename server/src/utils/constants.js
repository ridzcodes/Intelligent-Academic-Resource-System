/**
 * Global Constants and Enums for Academic Resource System
 * Useful for validation, schema constraints, and frontend select options.
 */

const RESOURCE_TYPES = [
  'Notes',
  'Textbook',
  'Question Paper',
  'Assignment',
  'Lab Manual',
  'Presentation',
  'Reference Material',
  'Other',
];

const RESOURCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const INDEXING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  INDEXED: 'indexed',
  FAILED: 'failed',
};

const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
  'Other',
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

module.exports = {
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  INDEXING_STATUS,
  USER_ROLES,
  DEPARTMENTS,
  SEMESTERS,
};
