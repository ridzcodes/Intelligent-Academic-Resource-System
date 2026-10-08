/**
 * Utility Formatters for Academic Resource System
 */

export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getResourceTypeColor = (type) => {
  switch (type) {
    case 'Notes':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Textbook':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Question Paper':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Assignment':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Lab Manual':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Presentation':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'Reference Material':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
};

export const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-600/20';
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-600/20';
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-600/20';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-300';
  }
};

export const getIndexingBadgeColor = (indexingStatus) => {
  switch (indexingStatus) {
    case 'indexed':
      return 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-600/20';
    case 'processing':
      return 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-600/20 animate-pulse';
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-600/20';
    case 'pending':
    default:
      return 'bg-slate-50 text-slate-600 border-slate-300';
  }
};
