import React from 'react';
import { Badge } from './Badge';
import type { ObligationStatus, ControlResult, FilingStatus, RemediationStatus } from '../../types';

type StatusType = ObligationStatus | ControlResult | FilingStatus | RemediationStatus | string;

function getVariant(status: StatusType): 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'gray' {
  switch (status) {
    case 'Compliant':
    case 'Effective':
    case 'Filed':
    case 'Resolved':
      return 'green';
    case 'At Risk':
    case 'Minor Deficiency':
    case 'In Progress':
    case 'Escalated':
      return 'amber';
    case 'Overdue':
    case 'Significant Deficiency':
    case 'Material Weakness':
      return 'red';
    case 'Pending Review':
    case 'Under Review':
    case 'Not Started':
    case 'Open':
      return 'blue';
    default:
      return 'gray';
  }
}

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <Badge variant={getVariant(status)} size={size}>
      {status}
    </Badge>
  );
}
