import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, FileText, Calendar, User as UserIcon, Tag } from 'lucide-react';
import Badge from './Badge';
import { formatDate, formatBytes, truncateText } from '../../utils/formatters';
import { resourceService } from '../../services/resourceService';

const ResourceCard = ({
  resource,
  showStatus = false,
  onStatusChange = null,
  onDelete = null,
  isOwner = false,
  isAdmin = false,
}) => {
  const {
    _id,
    title,
    description,
    subject,
    department,
    semester,
    resourceType,
    fileSize,
    uploadedBy,
    tags,
    status,
    downloadCount,
    viewsCount,
    createdAt,
  } = resource;

  const downloadUrl = resourceService.getDownloadUrl(_id);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge type={resourceType}>{resourceType}</Badge>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Sem {semester}
            </span>
            {showStatus && status && <Badge status={status}>{status}</Badge>}
          </div>
        </div>

        {/* Subject & Title */}
        <div className="mb-2">
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider block">
            {subject}
          </span>
          <Link
            to={`/resources/${_id}`}
            className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 mt-0.5"
          >
            {title}
          </Link>
        </div>

        {/* Department */}
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          <span>{department}</span>
        </p>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {truncateText(description, 120)}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1 truncate max-w-[140px]">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{uploadedBy?.name || 'Student'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Views">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              {viewsCount || 0}
            </span>
            <span className="flex items-center gap-1" title="Downloads">
              <Download className="w-3.5 h-3.5 text-slate-400" />
              {downloadCount || 0}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Link
            to={`/resources/${_id}`}
            className="flex-1 text-center py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Details
          </Link>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
            {fileSize ? (
              <span className="text-[10px] opacity-80">
                ({formatBytes(fileSize, 0)})
              </span>
            ) : null}
          </a>
        </div>

        {/* Admin moderation controls if provided */}
        {isAdmin && onStatusChange && (
          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between gap-1">
            <span className="text-[10px] font-semibold text-slate-400">ADMIN:</span>
            <div className="flex gap-1">
              <button
                onClick={() => onStatusChange(_id, 'approved')}
                disabled={status === 'approved'}
                className="px-2 py-1 text-[11px] rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-medium disabled:opacity-40"
              >
                Approve
              </button>
              <button
                onClick={() => onStatusChange(_id, 'rejected')}
                disabled={status === 'rejected'}
                className="px-2 py-1 text-[11px] rounded bg-rose-100 text-rose-800 hover:bg-rose-200 font-medium disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceCard;
