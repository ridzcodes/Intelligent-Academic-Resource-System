import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Search,
  UploadCloud,
  FolderArchive,
  Sparkles,
  User,
  ShieldAlert,
  Users,
  LogOut,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      {/* Top Section */}
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {user?.name}
            </h4>
            <p className="text-[11px] text-slate-500 truncate">{user?.department}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-semibold text-brand-700 bg-brand-100 px-1.5 py-0.2 rounded">
                Year {user?.year || 1}
              </span>
              <span className="text-[10px] font-medium text-slate-500 capitalize">
                • {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Student Navigation Menu */}
        <div>
          <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Student Menu
          </span>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={navItemClass}>
              <LayoutDashboard className="w-4 h-4 text-brand-600" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/browse" className={navItemClass}>
              <Compass className="w-4 h-4 text-slate-500" />
              <span>Browse Catalog</span>
            </NavLink>
            <NavLink to="/search" className={navItemClass}>
              <Search className="w-4 h-4 text-slate-500" />
              <span>Search Resources</span>
            </NavLink>
            <NavLink to="/upload" className={navItemClass}>
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload Resource</span>
            </NavLink>
            <NavLink to="/my-resources" className={navItemClass}>
              <FolderArchive className="w-4 h-4 text-amber-600" />
              <span>My Uploads</span>
            </NavLink>
            <NavLink to="/recommendations" className={navItemClass}>
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Recommendations</span>
            </NavLink>
            <NavLink to="/profile" className={navItemClass}>
              <User className="w-4 h-4 text-slate-500" />
              <span>My Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Admin Navigation Section */}
        {isAdmin && (
          <div>
            <span className="px-3 text-[11px] font-bold text-purple-600 uppercase tracking-wider block mb-2">
              Administration
            </span>
            <nav className="space-y-1">
              <NavLink to="/admin" className={navItemClass}>
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Admin Dashboard</span>
              </NavLink>
              <NavLink to="/admin/resources" className={navItemClass}>
                <FileCheck className="w-4 h-4 text-purple-600" />
                <span>Manage Resources</span>
              </NavLink>
              <NavLink to="/admin/users" className={navItemClass}>
                <Users className="w-4 h-4 text-purple-600" />
                <span>Manage Users</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="pt-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
