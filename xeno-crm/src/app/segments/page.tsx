"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Users, 
  Calendar, 
  MessageSquare, 
  Layers,
  Sparkles, 
  ArrowRight,
  Loader2 
} from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  description: string | null;
  filterQuery: any;
  nlQuery: string | null;
  createdAt: string;
  customerCount: number;
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await fetch('/api/segments');
        const data = await res.json();
        if (res.ok) {
          setSegments(data);
        }
      } catch (err) {
        console.error("Error fetching segments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="h-8 w-8 text-indigo-500" />
            Audience Segments
          </h1>
          <p className="text-slate-400 mt-1">
            Create, view, and manage target audiences for your marketing campaigns.
          </p>
        </div>
        <div>
          <Link
            href="/segments/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            New Segment
          </Link>
        </div>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span>Loading segments...</span>
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto space-y-6 mt-8">
          <div className="mx-auto w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800">
            <Layers className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">No segments created yet</h3>
            <p className="text-sm text-slate-400">
              Build your first customer segment using natural language AI to target high spenders, inactive users, or specific regions.
            </p>
          </div>
          <div>
            <Link
              href="/segments/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
            >
              <Sparkles className="h-4 w-4" /> Build with AI
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <div 
              key={segment.id} 
              className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-6 flex flex-col justify-between shadow-xl transition-all duration-200"
            >
              <div className="space-y-4">
                {/* Title and Count */}
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">
                    {segment.name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-400 border border-indigo-900/60 font-mono">
                    <Users className="h-3.5 w-3.5" />
                    {segment.customerCount}
                  </span>
                </div>

                {/* Description */}
                {segment.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {segment.description}
                  </p>
                )}

                {/* AI Prompt Badge */}
                {segment.nlQuery && (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-indigo-500" />
                      AI Generated Query
                    </div>
                    <p className="text-xs text-slate-300 italic font-medium line-clamp-2">
                      &ldquo;{segment.nlQuery}&rdquo;
                    </p>
                  </div>
                )}

                {/* Filter Chips Preview */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(segment.filterQuery || {}).map(([key, val]) => {
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
                      <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-medium bg-slate-950 text-slate-400 border border-slate-800">
                        {displayLabel}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(segment.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <Link
                  href={`/campaigns/new?segmentId=${segment.id}`}
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition"
                >
                  Create Campaign <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
