// N-1: GIS Sector Map — SVG-based schematic showing sector readiness heat-map,
// active hazard zones, and inspection coverage. No external map library required.

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, MapPin, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SectorData {
  code:              string;
  name:              string;
  avgScore:          number;
  activeInspections: number;
  criticalHazards:   number;
  alertLevel:        string;
  // SVG position (schematic layout, not geographic coordinates)
  x:   number;
  y:   number;
  w:   number;
  h:   number;
}

// Schematic layout — fixed positions representing command geography
const SECTOR_LAYOUT: Record<string, Pick<SectorData, 'x' | 'y' | 'w' | 'h'>> = {
  SECTOR_ALPHA:   { x: 20,  y: 20,  w: 200, h: 140 },
  SECTOR_BRAVO:   { x: 240, y: 20,  w: 180, h: 140 },
  SECTOR_CHARLIE: { x: 20,  y: 180, w: 200, h: 140 },
  SECTOR_DELTA:   { x: 240, y: 180, w: 180, h: 140 },
};

function scoreToColor(score: number): string {
  if (score >= 90) return '#10b981'; // emerald — optimal
  if (score >= 75) return '#38bdf8'; // sky — active
  if (score >= 60) return '#f59e0b'; // amber — guarded
  if (score >= 45) return '#f97316'; // orange — warning
  return '#ef4444';                   // red — critical
}

function scoreToFill(score: number): string {
  const hex = scoreToColor(score);
  return hex + '20'; // 12% opacity fill
}

