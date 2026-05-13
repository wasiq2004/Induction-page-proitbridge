export const PROGRAM_TYPES = [
  'ADVANCED_DATA_ANALYST',
  'ADVANCED_DATA_SCIENCE_AI',
  'AGENTIC_AI_GEN_AI',
  'COMBO',
];

export const COURSE_TYPES = ['ONLINE_LIVE', 'SELF_PACED', 'HYBRID'];

export const PAYMENT_METHODS = ['UPI', 'CARD'];

/**
 * In-memory store — replace with DB when ready.
 * @type {import('./types.js').EnrollmentRecord[]}
 */
export const enrollments = [];

export function createEnrollment(data) {
  return {
    id: Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
  };
}
