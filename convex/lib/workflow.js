export function complianceBandFromScore(score) {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'compliant';
  if (score >= 60) return 'attention';
  return 'critical';
}

export function riskLevelFromScore(score) {
  if (score >= 85) return 'low';
  if (score >= 70) return 'moderate';
  if (score >= 50) return 'high';
  return 'critical';
}

export function computeInspectionScores(sections, items, responses) {
  const responseByItemId = new Map(responses.map((response) => [response.itemId, response]));
  let totalWeight = 0;
  let totalEarned = 0;
  let answeredWeight = 0;

  const sectionScores = sections.map((section) => {
    const sectionItems = items.filter((item) => item.sectionId === section._id);
    let sectionWeight = 0;
    let sectionEarned = 0;
    let sectionAnsweredWeight = 0;

    for (const item of sectionItems) {
      sectionWeight += item.weight;
      totalWeight += item.weight;

      const response = responseByItemId.get(item._id);
      if (!response) continue;

      sectionAnsweredWeight += item.weight;
      answeredWeight += item.weight;
      totalEarned += response.numericScore * item.weight;
      sectionEarned += response.numericScore * item.weight;
    }

    return {
      sectionId: section._id,
      title: section.title,
      score: sectionWeight === 0 ? 0 : Math.round((sectionEarned / sectionWeight) * 100),
      completionPercent: sectionWeight === 0 ? 0 : Math.round((sectionAnsweredWeight / sectionWeight) * 100),
    };
  });

  const overallScore = totalWeight === 0 ? 0 : Math.round((totalEarned / totalWeight) * 100);
  const completionPercent = totalWeight === 0 ? 0 : Math.round((answeredWeight / totalWeight) * 100);

  return {
    sectionScores,
    overallScore,
    completionPercent,
    complianceBand: complianceBandFromScore(overallScore),
    riskLevel: riskLevelFromScore(overallScore),
  };
}

export function canTransitionInspection(roleCode, fromStatus, toStatus) {
  const transitions = {
    draft: ['submitted'],
    submitted: ['in_review', 'requires_correction', 'approved', 'rejected'],
    in_review: ['approved', 'rejected', 'requires_correction'],
    requires_correction: ['submitted'],
    approved: ['closed'],
    rejected: [],
    closed: [],
  };

  if (!(transitions[fromStatus] ?? []).includes(toStatus)) {
    return false;
  }

  if (toStatus === 'submitted') {
    return ['super_admin', 'ddse_admin', 'evaluator', 'directorate_officer', 'project_officer'].includes(roleCode);
  }

  return ['super_admin', 'ddse_admin', 'base_commander', 'audit_reviewer', 'senior_command_readonly'].includes(roleCode);
}
