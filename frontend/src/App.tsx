import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import IntroOverlay from '@components/IntroOverlay';
import ScrollProgressBar from '@components/ScrollProgressBar';
import QuickAuthModal from '@components/QuickAuthModal';
import LandingPage from '@pages/LandingPage';
import CongratulationsPage from '@pages/CongratulationsPage';
import EnrollmentPage from '@pages/EnrollmentPage';
import EnrollmentConfirmationPage from '@pages/EnrollmentConfirmationPage';
import TermsPage from '@pages/TermsPage';
import PrivacyPage from '@pages/PrivacyPage';
import RefundPage from '@pages/RefundPage';
import ContactPage from '@pages/ContactPage';
import { initMetaPixel } from '@lib/metaPixel';

function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    initMetaPixel();
  }, []);

  return (
    <>
      {!introComplete && (
        <IntroOverlay onComplete={() => setIntroComplete(true)} />
      )}
      <ScrollProgressBar />
      <QuickAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <div
        style={{
          opacity: introComplete ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <Routes>
          <Route path="/" element={<LandingPage onInductionClick={() => setAuthModalOpen(true)} />} />
          <Route path="/congratulations" element={<CongratulationsPage />} />
          <Route path="/enrollment" element={<EnrollmentPage />} />
          <Route path="/enrollment-confirmation" element={<EnrollmentConfirmationPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/refund" element={<RefundPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
