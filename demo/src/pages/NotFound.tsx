import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-purple-subtle border border-purple-primary/30 flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10 text-purple-light" />
        </div>
        <div>
          <h1 className="text-text-primary text-6xl font-mono font-bold">404</h1>
          <p className="text-text-secondary text-lg mt-2">Page not found</p>
          <p className="text-text-muted text-sm mt-1">The page you are looking for does not exist in this compliance platform.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 btn-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
