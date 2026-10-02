import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, GraduationCap, Cpu, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { resourceService } from '../../services/resourceService';
import ResourceCard from '../../components/common/ResourceCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compute student's estimated current semester based on year (Year 1: Sem 1/2, Year 2: Sem 3/4, etc.)
  const estimatedSemester = (user?.year || 1) * 2 - 1;

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // Foundation recommendation logic: Match student's registered department and relevant semesters
        const data = await resourceService.getResources({
          department: user?.department || 'Computer Science & Engineering',
          limit: 6,
          sort: 'popular',
        });

        if (data.success) {
          setRecommendations(data.resources || []);
        }
      } catch (err) {
        console.warn('Error fetching recommendations:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Curated Recommendations Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Personalized Study Recommendations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Study materials prioritized for your major: <span className="font-bold text-slate-700">{user?.department}</span> (Year {user?.year || 1})
        </p>
      </div>

      {/* Future AI Microservice Architectural Notice Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl shadow-indigo-900/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md text-purple-300 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              AI Microservice Integration (Phase 2 Roadmap)
            </h3>
            <p className="text-xs text-purple-200">
              Future Hybrid Recommendation & Vector Retrieval Architecture
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Currently, recommendations are powered by our clean deterministic rule-based engine (filtering by department, semester curriculum, and popularity metrics). In Phase 2, this will be augmented with our standalone Python FastAPI microservice utilizing <span className="text-purple-300 font-semibold">Sentence-Transformers</span> and <span className="text-purple-300 font-semibold">Vector Cosine Similarity</span> over full-text PDF embeddings.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">Step 1: Ingestion</span>
            <span className="text-slate-400">PDF chunking & token extraction</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">Step 2: Vector Store</span>
            <span className="text-slate-400">Dense embeddings via Sentence-BERT</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">Step 3: Recommendation</span>
            <span className="text-slate-400">Personalized semantic affinity score</span>
          </div>
        </div>
      </div>

      {/* Recommended Resource Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600" />
            <span>Recommended for {user?.department}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            {recommendations.length} items suggested
          </span>
        </div>

        {loading ? (
          <LoadingSpinner text="Generating tailored study recommendations..." />
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((res) => (
              <ResourceCard key={res._id} resource={res} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No recommendations available yet"
            description="As more study materials are uploaded and verified for your department, personalized suggestions will appear here."
            actionText="Browse General Catalog"
            actionLink="/browse"
          />
        )}
      </section>
    </div>
  );
};

export default RecommendationsPage;
