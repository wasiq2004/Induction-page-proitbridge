/**
 * Meta Pixel (Facebook Ads) wrapper. Initialized at runtime using
 * `VITE_META_PIXEL_ID` so the pixel ID never has to live in source.
 *
 * If `VITE_META_PIXEL_ID` is unset, `init()` no-ops and all `track*` helpers
 * silently skip — useful for local development without a real pixel.
 */

import { env } from './env';

let initialized = false;

const fbq = (...args: unknown[]): void => {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq === 'function') {
    window.fbq(...args);
  }
};

/** Inject the Meta Pixel base script and fire PageView. Idempotent. */
export const initMetaPixel = (): void => {
  if (initialized) return;
  if (!env.pixel.id) return;
  if (typeof window === 'undefined') return;

  // Standard Meta Pixel snippet, adapted for runtime injection.
  /* eslint-disable */
  (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  fbq('init', env.pixel.id);
  fbq('track', 'PageView');
  initialized = true;
};

export const trackEvent = (eventName: string, params?: Record<string, unknown>): void => {
  if (!initialized) return;
  if (params) fbq('track', eventName, params);
  else fbq('track', eventName);
};

export const trackCustom = (eventName: string, params?: Record<string, unknown>): void => {
  if (!initialized) return;
  if (params) fbq('trackCustom', eventName, params);
  else fbq('trackCustom', eventName);
};
