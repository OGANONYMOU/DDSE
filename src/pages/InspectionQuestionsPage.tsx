import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink } from 'react-router-dom';
import { Copy, FileQuestion, Layers3, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { getModuleTemplate, getModules, updateModuleTemplate, grantModuleEdit } from '../lib/api';
import { hasPermission } from '../lib/rbac';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import type {
  InspectionQuestionResponseType,
  InspectionTemplate,
  InspectionTemplateItem,
  ModuleDefinition,
  ModuleTemplateDefinition,
} from '../types/platform';

const RESPONSE_TYPES: Array<{ value: InspectionQuestionResponseType; label: string }> = [
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'score_5', label: 'Score 1-5' },
  { value: 'narrative', label: 'Narrative' },
  { value: 'checklist', label: 'Checklist' },
];

function cloneTemplate(template: InspectionTemplate): InspectionTemplate {
  return {
    sections: template.sections.map((section) => ({
      title: section.title,
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

function emptyQuestion(index: number): InspectionTemplateItem {
  return {
    code: String(index + 1),
    prompt: '',
    responseType: 'yes_no',
    weight: 10,
  };
}

function validateTemplate(template: InspectionTemplate): string | null {
  if (template.sections.length === 0) return 'Add at least one section.';
  for (const [sectionIndex, section] of template.sections.entries()) {
    if (!section.title.trim()) return `Section ${sectionIndex + 1} needs a title.`;
    if (section.items.length === 0) return `"${section.title}" needs at least one question.`;
    for (const [itemIndex, item] of section.items.entries()) {
      if (!item.prompt.trim()) return `Question ${itemIndex + 1} in "${section.title}" needs question text.`;
      if (!Number.isFinite(item.weight) || item.weight < 0 || item.weight > 100) {
        return `Question ${itemIndex + 1} in "${section.title}" needs a weight from 0 to 100.`;
      }
    }
  }
  return null;
}

export default function InspectionQuestionsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user.isPlatformOwner || user.roleCode === 'platform_owner' || user.roleCode === 'super_admin';
  const canView = hasPermission(user.roleCode, 'inspections.create') || isSuperAdmin;
  const [editingEnabled, setEditingEnabled] = useState(false);
  const canEdit = (hasPermission(user.roleCode, 'inspections.create') && !isSuperAdmin) || (isSuperAdmin && editingEnabled);

  const [modules, setModules] = useState<ModuleDefinition[]>([]);
  const [selectedCode, setSelectedCode] = useState('');
  const [moduleTemplate, setModuleTemplate] = useState<ModuleTemplateDefinition | null>(null);
  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getModules()
      .then((moduleRows) => {
        if (cancelled) return;
        const normalized = (moduleRows as unknown as Array<Record<string, unknown>>).map((m) => ({
          id: String(m.id ?? m.code ?? ''),
          moduleCode: String(m.moduleCode ?? m.code ?? ''),
          title: String(m.title ?? m.label ?? ''),
          classification: String(m.classification ?? 'general'),
          description: String(m.description ?? ''),
        }));
        setModules(normalized);
        setSelectedCode((current) => current || normalized[0]?.moduleCode || '');
      })
      .catch((err: Error) => toast.error(err.message))
      .finally(() => {
        if (!cancelled) setLoadingModules(false);
      });
    return () => { cancelled = true; };
  }, []);

  const loadTemplate = useCallback(async (moduleCode: string) => {
    if (!moduleCode) return;
    setLoadingTemplate(true);
    try {
      const next = await getModuleTemplate(moduleCode);
      const cloned = cloneTemplate(next.template ?? { sections: [] });
      setModuleTemplate(next);
      setTemplate(cloned);
      setSavedSnapshot(JSON.stringify(cloned));
      setActiveSectionIndex(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load questions.');
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplate(selectedCode);
  }, [selectedCode, loadTemplate]);

  const activeSection = template?.sections[activeSectionIndex] ?? null;
  const currentSnapshot = useMemo(() => JSON.stringify(template ?? { sections: [] }), [template]);
  const hasChanges = Boolean(template && currentSnapshot !== savedSnapshot);
  const questionCount = useMemo(
    () => template?.sections.reduce((sum, section) => sum + section.items.length, 0) ?? 0,
    [template],
  );

  function updateTemplate(mutator: (draft: InspectionTemplate) => void) {
    setTemplate((current) => {
      const next = cloneTemplate(current ?? { sections: [] });
      mutator(next);
      return next;
    });
  }

  function addSection() {
    updateTemplate((draft) => {
      draft.sections.push({ title: `Section ${draft.sections.length + 1}`, items: [emptyQuestion(0)] });
      setActiveSectionIndex(draft.sections.length - 1);
    });
  }

  function removeSection(index: number) {
    updateTemplate((draft) => {
      draft.sections.splice(index, 1);
      setActiveSectionIndex(Math.max(0, Math.min(index, draft.sections.length - 1)));
    });
  }

  function updateQuestion(sectionIndex: number, itemIndex: number, patch: Partial<InspectionTemplateItem>) {
    updateTemplate((draft) => {
      const item = draft.sections[sectionIndex]?.items[itemIndex];
      if (!item) return;
      Object.assign(item, patch);
    });
  }

  function addQuestion(sectionIndex: number) {
    updateTemplate((draft) => {
      const section = draft.sections[sectionIndex];
      if (!section) return;
      section.items.push(emptyQuestion(section.items.length));
    });
  }

  function duplicateQuestion(sectionIndex: number, itemIndex: number) {
    updateTemplate((draft) => {
      const section = draft.sections[sectionIndex];
      const item = section?.items[itemIndex];
      if (!section || !item) return;
      section.items.splice(itemIndex + 1, 0, {
        ...item,
        code: `${item.code || itemIndex + 1} copy`,
      });
    });
  }

  function removeQuestion(sectionIndex: number, itemIndex: number) {
    updateTemplate((draft) => {
      const section = draft.sections[sectionIndex];
      if (!section) return;
      section.items.splice(itemIndex, 1);
    });
  }

  async function handleSave() {
    if (!selectedCode || !template) return;
    const error = validateTemplate(template);
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const saved = await updateModuleTemplate(selectedCode, template);
      const cloned = cloneTemplate(saved.template);
      setModuleTemplate(saved);
      setTemplate(cloned);
      setSavedSnapshot(JSON.stringify(cloned));
      toast.success('Inspection questions updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save questions.');
    } finally {
      setSaving(false);
    }
  }

  if (!canView) return <Navigate to="/access-denied" replace />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspection Questions"
        subtitle="Set and update evaluation templates"
        action={
          <div className="flex gap-2">
            <NavLink
              to="/inspections/reviews"
              className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 transition hover:text-slate-200"
            >
              Reviewing
            </NavLink>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={async () => {
                  const next = !editingEnabled;
                  const code = selectedCode || moduleTemplate?.moduleCode;
                  if (!code) {
                    toast.error('No module selected');
                    return;
                  }
                  try {
                    // persist grant so server-side enforcement allows edits
                    await grantModuleEdit(code, next);
                    setEditingEnabled(next);
                    toast.success(next ? 'Question editing enabled' : 'Question editing disabled');
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Could not update grant');
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${editingEnabled ? 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15' : 'border-sky-500/25 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15'}`}
              >
                {editingEnabled ? 'Disable editing' : 'Enable editing'}
              </button>
            )}
            <button
              type="button"
              disabled={!hasChanges || saving || !canEdit}
              onClick={() => void handleSave()}
              className={`inline-flex items-center gap-2 rounded-lg border border-sky-500/25 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-sky-300 transition hover:bg-sky-500/15 ${(!hasChanges || saving || !canEdit) ? 'disabled:cursor-not-allowed disabled:opacity-40 opacity-40' : ''}`}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving' : 'Save'}
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Layers3 className="h-3.5 w-3.5" /> Departments
              </p>
              <span className="text-xs text-slate-600">{modules.length}</span>
            </div>

            {loadingModules ? (
              <div className="flex h-28 items-center justify-center">
                <FileQuestion className="h-6 w-6 animate-pulse text-sky-400/40" />
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {modules.map((module) => {
                  const isActive = selectedCode === module.moduleCode;
                  return (
                    <button
                      key={module.moduleCode}
                      type="button"
                      onClick={() => setSelectedCode(module.moduleCode)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isActive
                          ? 'border-sky-500/35 bg-sky-950/50'
                          : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/70'
                      }`}
                    >
                      <p className="truncate text-sm font-semibold text-white">{module.title}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{module.classification.replace(/_/g, ' ')}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</p>
              <button
                type="button"
                onClick={addSection}
                disabled={!canEdit}
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase transition ${canEdit ? 'border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15' : 'border-slate-800/60 bg-slate-900/20 text-slate-500 cursor-not-allowed'}`}
              >
                <Plus className="h-3 w-3" />
                Section
              </button>
            </div>

            {template?.sections.length ? (
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {template.sections.map((section, index) => {
                  const isActive = activeSectionIndex === index;
                  return (
                    <button
                      key={`${section.title}-${index}`}
                      type="button"
                      onClick={() => setActiveSectionIndex(index)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isActive
                          ? 'border-emerald-500/35 bg-emerald-950/30'
                          : 'border-slate-800/60 bg-slate-900/20 hover:border-slate-700/70'
                      }`}
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-slate-200">{section.title || `Section ${index + 1}`}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{section.items.length} questions</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-800/70 py-8 text-center">
                <p className="text-sm text-slate-600">No sections yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="rounded-xl border border-slate-800/60 bg-slate-950/70">
            <div className="border-b border-slate-800/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{moduleTemplate?.title ?? 'Select a department'}</p>
                  <p className="mt-1 text-[11px] font-mono uppercase text-slate-500">
                    v{moduleTemplate?.version ?? 1} · {questionCount} questions
                  </p>
                </div>
                {hasChanges && (
                  <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-300">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>

            {loadingTemplate ? (
              <div className="flex h-[520px] items-center justify-center">
                <FileQuestion className="h-8 w-8 animate-pulse text-sky-400/40" />
              </div>
            ) : activeSection && template ? (
              <div className="space-y-5 p-5">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-600">
                      Section title
                    </label>
                    <input
                      value={activeSection.title}
                      readOnly={!canEdit}
                      onChange={(e) => updateTemplate((draft) => { draft.sections[activeSectionIndex].title = e.target.value; })}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${canEdit ? 'border-slate-800/80 bg-slate-900/60 text-white focus:border-sky-500/40' : 'border-slate-800/60 bg-slate-900/20 text-slate-500'}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSection(activeSectionIndex)}
                    disabled={!canEdit}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${canEdit ? 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15' : 'border-slate-800/60 bg-slate-900/20 text-slate-500 cursor-not-allowed'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Section
                  </button>
                </div>

                <div className="space-y-3">
                  {activeSection.items.map((item, itemIndex) => (
                    <div key={`${item.code}-${itemIndex}`} className="rounded-xl border border-slate-800/60 bg-slate-950/80 p-4">
                      <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-600">Code</label>
                          <input
                            value={item.code}
                            readOnly={!canEdit}
                            onChange={(e) => updateQuestion(activeSectionIndex, itemIndex, { code: e.target.value })}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${canEdit ? 'border-slate-800/80 bg-slate-900/60 text-white focus:border-sky-500/40' : 'border-slate-800/60 bg-slate-900/20 text-slate-500'}`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-600">Question</label>
                          <textarea
                            rows={2}
                            value={item.prompt}
                            readOnly={!canEdit}
                            onChange={(e) => updateQuestion(activeSectionIndex, itemIndex, { prompt: e.target.value })}
                            className={`w-full resize-none rounded-lg border px-3 py-2 text-sm leading-6 outline-none ${canEdit ? 'border-slate-800/80 bg-slate-900/60 text-white focus:border-sky-500/40' : 'border-slate-800/60 bg-slate-900/20 text-slate-500'}`}
                          />
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-600">Response</label>
                          <select
                            value={item.responseType}
                            disabled={!canEdit}
                            onChange={(e) => updateQuestion(activeSectionIndex, itemIndex, { responseType: e.target.value as InspectionQuestionResponseType })}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${canEdit ? 'border-slate-800/80 bg-slate-900/60 text-white focus:border-sky-500/40' : 'border-slate-800/60 bg-slate-900/20 text-slate-500'}`}
                            style={{ colorScheme: 'dark' }}
                          >
                            {RESPONSE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-600">Weight</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.weight}
                            readOnly={!canEdit}
                            onChange={(e) => updateQuestion(activeSectionIndex, itemIndex, { weight: Number(e.target.value) })}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${canEdit ? 'border-slate-800/80 bg-slate-900/60 text-white focus:border-sky-500/40' : 'border-slate-800/60 bg-slate-900/20 text-slate-500'}`}
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => duplicateQuestion(activeSectionIndex, itemIndex)}
                            disabled={!canEdit}
                            aria-label="Duplicate question"
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${canEdit ? 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:text-slate-200' : 'border-slate-800/60 bg-slate-900/20 text-slate-500 cursor-not-allowed'}`}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(activeSectionIndex, itemIndex)}
                            disabled={!canEdit}
                            aria-label="Delete question"
                            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${canEdit ? 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15' : 'border-slate-800/60 bg-slate-900/20 text-slate-500 cursor-not-allowed'}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addQuestion(activeSectionIndex)}
                  disabled={!canEdit}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${canEdit ? 'border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15' : 'border-slate-800/60 bg-slate-900/20 text-slate-500 cursor-not-allowed'}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Question
                </button>
              </div>
            ) : (
              <div className="flex h-[520px] flex-col items-center justify-center gap-3 text-center">
                <FileQuestion className="h-10 w-10 text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">Select a section to edit questions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
