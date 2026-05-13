import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

interface QuickAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'options' | 'newUser' | 'existingUser';

function QuickAuthModal({ isOpen, onClose }: QuickAuthModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('options');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('options');
      setMobile('');
      const ctx = gsap.context(() => {
        gsap.from(modalRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
        gsap.from(contentRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 0.4,
          ease: 'back.out(1.2)',
          delay: 0.1,
        });
      });
      return () => ctx.revert();
    }
  }, [isOpen]);

  const handleClose = () => {
    const ctx = gsap.context(() => {
      gsap.to([modalRef.current, contentRef.current], {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: onClose,
      });
    });
    return () => ctx.revert();
  };

  const validateMobile = () => {
    return mobile.trim().length === 10 && /^\d{10}$/.test(mobile);
  };

  const handleMobileSubmit = async (userType: 'new' | 'existing') => {
    if (!validateMobile()) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    // Simulated API call - validation done later
    setTimeout(() => {
      setLoading(false);
      handleClose();
      // Redirect to congratulations page after modal closes
      setTimeout(() => navigate('/congratulations'), 300);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        backdropFilter: 'blur(4px)',
        opacity: 1,
      }}
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(6, 8, 22, 0.95) 0%, rgba(11, 16, 36, 0.95) 100%)',
          border: '1px solid rgba(133, 184, 255, 0.2)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          width: '90%',
          maxWidth: '450px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          scale: 1,
          opacity: 1,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
        >
          ✕
        </button>

        {/* OPTIONS STEP */}
        {step === 'options' && (
          <div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.75rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#fff',
                letterSpacing: '0.01em',
              }}
            >
              Get Your Induction
            </h2>
            <p
              style={{
                fontFamily: "'Manrope', system-ui, sans-serif",
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '2rem',
                lineHeight: 1.5,
              }}
            >
              Choose how you'd like to proceed with your AI transformation journey.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* New User Button */}
              <button
                onClick={() => setStep('newUser')}
                style={{
                  background: 'linear-gradient(135deg, #85b8ff, #7a6bff)',
                  color: '#fff',
                  border: 'none',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '0.875rem',
                  fontSize: '1rem',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>New User</span>
                <span
                  style={{
                    fontFamily: "'Manrope', system-ui, sans-serif",
                    fontSize: '0.85rem',
                    opacity: 0.9,
                    fontWeight: 400,
                  }}
                >
                  Get induction at ₹89
                </span>
              </button>

              {/* Existing User Button */}
              <button
                onClick={() => setStep('existingUser')}
                style={{
                  background: 'rgba(133, 184, 255, 0.1)',
                  color: '#85b8ff',
                  border: '2px solid rgba(133, 184, 255, 0.3)',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '0.875rem',
                  fontSize: '1rem',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(133, 184, 255, 0.6)';
                  e.currentTarget.style.background = 'rgba(133, 184, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(133, 184, 255, 0.3)';
                  e.currentTarget.style.background = 'rgba(133, 184, 255, 0.1)';
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Already a User</span>
                <span
                  style={{
                    fontFamily: "'Manrope', system-ui, sans-serif",
                    fontSize: '0.85rem',
                    opacity: 0.8,
                    fontWeight: 400,
                  }}
                >
                  Log in to your account
                </span>
              </button>
            </div>
          </div>
        )}

        {/* NEW USER STEP */}
        {step === 'newUser' && (
          <div>
            <button
              onClick={() => setStep('options')}
              style={{
                background: 'none',
                border: 'none',
                color: '#85b8ff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: "'Manrope', system-ui, sans-serif",
                marginBottom: '1.5rem',
                padding: 0,
                textDecoration: 'none',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              ← Back
            </button>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#fff',
                letterSpacing: '0.01em',
              }}
            >
              Create New Account
            </h2>
            <p
              style={{
                fontFamily: "'Manrope', system-ui, sans-serif",
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '2rem',
              }}
            >
              Enter your mobile number to get started.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  fontFamily: "'Manrope', system-ui, sans-serif",
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                Mobile Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid rgba(133, 184, 255, 0.3)`,
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontFamily: "'Manrope', system-ui, sans-serif",
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#85b8ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(133, 184, 255, 0.3)')}
              />
              <p
                style={{
                  fontFamily: "'Manrope', system-ui, sans-serif",
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.5rem',
                }}
              >
                {mobile.length}/10
              </p>
            </div>

            <button
              onClick={() => handleMobileSubmit('new')}
              disabled={loading || !validateMobile()}
              style={{
                width: '100%',
                padding: '1rem',
                background: validateMobile() ? 'linear-gradient(135deg, #85b8ff, #7a6bff)' : 'rgba(133, 184, 255, 0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                cursor: validateMobile() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (validateMobile()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        )}

        {/* EXISTING USER STEP */}
        {step === 'existingUser' && (
          <div>
            <button
              onClick={() => setStep('options')}
              style={{
                background: 'none',
                border: 'none',
                color: '#85b8ff',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontFamily: "'Manrope', system-ui, sans-serif",
                marginBottom: '1.5rem',
                padding: 0,
                textDecoration: 'none',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              ← Back
            </button>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#fff',
                letterSpacing: '0.01em',
              }}
            >
              Welcome Back
            </h2>
            <p
              style={{
                fontFamily: "'Manrope', system-ui, sans-serif",
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '2rem',
              }}
            >
              Enter your mobile number to log in.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  fontFamily: "'Manrope', system-ui, sans-serif",
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '0.5rem',
                }}
              >
                Mobile Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid rgba(133, 184, 255, 0.3)`,
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontFamily: "'Manrope', system-ui, sans-serif",
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#85b8ff')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(133, 184, 255, 0.3)')}
              />
              <p
                style={{
                  fontFamily: "'Manrope', system-ui, sans-serif",
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.5rem',
                }}
              >
                {mobile.length}/10
              </p>
            </div>

            <button
              onClick={() => handleMobileSubmit('existing')}
              disabled={loading || !validateMobile()}
              style={{
                width: '100%',
                padding: '1rem',
                background: validateMobile() ? 'linear-gradient(135deg, #85b8ff, #7a6bff)' : 'rgba(133, 184, 255, 0.3)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                cursor: validateMobile() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (validateMobile()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickAuthModal;
