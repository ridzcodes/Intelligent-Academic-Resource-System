import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, Download, Eye, ExternalLink, MapPin, Layers, BookOpen } from 'lucide-react';
import Badge from './Badge';
import { resourceService } from '../../services/resourceService';
import { formatBytes, truncateText } from '../../utils/formatters';

const RecommendationCard = ({ recommendation }) => {
  const {
    _id,
    resourceId,
    title,
    subject,
    department,
    semester,
    resourceType,
    description,
    tags,
    fileSize,
    fileOriginalName,
    similarityScore = 0,
    maxSimilarityScore,
    matchedChunksCount = 1,
    bestMatchPage = 1,
    bestMatchExcerpt,
    resource,
  } = recommendation;

  const targetId = _id || resourceId || resource?._id;
  const scorePercentage = Math.round(similarityScore * 100);

  // Dynamic confidence badge color
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const downloadUrl = targetId ? resourceService.getDownloadUrl(targetId) : null;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {resourceType && <Badge type={resourceType}>{resourceType}</Badge>}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Sem {semester || 1}
            </span>
          </div>

          {/* AI Similarity Badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl border shadow-sm ${getScoreBadgeClass(
                scorePercentage
              )}`}
              title={`Cosine Similarity: ${Number(similarityScore).toFixed(4)}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{scorePercentage}% Match</span>
            </span>
          </div>
        </div>

        {/* Subject & Title */}
        <div className="mb-2">
          {subject && (
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block mb-0.5">
              {subject}
            </span>
          )}
          <Link
            to={`/resources/${targetId}`}
            className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2"
          >
            {title}
          </Link>
        </div>

        {/* Department */}
        <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>{department}</span>
        </p>

        {/* Description Overview */}
        {description && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
            {truncateText(description, 110)}
          </p>
        )}

        {/* AI Alignment Metadata: Matched Chunks & Page Citation */}
        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-purple-900">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-600" />
              <span>{matchedChunksCount} matching section{matchedChunksCount === 1 ? '' : 's'}</span>
            </span>
            <span className="flex items-center gap-1 text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200/60 text-[10px]">
              <MapPin className="w-2.5 h-2.5 text-purple-600" />
              Page {bestMatchPage}
            </span>
          </div>

          {bestMatchExcerpt && (
            <p className="text-[11px] text-slate-600 italic line-clamp-2 font-mono leading-relaxed bg-white/70 p-2 rounded-lg border border-purple-100/60">
              "{bestMatchExcerpt}"
            </p>
          )}
        </div>
      </div>

      {/* Footer Info & Action Buttons */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 truncate max-w-[140px] text-[11px]">
          <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{fileOriginalName || 'Document.pdf'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/resources/${targetId}`}
            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Details
            <ExternalLink className="w-3 h-3" />
          </Link>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
              {fileSize ? (
                <span className="text-[10px] opacity-80">
                  ({formatBytes(fileSize, 0)})
                </span>
              ) : null}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
