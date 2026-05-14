/**
 * Enrollment submission — POSTs form data + Razorpay payment ID to the
 * enrollment GAS endpoint. Content-Type is `text/plain` so the browser does
 * NOT send a CORS preflight (GAS doPost cannot handle preflights).
 *
 * Response shape: { status: "success" | "error", message: string, enrollmentId?: string }
 *
 * Throws if the network fails, the status is not "success", or no
 * enrollmentId is returned. The caller surfaces these errors to the user
 * with the Razorpay payment ID so support can reconcile.
 */

import { env } from '@lib/env';
import type { EnrollmentFormData } from '@t/index';

export interface EnrollmentResult {
  enrollmentId: string;
  message: string;
}

export const submitEnrollment = async (
  data: EnrollmentFormData,
  paymentId: string,
): Promise<EnrollmentResult> => {
  if (!env.gas.enrollmentUrl) {
    throw new Error('VITE_GAS_ENROLLMENT_URL is not configured');
  }

  const address = [
    data.addressLine1,
    data.addressLine2,
    data.city,
    data.state,
    data.pincode,
    data.country,
  ]
    .filter(Boolean)
    .join(', ');

  const payload = {
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
    countryResidence: data.country,
    address,
    program: data.programSelection,
    courseType: data.courseType,
    paymentMethod: data.paymentMethod,
    paymentId,
  };

  const res = await fetch(env.gas.enrollmentUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Enrollment server returned ${res.status}`);
  }

  const json = (await res.json()) as {
    status?: string;
    message?: string;
    enrollmentId?: string;
  };

  if (json.status !== 'success') {
    throw new Error(json.message ?? 'Enrollment failed');
  }
  if (!json.enrollmentId) {
    throw new Error(
      `Enrollment ID not returned by server. Contact ${env.company.email} with payment ID ${paymentId}.`,
    );
  }
  return { enrollmentId: json.enrollmentId, message: json.message ?? 'Enrolled successfully' };
};
