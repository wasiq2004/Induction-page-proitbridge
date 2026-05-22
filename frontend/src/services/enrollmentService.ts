/**
 * Enrollment submission — the sheet is written to ONLY after Razorpay has
 * confirmed payment and produced a paymentId. Failed or cancelled payments
 * leave no row behind.
 *
 *   recordSuccessfulEnrollment(data, paymentId)
 *     registerEnrollment → insert one row with paymentStatus=SUCCESS and the
 *     Razorpay paymentId baked in, get a server-generated enrollmentId back.
 *
 * Content-Type is `text/plain` so the browser does NOT send a CORS preflight
 * (GAS doPost can't handle preflights).
 */

import { env } from '@lib/env';
import type { EnrollmentFormData } from '@t/index';

export interface EnrollmentResult {
  enrollmentId: string;
  paymentId: string;
}

const ENROLLMENT_AMOUNT_RUPEES = 1000;

const requireEndpoint = (): string => {
  if (!env.gas.enrollmentUrl) {
    throw new Error('VITE_GAS_ENROLLMENT_URL is not configured');
  }
  return env.gas.enrollmentUrl;
};

const composeAddress = (data: EnrollmentFormData): string =>
  [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.state,
    data.pincode,
    data.country,
  ]
    .filter(Boolean)
    .join(', ');

const post = async (payload: Record<string, unknown>): Promise<unknown> => {
  const res = await fetch(requireEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Enrollment server returned ${res.status}`);
  return res.json();
};

/**
 * Write a SUCCESS enrollment row to the sheet. Called ONLY after Razorpay
 * has returned a paymentId. Inserts the row with status=SUCCESS, then
 * patches it with the paymentId.
 */
export const recordSuccessfulEnrollment = async (
  data: EnrollmentFormData,
  paymentId: string,
): Promise<EnrollmentResult> => {
  const payload = {
    action: 'registerEnrollment',
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
    countryResidence: data.country,
    address: composeAddress(data),
    program: data.programSelection,
    courseType: data.courseType,
    paymentMethod: data.paymentMethod,
    amount: ENROLLMENT_AMOUNT_RUPEES,
    paymentStatus: 'SUCCESS',
    paymentId,
  };

  const json = (await post(payload)) as {
    status?: string;
    message?: string;
    enrollmentId?: string;
  };

  if (json.status !== 'success') {
    throw new Error(json.message ?? 'Enrollment server rejected the registration');
  }
  if (!json.enrollmentId) {
    throw new Error(
      `Enrollment ID not returned by server. Contact ${env.company.email}.`,
    );
  }

  return { enrollmentId: json.enrollmentId, paymentId };
};
