export type Jurisdiction = 'US' | 'EU' | 'UK';
export type ObligationStatus = 'Compliant' | 'At Risk' | 'Overdue' | 'Pending Review';
export type FilingFrequency = 'Annual' | 'Semi-Annual' | 'Quarterly' | 'Monthly' | 'Ad Hoc';
export type ControlResult = 'Effective' | 'Minor Deficiency' | 'Significant Deficiency' | 'Material Weakness';
export type FilingStatus = 'Not Started' | 'In Progress' | 'Under Review' | 'Filed' | 'Overdue';
export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type RemediationStatus = 'Open' | 'In Progress' | 'Escalated' | 'Resolved';

export interface Regulation {
  id: string;
  name: string;
  fullName: string;
  jurisdiction: Jurisdiction;
  filingType: string;
  frequency: FilingFrequency;
  nextDueDate: string;
  owner: string;
  status: ObligationStatus;
  description: string;
  requirements: string[];
  submissionMethod: string;
  controlIds: string[];
  evidenceRequired: string[];
}

export interface Control {
  id: string;
  name: string;
  regulationIds: string[];
  owner: string;
  testFrequency: 'Monthly' | 'Quarterly' | 'Annual';
  lastTestDate: string;
  nextTestDate: string;
  result: ControlResult;
  description: string;
  controlType: 'Preventive' | 'Detective' | 'Corrective';
  domain: string;
  effectivenessHistory: { quarter: string; score: number }[];
}

export interface Deficiency {
  id: string;
  controlId: string;
  controlName: string;
  regulationIds: string[];
  severity: 'Minor' | 'Significant' | 'Material';
  description: string;
  remediationPlan: string;
  targetDate: string;
  responsibleParty: string;
  status: RemediationStatus;
  escalationStatus: boolean;
  createdDate: string;
  daysOpen: number;
}

export interface FilingReport {
  id: string;
  regulationId: string;
  regulationName: string;
  reportName: string;
  dueDate: string;
  status: FilingStatus;
  priority: 'Critical' | 'Standard' | 'Routine';
  preparer: string;
  controller: string;
  cfo: string;
  preparerSigned: boolean;
  controllerSigned: boolean;
  cfoSigned: boolean;
  dataElements: { name: string; status: 'Complete' | 'Pending' | 'Missing'; value?: string }[];
  confirmationNumber?: string;
  filedDate?: string;
  jurisdiction: Jurisdiction;
}

export interface Risk {
  id: string;
  name: string;
  regulationId: string;
  regulationName: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  residualScore: number;
  controlStrength: number;
  issueCount: number;
  deadlineProximityDays: number;
  description: string;
  mitigationStatus: 'Mitigated' | 'Partially Mitigated' | 'Unmitigated';
}
