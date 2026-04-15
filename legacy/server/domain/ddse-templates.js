const riskScale = ['low', 'moderate', 'high', 'critical'];

export const ddseModuleCatalog = [
  {
    moduleCode: 'training_establishments',
    title: 'Training Establishment Inspection',
    classification: 'official',
    description: 'Digital inspection pack for institutional training establishments, cadet readiness, accreditation, and instructional adequacy.',
    sections: [
      { title: 'Governance and Accreditation', itemCount: 6 },
      { title: 'Academic Delivery and Syllabi', itemCount: 7 },
      { title: 'Cadet Welfare and Accommodation', itemCount: 6 },
      { title: 'Laboratory and Technical Serviceability', itemCount: 6 },
      { title: 'External Results and Outcomes', itemCount: 5 },
    ],
  },
  {
    moduleCode: 'jtf_readiness',
    title: 'JTF Operational Readiness',
    classification: 'restricted_operational',
    description: 'Weighted readiness inspections covering manpower, discipline, logistics, deployment posture, public relations, and welfare.',
    sections: [
      { title: 'Administration and Personnel', itemCount: 8 },
      { title: 'Logistics and Sustainment', itemCount: 7 },
      { title: 'Intelligence and Security', itemCount: 4 },
      { title: 'Training and Communications', itemCount: 5 },
    ],
  },
  {
    moduleCode: 'general_security',
    title: 'General Security Inspection',
    classification: 'restricted_operational',
    description: 'Barracks, personnel, gate, patrol, documentation, and communications security inspection workflows.',
    sections: [
      { title: 'Personnel and Visitor Control', itemCount: 5 },
      { title: 'Barracks and Perimeter Security', itemCount: 6 },
      { title: 'Equipment and Fire Safety', itemCount: 5 },
    ],
  },
  {
    moduleCode: 'armoury',
    title: 'Armoury Evaluation',
    classification: 'restricted_armoury',
    description: 'Locked-down armoury inspections with dual authorization, exception handling, and chain-of-custody support.',
    sections: [
      { title: 'Standing Orders and Records', itemCount: 4 },
      { title: 'Guard and Lighting Adequacy', itemCount: 4 },
      { title: 'Weapons Storage and Serviceability', itemCount: 5 },
      { title: 'Ammunition Safety and Fire Protection', itemCount: 4 },
    ],
  },
  {
    moduleCode: 'magazine',
    title: 'Magazine Evaluation',
    classification: 'restricted_magazine',
    description: 'Magazine siting, structure, ventilation, key custody, communications, and record compliance workflows.',
    sections: [
      { title: 'Siting and Structure', itemCount: 5 },
      { title: 'Records and Key Control', itemCount: 4 },
      { title: 'Safety Equipment and Condition', itemCount: 4 },
    ],
  },
  {
    moduleCode: 'afsb_screening',
    title: 'AFSB and Screening Oversight',
    classification: 'official',
    description: 'Attendance, shortlisting, infrastructure, panel, results, and wash-up oversight for screening exercises.',
    sections: [
      { title: 'Planning and Preparation', itemCount: 5 },
      { title: 'Screening Integrity and Competence', itemCount: 6 },
      { title: 'Results and Lessons Learned', itemCount: 4 },
    ],
  },
  {
    moduleCode: 'civil_projects',
    title: 'Civil Project Monitoring',
    classification: 'official',
    description: 'Contract intake, site handover, progress tracking, milestone control, stop-work notices, and document governance.',
    sections: [
      { title: 'Contract Intake and Documentation', itemCount: 6 },
      { title: 'Execution Monitoring', itemCount: 7 },
      { title: 'Payments and Compliance Notices', itemCount: 5 },
      { title: 'Final Inspection and Handover', itemCount: 4 },
    ],
  },
  {
    moduleCode: 'construction_qa',
    title: 'Direct Labour and Construction QA',
    classification: 'official',
    description: 'Construction quality assurance, design review, account-to-work reconciliation, and stop or continue decision tracking.',
    sections: [
      { title: 'Programme and Resourcing', itemCount: 5 },
      { title: 'Foundations and Structural Works', itemCount: 8 },
      { title: 'Finishes and Services', itemCount: 6 },
      { title: 'Observations and Recommendations', itemCount: 4 },
    ],
  },
  {
    moduleCode: 'hazard_safety',
    title: 'Hazard and Safety Assessment',
    classification: 'official',
    description: 'Full EHS assessment pack with corrective actions, closure verification, and reinspection management.',
    sections: [
      { title: 'General Environment and Egress', itemCount: 8 },
      { title: 'Fire and Flammable Controls', itemCount: 7 },
      { title: 'Electrical and Hazardous Substances', itemCount: 7 },
      { title: 'Emergency Preparedness', itemCount: 5 },
    ],
  },
];

export function summarizeCatalogForRole(allowedModuleCodes) {
  return ddseModuleCatalog
    .filter((moduleDefinition) => allowedModuleCodes.includes(moduleDefinition.moduleCode))
    .map((moduleDefinition) => ({
      ...moduleDefinition,
      totalItems: moduleDefinition.sections.reduce((total, section) => total + section.itemCount, 0),
      riskScale,
    }));
}
