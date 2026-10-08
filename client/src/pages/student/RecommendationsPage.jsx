import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, GraduationCap, Cpu, Layers, ArrowRight, RefreshCw, FileText, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { resourceService } from '../../services/resourceService';
import RecommendationCard from '../../components/common/RecommendationCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [sourceResource, setSourceResource] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Step 1: Fetch list of candidate/approved resources for the student to select as reference
  useEffect(() => {
    const loadInitialCatalog = async () => {
      try {
        setLoading(true);
        const data = await resourceService.getResources({
          department: user?.department || undefined,
          limit: 20,
          sort: 'popular',
        });

        if (data.success && data.resources && data.resources.length > 0) {
          setAvailableResources(data.resources);
          // Default to first resource
          setSelectedResourceId(data.resources[0]._id);
          setSourceResource(data.resources[0]);
        } else {
          // If no department resources, fallback to general catalog
          const fallbackData = await resourceService.getResources({ limit: 20, sort: 'latest' });
          if (fallbackData.success && fallbackData.resources && fallbackData.resources.length > 0) {
            setAvailableResources(fallbackData.resources);
            setSelectedResourceId(fallbackData.resources[0]._id);
            setSourceResource(fallbackData.resources[0]);
          }
        }
      } catch (err) {
        console.warn('Error loading catalog for recommendations:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialCatalog();
  }, [user]);

  // Step 2: Fetch Content-Based Recommendations whenever selectedResourceId changes
  const fetchRecommendationsForResource = async (resourceId) => {
    if (!resourceId) return;
    try {
      setLoadingRecs(true);
      setAiError(null);

      const data = await resourceService.getRecommendations(resourceId, { topK: 6 });

      if (data.success) {
        setRecommendations(data.recommendations || []);
        if (data.sourceResource) {
          setSourceResource(data.sourceResource);
        }
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error('Error fetching content-based recommendations:', err.message);
      setAiError(
        err.message || 'Unable to fetch vector recommendations. Ensure the Python AI microservice is running.'
      );
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    if (selectedResourceId) {
      // Find matching object in availableResources for instant UI reflection
      const found = availableResources.find((r) => r._id === selectedResourceId);
      if (found) {
        setSourceResource(found);
      }
      fetchRecommendationsForResource(selectedResourceId);
    }
  }, [selectedResourceId]);

  const handleResourceChange = (e) => {
    const newId = e.target.value;
    setSelectedResourceId(newId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>AI Content-Based Recommendation Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Content-Based Study Material Recommendations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Discover academically aligned notes, question papers, and syllabi matched using dense ChromaDB vector embeddings.
        </p>
      </div>

      {/* Active Source Resource Selector & Visual Controller */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="sourceResourceSelect" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Select Base Academic Document to Match Against:
            </label>
            <p className="text-xs text-slate-500">
              The engine will analyze this document's vector representation to find semantically related resources.
            </p>
          </div>

          <div className="relative min-w-[280px] sm:min-w-[340px]">
            <select
              id="sourceResourceSelect"
              value={selectedResourceId}
              onChange={handleResourceChange}
              disabled={loading || availableResources.length === 0}
              className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition pr-10 cursor-pointer disabled:opacity-50"
            >
              {availableResources.map((res) => (
                <option key={res._id} value={res._id}>
                  [{res.subject || res.department}] {res.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Selected Source Document Details Card */}
        {sourceResource && (
          <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 uppercase tracking-wider">
                  Active Reference Document
                </span>
                <Badge type={sourceResource.resourceType}>{sourceResource.resourceType}</Badge>
                <span className="text-xs text-purple-800 font-semibold">
                  Sem {sourceResource.semester}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {sourceResource.title}
              </h3>
              <p className="text-xs text-slate-600">
                {sourceResource.subject} &bull; {sourceResource.department}
              </p>
            </div>

            <button
              onClick={() => fetchRecommendationsForResource(selectedResourceId)}
              disabled={loadingRecs}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 self-start md:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingRecs ? 'animate-spin' : ''}`} />
              <span>Refresh Similar Resources</span>
            </button>
          </div>
        )}
      </div>

      {/* AI Vector Architecture Card (College Viva / Presentation Demonstration) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white shadow-xl shadow-indigo-950/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md text-purple-300 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Content-Based Recommendation Engine Architecture
            </h3>
            <p className="text-xs text-purple-200">
              ChromaDB Vector Cosine Similarity & Multi-Chunk Document Aggregation
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Given the selected academic document, our Python AI microservice retrieves its stored 384-dimensional vector embeddings from <span className="text-purple-300 font-semibold">ChromaDB</span>, computes its normalized centroid vector, performs approximate nearest neighbor search across all indexed PDFs, groups matching chunks by document ID, and computes a weighted similarity score while strictly excluding the target resource.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">1. Vector Extraction</span>
            <span className="text-slate-400">Extracts 384-D centroid from stored ChromaDB chunks</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">2. Cosine Search</span>
            <span className="text-slate-400">Computes geometric vector distance across corpus</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">3. Chunk Grouping</span>
            <span className="text-slate-400">Aggregates multi-passage PDF matches & deduplicates</span>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="font-bold text-purple-300 block mb-1">4. Target Exclusion</span>
            <span className="text-slate-400">Guarantees different, academically aligned resources</span>
          </div>
        </div>
      </div>

      {/* Recommended Resource Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>Similar Academic Resources ({recommendations.length})</span>
          </h2>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
            ChromaDB Cosine Matched
          </span>
        </div>

        {/* Loading Spinner */}
        {loading || loadingRecs ? (
          <LoadingSpinner text="Computing vector similarities and aggregating document scores..." />
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec._id || rec.resourceId} recommendation={rec} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No similar indexed documents found"
            description="As more PDFs are uploaded, approved, and indexed in ChromaDB, semantically related study materials will automatically appear here."
            actionText="Browse General Catalog"
            actionLink="/browse"
          />
        )}
      </section>
    </div>
  );
};

export default RecommendationsPage;
