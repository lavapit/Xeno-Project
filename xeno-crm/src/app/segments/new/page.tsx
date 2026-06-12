"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowLeft, 
  Users, 
  Check, 
  AlertCircle,
  Loader2,
  ListFilter,
  Save
} from 'lucide-react';
import Link from 'next/link';

interface PreviewCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  channel: string;
  totalSpend: number;
  orderCount: number;
}

export default function NewSegmentPage() {
  const router = useRouter();
  
  // Natural Language state
  const [nlQuery, setNlQuery] = useState('');
  const [parsingAI, setParsingAI] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  
  // Segment details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterQuery, setFilterQuery] = useState<any>(null);
  
  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewSample, setPreviewSample] = useState<PreviewCustomer[]>([]);
  
  // Page state
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Trigger Gemini to parse Natural Language
  const handleAIGenerate = async () => {
    if (!nlQuery.trim()) return;
    
    setParsingAI(true);
    setError('');
    setFilterQuery(null);
    setPreviewCount(null);
    setPreviewSample([]);
    setAiExplanation('');

    try {
      const res = await fetch('/api/ai/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlQuery })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to parse query');
      
      setFilterQuery(data.filterQuery);
      setAiExplanation(data.explanation);
      
      // Auto-populate segment name with a suggestion if empty
      if (!name) {
        // Simple default name from prompt
        const suggestedName = nlQuery.length > 30 ? nlQuery.substring(0, 30) + '...' : nlQuery;
        setName(suggestedName);
      }

      // Fetch preview
      fetchPreview(data.filterQuery);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while calling the AI agent.');
    } finally {
      setParsingAI(false);
    }
  };

  // Fetch count & sample
  const fetchPreview = async (query: any) => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filterQuery: query })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load preview');
      
      setPreviewCount(data.count);
      setPreviewSample(data.sample || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Save segment to DB
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !filterQuery) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          nlQuery,
          filterQuery
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save segment');
      }

      router.push('/segments');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save segment.');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back to list */}
      <div>
        <Link 
          href="/segments" 
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Segments
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-indigo-500" />
          Build Segment with AI
        </h1>
        <p className="text-slate-400 mt-1">
          Describe the audience you want to target, and our AI will translate it into a precise database filter.
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex gap-3 items-start text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input & Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Generator Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              1. Describe Your Audience
            </h2>
            <div className="space-y-2">
              <textarea
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="e.g., customers in Delhi who spent over 3000 rupees and have placed at least 3 orders"
                rows={3}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              />
              <p className="text-xs text-slate-500">
                You can filter by: location, preferred channel, minimum/maximum total spend, number of orders, or days since last active.
              </p>
            </div>
            
            <button
              onClick={handleAIGenerate}
              disabled={parsingAI || !nlQuery.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-150"
            >
              {parsingAI ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Filter Rules...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Filter Rules
                </>
              )}
            </button>
          </div>

          {/* Segment Name & Save Form (Only visible once filter is generated) */}
          {filterQuery && (
            <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Save className="h-5 w-5 text-indigo-400" />
                3. Save Segment
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                    Segment Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter segment name"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the target audience..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all duration-150"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Segment...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save & Finish
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <ListFilter className="h-5 w-5 text-indigo-400" />
                2. Filter & Preview
              </h2>

              {!filterQuery && !parsingAI && (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg text-slate-500 p-4 text-center">
                  <Users className="h-8 w-8 text-slate-600 mb-2" />
                  <p className="text-sm">Describe your segment and generate rules on the left to see matching shoppers.</p>
                </div>
              )}

              {parsingAI && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="text-sm">Analyzing intent and querying database...</span>
                </div>
              )}

              {filterQuery && (
                <div className="space-y-6">
                  {/* AI Explanation */}
                  {aiExplanation && (
                    <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-lg p-3 text-xs text-indigo-300">
                      <strong>AI Explanation: </strong>
                      {aiExplanation}
                    </div>
                  )}

                  {/* Filter rules as badges */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Filters Applied</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(filterQuery).map(([key, val]) => {
                        if (val === null || val === undefined || val === '') return null;
                        let displayLabel = `${key}: ${val}`;
                        if (key === 'minSpend') displayLabel = `Min Spend: ₹${Number(val).toLocaleString('en-IN')}`;
                        if (key === 'maxSpend') displayLabel = `Max Spend: ₹${Number(val).toLocaleString('en-IN')}`;
                        if (key === 'inactiveDays') displayLabel = `Inactive: ${val}+ days`;
                        if (key === 'activeDays') displayLabel = `Active within: ${val} days`;
                        if (key === 'minOrders') displayLabel = `Min Orders: ${val}`;
                        if (key === 'city') displayLabel = `City: ${val}`;
                        if (key === 'channel') displayLabel = `Channel: ${val}`;
                        
                        return (
                          <span key={key} className="inline-flex items-center px-2.5 py-1 rounded bg-slate-950 text-xs font-semibold text-slate-300 border border-slate-800">
                            {displayLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matching Shoppers Summary */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Matching Shoppers</h3>
                    {previewLoading ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        Fetching match count...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1.5">
                          {previewCount}
                          <span className="text-sm font-medium text-slate-400 font-sans">shoppers found</span>
                        </div>

                        {previewSample.length > 0 && (
                          <div className="border border-slate-800 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
                                <tr>
                                  <th className="p-2.5">Name</th>
                                  <th className="p-2.5">City</th>
                                  <th className="p-2.5 text-right">Spend</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 bg-slate-950/30 text-slate-300">
                                {previewSample.map((c) => (
                                  <tr key={c.id}>
                                    <td className="p-2.5 font-medium text-white truncate max-w-[120px]">{c.name}</td>
                                    <td className="p-2.5 text-slate-400">{c.city || '—'}</td>
                                    <td className="p-2.5 text-right font-mono text-indigo-400">₹{c.totalSpend.toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {previewCount && previewCount > 5 && (
                              <div className="p-2 bg-slate-950 text-[10px] text-center text-slate-500 border-t border-slate-800">
                                + {previewCount - 5} more shoppers
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
