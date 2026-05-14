/**
 * Razorpay checkout wrapper.
 *
 * The Razorpay script is loaded synchronously in `index.html <head>`, so
 * `window.Razorpay` is available before React mounts. `ensureScript()` is
 * still provided as a fallback in case the synchronous script is blocked by
 * an ad-blocker — it injects the SDK on demand.
 *
 * Two high-level entry points wrap the raw checkout:
 *   - `startInductionPayment` for the ₹89 induction flow
 *   - `openEnrollmentCheckout` for the ₹1000 enrollment flow
 */

import { env } from './env';
import {
  registerPendingUser,
  updatePaymentSuccess,
  saveAuthSession,
} from './googleSheets';
import {
  setPaymentPending,
  clearPaymentPending,
} from './razorpayPending';
import { trackEvent, trackCustom } from './metaPixel';

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export interface CheckoutSuccess {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export class CheckoutDismissedError extends Error {
  constructor() {
    super('Razorpay checkout dismissed');
    this.name = 'CheckoutDismissedError';
  }
}

export class CheckoutFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutFailedError';
  }
}

const ensureScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Razorpay script failed'));
    document.head.appendChild(s);
  });

interface CheckoutOptions {
  amount: number;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
}

const openCheckout = async (opts: CheckoutOptions): Promise<CheckoutSuccess> => {
  if (!env.razorpay.key) {
    throw new CheckoutFailedError('VITE_RAZORPAY_KEY is not configured');
  }
  await ensureScript();
  if (!window.Razorpay) throw new CheckoutFailedError('Razorpay unavailable');

  return new Promise<CheckoutSuccess>((resolve, reject) => {
    let handled = false;

    const rzp = new window.Razorpay!({
      key: env.razorpay.key,
      amount: opts.amount,
      currency: env.razorpay.currency,
      name: 'ProITBridge',
      description: opts.description,
      image: env.razorpay.logoUrl || undefined,
      prefill: opts.prefill,
      notes: opts.notes,
      theme: { color: env.razorpay.themeColor },
      handler: (response: unknown) => {
        if (handled) return;
        handled = true;
        resolve(response as CheckoutSuccess);
      },
      modal: {
        ondismiss: () => {
          if (handled) return;
          handled = true;
          reject(new CheckoutDismissedError());
        },
      },
    });

    rzp.on('payment.failed', (response: unknown) => {
      if (handled) return;
      handled = true;
      const r = response as { error?: { description?: string } };
      reject(new CheckoutFailedError(r.error?.description ?? 'Payment failed'));
    });

    rzp.open();
  });
};

/**
 * Full ₹89 induction payment flow:
 *   1. Write PENDING row to GAS
 *   2. fbq('InitiateCheckout')
 *   3. Mark pending in sessionStorage
 *   4. Open Razorpay
 *   5. On success: GAS updatePayment → save session → fbq Purchase
 *
 * Returns the Razorpay payment ID. Throws CheckoutDismissedError or
 * CheckoutFailedError on failure.
 */
export const startInductionPayment = async (
  mobile: string,
  name: string,
): Promise<string> => {
  await registerPendingUser(name, mobile);
  trackEvent('InitiateCheckout', { value: 89, currency: env.razorpay.currency });
  setPaymentPending(mobile, name);

  try {
    const result = await openCheckout({
      amount: env.razorpay.inductionAmount,
      description: 'ProITBridge Induction Session',
      prefill: { name, contact: mobile },
    });

    clearPaymentPending();
    await updatePaymentSuccess(name, mobile, result.razorpay_payment_id);
    saveAuthSession(mobile, name);
    trackEvent('Purchase', { value: 89, currency: env.razorpay.currency });
    trackCustom('InductionPaymentSuccess', {
      paymentId: result.razorpay_payment_id,
      amount: 89,
      currency: env.razorpay.currency,
    });

    return result.razorpay_payment_id;
  } catch (err) {
    clearPaymentPending();
    throw err;
  }
};

/**
 * ₹1000 enrollment checkout. Returns the Razorpay payment ID; the caller is
 * responsible for posting form data + paymentId to the enrollment GAS.
 */
export const openEnrollmentCheckout = async (prefill: {
  name: string;
  email: string;
  contact: string;
}): Promise<string> => {
  const result = await openCheckout({
    amount: env.razorpay.enrollmentAmount,
    description: 'ProITBridge Course Enrollment',
    prefill,
  });
  return result.razorpay_payment_id;
};
