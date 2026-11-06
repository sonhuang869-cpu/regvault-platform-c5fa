import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    green: 'bg-green-subtle text-green-compliance border-green-compliance/30',
    red: 'bg-red-subtle text-red-compliance border-red-compliance/30',
    amber: 'bg-amber-subtle text-amber-compliance border-amber-compliance/30',
    blue: 'bg-blue-subtle text-blue-compliance border-blue-compliance/30',
    purple: 'bg-purple-subtle text-purple-light border-purple-primary/30',
    gray: 'bg-surface-raised text-text-secondary border-border',
  };

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}
