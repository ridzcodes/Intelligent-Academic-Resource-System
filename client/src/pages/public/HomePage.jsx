import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  UploadCloud,
  FileText,
  Compass,
  CheckCircle2,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Download,
  Filter,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import SearchBar from '../../components/common/SearchBar';
import ResourceCard from '../../components/common/ResourceCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resourceService } from '../../services/resourceService';
import { RESOURCE_TYPES } from '../../utils/constants';

const HomePage = () => {
  const [featuredResources, setFeaturedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await resourceService.getResources({ limit: 6, sort: 'popular' });
        if (data.success) {
          setFeaturedResources(data.resources || []);
        }
      } catch (err) {
        console.warn('Could not load featured resources:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const handleHeroSearch = (query) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const categoryIcons = {
    Notes: <FileText className="w-6 h-6 text-blue-600" />,
    Textbook: <BookOpen className="w-6 h-6 text-emerald-600" />,
    'Question Paper': <Layers className="w-6 h-6 text-purple-600" />,
    Assignment: <CheckCircle2 className="w-6 h-6 text-amber-600" />,
    'Lab Manual': <Compass className="w-6 h-6 text-rose-600" />,
    Presentation: <Sparkles className="w-6 h-6 text-indigo-600" />,
    'Reference Material': <BookOpen className="w-6 h-6 text-teal-600" />,
    Other: <FileText className="w-6 h-6 text-slate-600" />,
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs font-semibold mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>College Academic Resource Repository</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight mb-6">
              Intelligent Academic Resource <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-sky-600 to-indigo-600">
                Retrieval & Recommendation
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed">
              Find the right academic resource quickly. Discover verified lecture notes, previous question papers, textbooks, lab manuals, and assignments shared by college peers.
            </p>

            {/* Large Search Box */}
            <div className="max-w-2xl mx-auto mb-8 shadow-xl shadow-brand-500/5 rounded-2xl">
              <SearchBar
                size="lg"
                placeholder="Search by subject, notes, textbook, question paper (e.g., Operating Systems)..."
                onSearch={handleHeroSearch}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/browse"
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
              >
                <Compass className="w-4 h-4" />
                <span>Browse All Resources</span>
              </Link>
              <Link
                to="/upload"
                className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-sm transition-all hover:scale-[1.02]"
              >
                <UploadCloud className="w-4 h-4 text-brand-600" />
                <span>Upload Resource</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
              Curated Categories
            </h2>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Explore Academic Study Materials
            </h3>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-2 md:mt-0"
          >
            <span>View all categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {RESOURCE_TYPES.map((type) => (
            <Link
              key={type}
              to={`/browse?type=${encodeURIComponent(type)}`}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {categoryIcons[type] || <FileText className="w-6 h-6 text-brand-600" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors text-sm sm:text-base">
                  {type}
                </h4>
                <p className="text-xs text-slate-500 mt-1">Verified PDF documents</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured / Popular Resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
              Trending Materials
            </h2>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Popular Study Resources
            </h3>
          </div>
          <Link
            to="/browse?sort=popular"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 mt-2 md:mt-0"
          >
            <span>See more popular resources</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching top resources..." />
        ) : featuredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredResources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-white border border-slate-200 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 text-sm font-medium">
              No approved resources yet. Be the first student to upload!
            </p>
            <Link
              to="/upload"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
            >
              Upload Material
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">
              Core Platform Capabilities
            </h2>
            <h3 className="text-3xl font-extrabold">
              Designed for Seamless College Study
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center mb-4 font-bold">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Fast Keyword Retrieval</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quickly locate lecture slides, notes, and previous question papers by subject code, department, semester, and topic keywords.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">Admin Quality Moderation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All uploaded materials undergo administrative review before publication, ensuring high academic quality and accuracy.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4 font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2">AI-Ready Architecture</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Engineered from the ground up for future AI microservice integration: vector embeddings, semantic search, and personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">
            Simple 3-Step Workflow
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How The System Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mx-auto mb-4">
              1
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-2">
              Sign Up & Select Department
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create your student profile with your engineering department and current academic year.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mx-auto mb-4">
              2
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-2">
              Search or Upload PDFs
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Search by semester or subject, or contribute study notes and question papers to assist peers.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center mx-auto mb-4">
              3
            </div>
            <h4 className="font-bold text-slate-800 text-base mb-2">
              Read, Download & Learn
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Directly download verified PDFs or preview study materials to ace your exams.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
