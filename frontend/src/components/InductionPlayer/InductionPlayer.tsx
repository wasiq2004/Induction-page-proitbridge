import { useEffect, useRef } from 'react';
import { attachVideoAnalytics } from '@lib/videoAnalytics';
import { getAuthSession } from '@lib/googleSheets';
import { env } from '@lib/env';
import styles from './InductionPlayer.module.css';

interface InductionPlayerProps {
  /** Public path to the video file (defaults to the bundled induction video). */
  src?: string;
  /** Optional poster image. */
  poster?: string;
  /** Stable identifier used to bucket analytics across users. */
  videoId?: string;
}

// How long the volume fade-in lasts when playback starts (ms).
const VOLUME_FADE_MS = 1500;
// Small tolerance so natural playback "seeks" past the high-water mark don't snap back.
const SEEK_TOLERANCE_S = 0.75;

function InductionPlayer({
  src = env.video.inductionUrl,
  poster,
  videoId = 'congrats-induction-v1',
}: InductionPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const session = getAuthSession();
    const detach = attachVideoAnalytics(el, {
      userId: session?.mobile ?? 'anonymous',
      userName: session?.name ?? 'anonymous',
      videoId,
    });
    return detach;
  }, [videoId]);

  // No-forward-scrub: the user can rewind freely, but cannot seek past the
  // furthest point they've already watched.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    let maxWatched = 0;

    const onTimeUpdate = () => {
      if (!el.seeking && el.currentTime > maxWatched) {
        maxWatched = el.currentTime;
      }
    };

    const onSeeking = () => {
      const limit = maxWatched + SEEK_TOLERANCE_S;
      if (el.currentTime > limit) {
        el.currentTime = maxWatched;
      }
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('seeking', onSeeking);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('seeking', onSeeking);
    };
  }, []);

  // Volume fade-in: each time playback starts (initial autoplay or resume
  // after pause), unmute and ramp volume from 0 to its target.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    let rafId = 0;
    let targetVolume = 1;

    const onPlay = () => {
      cancelAnimationFrame(rafId);
      targetVolume = el.volume > 0 ? el.volume : 1;
      el.muted = false;
      el.volume = 0;
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / VOLUME_FADE_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.volume = eased * targetVolume;
        if (progress < 1 && !el.paused) {
          rafId = requestAnimationFrame(tick);
        }
      };
      rafId = requestAnimationFrame(tick);
    };

    const onPause = () => {
      cancelAnimationFrame(rafId);
      el.volume = targetVolume;
    };

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, []);

  // Autoplay as soon as the video has enough data. Browsers require muted
  // autoplay without a prior user gesture, so we start muted; the fade-in
  // effect above unmutes us on the resulting `play` event. If the browser
  // still refuses (Safari with strict settings), the user can hit play.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const tryPlay = () => {
      el.muted = true;
      const p = el.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay was blocked — leave the controls for the user.
        });
      }
    };

    if (el.readyState >= 3) {
      tryPlay();
      return;
    }

    el.addEventListener('canplay', tryPlay, { once: true });
    return () => el.removeEventListener('canplay', tryPlay);
  }, []);

  return (
    <div className={styles.player}>
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        disableRemotePlayback
        preload="auto"
        playsInline
        autoPlay
        muted
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}

export default InductionPlayer;
