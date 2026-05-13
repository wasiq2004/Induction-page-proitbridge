import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { CareerStory } from '@t/index';
import styles from './StoriesSection.module.css';

interface StoryCardProps {
  item: CareerStory;
  index: number;
  total: number;
}

function StoryCard({ item, index, total }: StoryCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Autoplay when card scrolls into view, pause when it leaves
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay blocked — browser will show poster/thumbnail
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [hasVideoError]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--card-rotate-x', `${(-y * 6).toFixed(2)}deg`);
    event.currentTarget.style.setProperty('--card-rotate-y', `${(x * 8).toFixed(2)}deg`);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--card-rotate-x', '0deg');
    event.currentTarget.style.setProperty('--card-rotate-y', '0deg');
  };

  const handleMuteToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    // When unmuting, pause all other videos' audio first
    if (isMuted) {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== video) v.muted = true;
      });
    }

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <article
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ['--stack-index' as string]: index, ['--stack-total' as string]: total }}
    >
      <div className={styles.cardGlow} aria-hidden="true" />
      <div className={styles.videoWrapper}>
        {!hasVideoError ? (
          <video
            ref={videoRef}
            data-story-index={index}
            className={styles.storyVideo}
            src={item.videoSrc}
            muted
            playsInline
            loop
            preload="metadata"
            onError={() => setHasVideoError(true)}
          />
        ) : null}

        <div className={styles.videoOverlay} />
        {/* <span className={styles.label}>Career Transformation</span> */}

        <button
          className={styles.muteBtn}
          onClick={handleMuteToggle}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            // Muted icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.63 3.63a.996.996 0 0 0 0 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 1 0 1.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.2-1.22.83v.08c0 .37.23.71.58.83C16.1 6.54 19 9.06 19 12zm-8.71-6.29-.17.17L12 7.76V6.41c0-.89-1.08-1.34-1.71-.7zM16.5 12A4.5 4.5 0 0 0 14 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z" />
            </svg>
          ) : (
            // Unmuted icon
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>

        {hasVideoError && (
          <div className={styles.videoFallback}>
            <strong>Story video slot ready</strong>
            <p>Add <code>{item.videoSrc.replace('/assets/', '')}</code> to <code>/public/assets</code>.</p>
          </div>
        )}

      </div>

      <div className={styles.info}>
        <div className={styles.metaRow}>
          <span className={styles.cardIndex}>0{index + 1}</span>
          <span className={styles.duration}>{item.duration}</span>
        </div>
        <p className={styles.cardTitle}>{item.title}</p>
        {item.description && (
          <p className={styles.cardDescription}>{item.description}</p>
        )}
      </div>
    </article>
  );
}

export default StoryCard;
