import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Shield, ShieldAlert, Snowflake, Flag, Trash2, UserPlus, Search,
  Mail, Phone, Copy, X, Loader2, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { CLEARANCE_LABELS, ROLE_CONFIGS, type RoleCode, type ClearanceLevel } from '../lib/rbac';
import {
  listPersonnel, createPersonnel, updatePersonnelStatus, softDeletePersonnel,
  flagPersonnel, unflagPersonnel, getRegistrationFormOptions,
} from '../lib/api';
import type { PersonnelRecord, RegistrationFormOptions } from '../types/platform';

const STATUS_STYLES: Record<string, string> = {
  active:    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  pending:   'text-amber-400  border-amber-500/30  bg-amber-500/10',
  suspended: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  inactive:  'text-slate-400  border-slate-700/40  bg-slate-800/20',
  deleted:   'text-rose-400   border-rose-500/30   bg-rose-500/10',
};

const ASSIGNABLE_ROLES = (Object.keys(ROLE_CONFIGS) as RoleCode[])
  .filter((code) => code !== 'platform_owner')
  .map((code) => ({ code, label: ROLE_CONFIGS[code].label }));

const emptyNewPersonnel = {
  fullName: '', serviceNumber: '', rankCode: '', directorateCode: '',
  roleCode: 'staff', email: '', phoneNumber: '',
};

