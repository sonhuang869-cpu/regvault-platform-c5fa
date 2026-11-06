import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, RefreshCw } from 'lucide-react';

const pageMeta: Record<string, { title: string; breadcrumb: string[] }> = {
  '/': { title: 'Risk Dashboard', breadcrumb: ['RegVault', 'Risk Dashboard'] },
  '/obligations': { title: 'Obligation Registry', breadcrumb: ['RegVault', 'Obligations'] },
  '/controls': { title: 'Control Workbench', breadcrumb: ['RegVault', 'Controls'] },
  '/filings': { title: 'Report Filing', breadcrumb: ['RegVault', 'Filings'] },
};

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const meta = pageMeta[location.pathname] ?? { title: 'Not Found', breadcrumb: ['RegVault'] };

  const now = new Date();
  const lastUpdated = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-surface border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-text-primary font-semibold text-base">{meta.title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
              {meta.breadcrumb.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>/</span>}
                  <span className={i === meta.breadcrumb.length - 1 ? 'text-text-secondary' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <RefreshCw className="w-3 h-3" />
              <span>Updated {lastUpdated}</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-surface-raised transition-colors text-text-secondary hover:text-text-primary">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-compliance"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
