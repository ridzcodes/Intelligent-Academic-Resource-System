import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  UploadCloud,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderArchive,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { resourceService } from '../../services/resourceService';
import ResourceCard from '../../components/common/ResourceCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [departmentResources, setDepartmentResources] = useState([]);
  const [myUploadsCount, setMyUploadsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch resources matching user's department
        const deptPromise = resourceService.getResources({
          department: user?.department || 'All',
          limit: 6,
          sort: 'latest',
        });

        // 2. Fetch count of student's own uploads
        const myPromise = resourceService.getMyResources();

        const [deptData, myData] = await Promise.all([deptPromise, myPromise]);

        if (deptData.success) {
          setDepartmentResources(deptData.resources || []);
        }
        if (myData.success) {
          setMyUploadsCount(myData.count || 0);
        }
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 text-white shadow-lg shadow-brand-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{user?.department} • Year {user?.year || 1}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Welcome, {user?.name}!
          </h1>
          <p className="text-brand-100 text-xs sm:text-sm max-w-xl">
            Access curated lecture notes, question papers, and assignments for your semester. Share your own study materials to help your batch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <UploadCloud className="w-4 h-4" />
            Upload PDF
          </Link>
          <Link
            to="/browse"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs sm:text-sm font-semibold transition"
          >
            <Search className="w-4 h-4" />
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">My Uploads</p>
            <p className="text-2xl font-black text-slate-900">{myUploadsCount}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Department Resources</p>
            <p className="text-2xl font-black text-slate-900">{departmentResources.length}+</p>
          </div>
        </div>

        <Link
          to="/recommendations"
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Study Recommendations</p>
            <p className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-1">
              <span>View tailored items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/browse?type=Notes"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition text-center"
        >
          <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-800">Lecture Notes</span>
        </Link>
        <Link
          to="/browse?type=Question+Paper"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition text-center"
        >
          <Layers className="w-5 h-5 text-purple-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-800">Question Papers</span>
        </Link>
        <Link
          to="/browse?type=Textbook"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition text-center"
        >
          <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-800">Textbooks</span>
        </Link>
        <Link
          to="/search"
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-brand-300 hover:bg-slate-50 transition text-center"
        >
          <Search className="w-5 h-5 text-amber-600 mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-800">Custom Search</span>
        </Link>
      </div>

      {/* Department Resources Stream */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Latest for {user?.department || 'Your Department'}
            </h2>
            <p className="text-xs text-slate-500">Recently approved peer study materials</p>
          </div>
          <Link
            to={`/browse?department=${encodeURIComponent(user?.department || 'All')}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading your dashboard feed..." />
        ) : departmentResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentResources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 text-sm font-medium">
              No resources uploaded for {user?.department} yet.
            </p>
            <Link
              to="/upload"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
            >
              <UploadCloud className="w-4 h-4" />
              Upload the First PDF
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
