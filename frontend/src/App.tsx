import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import IntroOverlay from '@components/IntroOverlay';
import ScrollProgressBar from '@components/ScrollProgressBar';
import QuickAuthModal from '@components/QuickAuthModal';
import LandingPage from '@pages/LandingPage';
import CongratulationsPage from '@pages/CongratulationsPage';
import EnrollmentPage from '@pages/EnrollmentPage';

function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
        </Routes>
      </div>
    </>
  );
}

export default App;
