"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Megaphone, 
  TrendingUp, 
  UserCheck 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Segments', href: '/segments', icon: Layers },
    { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  ];

  return (
    <div className="flex h-full min-h-screen w-64 flex-col bg-slate-900 text-white border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <UserCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wider text-white bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              VELARA
            </span>
            <span className="block text-xxs text-slate-400 font-semibold tracking-widest uppercase">
              Mini CRM
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/40 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-300">CRM Engine Active</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">v1.0.0 • Production DB</p>
        </div>
      </div>
    </div>
  );
}
