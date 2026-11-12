export interface ReviewableField {
  decision?: string | null;
  name?: string;
}

export const VALID_RISK_RATINGS = ['Low', 'Medium', 'High', 'Prohibited'] as const;
export type ValidRiskRating = typeof VALID_RISK_RATINGS[number];

export function isSignReady(
  fields: ReviewableField[],
  riskRating?: string | null
): boolean {
  if (!fields || fields.length === 0) {
    return false;
  }

  // Hard compliance rule: Every field must have an explicit human decision (accepted, edited, or rejected)
  const allFieldsDecided = fields.every(
    (f) => f.decision === 'accepted' || f.decision === 'edited' || f.decision === 'rejected'
  );

  // Hard compliance rule: MLRO risk rating must be chosen from the approved tiers
  const validRiskSelected = Boolean(
    riskRating && VALID_RISK_RATINGS.includes(riskRating as ValidRiskRating)
  );

  return allFieldsDecided && validRiskSelected;
}

export function getSignValidationState(
  fields: ReviewableField[],
  riskRating?: string | null
): {
  isReady: boolean;
  message: string;
  reviewedCount: number;
  totalCount: number;
  pendingCount: number;
} {
  const totalCount = fields?.length || 0;
  const reviewedCount = (fields || []).filter(
    (f) => f.decision === 'accepted' || f.decision === 'edited' || f.decision === 'rejected'
  ).length;
  const pendingCount = totalCount - reviewedCount;
  const isReady = isSignReady(fields, riskRating);

  let message = '';
  if (isReady) {
    message = 'All statutory fields approved & risk tier classified. Ready for AML sign-off.';
  } else if (pendingCount > 0 && !riskRating) {
    message = `${pendingCount} field decision${pendingCount > 1 ? 's' : ''} remaining • Risk rating required`;
  } else if (pendingCount > 0) {
    message = `${pendingCount} field decision${pendingCount > 1 ? 's' : ''} remaining`;
  } else {
    message = 'MLRO Risk Classification selection required';
  }

  return {
    isReady,
    message,
    reviewedCount,
    totalCount,
    pendingCount,
  };
}
