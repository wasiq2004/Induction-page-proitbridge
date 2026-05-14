import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  startInductionPayment,
  CheckoutDismissedError,
} from '@lib/razorpay';
import { checkAccess, saveAuthSession } from '@lib/googleSheets';
import { trackCustom } from '@lib/metaPixel';

interface QuickAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthStep = 'selection' | 'details' | 'login' | 'payment';

const NAME_REGEX = /^.{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

function QuickAuthModal({ isOpen, onClose }: QuickAuthModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('selection');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('selection');
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

  const goToPayment = () => {
    const err = validateDetails();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep('payment');
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
      const result = await checkAccess(mobile);
      if (result.hasAccess) {
        saveAuthSession(mobile, result.userName ?? 'Student');
        onClose();
        setTimeout(() => navigate('/congratulations'), 200);
      } else {
        setError('No successful payment found for this mobile number.');
      }
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

        {step === 'selection' && <SelectionStep onPay={() => setStep('details')} onLogin={() => setStep('login')} />}

        {step === 'details' && (
          <DetailsStep
            fullName={fullName}
            mobile={mobile}
            error={error}
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
  fontFamily: "'Manrope', system-ui, sans-serif",
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
  fontFamily: "'Manrope', system-ui, sans-serif",
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
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed',
});

const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#6FD3F2',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontFamily: "'Manrope', system-ui, sans-serif",
  marginBottom: '1.5rem',
  padding: 0,
};

const headingStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: '1.5rem',
  fontWeight: 600,
  marginBottom: '0.5rem',
  color: '#fff',
};

const subTextStyle: React.CSSProperties = {
  fontFamily: "'Manrope', system-ui, sans-serif",
  fontSize: '0.9rem',
  color: 'rgba(255, 255, 255, 0.7)',
  marginBottom: '2rem',
  lineHeight: 1.5,
};

const errorStyle: React.CSSProperties = {
  fontFamily: "'Manrope', system-ui, sans-serif",
  fontSize: '0.85rem',
  color: '#ff8a8a',
  marginTop: '0.75rem',
};

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
            fontFamily: "'Cormorant Garamond', Georgia, serif",
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
  onBack: () => void;
  onChangeName: (v: string) => void;
  onChangeMobile: (v: string) => void;
  onContinue: () => void;
}) {
  const enabled = props.fullName.trim().length >= 2 && /^[6-9]\d{9}$/.test(props.mobile);
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
          onChange={(e) => props.onChangeMobile(e.target.value.replace(/\D/g, ''))}
          style={inputStyle}
        />
      </div>

      {props.error && <p style={errorStyle}>{props.error}</p>}

      <button onClick={props.onContinue} disabled={!enabled} style={{ ...primaryBtn(enabled), marginTop: '1rem' }}>
        Continue to Payment
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
          onChange={(e) => props.onChangeMobile(e.target.value.replace(/\D/g, ''))}
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
          fontFamily: "'Manrope', system-ui, sans-serif",
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
