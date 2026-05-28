import { Camera, FileText, AlertCircle, Upload } from 'lucide-react';

interface EvidencePlaceholder {
  label: string;
  icon:  React.ElementType;
  hint:  string;
}

const SLOTS: EvidencePlaceholder[] = [
  { label: 'Site Photos',       icon: Camera,     hint: 'Upload JPG/PNG images from site visit' },
  { label: 'Incident Reports',  icon: AlertCircle, hint: 'Upload formal incident documentation' },
  { label: 'Supporting Docs',   icon: FileText,    hint: 'Upload inspection notes, test certs, etc.' },
];

export default function EvidenceGallery() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {SLOTS.map((slot) => {
          const Icon = slot.icon;
          return (
            <div
              key={slot.label}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800/60 bg-slate-950/40 px-4 py-8 text-center transition hover:border-slate-700/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900/60">
                <Icon className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{slot.label}</p>
                <p className="mt-0.5 text-[9px] font-mono text-slate-600">{slot.hint}</p>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
              >
                <Upload className="h-2.5 w-2.5" />
                Upload
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] font-mono text-slate-700 uppercase text-center">
        Evidence upload system — integration pending
      </p>
    </div>
  );
}
