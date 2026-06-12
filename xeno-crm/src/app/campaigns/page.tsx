"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Megaphone, 
  Layers, 
  Calendar, 
  Send, 
  CheckCircle, 
  Play, 
  Loader2 
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  message: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  segment: {
    name: string;
    nlQuery: string | null;
  };
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/campaigns');
        const data = await res.json();
        if (res.ok) {
          setCampaigns(data);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">Draft</span>;
      case 'sending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 text-amber-400 border border-amber-800 animate-pulse">Sending</span>;
      case 'sent':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">Sent</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60">WhatsApp</span>;
      case 'sms':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-950/40 text-blue-400 border border-blue-900/60">SMS</span>;
      case 'email':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-950/40 text-purple-400 border border-purple-900/60">Email</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300">{channel}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-indigo-500" />
            Campaigns
          </h1>
          <p className="text-slate-400 mt-1">
            Broadcast personalized messages to your customer segments and monitor conversion funnels.
          </p>
        </div>
        <div>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      {/* Campaigns list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <span>Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center max-w-xl mx-auto space-y-6 mt-8">
          <div className="mx-auto w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-slate-800">
            <Megaphone className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">No campaigns created yet</h3>
            <p className="text-sm text-slate-400">
              Create your first campaign, select a target segment, draft personal messaging with AI, and send it out to test the real-time simulation.
            </p>
          </div>
          <div>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
            >
              <Plus className="h-4 w-4" /> Create Campaign
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((campaign) => {
            // Calculate rates
            const total = campaign.stats.total;
            const sent = campaign.stats.sent + campaign.stats.delivered + campaign.stats.opened + campaign.stats.read + campaign.stats.clicked;
            const success = campaign.stats.delivered + campaign.stats.opened + campaign.stats.read + campaign.stats.clicked;
            const openCount = campaign.stats.opened + campaign.stats.read + campaign.stats.clicked;
            const clickCount = campaign.stats.clicked;

            const deliveryRate = total > 0 ? Math.round((success / total) * 100) : 0;
            const openRate = success > 0 ? Math.round((openCount / success) * 100) : 0;
            const clickRate = openCount > 0 ? Math.round((clickCount / openCount) * 100) : 0;

            return (
              <div 
                key={campaign.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition duration-150"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold text-lg text-white truncate max-w-md">
                      {campaign.name}
                    </h3>
                    {getStatusBadge(campaign.status)}
                    {getChannelBadge(campaign.channel)}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-slate-500" />
                      Segment: <strong className="text-slate-300 font-semibold">{campaign.segment.name}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Created: {new Date(campaign.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 italic font-mono">
                    Message: &ldquo;{campaign.message}&rdquo;
                  </p>
                </div>

                {/* Campaign Stats */}
                {campaign.status !== 'draft' ? (
                  <div className="grid grid-cols-3 gap-6 text-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8 min-w-[250px]">
                    <div>
                      <div className="text-base font-bold text-white font-mono">{total}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Recipients</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-emerald-400 font-mono">{deliveryRate}%</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Delivered</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-indigo-400 font-mono">{openRate}%</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Open Rate</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end min-w-[250px]">
                    <span className="text-xs text-slate-500 italic mr-4">Draft mode</span>
                  </div>
                )}

                {/* Actions Button */}
                <div className="flex items-center justify-end gap-2 border-t md:border-t-0 border-slate-800/60 pt-4 md:pt-0">
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="w-full md:w-auto text-center px-4 py-2 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
