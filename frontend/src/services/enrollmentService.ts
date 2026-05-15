/**
 * Enrollment submission — two-phase flow against the enrollment GAS.
 *
 *   1. registerPendingEnrollment(data)
 *        Writes a row with paymentStatus = "PENDING", no payment id yet, and
 *        returns a server-generated enrollmentId.
 *
 *   2. finalizeEnrollmentPayment(enrollmentId, paymentId, status)
 *        Updates the same row's paymentId + paymentStatus to SUCCESS /
 *        FAILED / CANCELLED depending on the Razorpay outcome.
 *
 * The PENDING row makes the sheet reflect Razorpay state in real time — the
 * row appears the moment the user clicks Enroll, and the status column
 * flips as soon as Razorpay returns.
 *
 * Content-Type is `text/plain` so the browser does NOT send a CORS preflight
 * (GAS doPost can't handle preflights).
 */

import { env } from '@lib/env';
import type { EnrollmentFormData } from '@t/index';

export type EnrollmentPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface EnrollmentResult {
  enrollmentId: string;
  message: string;
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
 * Phase 1 — write the PENDING row before opening Razorpay. Returns the
 * server-generated enrollmentId so phase 2 can target the same row.
 */
export const registerPendingEnrollment = async (
  data: EnrollmentFormData,
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
    paymentStatus: 'PENDING',
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
  return {
    enrollmentId: json.enrollmentId,
    message: json.message ?? 'Pending enrollment created',
  };
};

/**
 * Phase 2 — patch the existing row with the Razorpay outcome.
 * Fire-and-forget by design: the row already exists, and the client UX has
 * its own success/failure paths; we only need the sheet to catch up.
 */
export const finalizeEnrollmentPayment = async (
  enrollmentId: string,
  paymentId: string,
  paymentStatus: EnrollmentPaymentStatus,
): Promise<void> => {
  try {
    await post({
      action: 'updateEnrollmentPayment',
      enrollmentId,
      paymentId,
      paymentStatus,
    });
  } catch (err) {
    console.warn('[enrollmentService] finalizeEnrollmentPayment failed', err);
  }
};
