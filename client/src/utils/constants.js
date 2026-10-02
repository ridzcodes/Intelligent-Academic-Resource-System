export const RESOURCE_TYPES = [
  'Notes',
  'Textbook',
  'Question Paper',
  'Assignment',
  'Lab Manual',
  'Presentation',
  'Reference Material',
  'Other',
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
  'Other',
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const RESOURCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const UPLOADS_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
