import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, X, Upload, Play, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { getControls, saveControls, getDeficiencies, saveDeficiencies, formatDate } from '../lib/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import type { Control, ControlResult, Deficiency, RemediationStatus } from '../types';

type ControlSortField = 'id' | 'name' | 'domain' | 'owner' | 'testFrequency' | 'lastTestDate' | 'nextTestDate' | 'result';
type SortDir = 'asc' | 'desc';

const DOMAIN_OPTIONS = Array.from(new Set(getControls().map(c => c.domain))).sort();
const TEAM_MEMBERS = ['Sarah Chen', 'Marcus Webb', 'Elena Vasquez', 'James Okafor', 'Priya Nair', 'Oliver Blackwood', 'Rachel Kim', 'Thomas Hardy'];

interface TestModalState {
  control: Control;
  tester: string;
  fileName: string;
  notes: string;
  result: ControlResult;
}

interface RemediationModalState {
  deficiency: Deficiency;
  plan: string;
  targetDate: string;
  status: RemediationStatus;
}

export default function ControlWorkbench() {
  const [activeTab, setActiveTab] = useState<'library' | 'deficiencies'>('library');
  const [controls, setControls] = useState<Control[]>(() => getControls());
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>(() => getDeficiencies());

  // Control Library state
  const [ctrlSearch, setCtrlSearch] = useState('');
  const [ctrlDomain, setCtrlDomain] = useState('All');
  const [ctrlResult, setCtrlResult] = useState('All');
  const [ctrlSort, setCtrlSort] = useState<ControlSortField>('id');
  const [ctrlSortDir, setCtrlSortDir] = useState<SortDir>('asc');
  const [testModal, setTestModal] = useState<TestModalState | null>(null);

  // Deficiency state
  const [defSearch, setDefSearch] = useState('');
  const [defStatus, setDefStatus] = useState('All');
  const [defSeverity, setDefSeverity] = useState('All');
  const [remediationModal, setRemediationModal] = useState<RemediationModalState | null>(null);

  const filteredControls = useMemo(() => {
    let arr = [...controls];
    if (ctrlSearch) {
      const q = ctrlSearch.toLowerCase();
      arr = arr.filter(c => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q));
    }
    if (ctrlDomain !== 'All') arr = arr.filter(c => c.domain === ctrlDomain);
    if (ctrlResult !== 'All') arr = arr.filter(c => c.result === ctrlResult);

    arr.sort((a, b) => {
      const aVal = a[ctrlSort] as string;
      const bVal = b[ctrlSort] as string;
      if (aVal < bVal) return ctrlSortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return ctrlSortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [controls, ctrlSearch, ctrlDomain, ctrlResult, ctrlSort, ctrlSortDir]);

  const filteredDeficiencies = useMemo(() => {
    let arr = [...deficiencies];
    if (defSearch) {
      const q = defSearch.toLowerCase();
      arr = arr.filter(d => d.id.toLowerCase().includes(q) || d.controlName.toLowerCase().includes(q) || d.responsibleParty.toLowerCase().includes(q));
    }
    if (defStatus !== 'All') arr = arr.filter(d => d.status === defStatus);
    if (defSeverity !== 'All') arr = arr.filter(d => d.severity === defSeverity);
    return arr;
  }, [deficiencies, defSearch, defStatus, defSeverity]);

  // Trend data: aggregate last 4 quarters for visible controls
  const trendData = useMemo(() => {
    const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
    return quarters.map(q => {
      const scores = filteredControls.map(c => {
        const h = c.effectivenessHistory.find(e => e.quarter === q);
        return h?.score ?? 0;
      });
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { quarter: q.replace(' 2024', ''), avg };
    });
  }, [filteredControls]);

  function toggleCtrlSort(field: ControlSortField) {
    if (ctrlSort === field) setCtrlSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setCtrlSort(field); setCtrlSortDir('asc'); }
  }

  function SortIcon({ field }: { field: ControlSortField }) {
    if (ctrlSort !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return ctrlSortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-purple-light" /> : <ChevronDown className="w-3 h-3 text-purple-light" />;
  }

  function openTestModal(control: Control) {
    setTestModal({ control, tester: TEAM_MEMBERS[0], fileName: '', notes: '', result: 'Effective' });
  }

  function submitTest() {
    if (!testModal) return;
    const today = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + (testModal.control.testFrequency === 'Monthly' ? 1 : testModal.control.testFrequency === 'Quarterly' ? 3 : 12));

    const updated = controls.map(c =>
      c.id === testModal.control.id
        ? {
            ...c,
            result: testModal.result,
            lastTestDate: today,
            nextTestDate: nextDate.toISOString().split('T')[0],
          }
        : c
    );
    setControls(updated);
    saveControls(updated);
    setTestModal(null);
    toast.success(`Control ${testModal.control.id} test recorded as "${testModal.result}"`);
  }

  function escalateDeficiency(id: string) {
    const updated = deficiencies.map(d =>
      d.id === id ? { ...d, escalationStatus: true, status: 'Escalated' as RemediationStatus } : d
    );
    setDeficiencies(updated);
    saveDeficiencies(updated);
    toast.warning(`Deficiency ${id} has been escalated`);
  }

  function submitRemediation() {
    if (!remediationModal) return;
    const updated = deficiencies.map(d =>
      d.id === remediationModal.deficiency.id
        ? { ...d, remediationPlan: remediationModal.plan, targetDate: remediationModal.targetDate, status: remediationModal.status }
        : d
    );
    setDeficiencies(updated);
    saveDeficiencies(updated);
    setRemediationModal(null);
    toast.success(`Remediation plan updated for ${remediationModal.deficiency.id}`);
  }

  const effectiveCount = controls.filter(c => c.result === 'Effective').length;
  const deficiencyCount = controls.filter(c => c.result !== 'Effective').length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex items-center gap-4">
        <div className="card flex items-center gap-3 py-2.5 flex-1">
          <div className="w-2 h-2 rounded-full bg-green-compliance"></div>
          <span className="text-text-primary text-sm font-semibold font-mono">{effectiveCount}</span>
          <span className="text-text-muted text-xs">Effective</span>
          <div className="w-px h-4 bg-border mx-1"></div>
          <div className="w-2 h-2 rounded-full bg-amber-compliance"></div>
          <span className="text-text-primary text-sm font-semibold font-mono">{deficiencyCount}</span>
          <span className="text-text-muted text-xs">With Deficiencies</span>
          <div className="w-px h-4 bg-border mx-1"></div>
          <span className="text-text-muted text-xs">{controls.length} total controls</span>
        </div>
        <button
          onClick={() => { setActiveTab('library'); }}
          className={`btn-${activeTab === 'library' ? 'primary' : 'secondary'}`}
        >
          Control Library
        </button>
        <button
          onClick={() => { setActiveTab('deficiencies'); }}
          className={`btn-${activeTab === 'deficiencies' ? 'primary' : 'secondary'}`}
        >
          Deficiency Tracker
          {deficiencies.filter(d => d.status !== 'Resolved').length > 0 && (
            <span className="ml-2 bg-red-compliance text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
              {deficiencies.filter(d => d.status !== 'Resolved').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'library' && (
        <>
          {/* Filters */}
          <div className="card flex items-center gap-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input className="input-field pl-9" placeholder="Search controls..." value={ctrlSearch} onChange={e => setCtrlSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Domain:</span>
              <select
                className="select-field text-xs"
                value={ctrlDomain}
                onChange={e => setCtrlDomain(e.target.value)}
              >
                <option value="All">All Domains</option>
                {DOMAIN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Result:</span>
              {(['All', 'Effective', 'Minor Deficiency', 'Significant Deficiency'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setCtrlResult(r)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${ctrlResult === r ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <span className="text-text-muted text-xs ml-auto">{filteredControls.length} controls</span>
          </div>

          {/* Trend chart */}
          <div className="card">
            <h2 className="text-text-primary font-semibold text-sm mb-3">Effectiveness Trend — Visible Controls ({filteredControls.length})</h2>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={trendData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" />
                <XAxis dataKey="quarter" tick={{ fill: '#8A9BB8', fontSize: 11 }} />
                <YAxis domain={[60, 100]} tick={{ fill: '#8A9BB8', fontSize: 11 }} />
                <Tooltip content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-surface-raised border border-border rounded px-2 py-1 text-xs">
                      <p className="text-text-secondary">{label}</p>
                      <p className="text-purple-light font-mono">{payload[0].value}% avg</p>
                    </div>
                  ) : null
                } />
                <Line type="monotone" dataKey="avg" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 3 }} name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Control Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      { key: 'id' as ControlSortField, label: 'ID' },
                      { key: 'name' as ControlSortField, label: 'Control Name' },
                      { key: 'domain' as ControlSortField, label: 'Domain' },
                      { key: 'owner' as ControlSortField, label: 'Owner' },
                      { key: 'testFrequency' as ControlSortField, label: 'Frequency' },
                      { key: 'lastTestDate' as ControlSortField, label: 'Last Test' },
                      { key: 'nextTestDate' as ControlSortField, label: 'Next Test' },
                      { key: 'result' as ControlSortField, label: 'Result' },
                    ].map(col => (
                      <th key={col.key} className="text-left text-text-muted font-medium px-3 py-2.5 cursor-pointer select-none hover:text-text-primary" onClick={() => toggleCtrlSort(col.key)}>
                        <div className="flex items-center gap-1">{col.label}<SortIcon field={col.key} /></div>
                      </th>
                    ))}
                    <th className="text-left text-text-muted font-medium px-3 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredControls.map(ctrl => (
                    <tr key={ctrl.id} className="border-b border-border/50 hover:bg-surface-raised transition-colors">
                      <td className="px-3 py-2.5 font-mono text-purple-light">{ctrl.id}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-text-primary font-medium max-w-[200px] truncate">{ctrl.name}</div>
                        <div className="text-text-muted mt-0.5">{ctrl.controlType}</div>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary">{ctrl.domain}</td>
                      <td className="px-3 py-2.5 text-text-secondary">{ctrl.owner}</td>
                      <td className="px-3 py-2.5 text-text-secondary">{ctrl.testFrequency}</td>
                      <td className="px-3 py-2.5 font-mono text-text-muted">{ctrl.lastTestDate}</td>
                      <td className="px-3 py-2.5 font-mono text-text-muted">{ctrl.nextTestDate}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={ctrl.result} /></td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => openTestModal(ctrl)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-subtle text-purple-light border border-purple-primary/30 rounded-lg hover:bg-purple-primary/20 transition-colors text-xs font-medium"
                        >
                          <Play className="w-3 h-3" />
                          Run Test
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'deficiencies' && (
        <>
          {/* Deficiency Filters */}
          <div className="card flex items-center gap-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input className="input-field pl-9" placeholder="Search deficiencies..." value={defSearch} onChange={e => setDefSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Status:</span>
              {(['All', 'Open', 'In Progress', 'Escalated', 'Resolved'] as const).map(s => (
                <button key={s} onClick={() => setDefStatus(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${defStatus === s ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Severity:</span>
              {(['All', 'Minor', 'Significant', 'Material'] as const).map(s => (
                <button key={s} onClick={() => setDefSeverity(s)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${defSeverity === s ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}>
                  {s}
                </button>
              ))}
            </div>
            <span className="text-text-muted text-xs ml-auto">{filteredDeficiencies.length} items</span>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {['ID', 'Control', 'Severity', 'Description', 'Responsible Party', 'Target Date', 'Days Open', 'Status', 'Escalated', 'Actions'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeficiencies.map(def => (
                    <tr key={def.id} className="border-b border-border/50 hover:bg-surface-raised transition-colors">
                      <td className="px-3 py-3 font-mono text-purple-light">{def.id}</td>
                      <td className="px-3 py-3">
                        <div className="text-text-primary font-medium">{def.controlId}</div>
                        <div className="text-text-muted mt-0.5 max-w-[120px] truncate">{def.controlName}</div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={def.severity === 'Material' ? 'red' : def.severity === 'Significant' ? 'red' : 'amber'}>
                          {def.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 max-w-[200px]">
                        <p className="text-text-secondary truncate" title={def.description}>{def.description}</p>
                      </td>
                      <td className="px-3 py-3 text-text-secondary">{def.responsibleParty}</td>
                      <td className="px-3 py-3 font-mono text-text-muted">{formatDate(def.targetDate)}</td>
                      <td className="px-3 py-3 font-mono">
                        <span className={`font-semibold ${def.daysOpen > 60 ? 'text-red-compliance' : def.daysOpen > 30 ? 'text-amber-compliance' : 'text-text-secondary'}`}>
                          {def.daysOpen}
                        </span>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={def.status} /></td>
                      <td className="px-3 py-3">
                        {def.escalationStatus ? (
                          <span className="flex items-center gap-1 text-red-compliance">
                            <AlertCircle className="w-3 h-3" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="text-text-muted">No</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {!def.escalationStatus && def.status !== 'Resolved' && (
                            <button
                              onClick={() => escalateDeficiency(def.id)}
                              className="px-2 py-1 bg-red-subtle text-red-compliance border border-red-compliance/30 rounded text-xs hover:bg-red-compliance/20 transition-colors"
                            >
                              Escalate
                            </button>
                          )}
                          <button
                            onClick={() => setRemediationModal({ deficiency: def, plan: def.remediationPlan, targetDate: def.targetDate, status: def.status })}
                            className="px-2 py-1 bg-surface-raised text-text-secondary border border-border rounded text-xs hover:text-text-primary transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Test Modal */}
      {testModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTestModal(null)}></div>
          <div className="relative bg-surface border border-border rounded-xl w-[480px] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-text-primary font-semibold text-sm">Run Control Test</h3>
                <p className="text-text-muted text-xs mt-0.5">{testModal.control.id} — {testModal.control.name}</p>
              </div>
              <button onClick={() => setTestModal(null)} className="p-1.5 hover:bg-surface-raised rounded-lg text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Select Tester</label>
                <select className="select-field w-full" value={testModal.tester} onChange={e => setTestModal({ ...testModal, tester: e.target.value })}>
                  {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Upload Evidence</label>
                <div
                  className="border border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-purple-primary/50 transition-colors"
                  onClick={() => {
                    const fakeFiles = ['control_test_workpaper.xlsx', 'evidence_sample.pdf', 'screenshot_evidence.png', 'test_results.docx'];
                    const name = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
                    setTestModal({ ...testModal, fileName: name });
                  }}
                >
                  {testModal.fileName ? (
                    <div className="flex items-center gap-2 text-sm text-green-compliance">
                      <Upload className="w-4 h-4" />
                      <span className="font-mono">{testModal.fileName}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-text-muted text-sm">
                      <Upload className="w-4 h-4" />
                      <span>Click to attach evidence file</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Test Notes</label>
                <textarea
                  className="input-field resize-none h-20"
                  placeholder="Document testing procedures, population, and observations..."
                  value={testModal.notes}
                  onChange={e => setTestModal({ ...testModal, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Test Result</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Effective', 'Minor Deficiency', 'Significant Deficiency', 'Material Weakness'] as ControlResult[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setTestModal({ ...testModal, result: r })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${
                        testModal.result === r
                          ? r === 'Effective' ? 'bg-green-subtle text-green-compliance border-green-compliance/50'
                            : r === 'Minor Deficiency' ? 'bg-amber-subtle text-amber-compliance border-amber-compliance/50'
                            : 'bg-red-subtle text-red-compliance border-red-compliance/50'
                          : 'bg-surface-raised text-text-muted border-border hover:border-border/80'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
              <button onClick={() => setTestModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitTest} className="btn-primary">Submit Test Result</button>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Modal */}
      {remediationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRemediationModal(null)}></div>
          <div className="relative bg-surface border border-border rounded-xl w-[480px] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="text-text-primary font-semibold text-sm">Update Remediation Plan</h3>
                <p className="text-text-muted text-xs mt-0.5">{remediationModal.deficiency.id} — {remediationModal.deficiency.controlName}</p>
              </div>
              <button onClick={() => setRemediationModal(null)} className="p-1.5 hover:bg-surface-raised rounded-lg text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Remediation Plan</label>
                <textarea
                  className="input-field resize-none h-28"
                  value={remediationModal.plan}
                  onChange={e => setRemediationModal({ ...remediationModal, plan: e.target.value })}
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Target Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={remediationModal.targetDate}
                  onChange={e => setRemediationModal({ ...remediationModal, targetDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Status</label>
                <div className="flex gap-2">
                  {(['Open', 'In Progress', 'Escalated', 'Resolved'] as RemediationStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setRemediationModal({ ...remediationModal, status: s })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        remediationModal.status === s ? 'bg-purple-primary text-white border-purple-primary' : 'bg-surface-raised text-text-secondary border-border hover:text-text-primary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
              <button onClick={() => setRemediationModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitRemediation} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
