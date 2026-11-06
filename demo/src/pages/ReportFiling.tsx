import React, { useState, useMemo } from 'react';
import { X, ChevronRight, CheckCircle2, Circle, FileText, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { getFilings, saveFilings, generateConfirmationNumber, formatDate } from '../lib/api';
import { historicalFilings } from '../lib/data';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Badge } from '../components/ui/Badge';
import type { FilingReport, FilingStatus } from '../types';

type PackageStep = 1 | 2 | 3 | 4 | 5;

interface FilingPackageState {
  filing: FilingReport;
  step: PackageStep;
}

function getPriorityVariant(p: string): 'red' | 'amber' | 'blue' {
  if (p === 'Critical') return 'red';
  if (p === 'Standard') return 'amber';
  return 'blue';
}

const stepLabels: Record<PackageStep, string> = {
  1: 'Data Collection',
  2: 'Validation',
  3: 'Preview',
  4: 'Approval Chain',
  5: 'Submit',
};

export default function ReportFiling() {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [filings, setFilings] = useState<FilingReport[]>(() => getFilings());
  const [packageState, setPackageState] = useState<FilingPackageState | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilingStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Critical' | 'Standard' | 'Routine'>('All');

  const queueFilings = useMemo(() => {
    let arr = filings.filter(f => f.status !== 'Filed');
    if (statusFilter !== 'All') arr = arr.filter(f => f.status === statusFilter);
    if (priorityFilter !== 'All') arr = arr.filter(f => f.priority === priorityFilter);
    return arr.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filings, statusFilter, priorityFilter]);

  function openPackage(filing: FilingReport) {
    setPackageState({ filing: { ...filing }, step: 1 });
  }

  function updateFiling(updated: FilingReport) {
    const newFilings = filings.map(f => f.id === updated.id ? updated : f);
    setFilings(newFilings);
    saveFilings(newFilings);
    if (packageState) setPackageState({ ...packageState, filing: updated });
  }

  function advanceStep() {
    if (!packageState) return;
    if (packageState.step < 5) {
      setPackageState({ ...packageState, step: (packageState.step + 1) as PackageStep });
    }
  }

  function goToStep(step: PackageStep) {
    if (!packageState) return;
    setPackageState({ ...packageState, step });
  }

  function getDataCompleteness(filing: FilingReport): number {
    const complete = filing.dataElements.filter(d => d.status === 'Complete').length;
    return filing.dataElements.length > 0 ? Math.round((complete / filing.dataElements.length) * 100) : 0;
  }

  function toggleDataElement(idx: number) {
    if (!packageState) return;
    const updated = { ...packageState.filing };
    const els = [...updated.dataElements];
    els[idx] = { ...els[idx], status: els[idx].status === 'Complete' ? 'Pending' : 'Complete' };
    updated.dataElements = els;
    updateFiling(updated);
  }

  function signAs(role: 'preparer' | 'controller' | 'cfo') {
    if (!packageState) return;
    const updated = { ...packageState.filing };
    if (role === 'preparer') updated.preparerSigned = true;
    if (role === 'controller') updated.controllerSigned = true;
    if (role === 'cfo') updated.cfoSigned = true;
    updateFiling(updated);
    toast.success(`Signed as ${role === 'preparer' ? packageState.filing.preparer : role === 'controller' ? packageState.filing.controller : packageState.filing.cfo}`);
  }

  function submitFiling() {
    if (!packageState) return;
    const confirmNum = generateConfirmationNumber();
    const today = new Date().toISOString().split('T')[0];
    const updated: FilingReport = {
      ...packageState.filing,
      status: 'Filed',
      confirmationNumber: confirmNum,
      filedDate: today,
    };
    const newFilings = filings.map(f => f.id === updated.id ? updated : f);
    setFilings(newFilings);
    saveFilings(newFilings);
    setPackageState(null);
    toast.success(`Filing submitted! Confirmation: ${confirmNum}`, { duration: 6000 });
  }

  function markInProgress(id: string) {
    const f = filings.find(f => f.id === id);
    if (f && f.status === 'Not Started') {
      const updated: FilingReport = { ...f, status: 'In Progress' };
      const newFilings = filings.map(x => x.id === id ? updated : x);
      setFilings(newFilings);
      saveFilings(newFilings);
      toast.info(`Filing marked as In Progress`);
    }
  }

  const filing = packageState?.filing;
  const completeness = filing ? getDataCompleteness(filing) : 0;
  const canAdvanceFromStep1 = filing ? filing.dataElements.every(d => d.status === 'Complete') : false;
  const canAdvanceFromStep2 = completeness === 100;

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('queue')}
          className={`btn-${activeTab === 'queue' ? 'primary' : 'secondary'}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Filing Queue
          <span className="ml-2 bg-purple-dim text-white rounded-full px-1.5 py-0.5 text-xs font-mono">
            {filings.filter(f => f.status !== 'Filed').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn-${activeTab === 'history' ? 'primary' : 'secondary'}`}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Filing History
        </button>
      </div>

      {activeTab === 'queue' && (
        <>
          {/* Filters */}
          <div className="card flex items-center gap-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Priority:</span>
              {(['All', 'Critical', 'Standard', 'Routine'] as const).map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${priorityFilter === p ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Status:</span>
              {(['All', 'Not Started', 'In Progress', 'Under Review', 'Overdue'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${statusFilter === s ? 'bg-purple-primary text-white' : 'bg-surface-raised text-text-secondary hover:text-text-primary'}`}>
                  {s}
                </button>
              ))}
            </div>
            <span className="text-text-muted text-xs ml-auto">{queueFilings.length} filings</span>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Report Name', 'Regulation', 'Jurisdiction', 'Due Date', 'Priority', 'Status', 'Preparer', 'Actions'].map(h => (
                    <th key={h} className="text-left text-text-muted font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queueFilings.map(f => {
                  const daysUntil = Math.ceil((new Date(f.dueDate).getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-text-primary font-medium max-w-[200px]">{f.reportName}</div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{f.regulationName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={f.jurisdiction === 'US' ? 'purple' : f.jurisdiction === 'EU' ? 'blue' : 'green'}>
                          {f.jurisdiction}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-text-secondary">{formatDate(f.dueDate)}</div>
                        <div className={`text-xs font-mono ${daysUntil <= 7 ? 'text-red-compliance' : daysUntil <= 30 ? 'text-amber-compliance' : 'text-text-muted'}`}>
                          {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d remaining`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPriorityVariant(f.priority)}>{f.priority}</Badge>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                      <td className="px-4 py-3 text-text-secondary">{f.preparer}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openPackage(f)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-subtle text-purple-light border border-purple-primary/30 rounded-lg hover:bg-purple-primary/20 transition-colors font-medium"
                          >
                            Open Package
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          {f.status === 'Not Started' && (
                            <button onClick={() => markInProgress(f.id)} className="px-2 py-1.5 bg-surface-raised text-text-secondary border border-border rounded-lg hover:text-text-primary transition-colors">
                              Start
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Report Name', 'Regulation', 'Jurisdiction', 'Filed Date', 'Confirmation #', 'Filed By', 'Status'].map(h => (
                  <th key={h} className="text-left text-text-muted font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...historicalFilings, ...filings.filter(f => f.status === 'Filed')].map(f => (
                <tr key={f.id} className="border-b border-border/50 hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-text-primary font-medium">{f.reportName}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{f.regulationName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={f.jurisdiction === 'US' ? 'purple' : f.jurisdiction === 'EU' ? 'blue' : 'green'}>
                      {f.jurisdiction}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{f.filedDate ? formatDate(f.filedDate) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-purple-light text-xs">{f.confirmationNumber ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{f.cfo}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filing Package Modal */}
      {packageState && filing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPackageState(null)}></div>
          <div className="relative bg-surface border border-border rounded-xl w-[640px] max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-text-primary font-semibold">{filing.reportName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getPriorityVariant(filing.priority)}>{filing.priority}</Badge>
                  <StatusBadge status={filing.status} />
                  <span className="text-text-muted text-xs">Due {formatDate(filing.dueDate)}</span>
                </div>
              </div>
              <button onClick={() => setPackageState(null)} className="p-1.5 hover:bg-surface-raised rounded-lg text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Progress */}
            <div className="px-6 py-3 border-b border-border flex items-center gap-1 flex-shrink-0">
              {([1, 2, 3, 4, 5] as PackageStep[]).map(s => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => s <= packageState.step && goToStep(s)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      packageState.step === s
                        ? 'bg-purple-primary text-white'
                        : s < packageState.step
                        ? 'bg-purple-subtle text-purple-light cursor-pointer hover:bg-purple-primary/20'
                        : 'text-text-muted cursor-not-allowed'
                    }`}
                  >
                    {s < packageState.step ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    {stepLabels[s]}
                  </button>
                  {s < 5 && <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Data Collection */}
              {packageState.step === 1 && (
                <div className="space-y-3">
                  <h4 className="text-text-primary font-semibold text-sm">Data Collection Checklist</h4>
                  <p className="text-text-muted text-xs">Complete all data elements before proceeding to validation.</p>
                  <div className="space-y-2">
                    {filing.dataElements.map((el, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          el.status === 'Complete' ? 'bg-green-subtle border-green-compliance/30' : el.status === 'Missing' ? 'bg-red-subtle border-red-compliance/30' : 'bg-surface-raised border-border hover:border-border/80'
                        }`}
                        onClick={() => toggleDataElement(i)}
                      >
                        <div className="flex items-center gap-3">
                          {el.status === 'Complete' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-compliance flex-shrink-0" />
                          ) : el.status === 'Missing' ? (
                            <AlertTriangle className="w-4 h-4 text-red-compliance flex-shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-text-muted flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-text-primary text-sm font-medium">{el.name}</div>
                            {el.value && <div className="text-text-muted text-xs mt-0.5">{el.value}</div>}
                          </div>
                        </div>
                        <Badge
                          variant={el.status === 'Complete' ? 'green' : el.status === 'Missing' ? 'red' : 'blue'}
                          size="sm"
                        >
                          {el.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs">Click items to toggle between Pending/Complete. Resolve Missing items before proceeding.</p>
                </div>
              )}

              {/* Step 2: Validation */}
              {packageState.step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-semibold text-sm">Pre-Submission Validation</h4>
                  <div className="bg-surface-raised rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-text-secondary text-sm">Data Completeness</span>
                      <span className={`font-mono font-semibold text-sm ${completeness === 100 ? 'text-green-compliance' : completeness >= 80 ? 'text-amber-compliance' : 'text-red-compliance'}`}>
                        {completeness}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${completeness === 100 ? 'bg-green-compliance' : completeness >= 80 ? 'bg-amber-compliance' : 'bg-red-compliance'}`}
                        style={{ width: `${completeness}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'All data elements complete', pass: completeness === 100 },
                      { label: 'No missing critical fields', pass: !filing.dataElements.some(d => d.status === 'Missing') },
                      { label: 'Report within filing window', pass: Math.ceil((new Date(filing.dueDate).getTime() - Date.now()) / 86400000) > 0 },
                      { label: 'Regulation mapping verified', pass: true },
                    ].map((check, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${check.pass ? 'bg-green-subtle' : 'bg-red-subtle'}`}>
                        {check.pass ? <CheckCircle2 className="w-4 h-4 text-green-compliance flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-compliance flex-shrink-0" />}
                        <span className={`text-sm ${check.pass ? 'text-green-compliance' : 'text-red-compliance'}`}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                  {!canAdvanceFromStep2 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-subtle rounded-lg border border-amber-compliance/30">
                      <AlertTriangle className="w-4 h-4 text-amber-compliance flex-shrink-0" />
                      <span className="text-amber-compliance text-sm">Complete all data elements in Step 1 to proceed</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Preview */}
              {packageState.step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-semibold text-sm">Filing Preview</h4>
                  <div className="bg-surface-raised rounded-xl p-5 font-mono text-xs space-y-3 border border-border">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <div className="text-text-primary font-semibold text-sm">{filing.reportName}</div>
                        <div className="text-text-muted mt-0.5">{filing.regulationName} — {filing.jurisdiction}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-text-muted">Filing Period</div>
                        <div className="text-text-primary">Due: {formatDate(filing.dueDate)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-text-muted mb-1">PREPARER</div>
                        <div className="text-text-primary">{filing.preparer}</div>
                      </div>
                      <div>
                        <div className="text-text-muted mb-1">CONTROLLER</div>
                        <div className="text-text-primary">{filing.controller}</div>
                      </div>
                      <div>
                        <div className="text-text-muted mb-1">CFO</div>
                        <div className="text-text-primary">{filing.cfo}</div>
                      </div>
                      <div>
                        <div className="text-text-muted mb-1">PRIORITY</div>
                        <div className="text-text-primary">{filing.priority}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-text-muted mb-2">DATA ELEMENTS ({filing.dataElements.length})</div>
                      {filing.dataElements.map((el, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-border/30 last:border-0">
                          <span className="text-text-secondary">{el.name}</span>
                          <span className={el.status === 'Complete' ? 'text-green-compliance' : 'text-amber-compliance'}>
                            {el.value ?? el.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => toast.success('Draft exported as PDF')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Draft as PDF
                  </button>
                </div>
              )}

              {/* Step 4: Approval Chain */}
              {packageState.step === 4 && (
                <div className="space-y-4">
                  <h4 className="text-text-primary font-semibold text-sm">Electronic Approval Chain</h4>
                  <p className="text-text-muted text-xs">Each approver must sign in sequence. The CFO sign-off is enabled only after the Controller has signed.</p>
                  <div className="space-y-3">
                    {[
                      {
                        role: 'preparer' as const,
                        label: 'Preparer',
                        name: filing.preparer,
                        signed: filing.preparerSigned,
                        enabled: true,
                        order: 1,
                      },
                      {
                        role: 'controller' as const,
                        label: 'Controller',
                        name: filing.controller,
                        signed: filing.controllerSigned,
                        enabled: filing.preparerSigned,
                        order: 2,
                      },
                      {
                        role: 'cfo' as const,
                        label: 'CFO',
                        name: filing.cfo,
                        signed: filing.cfoSigned,
                        enabled: filing.controllerSigned,
                        order: 3,
                      },
                    ].map(signer => (
                      <div
                        key={signer.role}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          signer.signed
                            ? 'bg-green-subtle border-green-compliance/30'
                            : signer.enabled
                            ? 'bg-surface-raised border-purple-primary/30'
                            : 'bg-surface border-border opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${signer.signed ? 'bg-green-compliance text-white' : 'bg-surface-raised text-text-muted border border-border'}`}>
                            {signer.order}
                          </div>
                          <div>
                            <div className="text-text-primary text-sm font-medium">{signer.name}</div>
                            <div className="text-text-muted text-xs">{signer.label}</div>
                          </div>
                        </div>
                        {signer.signed ? (
                          <div className="flex items-center gap-1.5 text-green-compliance text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Signed
                          </div>
                        ) : (
                          <button
                            onClick={() => signer.enabled && signAs(signer.role)}
                            disabled={!signer.enabled}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              signer.enabled
                                ? 'bg-purple-primary hover:bg-purple-dim text-white cursor-pointer'
                                : 'bg-surface-raised text-text-muted cursor-not-allowed'
                            }`}
                          >
                            Sign as {signer.label}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Submit */}
              {packageState.step === 5 && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-subtle border border-purple-primary/30 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-purple-light" />
                  </div>
                  <h4 className="text-text-primary font-semibold">Ready to Submit</h4>
                  <p className="text-text-muted text-sm max-w-sm mx-auto">
                    All approvals obtained. Clicking Submit will generate a confirmation number and officially record this filing.
                  </p>
                  <div className="bg-surface-raised rounded-xl p-4 text-left space-y-2">
                    {[
                      { label: 'Preparer', name: filing.preparer, signed: filing.preparerSigned },
                      { label: 'Controller', name: filing.controller, signed: filing.controllerSigned },
                      { label: 'CFO', name: filing.cfo, signed: filing.cfoSigned },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{s.label}: {s.name}</span>
                        {s.signed ? (
                          <span className="text-green-compliance flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Signed</span>
                        ) : (
                          <span className="text-red-compliance">Not Signed</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {!filing.preparerSigned || !filing.controllerSigned || !filing.cfoSigned ? (
                    <div className="flex items-center gap-2 justify-center p-3 bg-amber-subtle rounded-lg border border-amber-compliance/30">
                      <AlertTriangle className="w-4 h-4 text-amber-compliance" />
                      <span className="text-amber-compliance text-sm">All three signatures required before submission</span>
                    </div>
                  ) : (
                    <button
                      onClick={submitFiling}
                      className="btn-primary w-full py-3 text-base"
                    >
                      Submit Filing to Regulator
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => packageState.step > 1 && goToStep((packageState.step - 1) as PackageStep)}
                disabled={packageState.step === 1}
                className={`btn-secondary ${packageState.step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                ← Back
              </button>
              <div className="flex items-center gap-2">
                {([1, 2, 3, 4, 5] as PackageStep[]).map(s => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors ${packageState.step === s ? 'bg-purple-primary' : s < packageState.step ? 'bg-purple-dim' : 'bg-border'}`}
                  ></div>
                ))}
              </div>
              {packageState.step < 5 && (
                <button
                  onClick={advanceStep}
                  disabled={
                    (packageState.step === 1 && !canAdvanceFromStep1) ||
                    (packageState.step === 2 && !canAdvanceFromStep2)
                  }
                  className={`btn-primary ${((packageState.step === 1 && !canAdvanceFromStep1) || (packageState.step === 2 && !canAdvanceFromStep2)) ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Next →
                </button>
              )}
              {packageState.step === 5 && <div className="w-20"></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