function HazardMarker({ x, y, pulse }: { x: number; y: number; pulse: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={0} r={6} fill="#ef4444" opacity={0.9} />
      {pulse && (
        <circle cx={0} cy={0} r={10} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.4}>
          <animate attributeName="r" from="6" to="14" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

function InspectionMarker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={0} r={4} fill="#38bdf8" opacity={0.8} />
    </g>
  );
}

export default function SectorMapView() {
  const [sectors, setSectors]   = useState<SectorData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [sectorResult, hazardResult] = await Promise.all([
          supabase.from('sector_readiness').select('*'),
          supabase.from('hazard_assessments')
            .select('directorate_code, risk_level, workflow_status')
            .eq('risk_level', 'CRITICAL')
            .neq('workflow_status', 'closed'),
        ]);

        const hazardsByDir: Record<string, number> = {};
        for (const h of hazardResult.data ?? []) {
          hazardsByDir[String(h.directorate_code)] = (hazardsByDir[String(h.directorate_code)] ?? 0) + 1;
        }

        const built: SectorData[] = (sectorResult.data ?? []).map((row) => ({
          code:              String(row.code),
          name:              String(row.name),
          avgScore:          Number(row.avg_score ?? 0),
          activeInspections: Number(row.active_inspections ?? 0),
          criticalHazards:   hazardsByDir[String(row.directorate_code)] ?? 0,
          alertLevel:        String(row.alert_level ?? 'Normal'),
          ...(SECTOR_LAYOUT[String(row.code)] ?? { x: 0, y: 0, w: 100, h: 100 }),
        }));

        // Add any sectors defined in layout but not in DB (show as unknown)
        for (const [code, pos] of Object.entries(SECTOR_LAYOUT)) {
          if (!built.find((s) => s.code === code)) {
            built.push({ code, name: code, avgScore: 0, activeInspections: 0, criticalHazards: 0, alertLevel: 'Normal', ...pos });
          }
        }

        setSectors(built);
      } catch { /* use empty state */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedSector = sectors.find((s) => s.code === selected);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Sector Readiness Map
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-slate-600">
          {[['#10b981','≥90 Optimal'],['#38bdf8','≥75 Active'],['#f59e0b','≥60 Guarded'],['#ef4444','<60 Warning']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* SVG Map */}
        <div className="flex-1 p-4">
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            </div>
          ) : (
            <svg
              viewBox="0 0 440 340"
              className="w-full"
              style={{ maxHeight: '340px' }}
              aria-label="DDSE sector readiness map"
            >
              {/* Grid background */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="440" height="340" fill="url(#grid)" opacity={0.5} />

              {/* Sector zones */}
              {sectors.map((s) => (
                <g
                  key={s.code}
                  onClick={() => setSelected(selected === s.code ? null : s.code)}
                  className="cursor-pointer"
                >
                  {/* Zone fill */}
                  <rect
                    x={s.x} y={s.y} width={s.w} height={s.h}
                    rx={8}
                    fill={scoreToFill(s.avgScore)}
                    stroke={scoreToColor(s.avgScore)}
                    strokeWidth={selected === s.code ? 2.5 : 1.5}
                    strokeOpacity={0.6}
                  />

                  {/* Score ring */}
                  <circle
                    cx={s.x + s.w / 2} cy={s.y + s.h / 2} r={28}
                    fill={scoreToFill(s.avgScore)}
                    stroke={scoreToColor(s.avgScore)}
                    strokeWidth={2}
                  />
                  <text
                    x={s.x + s.w / 2} y={s.y + s.h / 2 + 5}
                    textAnchor="middle"
                    fill={scoreToColor(s.avgScore)}
                    fontSize={14} fontWeight="900" fontFamily="monospace"
                  >
                    {s.avgScore > 0 ? `${Math.round(s.avgScore)}` : '—'}
                  </text>
                  <text
                    x={s.x + s.w / 2} y={s.y + s.h / 2 + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={7} fontFamily="monospace"
                  >
                    SCORE
                  </text>

                  {/* Sector label */}
                  <text
                    x={s.x + 10} y={s.y + 18}
                    fill="#94a3b8" fontSize={8} fontWeight="700" fontFamily="monospace"
                  >
                    {s.code.replace('SECTOR_', '')}
                  </text>

                  {/* Hazard markers (bottom-left cluster) */}
                  {s.criticalHazards > 0 && (
                    <>
                      {Array.from({ length: Math.min(s.criticalHazards, 4) }).map((_, i) => (
                        <HazardMarker
                          key={i}
                          x={s.x + 10 + i * 16}
                          y={s.y + s.h - 14}
                          pulse={s.criticalHazards > 0}
                        />
                      ))}
                      <text
                        x={s.x + 10 + Math.min(s.criticalHazards, 4) * 16 + 4}
                        y={s.y + s.h - 10}
                        fill="#ef4444" fontSize={7} fontFamily="monospace"
                      >
                        {s.criticalHazards > 4 ? `+${s.criticalHazards}` : ''}
                      </text>
                    </>
                  )}

                  {/* Inspection markers (top-right) */}
                  {Array.from({ length: Math.min(s.activeInspections, 5) }).map((_, i) => (
                    <InspectionMarker
                      key={i}
                      x={s.x + s.w - 12 - i * 10}
                      y={s.y + 14}
                    />
                  ))}
                </g>
              ))}

              {/* Legend markers */}
              <g transform="translate(10,318)">
                <circle cx={4} cy={4} r={4} fill="#ef4444" opacity={0.9} />
                <text x={12} y={8} fill="#64748b" fontSize={7} fontFamily="monospace">CRITICAL HAZARD</text>
                <circle cx={100} cy={4} r={3} fill="#38bdf8" opacity={0.8} />
                <text x={108} y={8} fill="#64748b" fontSize={7} fontFamily="monospace">ACTIVE INSPECTION</text>
              </g>
            </svg>
          )}
        </div>

        {/* Detail panel */}
        <div className="w-full border-t border-slate-800/60 p-4 lg:w-56 lg:border-l lg:border-t-0">
          {selectedSector ? (
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Selected Sector</p>
                <p className="mt-1 text-[12px] font-bold text-white leading-snug">{selectedSector.name}</p>
              </div>
              {[
                { label: 'Readiness Score', value: `${Math.round(selectedSector.avgScore)}%`, color: scoreToColor(selectedSector.avgScore) },
                { label: 'Alert Level',      value: selectedSector.alertLevel, color: '#94a3b8' },
                { label: 'Active Inspections', value: String(selectedSector.activeInspections), color: '#38bdf8' },
                { label: 'Critical Hazards',   value: String(selectedSector.criticalHazards),   color: selectedSector.criticalHazards > 0 ? '#ef4444' : '#10b981' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2 border-b border-slate-800/30 pb-2 last:border-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{row.label}</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: row.color }}>{row.value}</p>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-full rounded-lg border border-slate-800/60 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:text-slate-400 transition"
              >
                Deselect
              </button>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <MapPin className="h-8 w-8 text-slate-700" />
              <p className="mt-2 text-[10px] font-mono uppercase text-slate-600">
                Click a sector to inspect
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
