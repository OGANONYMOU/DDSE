import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { HazardCheckItem } from '../../types/safety';

interface Props {
  items:     HazardCheckItem[];
  editable?: boolean;
  onChange?: (id: string, value: boolean | null) => void;
}

function StatusIcon({ v }: { v: boolean | null }) {
  if (v === true)  return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (v === false) return <XCircle      className="h-4 w-4 text-rose-400 shrink-0" />;
  return                 <MinusCircle  className="h-4 w-4 text-slate-500 shrink-0" />;
}

export default function HazardChecklist({ items, editable = false, onChange }: Props) {
  const pass   = items.filter((i) => i.compliant === true).length;
  const fail   = items.filter((i) => i.compliant === false).length;
  const unsure = items.filter((i) => i.compliant === null).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[9px] font-mono font-black uppercase">
        <span className="text-emerald-400">{pass} Pass</span>
        <span className="text-rose-400">{fail} Fail</span>
        {unsure > 0 && <span className="text-slate-500">{unsure} N/A</span>}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border p-4 transition ${
            item.compliant === false
              ? 'border-rose-500/20 bg-rose-950/20'
              : item.compliant === true
              ? 'border-slate-800/40 bg-slate-950/50'
              : 'border-slate-800/60 bg-slate-950/70'
          }`}
        >
          <div className="flex items-start gap-3">
            {editable ? (
              <div className="flex gap-1.5 shrink-0 mt-0.5">
                {([true, false, null] as Array<boolean | null>).map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => onChange?.(item.id, v)}
                    className={`rounded p-0.5 transition ${item.compliant === v ? 'opacity-100' : 'opacity-30 hover:opacity-70'}`}
                  >
                    <StatusIcon v={v} />
                  </button>
                ))}
              </div>
            ) : (
              <StatusIcon v={item.compliant} />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-200 leading-relaxed">{item.prompt}</p>
              {item.notes && (
                <p className="mt-1.5 text-[10px] font-mono text-slate-500 italic">{item.notes}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
