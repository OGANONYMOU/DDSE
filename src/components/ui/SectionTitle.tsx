interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionTitle({ title, subtitle, className = '' }: SectionTitleProps) {
  return (
    <div className={`border-b border-slate-800/40 pb-3 ${className}`}>
      <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-[10px] font-mono text-slate-600 uppercase">
          {subtitle}
        </p>
      )}
    </div>
  );
}
