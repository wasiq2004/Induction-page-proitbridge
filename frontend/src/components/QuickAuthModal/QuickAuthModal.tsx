import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  startInductionPayment,
  CheckoutDismissedError,
} from '@lib/razorpay';
import { checkAccess, normalizeMobile, saveAuthSession } from '@lib/googleSheets';
import { trackCustom } from '@lib/metaPixel';

interface QuickAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'consent' | 'selection' | 'details' | 'login' | 'payment';

const NAME_REGEX = /^.{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

function QuickAuthModal({ isOpen, onClose }: QuickAuthModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('consent');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('consent');
      setFullName('');
      setMobile('');
      setError(null);
      setLoading(false);
      trackCustom('InductionCTAClicked');
      const ctx = gsap.context(() => {
        gsap.from(modalRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' });
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
    if (loading) return;
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

  const validateDetails = (): string | null => {
    if (!NAME_REGEX.test(fullName.trim())) return 'Please enter your full name';
    if (!MOBILE_REGEX.test(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    return null;
  };

  const validateLogin = (): string | null => {
    if (!MOBILE_REGEX.test(mobile)) return 'Enter a valid 10-digit Indian mobile number';
    return null;
  };

  const goToPayment = async () => {
    const err = validateDetails();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizeMobile(mobile);
      const result = await checkAccess(normalized);
      if (result.status === 'SUCCESS') {
        setError('This mobile number is already registered. Please use the Login option above.');
        return;
      }
      if (result.status === 'PENDING') {
        setError(
          'A payment is already in progress for this number. Please wait a few minutes, then log in.',
        );
        return;
      }
      // Persist the normalized form so payment/registration uses the canonical value.
      setMobile(normalized);
      setStep('payment');
    } catch {
      setError('Could not verify the number. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const err = validateLogin();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizeMobile(mobile);
      const result = await checkAccess(normalized);
      if (result.hasAccess) {
        saveAuthSession(normalized, result.userName ?? 'Student');
        onClose();
        setTimeout(() => navigate('/congratulations'), 200);
        return;
      }
      if (result.status === 'PENDING') {
        setError(
          'Your payment is still being processed. Please wait a few minutes and try logging in again.',
        );
        return;
      }
      setError('No payment found for this mobile number. Please pay first or check the number.');
    } catch {
      setError('Could not verify access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setError(null);
    setLoading(true);
    try {
      const paymentId = await startInductionPayment(mobile, fullName.trim());
      onClose();
      setTimeout(
        () =>
          navigate('/congratulations', {
            state: { paymentId, paymentVerified: true, userName: fullName.trim() },
          }),
        200,
      );
    } catch (err) {
      if (err instanceof CheckoutDismissedError) {
        setError('Payment cancelled. You can try again whenever you are ready.');
      } else {
        setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(6, 8, 22, 0.95) 0%, rgba(11, 16, 36, 0.95) 100%)',
          border: '1px solid rgba(111, 211, 242, 0.2)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          width: '90%',
          maxWidth: '450px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '1.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '0.5rem',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {step === 'consent' && (
          <ConsentStep
            onAgree={() => setStep('selection')}
            onCancel={handleClose}
          />
        )}

        {step === 'selection' && <SelectionStep onPay={() => setStep('details')} onLogin={() => setStep('login')} />}

        {step === 'details' && (
          <DetailsStep
            fullName={fullName}
            mobile={mobile}
            error={error}
            loading={loading}
            onBack={() => setStep('selection')}
            onChangeName={setFullName}
            onChangeMobile={setMobile}
            onContinue={goToPayment}
          />
        )}

        {step === 'login' && (
          <LoginStep
            mobile={mobile}
            error={error}
            loading={loading}
            onBack={() => setStep('selection')}
            onChangeMobile={setMobile}
            onSubmit={handleLogin}
          />
        )}

        {step === 'payment' && (
          <PaymentStep
            fullName={fullName}
            mobile={mobile}
            error={error}
            loading={loading}
            onBack={() => setStep('details')}
            onPay={handlePay}
          />
        )}
      </div>
    </div>
  );
}

// --- Step components -------------------------------------------------------

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.7)',
  display: 'block',
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.875rem 1rem',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(111, 211, 242, 0.3)',
  borderRadius: '0.75rem',
  color: '#fff',
  fontFamily: 'var(--font-sans)',
  fontSize: '1rem',
  outline: 'none',
};

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '1rem',
  background: enabled
    ? 'linear-gradient(135deg, #6FD3F2, #2E7DE8)'
    : 'rgba(111, 211, 242, 0.3)',
  color: '#fff',
  border: 'none',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed',
});

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6FD3F2',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
  marginBottom: '1.5rem',
  padding: 0,
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: '0.5rem',
  color: '#fff',
};

const subTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '2rem',
  lineHeight: 1.5,
};

const errorStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.85rem',
  color: '#ff8a8a',
  marginTop: '0.75rem',
};

function ConsentStep({ onAgree, onCancel }: { onAgree: () => void; onCancel: () => void }) {
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          borderRadius: 999,
          border: '1px solid rgba(43, 200, 245, 0.3)',
          background: 'rgba(43, 200, 245, 0.08)',
          color: '#6FD3F2',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
        <span>Before you continue</span>
      </div>

      <h2 style={headingStyle}>This is a 30-minute induction</h2>
      <p style={{ ...subTextStyle, marginBottom: '1.25rem' }}>
        Right after payment you will be taken to an exclusive video that runs for about{' '}
        <strong style={{ color: '#fff' }}>30 minutes</strong>. You can&apos;t fast-forward
        through it and you&apos;ll get the most out of it if you watch in one sitting.
      </p>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '0.75rem',
          padding: '0.95rem 1.1rem',
          marginBottom: '1.75rem',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.88rem',
          color: 'rgba(255, 255, 255, 0.78)',
          lineHeight: 1.6,
        }}
      >
        <p style={{ marginBottom: '0.5rem' }}>Please confirm you can:</p>
        <ul style={{ paddingLeft: '1.1rem', margin: 0, listStyle: 'disc' }}>
          <li>Set aside <strong style={{ color: '#fff' }}>30 minutes</strong> right now</li>
          <li>Watch on a stable internet connection</li>
          <li>Use headphones or be in a quiet place</li>
        </ul>
      </div>

      <button onClick={onAgree} style={primaryBtn(true)}>
        Yes, I&apos;m ready — continue
      </button>
      <button
        onClick={onCancel}
        style={{
          width: '100%',
          marginTop: '0.75rem',
          padding: '0.9rem',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '0.75rem',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
        }}
      >
        I&apos;ll come back later
      </button>
    </div>
  );
}

