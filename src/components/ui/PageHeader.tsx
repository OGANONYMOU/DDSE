import { memo, type ReactNode } from 'react';

interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  action?:   ReactNode;
}

const PageHeader = memo(function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-base font-black uppercase tracking-[0.15em] text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});

export default PageHeader;
