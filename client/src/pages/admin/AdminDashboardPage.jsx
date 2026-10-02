import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { resourceService } from '../../services/resourceService';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [pendingResources, setPendingResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, resourcesData] = await Promise.all([
        resourceService.adminGetStats(),
        resourceService.adminGetResources({ status: 'pending', limit: 5 }),
      ]);

      if (statsData.success) {
        setStats(statsData.stats);
      }
      if (resourcesData.success) {
        setPendingResources(resourcesData.resources || []);
      }
    } catch (err) {
      console.warn('Error fetching admin data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await resourceService.adminUpdateStatus(id, newStatus);
      if (res.success) {
        setToast({
          type: 'success',
          message: `Resource marked as '${newStatus}' successfully!`,
        });
        fetchAdminData();
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update resource status.',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingSpinner text="Loading administrator analytics & queues..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            System Administration Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Moderate uploaded academic study materials and monitor platform metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/resources"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <FileCheck className="w-4 h-4" />
            <span>Manage All Resources</span>
          </Link>
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: '', message: '' })}
      />

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Pending Approvals */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Pending Reviews
            </span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-amber-900">
            {stats?.pendingResources || 0}
          </p>
          <p className="text-[11px] text-amber-700 mt-1">Awaiting moderation</p>
        </div>

        {/* Total Approved Resources */}
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Approved Materials
            </span>
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-emerald-900">
            {stats?.approvedResources || 0}
          </p>
          <p className="text-[11px] text-emerald-700 mt-1">
            Live on public catalog
          </p>
        </div>

        {/* Total Registered Users */}
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Users
            </span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-blue-900">
            {stats?.totalUsers || 0}
          </p>
          <p className="text-[11px] text-blue-700 mt-1">
            {stats?.totalStudents || 0} students, {stats?.totalAdmins || 0} admins
          </p>
        </div>

        {/* Total Downloads */}
        <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Downloads
            </span>
            <Download className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-purple-900">
            {stats?.totalDownloads || 0}
          </p>
          <p className="text-[11px] text-purple-700 mt-1">
            Across {stats?.totalViews || 0} views
          </p>
        </div>
      </div>

      {/* Pending Quality Review Queue */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pending Upload Approval Queue
            </h2>
            <p className="text-xs text-slate-500">
              Review and approve study resources submitted by students
            </p>
          </div>
          <Link
            to="/admin/resources?status=pending"
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>View all queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingResources.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pendingResources.map((item) => (
              <div
                key={item._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge type={item.resourceType}>{item.resourceType}</Badge>
                    <span className="text-xs font-semibold text-slate-500">
                      Sem {item.semester} • {item.department}
                    </span>
                  </div>
                  <Link
                    to={`/resources/${item._id}`}
                    className="font-bold text-sm text-slate-900 hover:text-brand-600 block"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Uploaded by {item.uploadedBy?.name || 'Student'} ({item.uploadedBy?.email})
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    to={`/resources/${item._id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Inspect
                  </Link>
                  <button
                    onClick={() => handleStatusChange(item._id, 'approved')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(item._id, 'rejected')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">The review queue is empty!</p>
            <p>All student submitted academic materials have been reviewed.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;
