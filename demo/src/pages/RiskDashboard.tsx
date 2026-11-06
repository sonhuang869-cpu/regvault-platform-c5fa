import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, FileWarning, TrendingUp } from 'lucide-react';
import { regulations, controls, deficiencies, filingReports, risks } from '../lib/data';
import { getDaysUntil, formatDate } from '../lib/api';
import { RiskChip } from '../components/ui/RiskChip';
import { Badge } from '../components/ui/Badge';

// Derived stats
const totalObligations = regulations.length;
const compliantCount = regulations.filter(r => r.status === 'Compliant').length;
const atRiskCount = regulations.filter(r => r.status === 'At Risk').length;
const pendingCount = regulations.filter(r => r.status === 'Pending Review').length;

const totalControls = controls.length;
const effectiveControls = controls.filter(c => c.result === 'Effective').length;
const effectivenessRate = Math.round((effectiveControls / totalControls) * 100);

const openDeficiencies = deficiencies.filter(d => d.status !== 'Resolved').length;
const criticalDeficiencies = deficiencies.filter(d => d.severity === 'Significant' || d.severity === 'Material').length;

const upcomingFilings = filingReports.filter(f => f.status !== 'Filed').length;
const criticalFilings = filingReports.filter(f => f.priority === 'Critical' && f.status !== 'Filed').length;

// Issue count by regulation for stacked bar
const issuesByRegulation = regulations.map(reg => {
  const regDeficiencies = deficiencies.filter(d => d.regulationIds.includes(reg.id));
  const significant = regDeficiencies.filter(d => d.severity === 'Significant' || d.severity === 'Material').length;
  const minor = regDeficiencies.filter(d => d.severity === 'Minor').length;
  return { name: reg.name, Significant: significant, Minor: minor };
}).filter(d => d.Significant + d.Minor > 0);

// Upcoming filings
const upcomingFilingsSorted = [...filingReports]
  .filter(f => f.status !== 'Filed')
  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  .slice(0, 5);

// Residual risk table
const residualRiskData = regulations.map(reg => {
  const regRisks = risks.filter(r => r.regulationId === reg.id);
  const maxScore = regRisks.reduce((max, r) => Math.max(max, r.residualScore), 0);
  const avgControl = regRisks.length > 0
    ? Math.round(regRisks.reduce((sum, r) => sum + r.controlStrength, 0) / regRisks.length)
    : 100;
  const issueCount = regRisks.reduce((sum, r) => sum + r.issueCount, 0);
  return { reg, maxScore, avgControl, issueCount };
});

// Effectiveness trend (aggregate across all controls, last 4 quarters)
const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
const trendData = quarters.map(q => {
  const scores = controls.map(c => {
    const entry = c.effectivenessHistory.find(h => h.quarter === q);
    return entry?.score ?? 0;
  });
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  return { quarter: q.replace(' 2024', ''), score: avg };
});

function getDaysColor(days: number) {
  if (days <= 7) return 'text-red-compliance';
  if (days <= 30) return 'text-amber-compliance';
  return 'text-text-secondary';
}

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-raised border border-border rounded-lg p-3 text-xs shadow-lg">
        <p className="text-text-primary font-medium mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

interface HeatmapCell {
  likelihood: number;
  impact: number;
  risksInCell: typeof risks;
}

