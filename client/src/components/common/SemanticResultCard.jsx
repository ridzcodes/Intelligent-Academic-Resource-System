import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, ExternalLink, Sparkles, MapPin } from 'lucide-react';
import Badge from './Badge';
import { resourceService } from '../../services/resourceService';
import { formatBytes } from '../../utils/formatters';

const SemanticResultCard = ({ result }) => {
  const {
    text,
    similarityScore = 0,
    pageNumber = 1,
    filename,
    resource,
  } = result;

  const scorePercentage = Math.round(similarityScore * 100);

  // Determine badge color based on match confidence
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-brand-50 text-brand-700 border-brand-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const downloadUrl = resource?._id ? resourceService.getDownloadUrl(resource._id) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {resource?.resourceType && (
              <Badge type={resource.resourceType}>{resource.resourceType}</Badge>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              <MapPin className="w-3 h-3 text-indigo-500" />
              Page {pageNumber}
            </span>
          </div>

          {/* Semantic Similarity Score Badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl border ${getScoreBadgeClass(
              scorePercentage
            )}`}
            title={`Cosine Similarity: ${(similarityScore).toFixed(4)}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {scorePercentage}% Match
          </span>
        </div>

        {/* Title & Subject */}
        <div className="mb-3">
          {resource?.subject && (
            <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block mb-0.5">
              {resource.subject}
            </span>
          )}
          <h3 className="text-base font-bold text-slate-900 line-clamp-2">
            {resource ? (
              <Link
                to={`/resources/${resource._id}`}
                className="hover:text-brand-600 transition-colors"
              >
                {resource.title}
              </Link>
            ) : (
              <span>{filename || 'Indexed Document'}</span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{filename}</span>
          </p>
        </div>

        {/* Matched PDF Passage Snippet */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl relative">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
            <span className="flex items-center gap-1 text-brand-700">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Relevant Excerpt on Page {pageNumber}:
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic line-clamp-4 font-mono">
            "{text}"
          </p>
        </div>
      </div>

      {/* Footer Details & Action Buttons */}
      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="text-slate-500 truncate text-[11px]">
          {resource?.department ? (
            <span>{resource.department}</span>
          ) : (
            <span className="text-slate-400">ChromaDB Vector Match</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {resource ? (
            <>
              <Link
                to={`/resources/${resource._id}`}
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
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  <Download className="w-3 h-3" />
                  <span>PDF</span>
                </a>
              )}
            </>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Indexed in ChromaDB
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SemanticResultCard;
