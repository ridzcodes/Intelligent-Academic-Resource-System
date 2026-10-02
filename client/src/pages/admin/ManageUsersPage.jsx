import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Trash2, UserCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { resourceService } from '../../services/resourceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

const ManageUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await resourceService.adminGetUsers({
        role: roleFilter !== 'All' ? roleFilter : undefined,
        search: searchKeyword || undefined,
      });
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.warn('Error fetching users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      const res = await resourceService.adminUpdateUserRole(user._id, newRole);
      if (res.success) {
        setToast({
          type: 'success',
          message: `${user.name}'s role updated to '${newRole}'`,
        });
        fetchUsers();
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to update user role',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await resourceService.adminDeleteUser(deleteTarget._id);
      if (res.success) {
        setToast({ type: 'success', message: 'User account deleted.' });
        setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Failed to delete user',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          User & Role Administration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage student and faculty accounts, permissions, and departmental assignments
        </p>
      </div>

      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ type: '', message: '' })}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          {['All', 'student', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                roleFilter === role
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search by student name or email..."
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading registered accounts..." />
      ) : users.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-4 py-4">Department</th>
                  <th className="px-4 py-4">Year</th>
                  <th className="px-4 py-4">Role</th>
                  <th className="px-4 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                          {item.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">
                            {item.name}
                            {item._id === currentAdmin?._id && (
                              <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-800 font-medium">
                      {item.department}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      Year {item.year || 1}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          item.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.role}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {item._id !== currentAdmin?._id && (
                        <>
                          <button
                            onClick={() => handleRoleToggle(item)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                          >
                            Set as {item.role === 'admin' ? 'Student' : 'Admin'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No registered accounts matched the specified criteria."
        />
      )}

      {/* Delete User Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm User Account Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete user account{' '}
            <span className="font-bold text-slate-800">
              "{deleteTarget?.name}" ({deleteTarget?.email})
            </span>
            ?
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
              Delete Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageUsersPage;
