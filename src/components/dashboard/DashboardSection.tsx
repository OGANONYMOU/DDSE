import type { ReactNode } from 'react';
import SectionTitle from '../ui/SectionTitle';

interface DashboardSectionProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function DashboardSection({ title, subtitle, children, className = '' }: DashboardSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {title && <SectionTitle title={title} subtitle={subtitle} />}
      {children}
    </section>
  );
}
