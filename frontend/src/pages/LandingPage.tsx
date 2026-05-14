import { useEffect } from 'react';
import HeroSection from '@components/HeroSection';
import BlobDivider from '@components/BlobDivider';
import PrerequisitesSection from '@components/PrerequisitesSection';
import AdmissionsSection from '@components/AdmissionsSection/AdmissionsSection';
import SuccessProofsSection from '@components/SuccessProofsSection';
import StoriesSection from '@components/StoriesSection';
import TestimonialsSection from '@components/TestimonialsSection';
import Footer from '@components/Footer';

interface LandingPageProps {
  onInductionClick?: () => void;
}

function LandingPage({ onInductionClick }: LandingPageProps) {
  useEffect(() => {
    const root = document.documentElement;
    let frameId = 0;

    const updateScrollVars = () => {
      frameId = 0;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );

      root.style.setProperty('--page-scroll', `${scrollY}px`);
      root.style.setProperty('--page-progress', (scrollY / maxScroll).toFixed(4));
    };

    const requestUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateScrollVars);
    };

    updateScrollVars();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
    };
  }, []);

  return (
    <main className="luxuryPage">
      <div className="ambientBackdrop" aria-hidden="true">
        <span className="ambientGlow ambientGlowLeft" />
        <span className="ambientGlow ambientGlowRight" />
        <span className="ambientBeam ambientBeamOne" />
        <span className="ambientBeam ambientBeamTwo" />
        <span className="ambientGrid" />
      </div>

      {/* Section 1 - Ambient (Hero) */}
      <section className="section ambient-section">
        <HeroSection onInductionClick={onInductionClick} />
      </section>

      {/* Section 2 - Dark */}
      <section className="section dark-section">
        <PrerequisitesSection onInductionClick={onInductionClick} />
        <BlobDivider />
        <AdmissionsSection />
      </section>

      {/* Section 3 - Ambient */}
      <section className="section ambient-section">
        <SuccessProofsSection />
        <BlobDivider />
        <StoriesSection />
      </section>

      {/* Section 4 - Dark */}
      <section className="section dark-section">
        <TestimonialsSection />
        <BlobDivider />
        <Footer onInductionClick={onInductionClick} />
      </section>
    </main>
  );
}

export default LandingPage;
