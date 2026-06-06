// N-2: Inspection Scheduling / Calendar Module
// Uses react-day-picker (already in deps) for the calendar view.

import { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarDays, Plus, Clock, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  listSchedules, createSchedule, groupByDate,
  type InspectionSchedule, type ScheduleFrequency,
} from '../services/schedules';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';

import 'react-day-picker/dist/style.css';

const STATUS_COLOR: Record<string, string> = {
  scheduled:   'bg-sky-500',
  confirmed:   'bg-emerald-500',
  in_progress: 'bg-amber-500',
  completed:   'bg-slate-500',
  cancelled:   'bg-rose-700',
  overdue:     'bg-rose-500 animate-pulse',
};

const FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
  weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly',
  biannual: 'Bi-Annual', annual: 'Annual', one_off: 'One-off',
};

export default function SchedulePage() {
  const { user }  = useAuth();
  const [month,      setMonth]      = useState(new Date());
  const [schedules,  setSchedules]  = useState<InspectionSchedule[]>([]);
  const [selected,   setSelected]   = useState<Date | undefined>(new Date());
  const [loading,    setLoading]    = useState(true);
  const [composing,  setComposing]  = useState(false);
  const [form, setForm] = useState({
    title: '', moduleCode: '', frequency: 'quarterly' as ScheduleFrequency,
    scheduledDate: format(new Date(), 'yyyy-MM-dd'), notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSchedules({
        from: format(startOfMonth(month), 'yyyy-MM-dd'),
        to:   format(endOfMonth(month),   'yyyy-MM-dd'),
      });
      setSchedules(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  const byDate    = groupByDate(schedules);
  const selectedKey = selected ? format(selected, 'yyyy-MM-dd') : null;
  const dayItems  = selectedKey ? (byDate[selectedKey] ?? []) : [];

  // Dates with schedules — shown as coloured dots on calendar
  const modifiers = {
    hasSchedule: schedules.map((s) => new Date(s.scheduledDate + 'T12:00:00')),
    overdue:     schedules.filter((s) => s.status === 'overdue').map((s) => new Date(s.scheduledDate + 'T12:00:00')),
  };

  const modifiersStyles = {
    hasSchedule: { border: '2px solid #38bdf8', borderRadius: '50%' },
    overdue:     { border: '2px solid #ef4444', borderRadius: '50%' },
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.moduleCode) { toast.error('Title and module are required.'); return; }
    try {
      await createSchedule({
        title:            form.title,
        moduleCode:       form.moduleCode,
        directorateCode:  user.directorateCode,
        unitId:           null,
        frequency:        form.frequency,
        scheduledDate:    form.scheduledDate,
        scheduledTime:    null,
        leadInspectorId:  user.id,
        status:           'scheduled',
        notes:            form.notes || null,
        nextOccurrence:   null,
        createdBy:        user.id,
      }, user.id);
      toast.success('Inspection scheduled.');
      setComposing(false);
      setForm({ title: '', moduleCode: '', frequency: 'quarterly', scheduledDate: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create schedule.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspection Schedule"
        subtitle="Plan, assign and track upcoming inspections by date"
        action={
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex items-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15"
          >
            <Plus className="h-3.5 w-3.5" />
            Schedule Inspection
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'This Month',  value: schedules.length,                                          color: 'text-white' },
          { label: 'Scheduled',   value: schedules.filter((s) => s.status === 'scheduled').length,  color: 'text-sky-400' },
          { label: 'Overdue',     value: schedules.filter((s) => s.status === 'overdue').length,    color: 'text-rose-400' },
          { label: 'Completed',   value: schedules.filter((s) => s.status === 'completed').length,  color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800/60 bg-slate-950/70 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${s.color}`}>{loading ? '…' : s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Calendar */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
          <style>{`
            .rdp { --rdp-accent-color: #0ea5e9; --rdp-background-color: #0f172a; font-size: 12px; }
            .rdp-day_selected { background: #0ea5e9 !important; }
            .rdp-day { color: #94a3b8; }
            .rdp-day:hover { background: #1e293b !important; }
            .rdp-head_cell { color: #475569; font-size: 10px; }
            .rdp-caption_label { color: #e2e8f0; font-size: 12px; }
            .rdp-nav_button { color: #64748b; }
          `}</style>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            month={month}
            onMonthChange={setMonth}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </div>

        {/* Day panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {selected ? format(selected, 'EEEE, d MMMM yyyy') : 'Select a date'}
            </p>
            {dayItems.length > 0 && (
              <span className="rounded border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-sky-400">
                {dayItems.length} inspection{dayItems.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            </div>
          ) : dayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 py-12 text-center">
              <CalendarDays className="h-8 w-8 text-slate-700" />
              <p className="mt-2 text-[11px] font-mono uppercase text-slate-600">
                {selected ? 'No inspections scheduled for this day' : 'Select a date to view inspections'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayItems.map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-white">{s.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-mono uppercase text-slate-600">{s.moduleCode}</span>
                      <span className="text-[9px] font-mono uppercase text-slate-600">·</span>
                      <span className="text-[9px] font-mono uppercase text-slate-600">{FREQUENCY_LABELS[s.frequency]}</span>
                      {s.scheduledTime && (
                        <span className="flex items-center gap-1 text-[9px] font-mono text-slate-600">
                          <Clock className="h-2.5 w-2.5" />{s.scheduledTime.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    {s.notes && <p className="mt-1 text-[10px] font-mono text-slate-500 italic">{s.notes}</p>}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800/60 bg-slate-950/95 p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-sky-400" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-white">Schedule Inspection</h3>
            </div>
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              {[
                { label: 'Title',   field: 'title',      type: 'text',   placeholder: 'e.g. Q1 Barracks Structural Inspection' },
                { label: 'Module',  field: 'moduleCode', type: 'text',   placeholder: 'e.g. BARRACKS' },
                { label: 'Date',    field: 'scheduledDate', type: 'date', placeholder: '' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</label>
                  <input
                    type={type} placeholder={placeholder} required
                    value={form[field as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-[11px] font-mono text-slate-300 outline-none focus:border-sky-500/50"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as ScheduleFrequency }))}
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-[11px] font-mono text-slate-300 outline-none"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Notes</label>
                <textarea
                  rows={2} placeholder="Optional notes..."
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-[11px] font-mono text-slate-300 outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setComposing(false)}
                  className="flex-1 rounded-xl border border-slate-700/60 py-2.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-300 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 rounded-xl bg-sky-600 py-2.5 text-[10px] font-black uppercase text-white hover:bg-sky-500 transition">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
