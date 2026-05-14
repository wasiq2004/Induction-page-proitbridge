/**
 * Tracks an in-flight Razorpay payment in sessionStorage so the page can
 * recover state if the user returns from a UPI app (which can backbone the
 * tab). Pending state auto-expires after 10 minutes.
 */

const KEY_PENDING = 'razorpay_payment_pending';
const KEY_MOBILE = 'razorpay_payment_mobile';
const KEY_NAME = 'razorpay_payment_name';
const KEY_TS = 'razorpay_payment_timestamp';

const TEN_MINUTES_MS = 10 * 60 * 1000;

export const setPaymentPending = (mobile: string, name: string): void => {
  try {
    sessionStorage.setItem(KEY_PENDING, 'true');
    sessionStorage.setItem(KEY_MOBILE, mobile);
    sessionStorage.setItem(KEY_NAME, name);
    sessionStorage.setItem(KEY_TS, String(Date.now()));
  } catch {
    /* silent */
  }
};

export const clearPaymentPending = (): void => {
  try {
    sessionStorage.removeItem(KEY_PENDING);
    sessionStorage.removeItem(KEY_MOBILE);
    sessionStorage.removeItem(KEY_NAME);
    sessionStorage.removeItem(KEY_TS);
  } catch {
    /* silent */
  }
};

export const isPaymentPending = (): boolean => {
  try {
    if (sessionStorage.getItem(KEY_PENDING) !== 'true') return false;
    const ts = Number(sessionStorage.getItem(KEY_TS) ?? '0');
    if (!ts || Date.now() - ts > TEN_MINUTES_MS) {
      clearPaymentPending();
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const getPendingPaymentDetails = (): { mobile: string; name: string } | null => {
  try {
    const mobile = sessionStorage.getItem(KEY_MOBILE);
    const name = sessionStorage.getItem(KEY_NAME);
    if (!mobile || !name) return null;
    return { mobile, name };
  } catch {
    return null;
  }
};
