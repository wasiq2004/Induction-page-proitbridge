/**
 * Client-side video watch tracker → Google Sheets (via GAS).
 *
 * One row per (mobile, videoId). On each flush we POST the latest:
 *   - watchedSec      : cumulative seconds the user actually watched
 *   - maxPositionSec  : furthest point reached in the timeline
 *   - durationSec     : video length
 *   - completed       : did the user reach the end
 *
 * "Actual watch time" excludes seeks: we compare wall-clock delta against
 * playback-position delta and discard the interval when they diverge.
 *
 * Flush triggers: every FLUSH_INTERVAL_MS while playing, on pause, on ended,
 * and on tab hide / unload (so we don't lose the final state).
 */

import { updateWatchProgress } from './googleSheets';

const FLUSH_INTERVAL_MS = 10_000;
const SEEK_THRESHOLD_S = 1.5;

interface AnalyticsOptions {
  userId: string;     // mobile (matches the auth-session row)
  userName: string;
  videoId: string;
}

export function attachVideoAnalytics(
  el: HTMLVideoElement,
  opts: AnalyticsOptions,
): () => void {
  let watchedSec = 0;
  let maxPositionSec = 0;
  let durationSec = 0;
  let completed = false;

  let playing = false;
  let lastPosition = el.currentTime;
  let lastTickWall = performance.now();
  let flushTimer: number | null = null;
  let pendingChange = false;

  const flush = () => {
    if (!pendingChange) return;
    pendingChange = false;
    updateWatchProgress({
      mobile: opts.userId,
      fullName: opts.userName,
      videoId: opts.videoId,
      watchedSec,
      maxPositionSec,
      durationSec,
      completed,
    });
  };

  const accumulate = () => {
    if (!playing) return;
    const now = performance.now();
    const wallDelta = (now - lastTickWall) / 1000;
    const posDelta = el.currentTime - lastPosition;
    lastTickWall = now;
    lastPosition = el.currentTime;

    // If position jumped more (or less) than wall-clock could explain, treat
    // it as a seek and don't count it toward watch time.
    if (Math.abs(posDelta - wallDelta) <= SEEK_THRESHOLD_S && posDelta > 0) {
      watchedSec += posDelta;
      pendingChange = true;
    }
    if (el.currentTime > maxPositionSec) {
      maxPositionSec = el.currentTime;
      pendingChange = true;
    }
  };

  const onLoaded = () => {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      durationSec = el.duration;
      pendingChange = true;
    }
  };

  const onPlay = () => {
    playing = true;
    lastPosition = el.currentTime;
    lastTickWall = performance.now();
    flushTimer = window.setInterval(() => {
      accumulate();
      flush();
    }, FLUSH_INTERVAL_MS);
  };

  const onPause = () => {
    accumulate();
    playing = false;
    if (flushTimer !== null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    flush();
  };

  const onEnded = () => {
    accumulate();
    completed = true;
    pendingChange = true;
    playing = false;
    if (flushTimer !== null) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    flush();
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      accumulate();
      flush();
    }
  };

  const onBeforeUnload = () => {
    accumulate();
    flush();
  };

  el.addEventListener('loadedmetadata', onLoaded);
  el.addEventListener('play', onPlay);
  el.addEventListener('pause', onPause);
  el.addEventListener('ended', onEnded);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('beforeunload', onBeforeUnload);

  return () => {
    accumulate();
    flush();
    if (flushTimer !== null) clearInterval(flushTimer);
    el.removeEventListener('loadedmetadata', onLoaded);
    el.removeEventListener('play', onPlay);
    el.removeEventListener('pause', onPause);
    el.removeEventListener('ended', onEnded);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('beforeunload', onBeforeUnload);
  };
}
