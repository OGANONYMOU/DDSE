import PersonnelDossier from '../components/PersonnelDossier';

export default function PersonnelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-[0.15em] text-white">Personnel</h2>
        <p className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase">
          Officer dossiers, clearance management & unit assignments
        </p>
      </div>
      <PersonnelDossier />
    </div>
  );
}
