import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import type { MockQuestion } from '../../lib/mock-data';

export type QuestionResponse =
  | { type: 'boolean'; value: 'yes' | 'no' | 'na' | null }
  | { type: 'rating';  value: number | null }
  | { type: 'text';    value: string }
  | { type: 'risk';    value: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null }
  | { type: 'select';  value: string | null };

interface Props {
  question:  MockQuestion;
  response:  QuestionResponse | undefined;
  onChange:  (response: QuestionResponse) => void;
}

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const RISK_COLOR: Record<string, string> = {
  LOW:      'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  MEDIUM:   'border-amber-500/40 bg-amber-500/10 text-amber-400',
  HIGH:     'border-rose-500/40 bg-rose-500/10 text-rose-400',
  CRITICAL: 'border-rose-400/60 bg-rose-400/15 text-rose-300',
};

const RISK_IDLE = 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300';

function BooleanInput({ value, onChange }: { value: 'yes' | 'no' | 'na' | null; onChange: (v: 'yes' | 'no' | 'na') => void }) {
  const btn = (label: string, v: 'yes' | 'no' | 'na', icon: React.ReactNode, activeClass: string) => (
    <button
      key={v}
      type="button"
      onClick={() => onChange(v)}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
        value === v ? activeClass : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex gap-2">
      {btn('Yes', 'yes', <CheckCircle2 className="h-3 w-3" />, 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400')}
      {btn('No',  'no',  <XCircle      className="h-3 w-3" />, 'border-rose-500/40 bg-rose-500/10 text-rose-400')}
      {btn('N/A', 'na',  <MinusCircle  className="h-3 w-3" />, 'border-slate-600/60 bg-slate-800/40 text-slate-400')}
    </div>
  );
}

function RatingInput({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-8 w-8 rounded-lg border text-[11px] font-black transition ${
            value === n
              ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
              : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function RiskInput({ value, onChange }: { value: string | null; onChange: (v: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {RISK_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
            value === level ? RISK_COLOR[level] : RISK_IDLE
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter remarks..."
      className="w-full resize-none rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2.5 text-[11px] font-mono text-slate-300 placeholder:text-slate-600 outline-none transition focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20"
    />
  );
}

function SelectInput({ options = [], value, onChange }: { options?: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
            value === opt
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              : 'border-slate-800/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function QuestionRenderer({ question, response, onChange }: Props) {
  const isAnswered = response !== undefined && response.value !== null && response.value !== '';

  return (
    <div className={`rounded-xl border p-4 transition ${isAnswered ? 'border-slate-800/40 bg-slate-950/50' : 'border-slate-800/60 bg-slate-950/70'}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className="shrink-0 rounded-md border border-slate-800/60 bg-slate-900/60 px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
          {question.code}
        </span>
        <p className="text-[12px] text-slate-200 leading-relaxed">
          {question.prompt}
          {question.required && <span className="ml-1 text-rose-500">*</span>}
        </p>
      </div>

      <div className="pl-8">
        {question.type === 'boolean' && (
          <BooleanInput
            value={(response as { type: 'boolean'; value: 'yes' | 'no' | 'na' | null } | undefined)?.value ?? null}
            onChange={(v) => onChange({ type: 'boolean', value: v })}
          />
        )}

        {question.type === 'rating' && (
          <RatingInput
            value={(response as { type: 'rating'; value: number | null } | undefined)?.value ?? null}
            onChange={(v) => onChange({ type: 'rating', value: v })}
          />
        )}

        {question.type === 'text' && (
          <TextInput
            value={(response as { type: 'text'; value: string } | undefined)?.value ?? ''}
            onChange={(v) => onChange({ type: 'text', value: v })}
          />
        )}

        {question.type === 'risk' && (
          <RiskInput
            value={(response as { type: 'risk'; value: string | null } | undefined)?.value ?? null}
            onChange={(v) => onChange({ type: 'risk', value: v })}
          />
        )}

        {question.type === 'select' && (
          <SelectInput
            options={question.options}
            value={(response as { type: 'select'; value: string | null } | undefined)?.value ?? null}
            onChange={(v) => onChange({ type: 'select', value: v })}
          />
        )}
      </div>
    </div>
  );
}
