import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ShieldCheck, FileText, Shield } from 'lucide-react';

const navItems = [
  { label: 'Risk Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Obligations', icon: BookOpen, to: '/obligations' },
  { label: 'Controls', icon: ShieldCheck, to: '/controls' },
  { label: 'Filings', icon: FileText, to: '/filings' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-purple-dim flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-text-primary font-semibold text-sm tracking-tight">RegVault</span>
          <div className="text-text-muted text-xs">Compliance Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${
                isActive
                  ? 'bg-purple-subtle text-purple-light border-l-2 border-purple-primary pl-[10px]'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-purple-dim flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">PR</span>
          </div>
          <div className="min-w-0">
            <div className="text-text-primary text-xs font-medium truncate">Padma Rallapalli</div>
            <div className="text-text-muted text-xs truncate">Sr. Director, Revenue Assurance</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
