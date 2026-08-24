import { useState } from 'react';
import { X, FolderPlus, UploadCloud, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { createProject, uploadProjectDocument } from '../../services/projects';
import type { Project } from '../../types/projects';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface Props {
  onClose:   () => void;
  onCreated: (project: Project) => void;
}

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [title, setTitle]     = useState('');
  const [reason, setReason]   = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile]       = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(f: File | null) {
    if (f && !ALLOWED_TYPES.includes(f.type)) {
      setFileError('Only PDF or Word (.doc/.docx) files are accepted.');
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }

  async function handleSubmit() {
    if (!title.trim())   { toast.error('Enter a project title.'); return; }
    if (!reason.trim())  { toast.error('Describe why this project is needed.'); return; }
    if (!summary.trim()) { toast.error('Add a short summary of the project.'); return; }

    setSubmitting(true);
    try {
      const project = await createProject(
        {
          projectCode:       `PRJ-${Date.now().toString(36).toUpperCase()}`,
          title:             title.trim(),
          type:              'New Construction',
          status:            'planning',
          priority:          'ROUTINE',
          riskLevel:         'LOW',
          location:          '',
          directorateCode:   user.directorateCode,
          contractor:        null,
          leadInspectorId:   null,
          leadInspectorName: null,
          budgetNgn:         null,
          completionPercent: 0,
          startDate:         null,
          endDate:           null,
          classification:    'INTERNAL',
          reason:            reason.trim(),
          summary:           summary.trim(),
          notes:             null,
          createdBy:         user.id,
        },
        user.id,
      );

      if (file) {
        try {
          await uploadProjectDocument(project.id, file, title.trim(), user.id);
        } catch (err) {
          toast.error(err instanceof Error ? `Project created, but the file failed to upload: ${err.message}` : 'Project created, but the file failed to upload.');
        }
      }

      toast.success('Project created.');
      onCreated(project);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10">
              <FolderPlus className="h-5 w-5 text-sky-400" />
            </div>
            <p className="text-base font-bold text-white">New Project</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Title</label>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              placeholder="e.g. Perimeter fence rehabilitation — Unit 14"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Reason for project</label>
            <textarea
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              placeholder="Why is this project needed?"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Summary</label>
            <textarea
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-sky-500/40"
              placeholder="Summarize the full project — scope, location, expected outcome…"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Supporting document (optional)</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-3 text-sm text-slate-400 transition hover:border-sky-500/40 hover:text-slate-300">
              {file ? <FileText className="h-4 w-4 shrink-0 text-sky-400" /> : <UploadCloud className="h-4 w-4 shrink-0" />}
              <span className="truncate">{file ? file.name : 'Upload a PDF or Word document'}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
            {fileError && <p className="mt-1.5 text-xs text-rose-400">{fileError}</p>}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-700/60 py-2.5 text-sm font-semibold text-slate-400 transition hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button" onClick={() => void handleSubmit()} disabled={submitting}
            className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
