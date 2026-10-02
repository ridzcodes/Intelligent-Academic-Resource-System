import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderArchive,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  Edit,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import { formatDate, formatBytes } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';

const MyResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '' });

  const fetchMyResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getMyResources();
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (err) {
      console.warn('Error fetching my resources:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyResources();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await resourceService.deleteResource(deleteTarget._id);
      if (res.success) {
        setToast({ type: 'success', message: 'Resource deleted successfully.' });
        setResources((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete resource.' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    try {
      const res = await resourceService.updateResource(editTarget._id, {
        title: editTarget.title,
        subject: editTarget.subject,
        description: editTarget.description,
        tags: editTarget.tags,
      });

      if (res.success) {
        setToast({ type: 'success', message: 'Resource updated successfully.' });
        fetchMyResources();
        setEditTarget(null);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update resource.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Uploaded Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track status approvals, view download counts, and manage your contributions
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New PDF</span>
        </Link>
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: '', message: '' })}
      />

      {loading ? (
        <LoadingSpinner text="Fetching your upload portfolio..." />
      ) : resources.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Resource Details</th>
                  <th className="px-4 py-4">Type & Sem</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Engagement</th>
                  <th className="px-4 py-4">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-slate-900 text-sm mb-0.5">
                        {item.title}
                      </div>
                      <div className="text-brand-600 font-semibold text-xs">
                        {item.subject} • {item.department}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {formatBytes(item.fileSize)}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge type={item.resourceType}>{item.resourceType}</Badge>
                      <div className="text-[11px] text-slate-500 mt-1 font-medium">
                        Semester {item.semester}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <Badge status={item.status}>{item.status}</Badge>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.viewsCount || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.downloadCount || 0} downloads</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/resources/${item._id}`}
                        className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg inline-block font-semibold"
                        title="View details"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setEditTarget(item)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Edit metadata"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FolderArchive}
          title="You haven't uploaded any study resources yet"
          description="Contribute your class notes, solved previous question papers, or lab manuals to help fellow students."
          actionText="Upload Your First Resource"
          actionLink="/upload"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Resource Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-slate-800">
              "{deleteTarget?.title}"
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit Resource Metadata"
        maxWidth="max-w-lg"
      >
        {editTarget && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={editTarget.title}
                onChange={(e) =>
                  setEditTarget({ ...editTarget, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={editTarget.subject}
                onChange={(e) =>
                  setEditTarget({ ...editTarget, subject: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={editTarget.description}
                onChange={(e) =>
                  setEditTarget({ ...editTarget, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MyResourcesPage;
