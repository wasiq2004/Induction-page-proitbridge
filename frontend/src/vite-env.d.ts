/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAZORPAY_KEY: string;
  readonly VITE_RAZORPAY_INDUCTION_AMOUNT: string;
  readonly VITE_RAZORPAY_ENROLLMENT_AMOUNT: string;
  readonly VITE_RAZORPAY_CURRENCY: string;
  readonly VITE_RAZORPAY_THEME_COLOR: string;
  readonly VITE_RAZORPAY_LOGO_URL: string;

  readonly VITE_GAS_INDUCTION_URL: string;
  readonly VITE_GAS_ENROLLMENT_URL: string;

  readonly VITE_N8N_WEBHOOK_URL: string;
  readonly VITE_INVOICE_EMAIL_RECIPIENT: string;

  readonly VITE_META_PIXEL_ID: string;

  readonly VITE_VIMEO_LANDING_VIDEO_ID: string;
  readonly VITE_VIMEO_INDUCTION_VIDEO_ID: string;

  readonly VITE_INDUCTION_VIDEO_URL: string;

  readonly VITE_COMPANY_NAME: string;
  readonly VITE_COMPANY_GSTIN: string;
  readonly VITE_COMPANY_ADDRESS: string;
  readonly VITE_COMPANY_STATE: string;
  readonly VITE_COMPANY_EMAIL: string;
  readonly VITE_COMPANY_PHONE: string;
  readonly VITE_COMPANY_SAC_CODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
      close: () => void;
    };
    fbq?: (...args: unknown[]) => void;
  }
}

export {};
