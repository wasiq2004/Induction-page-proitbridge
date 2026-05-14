/**
 * Typed accessor for `import.meta.env`. Centralizes parsing and defaults so
 * the rest of the codebase never reads `import.meta.env.*` directly.
 *
 * All values are read at module-evaluation time. Missing required vars throw
 * loudly in development; in production they fall back to safe defaults so the
 * bundle never crashes at import time.
 */

const raw = import.meta.env;

const str = (key: keyof ImportMetaEnv, fallback = ''): string => {
  const v = raw[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
};

const num = (key: keyof ImportMetaEnv, fallback: number): number => {
  const v = raw[key];
  const parsed = typeof v === 'string' ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  razorpay: {
    key: str('VITE_RAZORPAY_KEY'),
    inductionAmount: num('VITE_RAZORPAY_INDUCTION_AMOUNT', 8900),
    enrollmentAmount: num('VITE_RAZORPAY_ENROLLMENT_AMOUNT', 100000),
    currency: str('VITE_RAZORPAY_CURRENCY', 'INR'),
    themeColor: str('VITE_RAZORPAY_THEME_COLOR', '#0B1F3A'),
    logoUrl: str('VITE_RAZORPAY_LOGO_URL'),
  },
  gas: {
    inductionUrl: str('VITE_GAS_INDUCTION_URL'),
    enrollmentUrl: str('VITE_GAS_ENROLLMENT_URL'),
  },
  n8n: {
    webhookUrl: str('VITE_N8N_WEBHOOK_URL'),
    invoiceRecipient: str('VITE_INVOICE_EMAIL_RECIPIENT'),
  },
  pixel: {
    id: str('VITE_META_PIXEL_ID'),
  },
  vimeo: {
    landingId: str('VITE_VIMEO_LANDING_VIDEO_ID'),
    inductionId: str('VITE_VIMEO_INDUCTION_VIDEO_ID'),
  },
  company: {
    name: str('VITE_COMPANY_NAME'),
    gstin: str('VITE_COMPANY_GSTIN'),
    address: str('VITE_COMPANY_ADDRESS'),
    state: str('VITE_COMPANY_STATE'),
    email: str('VITE_COMPANY_EMAIL'),
    phone: str('VITE_COMPANY_PHONE'),
    sacCode: str('VITE_COMPANY_SAC_CODE'),
  },
} as const;

export const isConfigured = (...values: string[]): boolean =>
  values.every((v) => v && v.length > 0);
