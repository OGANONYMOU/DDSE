import { FileText, ImageIcon, FileBarChart2, Award, MapPin, ScrollText } from 'lucide-react';
import type { MockDocument } from '../../lib/mock-data';

const TYPE_ICON: Record<MockDocument['type'], React.ElementType> = {
  BOQ:         FileText,
  Drawing:     MapPin,
  Report:      FileBarChart2,
  Certificate: Award,
  Photo:       ImageIcon,
  Permit:      ScrollText,
};

const TYPE_COLOR: Record<MockDocument['type'], string> = {
  BOQ:         'text-sky-400    border-sky-500/20    bg-sky-500/8',
  Drawing:     'text-violet-400 border-violet-500/20 bg-violet-500/8',
  Report:      'text-teal-400   border-teal-500/20   bg-teal-500/8',
  Certificate: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8',
  Photo:       'text-amber-400  border-amber-500/20  bg-amber-500/8',
  Permit:      'text-rose-400   border-rose-500/20   bg-rose-500/8',
};

interface Props {
  document: MockDocument;
}

export default function DocumentCard({ document: doc }: Props) {
  const Icon   = TYPE_ICON[doc.type];
  const colors = TYPE_COLOR[doc.type];
  const [iconColor, borderColor, bgColor] = colors.split(' ');

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800/60 bg-slate-950/70 p-4">
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${borderColor} ${bgColor}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-200 leading-snug line-clamp-2">
            {doc.title}
          </p>
          <span className={`mt-1 inline-block text-[9px] font-black uppercase tracking-wider ${iconColor}`}>
            {doc.type}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-800/40 pt-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-mono text-slate-600">{doc.uploadedBy}</p>
          <p className="text-[9px] font-mono text-slate-700">{doc.uploadedAt} · {doc.size}</p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-700/40 bg-slate-800/40 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 transition hover:border-sky-500/30 hover:text-sky-400"
        >
          View
        </button>
      </div>
    </div>
  );
}