export default function RiskDashboard() {
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);

  function getCellRisks(likelihood: number, impact: number) {
    return risks.filter(r => r.likelihood === likelihood && r.impact === impact);
  }

  function getCellColor(likelihood: number, impact: number): string {
    const score = likelihood * impact;
    if (score >= 15) return 'bg-red-compliance/30 hover:bg-red-compliance/50 border-red-compliance/40';
    if (score >= 9) return 'bg-amber-compliance/25 hover:bg-amber-compliance/40 border-amber-compliance/40';
    if (score >= 4) return 'bg-blue-compliance/20 hover:bg-blue-compliance/35 border-blue-compliance/30';
    return 'bg-surface-raised hover:bg-border border-border';
  }

  const kpiCards = [
    {
      label: 'Total Obligations',
      value: totalObligations,
      icon: CheckCircle2,
      iconColor: 'text-green-compliance',
      bgColor: 'bg-green-subtle',
      sub: `${compliantCount} compliant · ${atRiskCount} at risk · ${pendingCount} pending`,
    },
    {
      label: 'Controls Tested',
      value: `${effectiveControls}/${totalControls}`,
      icon: TrendingUp,
      iconColor: 'text-purple-light',
      bgColor: 'bg-purple-subtle',
      sub: `${effectivenessRate}% effective rate`,
    },
    {
      label: 'Open Deficiencies',
      value: openDeficiencies,
      icon: AlertTriangle,
      iconColor: 'text-amber-compliance',
      bgColor: 'bg-amber-subtle',
      sub: `${criticalDeficiencies} significant or material`,
    },
    {
      label: 'Upcoming Filings',
      value: upcomingFilings,
      icon: FileWarning,
      iconColor: 'text-blue-compliance',
      bgColor: 'bg-blue-subtle',
      sub: `${criticalFilings} critical priority`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="card flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div>
              <div className="text-text-muted text-xs font-medium mb-0.5">{card.label}</div>
              <div className="text-text-primary font-semibold text-2xl font-mono leading-none mb-1">
                {card.value}
              </div>
              <div className="text-text-muted text-xs">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Heat Map */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-text-primary font-semibold text-sm">Compliance Risk Heat Map</h2>
            <p className="text-text-muted text-xs mt-0.5">Click a cell to see risks in that quadrant</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-compliance/30 inline-block"></span> Low
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-compliance/30 inline-block"></span> Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-compliance/30 inline-block"></span> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-compliance/30 inline-block"></span> Critical
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <div className="text-text-muted text-xs font-medium mb-2 rotate-180 [writing-mode:vertical-lr]">
              Impact →
            </div>
          </div>
          <div className="flex-1">
            <div className="grid" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)', gap: '4px' }}>
              {/* Y-axis labels + grid */}
              {[5, 4, 3, 2, 1].map(impact => (
                <React.Fragment key={impact}>
                  <div className="flex items-center justify-end pr-2 text-xs text-text-muted font-mono w-6">
                    {impact}
                  </div>
                  {[1, 2, 3, 4, 5].map(likelihood => {
                    const cellRisks = getCellRisks(likelihood, impact);
                    const isSelected = selectedCell?.likelihood === likelihood && selectedCell?.impact === impact;
                    return (
                      <button
                        key={`${likelihood}-${impact}`}
                        onClick={() =>
                          setSelectedCell(
                            isSelected ? null : { likelihood, impact, risksInCell: cellRisks }
                          )
                        }
                        className={`aspect-square rounded-lg border transition-all flex flex-wrap items-center justify-center gap-1 p-1.5 min-h-[52px] ${getCellColor(likelihood, impact)} ${isSelected ? 'ring-2 ring-purple-primary' : ''}`}
                      >
                        {cellRisks.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {cellRisks.slice(0, 4).map(r => (
                              <div
                                key={r.id}
                                title={r.name}
                                className="w-2 h-2 rounded-full bg-text-primary/80"
                              ></div>
                            ))}
                            {cellRisks.length > 4 && (
                              <span className="text-xs text-text-secondary">+{cellRisks.length - 4}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
              {/* X-axis labels */}
              <div></div>
              {[1, 2, 3, 4, 5].map(l => (
                <div key={l} className="text-center text-xs text-text-muted font-mono pt-1">{l}</div>
              ))}
            </div>
            <div className="text-center text-xs text-text-muted mt-2">Likelihood →</div>
          </div>

          {/* Selected cell risks */}
          {selectedCell && (
            <div className="w-72 border border-border rounded-lg p-3">
              <div className="text-text-primary text-xs font-medium mb-2">
                Likelihood {selectedCell.likelihood} × Impact {selectedCell.impact}
                <RiskChip score={selectedCell.likelihood * selectedCell.impact} />
              </div>
              {selectedCell.risksInCell.length === 0 ? (
                <p className="text-text-muted text-xs">No risks in this quadrant</p>
              ) : (
                <div className="space-y-2">
                  {selectedCell.risksInCell.map(r => (
                    <div key={r.id} className="bg-surface-raised rounded-lg p-2">
                      <div className="text-text-primary text-xs font-medium">{r.name}</div>
                      <div className="text-text-muted text-xs mt-0.5">{r.regulationName}</div>
                      <div className="text-text-secondary text-xs mt-1 leading-relaxed">{r.description}</div>
                      <div className="mt-1.5">
                        <Badge variant={r.mitigationStatus === 'Mitigated' ? 'green' : r.mitigationStatus === 'Partially Mitigated' ? 'amber' : 'red'} size="sm">
                          {r.mitigationStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Open Issues by Regulation */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Open Issues by Regulation</h2>
          {issuesByRegulation.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={issuesByRegulation} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" />
                <XAxis dataKey="name" tick={{ fill: '#8A9BB8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8A9BB8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#8A9BB8' }} />
                <Bar dataKey="Significant" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Minor" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">
              No open deficiencies
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Upcoming Filing Deadlines</h2>
          <div className="space-y-2">
            {upcomingFilingsSorted.map(filing => {
              const days = getDaysUntil(filing.dueDate);
              return (
                <div
                  key={filing.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-text-primary text-xs font-medium truncate">{filing.reportName}</div>
                    <div className="text-text-muted text-xs mt-0.5">{formatDate(filing.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={filing.priority === 'Critical' ? 'red' : filing.priority === 'Standard' ? 'amber' : 'blue'} size="sm">
                      {filing.priority}
                    </Badge>
                    <span className={`text-xs font-mono font-medium ${getDaysColor(days)}`}>
                      {days}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Effectiveness Trend + Residual Risk Table */}
      <div className="grid grid-cols-2 gap-4">
        {/* Effectiveness Trend */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Avg Control Effectiveness — 2024</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3347" />
              <XAxis dataKey="quarter" tick={{ fill: '#8A9BB8', fontSize: 11 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#8A9BB8', fontSize: 11 }} />
              <Tooltip content={({ active, payload, label }) => (
                active && payload?.length ? (
                  <div className="bg-surface-raised border border-border rounded-lg p-2 text-xs">
                    <p className="text-text-secondary">{label}</p>
                    <p className="text-purple-light font-mono">{payload[0].value}% effective</p>
                  </div>
                ) : null
              )} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Residual Risk Table */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Residual Risk by Obligation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted pb-2 font-medium">Regulation</th>
                  <th className="text-center text-text-muted pb-2 font-medium">Score</th>
                  <th className="text-center text-text-muted pb-2 font-medium">Control</th>
                  <th className="text-center text-text-muted pb-2 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {residualRiskData.map(({ reg, maxScore, avgControl, issueCount }) => (
                  <tr key={reg.id} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 text-text-primary font-medium pr-2">{reg.name}</td>
                    <td className="py-1.5 text-center">
                      <RiskChip score={maxScore} />
                    </td>
                    <td className="py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${avgControl >= 85 ? 'bg-green-compliance' : avgControl >= 70 ? 'bg-amber-compliance' : 'bg-red-compliance'}`}
                            style={{ width: `${avgControl}%` }}
                          ></div>
                        </div>
                        <span className="text-text-secondary font-mono">{avgControl}%</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-center">
                      <span className={`font-mono font-medium ${issueCount > 0 ? 'text-amber-compliance' : 'text-text-muted'}`}>
                        {issueCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deadline proximity indicator row */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Clock className="w-3.5 h-3.5" />
        <span>All times reference current date. Days remaining shown as actual calendar days.</span>
      </div>
    </div>
  );
}
