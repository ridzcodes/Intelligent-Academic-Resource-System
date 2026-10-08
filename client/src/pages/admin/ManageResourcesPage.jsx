import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileCheck,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { formatDate, formatBytes } from '../../utils/formatters';

const ManageResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '' });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.adminGetResources({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: searchKeyword || undefined,
      });
      if (data.success) {
        setResources(data.resources || []);
      }
    } catch (err) {
      console.warn('Error loading admin resources:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await resourceService.adminUpdateStatus(id, newStatus);
      if (res.success) {
        setToast({
          type: 'success',
          message:
            newStatus === 'approved'
              ? `Resource approved and AI indexing started!`
              : `Resource status updated to '${newStatus}'`,
        });
        fetchResources();
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update resource status',
      });
    }
  };

  const handleReindex = async (id) => {
    try {
      const res = await resourceService.adminReindexResource(id);
      if (res.success) {
        setToast({
          type: 'success',
          message: 'AI vector indexing pipeline triggered!',
        });
        setTimeout(() => fetchResources(), 1500);
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to trigger AI re-indexing',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await resourceService.deleteResource(deleteTarget._id);
      if (res.success) {
        setToast({ type: 'success', message: 'Resource permanently deleted' });
        setResources((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete resource',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Manage All Academic Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Approve, reject, or remove submitted academic study materials
        </p>
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: '', message: '' })}
      />

      {/* Control Bar: Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['All', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setSearchParams(status === 'All' ? {} : { status });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === status
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search by title or subject..."
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Fetching resources catalogue..." />
      ) : resources.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title & Subject</th>
                  <th className="px-4 py-4">Department & Sem</th>
                  <th className="px-4 py-4">Uploader</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 max-w-xs">
                      <Link
                        to={`/resources/${res._id}`}
                        className="font-bold text-slate-900 hover:text-purple-600 line-clamp-1 text-sm mb-0.5"
                      >
                        {res.title}
                      </Link>
                      <span className="text-purple-600 font-semibold">
                        {res.subject}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-medium">
                        {res.department}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Sem {res.semester} • {res.resourceType}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <div className="font-semibold">{res.uploadedBy?.name || 'Student'}</div>
                      <div className="text-[11px] text-slate-400">
                        {res.uploadedBy?.email}
                      </div>
                    </td>

                    <td className="px-4 py-4 space-y-1">
                      <div>
                        <Badge status={res.status}>{res.status}</Badge>
                      </div>
                      {res.status === 'approved' && (
                        <div className="flex items-center gap-1">
                          {res.indexingStatus === 'indexed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles className="w-2.5 h-2.5 mr-1" />
                              Indexed ({res.chunkCount || 0} chunks)
                            </span>
                          ) : res.indexingStatus === 'processing' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                              <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                              Indexing...
                            </span>
                          ) : res.indexingStatus === 'failed' ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
                              title={res.indexingError || 'Indexing failed'}
                            >
                              Index Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Not Indexed
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(res.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                      {res.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(res._id, 'approved')}
                          className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[11px] font-semibold"
                          title="Approve resource & automatically index into AI semantic search"
                        >
                          Approve
                        </button>
                      )}
                      {res.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatusUpdate(res._id, 'rejected')}
                          className="px-2 py-1 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 text-[11px] font-semibold"
                        >
                          Reject
                        </button>
                      )}
                      {res.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(res._id, 'pending')}
                          className="px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 text-[11px] font-semibold"
                        >
                          Set Pending
                        </button>
                      )}
                      {res.status === 'approved' && (
                        <button
                          onClick={() => handleReindex(res._id)}
                          className="px-2 py-1 rounded bg-purple-100 text-purple-800 hover:bg-purple-200 text-[11px] font-semibold inline-flex items-center gap-1"
                          title="Re-run AI vector indexing pipeline for this PDF"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Re-index
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(res)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
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
          icon={FileCheck}
          title="No resources found"
          description="There are currently no materials matching this status or keyword."
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Admin Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-bold text-slate-800">
              "{deleteTarget?.title}"
            </span>
            ? This will remove the document file from the server storage permanently.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageResourcesPage;
