"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Layers, 
  Megaphone, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  MessageSquare, 
  Mail, 
  Phone,
  Sparkles,
  Loader2
} from 'lucide-react';

interface RecentCampaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  createdAt: string;
  segmentName: string;
  total: number;
  delivered: number;
  opened: number;
}

interface DashboardData {
  totalCustomers: number;
  activeSegments: number;
  campaignsSent: number;
  averageOpenRate: number;
  recentCampaigns: RecentCampaign[];
  statusCounts: Record<string, number>;
}

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span>Loading dashboard analytics...</span>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-medium bg-slate-800 text-slate-400 border border-slate-700">Draft</span>;
      case 'sending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-medium bg-amber-950/60 text-amber-400 border border-amber-800 animate-pulse">Sending</span>;
      case 'sent':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">Sent</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xxs font-medium bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-emerald-400" />;
      case 'sms':
        return <Phone className="h-4 w-4 text-blue-400" />;
      case 'email':
        return <Mail className="h-4 w-4 text-purple-400" />;
      default:
        return <Megaphone className="h-4 w-4 text-slate-400" />;
    }
  };

  // Find max value in status counts to scale the bar chart
  const maxCount = Math.max(...Object.values(data.statusCounts), 1);

  // Status color codes for bar chart
  const statusColors: Record<string, string> = {
    pending: 'from-amber-600 to-yellow-500',
    sent: 'from-slate-600 to-slate-500',
    delivered: 'from-blue-600 to-cyan-500',
    opened: 'from-cyan-600 to-teal-500',
    read: 'from-purple-600 to-pink-500',
    clicked: 'from-emerald-600 to-green-500',
    failed: 'from-rose-600 to-red-500',
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome to Velara CRM
          </h1>
          <p className="text-slate-400 mt-1">
            Analyze customer behavior, build smart segments, and launch automated campaigns.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/segments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Build Segment
          </Link>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Customers */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition duration-200 group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Shoppers</span>
            <div className="p-2 rounded-lg bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-mono text-white">{data.totalCustomers}</span>
            <span className="block text-xs text-slate-500 mt-1">Registered accounts</span>
          </div>
        </div>

        {/* Active Segments */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition duration-200 group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Saved Segments</span>
            <div className="p-2 rounded-lg bg-purple-950/40 text-purple-400 border border-purple-900/40 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-mono text-white">{data.activeSegments}</span>
            <span className="block text-xs text-slate-500 mt-1">Targeted subdivisions</span>
          </div>
        </div>

        {/* Campaigns Sent */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition duration-200 group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Active Campaigns</span>
            <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-900/40 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300">
              <Megaphone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-mono text-white">{data.campaignsSent}</span>
            <span className="block text-xs text-slate-500 mt-1">Broadcasts dispatched</span>
          </div>
        </div>

        {/* Avg Open Rate */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 shadow-xl hover:border-slate-700/80 transition duration-200 group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Avg Open Rate</span>
            <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-mono text-white">{data.averageOpenRate}%</span>
            <span className="block text-xs text-slate-500 mt-1">Total open engagements</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Campaigns Table */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
              <h2 className="text-base font-bold text-white">Recent Campaigns</h2>
              <Link href="/campaigns" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition">
                All campaigns <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
            {data.recentCampaigns.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No campaigns created yet. Build a segment and launch a campaign to populate this dashboard.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xxs font-semibold uppercase tracking-wider bg-slate-950/40">
                      <th className="px-5 py-3">Campaign</th>
                      <th className="px-5 py-3">Segment</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Delivered/Open Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 text-xs font-medium">
                    {data.recentCampaigns.map((camp) => {
                      const deliveryRate = camp.total > 0 ? Math.round((camp.delivered / camp.total) * 100) : 0;
                      const openRate = camp.delivered > 0 ? Math.round((camp.opened / camp.delivered) * 100) : 0;
                      return (
                        <tr 
                          key={camp.id} 
                          className="hover:bg-slate-800/30 cursor-pointer transition"
                          onClick={() => router.push(`/campaigns/${camp.id}`)}
                        >
                          <td className="px-5 py-3.5 flex items-center gap-2">
                            {getChannelIcon(camp.channel)}
                            <span className="font-bold text-white text-sm truncate max-w-[150px]">{camp.name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 truncate max-w-[120px]">{camp.segmentName}</td>
                          <td className="px-5 py-3.5">{getStatusBadge(camp.status)}</td>
                          <td className="px-5 py-3.5 text-right font-mono">
                            {camp.status !== 'draft' ? (
                              <div>
                                <span className="text-emerald-400">{deliveryRate}% Del</span>
                                <span className="text-slate-500 mx-1">•</span>
                                <span className="text-indigo-400">{openRate}% Open</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">Not sent</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Messaging Distribution Bar Chart */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">Aggregate Message Funnel</h2>
            
            {/* Custom Bar Chart using Tailwind/SVG */}
            <div className="space-y-4">
              {Object.entries(data.statusCounts).map(([status, count]) => {
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const colorClass = statusColors[status] || 'from-slate-700 to-slate-600';
                
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="capitalize font-semibold text-slate-300">{status}</span>
                      <span className="font-mono text-slate-400 font-bold">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                      <div 
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 mt-6 pt-3 border-t border-slate-800/60 font-mono text-center">
            Total historical messaging data across all campaigns.
          </div>
        </div>
      </div>
    </div>
  );
}
