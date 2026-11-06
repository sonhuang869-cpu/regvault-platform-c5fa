import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, X, ExternalLink, Search } from 'lucide-react';
import { regulations } from '../lib/data';
import { getDaysUntil, formatDate } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import type { Regulation, Jurisdiction, ObligationStatus } from '../types';

type SortField = 'name' | 'jurisdiction' | 'frequency' | 'nextDueDate' | 'owner' | 'status';
type SortDir = 'asc' | 'desc';

function getDaysColor(days: number) {
  if (days < 0) return 'text-red-compliance bg-red-subtle';
  if (days <= 14) return 'text-red-compliance bg-red-subtle';
  if (days <= 30) return 'text-amber-compliance bg-amber-subtle';
  return 'text-text-secondary bg-surface-raised';
}

function getJurisdictionVariant(j: Jurisdiction): 'purple' | 'blue' | 'green' {
  if (j === 'US') return 'purple';
  if (j === 'EU') return 'blue';
  return 'green';
}

// Build 3-month calendar heatmap data for Dec 2024 - Feb 2025
function buildCalendarData() {
  const months = [
    { year: 2024, month: 11, label: 'Dec 2024' },
    { year: 2025, month: 0, label: 'Jan 2025' },
    { year: 2025, month: 1, label: 'Feb 2025' },
  ];

  return months.map(({ year, month, label }) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { day: number | null; count: number; regs: string[] }[] = [];

    for (let i = 0; i < firstDay; i++) cells.push({ day: null, count: 0, regs: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const matchRegs = regulations.filter(r => r.nextDueDate === dateStr).map(r => r.name);
      cells.push({ day: d, count: matchRegs.length, regs: matchRegs });
    }

    return { label, cells };
  });
}

const calendarData = buildCalendarData();

