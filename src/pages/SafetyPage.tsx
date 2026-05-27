import HazardEmergency from '../components/HazardEmergency';

export default function SafetyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black uppercase tracking-[0.15em] text-white">
          Safety Assessments
        </h2>
        <p className="mt-0.5 text-[11px] font-mono text-slate-500 uppercase">
          Hazard identification, incident logging & emergency protocols
        </p>
      </div>
      <HazardEmergency />
    </div>
  );
}
