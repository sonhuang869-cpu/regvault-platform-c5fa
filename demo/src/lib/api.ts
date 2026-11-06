import type { Control, FilingReport, Deficiency } from '../types';
import { controls as seedControls, filingReports as seedFilings, deficiencies as seedDeficiencies } from './data';

const CONTROLS_KEY = 'regvault_controls';
const FILINGS_KEY = 'regvault_filings';
const DEFICIENCIES_KEY = 'regvault_deficiencies';

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function getControls(): Control[] {
  return loadFromStorage<Control>(CONTROLS_KEY, seedControls);
}

export function saveControls(controls: Control[]): void {
  saveToStorage(CONTROLS_KEY, controls);
}

export function getFilings(): FilingReport[] {
  return loadFromStorage<FilingReport>(FILINGS_KEY, seedFilings);
}

export function saveFilings(filings: FilingReport[]): void {
  saveToStorage(FILINGS_KEY, filings);
}

export function getDeficiencies(): Deficiency[] {
  return loadFromStorage<Deficiency>(DEFICIENCIES_KEY, seedDeficiencies);
}

export function saveDeficiencies(deficiencies: Deficiency[]): void {
  saveToStorage(DEFICIENCIES_KEY, deficiencies);
}

export function resetToSeedData(): void {
  try {
    localStorage.removeItem(CONTROLS_KEY);
    localStorage.removeItem(FILINGS_KEY);
    localStorage.removeItem(DEFICIENCIES_KEY);
  } catch {
    // ignore
  }
}

export function generateConfirmationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `REG-${year}-${random}`;
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getStatusColor(status: string): string {
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