function SelectionStep({ onPay, onLogin }: { onPay: () => void; onLogin: () => void }) {
  return (
    <div>
      <h2 style={{ ...headingStyle, fontSize: '1.75rem' }}>Get Your Induction</h2>
      <p style={subTextStyle}>Choose how you'd like to proceed with your AI transformation journey.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button onClick={onPay} style={primaryBtn(true)}>
          New User — Pay Rs. 89
        </button>
        <button
          onClick={onLogin}
          style={{
            background: 'rgba(111, 211, 242, 0.1)',
            color: '#6FD3F2',
            border: '2px solid rgba(111, 211, 242, 0.3)',
            padding: '1rem',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Already Paid? Login
        </button>
      </div>
    </div>
  );
}

function DetailsStep(props: {
  fullName: string;
  mobile: string;
  error: string | null;
  loading: boolean;
  onBack: () => void;
  onChangeName: (v: string) => void;
  onChangeMobile: (v: string) => void;
  onContinue: () => void;
}) {
  const enabled =
    !props.loading &&
    props.fullName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(props.mobile);
  return (
    <div>
      <button onClick={props.onBack} style={backBtnStyle}>← Back</button>
      <h2 style={headingStyle}>Your Details</h2>
      <p style={subTextStyle}>We'll prefill your Razorpay checkout with this.</p>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Full Name *</label>
        <input
          type="text"
          placeholder="e.g. Priya Sharma"
          value={props.fullName}
          onChange={(e) => props.onChangeName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Mobile Number *</label>
        <input
          type="tel"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={props.mobile}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            // Drop country-code prefix on the fly so the field always shows 10 digits.
            const trimmed = digits.length === 12 && digits.startsWith('91')
              ? digits.slice(2)
              : digits.length === 11 && digits.startsWith('0')
                ? digits.slice(1)
                : digits;
            props.onChangeMobile(trimmed);
          }}
          style={inputStyle}
        />
      </div>

      {props.error && <p style={errorStyle}>{props.error}</p>}

      <button onClick={props.onContinue} disabled={!enabled} style={{ ...primaryBtn(enabled), marginTop: '1rem' }}>
        {props.loading ? 'Checking number…' : 'Continue to Payment'}
      </button>
    </div>
  );
}

function LoginStep(props: {
  mobile: string;
  error: string | null;
  loading: boolean;
  onBack: () => void;
  onChangeMobile: (v: string) => void;
  onSubmit: () => void;
}) {
  const enabled = /^[6-9]\d{9}$/.test(props.mobile) && !props.loading;
  return (
    <div>
      <button onClick={props.onBack} style={backBtnStyle}>← Back</button>
      <h2 style={headingStyle}>Welcome Back</h2>
      <p style={subTextStyle}>Enter the mobile number you paid with.</p>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Mobile Number *</label>
        <input
          type="tel"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={props.mobile}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            // Drop country-code prefix on the fly so the field always shows 10 digits.
            const trimmed = digits.length === 12 && digits.startsWith('91')
              ? digits.slice(2)
              : digits.length === 11 && digits.startsWith('0')
                ? digits.slice(1)
                : digits;
            props.onChangeMobile(trimmed);
          }}
          style={inputStyle}
        />
      </div>

      {props.error && <p style={errorStyle}>{props.error}</p>}

      <button onClick={props.onSubmit} disabled={!enabled} style={{ ...primaryBtn(enabled), marginTop: '1rem' }}>
        {props.loading ? 'Checking…' : 'Login'}
      </button>
    </div>
  );
}

function PaymentStep(props: {
  fullName: string;
  mobile: string;
  error: string | null;
  loading: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <div>
      <button onClick={props.onBack} style={backBtnStyle} disabled={props.loading}>← Back</button>
      <h2 style={headingStyle}>Confirm & Pay</h2>
      <p style={subTextStyle}>
        Pay <strong style={{ color: '#fff' }}>Rs. 89</strong> via Razorpay to unlock the induction.
      </p>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '0.75rem',
          padding: '1rem 1.1rem',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          color: 'rgba(255, 255, 255, 0.85)',
          lineHeight: 1.6,
        }}
      >
        <div><span style={{ opacity: 0.6 }}>Name:</span> {props.fullName}</div>
        <div><span style={{ opacity: 0.6 }}>Mobile:</span> {props.mobile}</div>
        <div><span style={{ opacity: 0.6 }}>Amount:</span> Rs. 89</div>
      </div>

      {props.error && <p style={errorStyle}>{props.error}</p>}

      <button onClick={props.onPay} disabled={props.loading} style={primaryBtn(!props.loading)}>
        {props.loading ? 'Opening Razorpay…' : 'Pay Rs. 89 Securely'}
      </button>
    </div>
  );
}

export default QuickAuthModal;
