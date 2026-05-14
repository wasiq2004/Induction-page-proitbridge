/**
 * Google Apps Script (GAS) — Induction access control.
 *
 * GAS deployment URL is read from `VITE_GAS_INDUCTION_URL`. The script
 * dispatches on the `action` query parameter:
 *   - register       → write new row with status=PENDING
 *   - updatePayment  → update row to status=SUCCESS + paymentId
 *   - checkAccess    → read row by mobile, return { hasAccess, userName, paymentId }
 *
 * `register` and `updatePayment` use mode: "no-cors" (fire-and-forget — GAS
 * does not allow CORS preflights on POSTs without going through doPost, and
 * we do not need to read the response). `checkAccess` requires a real JSON
 * response, so it goes through the GAS doGet handler with normal fetch.
 */

import { env } from './env';

const AUTH_KEY_MOBILE = 'pib_auth_mobile';
const AUTH_KEY_NAME = 'pib_auth_name';

interface CheckAccessResponse {
  hasAccess: boolean;
  userName?: string;
  paymentId?: string;
}

interface AuthSession {
  mobile: string;
  name: string;
}

const buildUrl = (params: Record<string, string>): string => {
  const base = env.gas.inductionUrl;
  if (!base) throw new Error('VITE_GAS_INDUCTION_URL is not configured');
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
};

/** Fire-and-forget: write a new PENDING row before payment opens. */
export const registerPendingUser = async (
  fullName: string,
  mobile: string,
): Promise<void> => {
  try {
    await fetch(
      buildUrl({
        action: 'register',
        fullName,
        mobile,
        status: 'PENDING',
        paymentId: '',
      }),
      { method: 'GET', mode: 'no-cors' },
    );
  } catch (err) {
    console.warn('[googleSheets] registerPendingUser failed', err);
  }
};

/** Fire-and-forget: flip the row to SUCCESS after Razorpay confirms payment. */
export const updatePaymentSuccess = async (
  fullName: string,
  mobile: string,
  paymentId: string,
): Promise<void> => {
  try {
    await fetch(
      buildUrl({
        action: 'updatePayment',
        fullName,
        mobile,
        status: 'SUCCESS',
        paymentId,
      }),
      { method: 'GET', mode: 'no-cors' },
    );
  } catch (err) {
    console.warn('[googleSheets] updatePaymentSuccess failed', err);
  }
};

/** Check if a mobile number has a SUCCESS row. Used by the login flow. */
export const checkAccess = async (mobile: string): Promise<CheckAccessResponse> => {
  try {
    const res = await fetch(buildUrl({ action: 'checkAccess', mobile }), {
      method: 'GET',
    });
    if (!res.ok) return { hasAccess: false };
    const data = (await res.json()) as CheckAccessResponse;
    return data;
  } catch (err) {
    console.warn('[googleSheets] checkAccess failed', err);
    return { hasAccess: false };
  }
};

// --- Session helpers (localStorage) -----------------------------------------

export const saveAuthSession = (mobile: string, name: string): void => {
  try {
    localStorage.setItem(AUTH_KEY_MOBILE, mobile);
    localStorage.setItem(AUTH_KEY_NAME, name);
  } catch {
    /* localStorage unavailable — silent */
  }
};

export const getAuthSession = (): AuthSession | null => {
  try {
    const mobile = localStorage.getItem(AUTH_KEY_MOBILE);
    const name = localStorage.getItem(AUTH_KEY_NAME);
    if (!mobile || !name) return null;
    return { mobile, name };
  } catch {
    return null;
  }
};

export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(AUTH_KEY_MOBILE);
    localStorage.removeItem(AUTH_KEY_NAME);
  } catch {
    /* silent */
  }
};
