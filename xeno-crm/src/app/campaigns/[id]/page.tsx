"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  RefreshCw, 
  Sparkles, 
  Send, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MousePointer, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  customerId: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  channel: string;
  status: string;
  sentAt: string | null;
  updatedAt: string;
}

interface CampaignDetail {
  id: string;
  name: string;
  message: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  segment: {
    name: string;
  };
  messages: Message[];
  stats: {
    total: number;
    sent: number;
    delivered: number;
    opened: number;
    read: number;
    clicked: number;
    failed: number;
    pending: number;
  };
}

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedId, setResolvedId] = useState<string>('');

  // Resolve params for Next.js 15+ compatibility
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      setResolvedId(resolved.id);
    });
  }, [params]);

  const fetchCampaignDetails = async (showLoading = false) => {
    if (!resolvedId) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${resolvedId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (err) {
      console.error("Error fetching campaign:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Poll details every 5 seconds if campaign is active
  useEffect(() => {
    if (!resolvedId) return;
    fetchCampaignDetails(true);

    const interval = setInterval(() => {
      setCampaign((currentCampaign) => {
        if (currentCampaign && (currentCampaign.status === 'sending' || currentCampaign.messages.some(m => m.status === 'pending' || m.status === 'sent'))) {
          fetchCampaignDetails(false);
        }
        return currentCampaign;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [resolvedId]);

  // Load AI Insights once campaign has messages
  useEffect(() => {
    if (!campaign || campaign.status === 'draft' || campaign.messages.length === 0 || aiInsight || loadingInsight) return;

    const fetchAIInsights = async () => {
      setLoadingInsight(true);
      try {
        const res = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id })
        });
        if (res.ok) {
          const data = await res.json();
          setAiInsight(data.summary || '');
        }
      } catch (err) {
        console.error("Error generating insights:", err);
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchAIInsights();
  }, [campaign, aiInsight, loadingInsight]);

  if (loading || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span>Loading campaign details...</span>
      </div>
    );
  }

  // Calculate rates
  const stats = campaign.stats;
  const total = stats.total;
  const sent = stats.sent;
  const delivered = stats.delivered + stats.opened + stats.read + stats.clicked;
  const opened = stats.opened + stats.read + stats.clicked;
  const clicked = stats.clicked;
  const failed = stats.failed;
  const pending = stats.pending;

  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0.0';
  const clickRate = opened > 0 ? ((clicked / opened) * 100).toFixed(1) : '0.0';
  const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0';

  // Filtered messages
  const filteredMessages = campaign.messages.filter(msg => {
    const matchesStatus = statusFilter === 'all' || msg.status.toLowerCase() === statusFilter.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      msg.customer.name.toLowerCase().includes(searchLower) ||
      msg.customer.email.toLowerCase().includes(searchLower) ||
      (msg.customer.phone && msg.customer.phone.includes(searchLower));
    return matchesStatus && matchesSearch;
  });

  // Color mappings
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-950/60 text-yellow-400 border-yellow-900',
    sent: 'bg-slate-800 text-slate-300 border-slate-700',
    delivered: 'bg-blue-950/60 text-blue-400 border-blue-900',
    opened: 'bg-cyan-950/60 text-cyan-400 border-cyan-900',
    read: 'bg-purple-950/60 text-purple-400 border-purple-900',
    clicked: 'bg-emerald-950/60 text-emerald-400 border-emerald-900',
    failed: 'bg-rose-950/60 text-rose-400 border-rose-900',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/campaigns" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to Campaigns
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">{campaign.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              campaign.status === 'sending' ? 'bg-amber-950/60 text-amber-400 border-amber-800 animate-pulse' :
              campaign.status === 'sent' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900' :
              'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Segment: <span className="text-indigo-400 font-semibold">{campaign.segment.name}</span> • Channel: <span className="capitalize">{campaign.channel}</span>
          </p>
        </div>

        <button
          onClick={() => fetchCampaignDetails(true)}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-800 hover:border-slate-700 rounded-lg text-sm text-slate-300 hover:text-white transition bg-slate-900/50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh Data
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">{total}</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Total Target</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">{deliveryRate}%</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Delivery Rate</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-900/60 text-cyan-400">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">{openRate}%</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Open Rate</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/60 text-indigo-400">
            <MousePointer className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">{clickRate}%</div>
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-0.5">Click-Through</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Donut Chart */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Delivery Funnel</h2>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* SVG Donut */}
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="3.5" />
                {/* Clicked segment (green) */}
                {total > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.5" 
                    strokeDasharray={`${(clicked / total) * 100} ${100 - (clicked / total) * 100}`} 
                    strokeDashoffset="0"
                  />
                )}
                {/* Opened/Read segment (cyan) */}
                {total > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="3.5" 
                    strokeDasharray={`${((opened - clicked) / total) * 100} ${100 - ((opened - clicked) / total) * 100}`} 
                    strokeDashoffset={`-${(clicked / total) * 100}`}
                  />
                )}
                {/* Delivered but unopened segment (blue) */}
                {total > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3.5" 
                    strokeDasharray={`${((delivered - opened) / total) * 100} ${100 - ((delivered - opened) / total) * 100}`} 
                    strokeDashoffset={`-${(opened / total) * 100}`}
                  />
                )}
                {/* Failed segment (red) */}
                {total > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="3.5" 
                    strokeDasharray={`${(failed / total) * 100} ${100 - (failed / total) * 100}`} 
                    strokeDashoffset={`-${(delivered / total) * 100}`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-white font-mono">{total}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total</span>
              </div>
            </div>

            {/* Legends */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span className="text-slate-400">Clicked ({clicked})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                <span className="text-slate-400">Opened ({opened - clicked})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                <span className="text-slate-400">Delivered ({delivered - opened})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span className="text-slate-400">Failed ({failed})</span>
              </div>
              {pending > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-slate-700 inline-block" />
                  <span className="text-slate-400">Queue ({pending})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-32 h-32 text-indigo-500" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              AI Campaign Insights
            </h2>

            {loadingInsight ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                <span className="text-xs">Generating campaign insights...</span>
              </div>
            ) : aiInsight ? (
              <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl">
                {aiInsight}
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">
                AI insights will generate automatically once the campaign starts sending.
              </p>
            )}
          </div>

          <div className="text-xxs text-slate-500 pt-4 border-t border-slate-800/50 mt-4">
            Insights generated in real-time by Gemini based on recipient response analytics.
          </div>
        </div>
      </div>

      {/* Message Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            Recipient Dispatch Log
          </h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search recipient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition"
              />
            </div>
            
            {/* Filter by status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 transition"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="read">Read</option>
              <option value="clicked">Clicked</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xxs font-semibold uppercase tracking-wider">
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Destination</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-xs font-mono">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-sans italic">
                    No matching message logs.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-800/20">
                    <td className="px-6 py-3 font-medium text-white font-sans">
                      {msg.customer.name}
                    </td>
                    <td className="px-6 py-3 text-slate-400">
                      {campaign.channel === 'email' ? msg.customer.email : (msg.customer.phone || '—')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-semibold uppercase border ${statusColors[msg.status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-400">
                      {new Date(msg.updatedAt).toLocaleTimeString('en-IN', {
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
