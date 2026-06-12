"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ShoppingBag, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Loader2 
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  channel: string;
  city: string | null;
  createdAt: string;
  totalSpend: number;
  orderCount: number;
  lastOrderAt: string | null;
}

interface Order {
  id: string;
  amount: number;
  items: string[];
  createdAt: string;
}

interface CustomerDetail extends Customer {
  orders: Order[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const limit = 10;

  // Fetch customers list
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (res.ok) {
          setCustomers(data.customers || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300); // Debounce search input

    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  // Fetch single customer detail
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/customers/${selectedCustomerId}`);
        const data = await res.json();
        if (res.ok) {
          setCustomerDetail(data);
        }
      } catch (err) {
        console.error("Error fetching customer details:", err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedCustomerId]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getChannelBadge = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'whatsapp':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">WhatsApp</span>;
      case 'sms':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-950/60 text-blue-400 border border-blue-800">SMS</span>;
      case 'email':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-400 border border-purple-800">Email</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">{channel}</span>;
    }
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Shoppers Directory</h1>
          <p className="text-slate-400 mt-1">Manage and view detailed profiles and order histories for your customers.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Search & Actions */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
            />
          </div>
          <div className="ml-auto text-xs text-slate-400">
            Showing {customers.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} customers
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Preferred Channel</th>
                <th className="px-6 py-4 text-right">Orders</th>
                <th className="px-6 py-4 text-right">Total Spend</th>
                <th className="px-6 py-4 text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      <div>{c.name}</div>
                      <div className="text-xs text-slate-500 font-normal">{c.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{c.city || '—'}</td>
                    <td className="px-6 py-4">{getChannelBadge(c.channel)}</td>
                    <td className="px-6 py-4 text-right font-mono">{c.orderCount}</td>
                    <td className="px-6 py-4 text-right font-semibold text-indigo-400 font-mono">
                      ₹{c.totalSpend.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-400">
                      {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Side Slide-Over Panel for Customer Details */}
      {selectedCustomerId && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedCustomerId(null)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300">
            {/* Panel Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <h2 className="text-xl font-bold text-white">Shopper Profile</h2>
                <p className="text-xs text-slate-500 mt-1">Details and full purchase timeline</p>
              </div>
              <button 
                onClick={() => setSelectedCustomerId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail || !customerDetail ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span>Loading shopper details...</span>
                </div>
              ) : (
                <>
                  {/* Basic Info */}
                  <div className="space-y-4 bg-slate-950/40 border border-slate-800/80 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">{customerDetail.name}</h3>
                      {getChannelBadge(customerDetail.channel)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 font-medium pt-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="truncate">{customerDetail.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span>{customerDetail.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span>Located in {customerDetail.city || 'Unknown Location'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/20 border border-slate-800 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-indigo-400 font-mono">
                        ₹{customerDetail.totalSpend.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Total Spend</div>
                    </div>
                    <div className="bg-slate-950/20 border border-slate-800 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-white font-mono">
                        {customerDetail.orderCount}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">Total Orders</div>
                    </div>
                  </div>

                  {/* Orders Timeline */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Order History</h4>
                    
                    {customerDetail.orders.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No orders found.</p>
                    ) : (
                      <div className="relative border-l-2 border-slate-800 pl-5 ml-2.5 space-y-6">
                        {customerDetail.orders.map((order) => (
                          <div key={order.id} className="relative">
                            {/* Dot icon */}
                            <span className="absolute -left-[27px] top-1.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-indigo-500" />
                            
                            <div className="bg-slate-950/30 border border-slate-800/60 hover:border-slate-800 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-sm font-bold text-indigo-400 font-mono">
                                  ₹{order.amount.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <ShoppingBag className="h-3.5 w-3.5 text-slate-500 mr-0.5" />
                                {order.items.map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xxs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