export default function PersonnelDossier() {
  const { user } = useAuth();
  const permission = usePermission();
  const canViewAll = permission.can('personnel.view_all');
  const canManage  = permission.can('personnel.manage');

  const [officers, setOfficers]   = useState<PersonnelRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery]         = useState('');
  const [busyId, setBusyId]       = useState<string | null>(null);

  const [formOptions, setFormOptions] = useState<RegistrationFormOptions | null>(null);
  const [addOpen, setAddOpen]         = useState(false);
  const [addForm, setAddForm]         = useState(emptyNewPersonnel);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ serviceNumber: string; temporaryPassword: string } | null>(null);

  async function load() {
    if (!canViewAll) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await listPersonnel();
      setOfficers(data);
      setSelectedId((current) => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    if (canManage) {
      getRegistrationFormOptions().then(setFormOptions).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAll, canManage]);

  const rankLabel = (code: string | null) =>
    formOptions?.ranks.find((r) => r.code === code)?.label ?? code ?? 'Not on file';
  const directorateLabel = (code: string) =>
    formOptions?.directorates.find((d) => d.code === code)?.name ?? code;
  const roleLabel = (code: string) => ROLE_CONFIGS[code as RoleCode]?.label ?? code;
  const clearanceLabel = (level: number | null) =>
    level ? CLEARANCE_LABELS[level as ClearanceLevel] : '—';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return officers;
    return officers.filter((o) =>
      o.fullName.toLowerCase().includes(q) || o.serviceNumber.toLowerCase().includes(q)
    );
  }, [officers, query]);

  const currentOfficer = filtered.find((o) => o.id === selectedId) ?? officers.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  async function runAction(id: string, label: string, action: () => Promise<void>) {
    setBusyId(id);
    try {
      await action();
      await load();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  function handleFreeze(o: PersonnelRecord) {
    const freezing = o.status !== 'suspended';
    const verb = freezing ? 'Freeze' : 'Unfreeze';
    if (!window.confirm(`${verb} ${o.fullName}'s account?`)) return;
    void runAction(o.id, `${o.fullName}'s account ${freezing ? 'frozen' : 'reactivated'}.`, () =>
      updatePersonnelStatus(o.id, freezing ? 'suspended' : 'active')
    );
  }

  function handleFlag(o: PersonnelRecord) {
    if (o.flagged) {
      if (!window.confirm(`Clear the flag on ${o.fullName}?`)) return;
      void runAction(o.id, `Flag cleared for ${o.fullName}.`, () => unflagPersonnel(o.id));
      return;
    }
    const reason = window.prompt(`Reason for flagging ${o.fullName}:`);
    if (!reason) return;
    void runAction(o.id, `${o.fullName} flagged for review.`, () => flagPersonnel(o.id, user.id, reason));
  }

  function handleDelete(o: PersonnelRecord) {
    if (!window.confirm(`Delete ${o.fullName}'s profile? This deactivates their account (soft-delete) and can be reversed by reactivating status.`)) return;
    void runAction(o.id, `${o.fullName}'s profile deleted.`, () => softDeletePersonnel(o.id));
  }

  async function handleCreate() {
    if (!addForm.fullName || !addForm.serviceNumber || !addForm.rankCode || !addForm.directorateCode) {
      toast.error('Full name, service number, rank and directorate are required.');
      return;
    }
    setAddSubmitting(true);
    try {
      const result = await createPersonnel(addForm);
      setCreatedCredentials({ serviceNumber: result.serviceNumber, temporaryPassword: result.temporaryPassword });
      setAddForm(emptyNewPersonnel);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create personnel record.');
    } finally {
      setAddSubmitting(false);
    }
  }

  function closeAddModal() {
    setAddOpen(false);
    setCreatedCredentials(null);
    setAddForm(emptyNewPersonnel);
  }

  if (!canViewAll) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-rose-400/60" />
        <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">Restricted</p>
        <p className="mt-1 text-[11px] font-mono text-slate-600">Personnel records are visible to super admins and admins only.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-12 font-sans text-white">
      {/* ── LEFT: ROSTER LIST ── */}
      <div className="xl:col-span-4 space-y-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500/20" />
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-sky-400" />
              PERSONNEL ROSTER
            </h3>
            <span className="text-[10px] font-mono text-slate-600">{officers.length}</span>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or service number…"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none"
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[10px] font-mono text-rose-300">{error}</p>
          )}

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[84px] animate-pulse rounded-2xl border border-slate-900 bg-slate-900/40" />
              ))
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-[11px] font-mono text-slate-600">No personnel match.</p>
            ) : (
              filtered.map((off) => {
                const active = off.id === currentOfficer?.id;
                return (
                  <button
                    key={off.id}
                    onClick={() => setSelectedId(off.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative ${
                      active
                        ? 'border-sky-500/40 bg-sky-950/90 shadow-[0_0_15px_rgba(56,182,255,0.08)]'
                        : 'border-slate-900 bg-slate-950/40 hover:border-slate-800'
                    }`}
                    type="button"
                  >
                    <div className="flex justify-between items-center gap-2 text-[10px] font-mono text-slate-500">
                      <span>{off.serviceNumber}</span>
                      <span className={`rounded border px-1.5 py-0.5 font-bold uppercase ${STATUS_STYLES[off.status] ?? STATUS_STYLES.inactive}`}>
                        {off.status}
                      </span>
                    </div>
                    <h4 className="mt-1 flex items-center gap-1.5 text-sm font-black uppercase text-white">
                      {off.fullName}
                      {off.flagged && <Flag className="h-3 w-3 shrink-0 text-rose-400" />}
                    </h4>
                    <p className="mt-2 text-xs text-slate-400 font-mono">{roleLabel(off.roleCode)} · {directorateLabel(off.directorateCode)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/20"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Personnel
          </button>
        )}
      </div>

      {/* ── RIGHT: DOSSIER ── */}
      <div className="xl:col-span-8 space-y-6">
        {!currentOfficer ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-center text-[11px] font-mono text-slate-600">
            {loading ? 'Loading personnel records…' : 'Select a record from the roster.'}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-slate-900">
              <div className="flex items-center gap-5">
                <div className="relative h-20 w-20 rounded-2xl border border-sky-400/30 bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Shield className="h-10 w-10" />
                  <div className="absolute inset-1 rounded-xl border border-dashed border-sky-500/25" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 border border-rose-500/20 px-2 py-0.5 bg-rose-500/5 rounded">
                      {clearanceLabel(currentOfficer.clearanceLevel)}
                    </span>
                    {currentOfficer.flagged && (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 border border-rose-500/30 px-2 py-0.5 bg-rose-500/10 rounded">
                        <Flag className="h-2.5 w-2.5" /> Flagged
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider mt-1.5">{currentOfficer.fullName}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    SERVICE NO: {currentOfficer.serviceNumber} · RANK: {rankLabel(currentOfficer.rankCode)}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-500">
                <span>ACCOUNT STATUS</span>
                <span className={`mt-1 block rounded border px-2 py-1 text-sm font-black uppercase ${STATUS_STYLES[currentOfficer.status] ?? STATUS_STYLES.inactive}`}>
                  {currentOfficer.status}
                </span>
              </div>
            </div>

            {currentOfficer.flagged && currentOfficer.flaggedReason && (
              <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-rose-400">Flag Reason</p>
                <p className="mt-1 text-xs text-rose-200">{currentOfficer.flaggedReason}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-2 text-xs font-mono">
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider">Directorate</p>
                <p className="text-sm font-bold text-white uppercase">{directorateLabel(currentOfficer.directorateCode)}</p>
              </div>
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider">Assigned Role</p>
                <p className="text-sm font-bold text-white uppercase">{roleLabel(currentOfficer.roleCode)}</p>
              </div>
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p>
                <p className="text-sm font-bold text-white">{currentOfficer.email ?? 'Not on file'}</p>
              </div>
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p>
                <p className="text-sm font-bold text-white">{currentOfficer.phoneNumber ?? 'Not on file'}</p>
              </div>
              {currentOfficer.commandJurisdiction && (
                <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                  <p className="text-slate-500 uppercase text-[9px] tracking-wider">Command Jurisdiction</p>
                  <p className="text-sm font-bold text-white uppercase">{currentOfficer.commandJurisdiction}</p>
                </div>
              )}
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider">MFA Enrolled</p>
                <p className="text-sm font-bold text-white uppercase">{currentOfficer.mfaEnrolled ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider">Registered</p>
                <p className="text-sm font-bold text-white uppercase">{new Date(currentOfficer.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-900 bg-slate-950 p-4 space-y-2">
                <p className="text-slate-500 uppercase text-[9px] tracking-wider">Last Updated</p>
                <p className="text-sm font-bold text-white uppercase">{new Date(currentOfficer.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Super-admin actions */}
            {canManage && (
              <div className="mt-6 border-t border-slate-900 pt-6">
                <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Administrative Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === currentOfficer.id}
                    onClick={() => handleFreeze(currentOfficer)}
                    className="flex items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
                  >
                    <Snowflake className="h-3.5 w-3.5" />
                    {currentOfficer.status === 'suspended' ? 'Unfreeze Account' : 'Freeze Account'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === currentOfficer.id}
                    onClick={() => handleFlag(currentOfficer)}
                    className="flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {currentOfficer.flagged ? 'Clear Flag' : 'Flag for Review'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === currentOfficer.id || currentOfficer.status === 'deleted'}
                    onClick={() => handleDelete(currentOfficer)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-300 transition hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {currentOfficer.status === 'deleted' ? 'Deleted' : 'Delete Personnel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ADD PERSONNEL MODAL ── */}
      <AnimatePresence>
        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-lg overflow-hidden rounded-xl border border-sky-500/30 bg-[#040810] p-6 shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-sky-500" />

              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <div className="flex items-center gap-2 text-sky-400">
                  <UserPlus className="h-4 w-4" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Add Personnel</h4>
                </div>
                <button type="button" onClick={closeAddModal} className="rounded-lg bg-slate-900 p-1.5 text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {createdCredentials ? (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <p className="text-xs font-black uppercase tracking-wider">Account created</p>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    Share this temporary password with {createdCredentials.serviceNumber} — it won't be shown again. They'll be required to change it on first sign-in.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2.5">
                    <code className="flex-1 text-xs text-emerald-300">{createdCredentials.temporaryPassword}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(createdCredentials.temporaryPassword).then(() => toast.success('Copied.'));
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="w-full rounded-lg bg-sky-500/15 py-2 text-[10px] font-black uppercase text-sky-300 transition hover:bg-sky-500/25"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Full name *"
                      value={addForm.fullName}
                      onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                      className="col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none"
                    />
                    <input
                      placeholder="Service number *"
                      value={addForm.serviceNumber}
                      onChange={(e) => setAddForm((f) => ({ ...f, serviceNumber: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none"
                    />
                    <select
                      value={addForm.rankCode}
                      onChange={(e) => setAddForm((f) => ({ ...f, rankCode: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500/40 focus:outline-none"
                    >
                      <option value="">Rank *</option>
                      {formOptions?.ranks.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                    </select>
                    <select
                      value={addForm.directorateCode}
                      onChange={(e) => setAddForm((f) => ({ ...f, directorateCode: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500/40 focus:outline-none"
                    >
                      <option value="">Directorate *</option>
                      {formOptions?.directorates.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                    <select
                      value={addForm.roleCode}
                      onChange={(e) => setAddForm((f) => ({ ...f, roleCode: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500/40 focus:outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                    </select>
                    <input
                      placeholder="Email (optional)"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none"
                    />
                    <input
                      placeholder="Phone (optional)"
                      value={addForm.phoneNumber}
                      onChange={(e) => setAddForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-sky-500/40 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={addSubmitting}
                    onClick={handleCreate}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500/15 py-2.5 text-[10px] font-black uppercase text-sky-300 transition hover:bg-sky-500/25 disabled:opacity-50"
                  >
                    {addSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Create Account
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
