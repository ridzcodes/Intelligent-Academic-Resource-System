import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  Eye,
  Calendar,
  User,
  GraduationCap,
  Building2,
  Tag,
  ArrowLeft,
  FileText,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { formatDate, formatBytes } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UPLOADS_BASE_URL } from '../../utils/constants';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [relatedResources, setRelatedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        const data = await resourceService.getResourceById(id);
        if (data.success && data.resource) {
          setResource(data.resource);

          // Fetch related resources for the same department/subject
          const related = await resourceService.getResources({
            department: data.resource.department,
            limit: 3,
          });
          if (related.success) {
            setRelatedResources(
              (related.resources || []).filter((r) => r._id !== id)
            );
          }
        }
      } catch (err) {
        console.warn('Error fetching resource details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResource();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <LoadingSpinner text="Loading study resource details..." />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Resource not found</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested document could not be located.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </div>
    );
  }

  const downloadUrl = resourceService.getDownloadUrl(resource._id);
  const fullPdfUrl = `${UPLOADS_BASE_URL}${resource.fileUrl}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main Resource Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Badge type={resource.resourceType}>{resource.resourceType}</Badge>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Semester {resource.semester}
            </span>
            <Badge status={resource.status}>{resource.status}</Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-slate-400" />
              {resource.viewsCount || 0} views
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-4 h-4 text-slate-400" />
              {resource.downloadCount || 0} downloads
            </span>
          </div>
        </div>

        {/* Subject & Title */}
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
          {resource.subject}
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4">
          {resource.title}
        </h1>

        {/* Department & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>{resource.department}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-brand-600" />
            <span>Uploaded by {resource.uploadedBy?.name || 'Verified Student'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Uploaded on {formatDate(resource.createdAt)}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Document Overview & Syllabus Topics
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {resource.description}
          </p>
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tags & Key Concepts
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg"
                >
                  <Tag className="w-3 h-3 text-slate-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-500/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF ({formatBytes(resource.fileSize)})</span>
          </a>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Hide PDF Preview' : 'Preview PDF Document'}</span>
          </button>
        </div>
      </div>

      {/* Embedded In-Browser PDF Preview */}
      {showPreview && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Embedded PDF Document Viewer</span>
            </h3>
            <a
              href={fullPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="w-full h-[650px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            <iframe
              src={fullPdfUrl}
              title={resource.title}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Related Department Study Materials */}
      {relatedResources.length > 0 && (
        <div className="space-y-4 pt-6">
          <h2 className="text-lg font-bold text-slate-900">
            Related {resource.department} Materials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedResources.map((rel) => (
              <div
                key={rel._id}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 transition"
              >
                <Badge type={rel.resourceType}>{rel.resourceType}</Badge>
                <Link
                  to={`/resources/${rel._id}`}
                  className="block font-bold text-sm text-slate-900 hover:text-brand-600 mt-2 mb-1"
                >
                  {rel.title}
                </Link>
                <p className="text-xs text-slate-500">{rel.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDetailsPage;