export default function ObligationRegistry() {
  const [search, setSearch] = useState('');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<Jurisdiction | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ObligationStatus | 'All'>('All');
  const [sortField, setSortField] = useState<SortField>('nextDueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedReg, setSelectedReg] = useState<Regulation | null>(null);

  const filtered = useMemo(() => {
    let arr = [...regulations];
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(r => r.name.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q));
    }
    if (jurisdictionFilter !== 'All') arr = arr.filter(r => r.jurisdiction === jurisdictionFilter);
    if (statusFilter !== 'All') arr = arr.filter(r => r.status === statusFilter);

    arr.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (sortField === 'nextDueDate') {
        aVal = new Date(a.nextDueDate).getTime();
        bVal = new Date(b.nextDueDate).getTime();
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [search, jurisdictionFilter, statusFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-purple-light" /> : <ChevronDown className="w-3 h-3 text-purple-light" />;
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card flex items-center gap-4 py-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            className="input-field pl-9"
            placeholder="Search regulations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs">Jurisdiction:</span>
          {(['All', 'US', 'EU', 'UK'] as const).map(j => (
            <button
              key={j}
              onClick={() => setJurisdictionFilter(j)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${jurisdictionFilter === j ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}
            >
              {j}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-xs">Status:</span>
          {(['All', 'Compliant', 'At Risk', 'Overdue', 'Pending Review'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-text-muted text-xs ml-auto">{filtered.length} of {regulations.length}</span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {[
                  { key: 'name' as SortField, label: 'Regulation' },
                  { key: 'jurisdiction' as SortField, label: 'Jurisdiction' },
                  { key: 'frequency' as SortField, label: 'Filing Type' },
                  { key: 'nextDueDate' as SortField, label: 'Next Due Date' },
                  { key: 'owner' as SortField, label: 'Owner' },
                  { key: 'status' as SortField, label: 'Status' },
                ].map(col => (
                  <th
                    key={col.key}
                    className="text-left text-text-muted text-xs font-medium px-4 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => toggleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.key} />
                    </div>
                  </th>
                ))}
                <th className="text-left text-text-muted text-xs font-medium px-4 py-3">Days Until Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(reg => {
                const days = getDaysUntil(reg.nextDueDate);
                return (
                  <tr
                    key={reg.id}
                    className="border-b border-border/50 hover:bg-surface-raised transition-colors cursor-pointer"
                    onClick={() => setSelectedReg(reg)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-text-primary font-medium text-sm">{reg.name}</div>
                      <div className="text-text-muted text-xs mt-0.5 max-w-xs truncate">{reg.fullName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getJurisdictionVariant(reg.jurisdiction)}>{reg.jurisdiction}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-text-secondary text-xs">{reg.filingType}</div>
                      <div className="text-text-muted text-xs">{reg.frequency}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-text-secondary text-sm">
                      {formatDate(reg.nextDueDate)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{reg.owner}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${getDaysColor(days)}`}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="card">
        <h2 className="text-text-primary font-semibold text-sm mb-4">Filing Deadline Calendar — Dec 2024 to Feb 2025</h2>
        <div className="grid grid-cols-3 gap-6">
          {calendarData.map(month => (
            <div key={month.label}>
              <div className="text-text-secondary text-xs font-medium mb-2">{month.label}</div>
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-text-muted py-1">{d}</div>
                ))}
                {month.cells.map((cell, i) => (
                  <div key={i} className="relative group">
                    {cell.day === null ? (
                      <div className="aspect-square"></div>
                    ) : (
                      <div
                        className={`aspect-square rounded flex items-center justify-center text-xs font-mono cursor-default
                          ${cell.count > 0
                            ? 'bg-purple-primary/80 text-white font-semibold ring-1 ring-purple-primary'
                            : 'text-text-muted hover:bg-surface-raised'
                          }`}
                        title={cell.regs.length > 0 ? cell.regs.join(', ') : undefined}
                      >
                        {cell.day}
                        {cell.count > 1 && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-compliance text-white text-xs flex items-center justify-center font-mono">
                            {cell.count}
                          </span>
                        )}
                      </div>
                    )}
                    {cell.regs.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-surface-raised border border-border rounded px-2 py-1 text-xs text-text-primary whitespace-nowrap z-10 hidden group-hover:block shadow-lg pointer-events-none">
                        {cell.regs.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-primary/80 inline-block ring-1 ring-purple-primary"></span>
            Filing due date
          </span>
          <span>Hover over highlighted dates to see which filings are due</span>
        </div>
      </div>

      {/* Obligation Detail Drawer */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedReg(null)}></div>
          <div className="relative w-[500px] h-full bg-surface border-l border-border overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-surface border-b border-border px-5 py-4 flex items-start justify-between z-10">
              <div>
                <h3 className="text-text-primary font-semibold">{selectedReg.name}</h3>
                <p className="text-text-muted text-xs mt-0.5">{selectedReg.fullName}</p>
              </div>
              <button
                onClick={() => setSelectedReg(null)}
                className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Jurisdiction', value: <Badge variant={getJurisdictionVariant(selectedReg.jurisdiction)}>{selectedReg.jurisdiction}</Badge> },
                  { label: 'Status', value: <StatusBadge status={selectedReg.status} /> },
                  { label: 'Frequency', value: selectedReg.frequency },
                  { label: 'Owner', value: selectedReg.owner },
                  { label: 'Next Due', value: <span className="font-mono">{formatDate(selectedReg.nextDueDate)}</span> },
                  { label: 'Days Until Due', value: <span className={`font-mono font-medium ${getDaysColor(getDaysUntil(selectedReg.nextDueDate)).split(' ')[0]}`}>{getDaysUntil(selectedReg.nextDueDate)}d</span> },
                ].map(item => (
                  <div key={item.label} className="bg-surface-raised rounded-lg p-3">
                    <div className="text-text-muted text-xs mb-1">{item.label}</div>
                    <div className="text-text-primary text-sm">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Description</h4>
                <p className="text-text-secondary text-sm leading-relaxed">{selectedReg.description}</p>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Requirements</h4>
                <ul className="space-y-1.5">
                  {selectedReg.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-purple-light mt-0.5">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evidence Required */}
              <div>
                <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Evidence Required</h4>
                <ul className="space-y-1.5">
                  {selectedReg.evidenceRequired.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-blue-compliance mt-0.5">•</span>
                      {ev}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submission Method */}
              <div>
                <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Submission Method</h4>
                <div className="bg-surface-raised rounded-lg p-3 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-light flex-shrink-0" />
                  <span className="text-text-secondary text-sm">{selectedReg.submissionMethod}</span>
                </div>
              </div>

              {/* Mapped Controls */}
              <div>
                <h4 className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">
                  Mapped Controls ({selectedReg.controlIds.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedReg.controlIds.map(id => (
                    <span key={id} className="px-2 py-1 bg-purple-subtle text-purple-light border border-purple-primary/30 rounded text-xs font-mono">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
