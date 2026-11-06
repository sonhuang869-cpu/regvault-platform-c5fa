import React from 'react';

interface RiskChipProps {
  score: number;
  label?: string;
}

export function RiskChip({ score, label }: RiskChipProps) {
  let colorClass = '';
  let level = '';

  if (score >= 15) {
    colorClass = 'bg-red-subtle text-red-compliance border-red-compliance/30';
    level = 'Critical';
  } else if (score >= 9) {
    colorClass = 'bg-amber-subtle text-amber-compliance border-amber-compliance/30';
    level = 'High';
  } else if (score >= 4) {
    colorClass = 'bg-blue-subtle text-blue-compliance border-blue-compliance/30';
    level = 'Medium';
  } else {
    colorClass = 'bg-green-subtle text-green-compliance border-green-compliance/30';
    level = 'Low';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}
    >
      <span className="font-mono font-semibold">{score}</span>
      <span>{label ?? level}</span>
    </span>
  );
}
