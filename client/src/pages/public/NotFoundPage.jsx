import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mb-6 shadow-md shadow-brand-500/10">
        <Compass className="w-10 h-10 animate-spin-slow" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mb-2">Page Not Found</h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-8">
        The academic resource or page you are looking for might have been moved, deleted, or does not exist.
      </p>
      <div className="flex gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Catalog
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
