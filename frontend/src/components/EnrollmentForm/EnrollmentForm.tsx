import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useScrollReveal } from '@hooks/useScrollReveal';
import { submitEnrollment } from '@services/enrollmentService';
import { indianStates } from '@constants/indianStates';
import { ProgramType, PaymentMethod } from '@t/index';
import type { EnrollmentFormData, CourseType } from '@t/index';
import {
  openEnrollmentCheckout,
  CheckoutDismissedError,
} from '@lib/razorpay';
import { trackEvent, trackCustom } from '@lib/metaPixel';
import { env } from '@lib/env';
import styles from './EnrollmentForm.module.css';

type SubmitState = 'idle' | 'loading' | 'success';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const PROGRAM_LABELS: Record<ProgramType, string> = {
  [ProgramType.ADVANCED_DATA_ANALYST]: 'Advanced Data Analyst',
  [ProgramType.ADVANCED_DATA_SCIENCE_AI]: 'Advanced Data Science & AI',
  [ProgramType.AGENTIC_AI_GEN_AI]: 'Agentic AI & GenAI',
  [ProgramType.COMBO]: 'Combo (All Programs)',
};

const COURSE_TYPE_OPTIONS: { value: CourseType; label: string }[] = [
  { value: 'ONLINE_LIVE', label: 'Online Live' },
  { value: 'SELF_PACED', label: 'Self-paced' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const STEPS = ['Personal', 'Address', 'Course', 'Payment'];
const STEP_FIELDS: (keyof EnrollmentFormData)[][] = [
  ['fullName', 'email', 'mobile'],
  ['addressLine1', 'city', 'state', 'pincode'],
  ['programSelection', 'courseType'],
  ['paymentMethod'],
];

const INITIAL: EnrollmentFormData = {
  fullName: '',
  email: '',
  mobile: '',
  country: 'India',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  programSelection: ProgramType.ADVANCED_DATA_ANALYST,
  courseType: 'ONLINE_LIVE',
  paymentMethod: PaymentMethod.UPI,
};

const CONFETTI_COLORS = ['#3B82F6', '#7C3AED', '#F59E0B', '#10B981', '#EF4444'];

const validateField = (name: keyof EnrollmentFormData, value: string): string | null => {
  switch (name) {
    case 'fullName':    return value.trim() ? null : 'Full name is required';
    case 'email':       return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Valid email required';
    case 'mobile':      return /^[0-9]{10}$/.test(value) ? null : 'Enter 10-digit mobile number';
    case 'addressLine1': return value.trim() ? null : 'Address is required';
    case 'city':        return value.trim() ? null : 'City is required';
    case 'state':       return value.trim() ? null : 'State is required';
    case 'pincode':     return /^[0-9]{6}$/.test(value) ? null : 'Enter 6-digit pincode';
    default:            return null;
  }
};

function EnrollmentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EnrollmentFormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof EnrollmentFormData, string>>>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { ref: personalRef, isVisible: pVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: addressRef, isVisible: aVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: courseRef, isVisible: cVisible } = useScrollReveal<HTMLDivElement>();
  const { ref: paymentRef, isVisible: payVisible } = useScrollReveal<HTMLDivElement>();

  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRafRef = useRef(0);

  // Heading clip-path entrance per word
  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLSpanElement>(`.${styles.headingWord}`);
    const ctx = gsap.context(() => {
      gsap.from(words, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2,
      });
    });
    return () => ctx.revert();
  }, []);

  // Section reveal animations
  const revealSection = (el: HTMLElement | null) => {
    if (!el) return;
    gsap.from(el, { y: 30, opacity: 0, duration: 0.5, ease: 'power3.out' });
  };

  useEffect(() => { if (pVisible) revealSection(personalRef.current); }, [pVisible]);
  useEffect(() => { if (aVisible) revealSection(addressRef.current); }, [aVisible]);
  useEffect(() => { if (cVisible) revealSection(courseRef.current); }, [cVisible]);
  useEffect(() => { if (payVisible) revealSection(paymentRef.current); }, [payVisible]);

  const getActiveStep = () => {
    for (let i = 0; i < STEP_FIELDS.length; i++) {
      const incomplete = STEP_FIELDS[i].some(
        f => typeof formData[f] === 'string' && !(formData[f] as string).trim()
      );
      if (incomplete) return i;
    }
    return STEP_FIELDS.length - 1;
  };

  const handleChange = (name: keyof EnrollmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err ?? undefined }));
    }
  };

  const handleBlur = (name: keyof EnrollmentFormData, value: string) => {
    const err = validateField(name, value);
    if (err) setErrors(prev => ({ ...prev, [name]: err }));
  };

  const launchConfetti = (btn: HTMLButtonElement) => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rect = btn.getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;

    const particles: ConfettiParticle[] = Array.from({ length: 30 }, () => ({
      x: ox,
      y: oy,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 16 - 4,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      opacity: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5;
        p.opacity -= 0.015;
        p.rotation += p.rotationSpeed;
        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }
      if (alive) confettiRafRef.current = requestAnimationFrame(draw);
    };

    confettiRafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => () => cancelAnimationFrame(confettiRafRef.current), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const allErrors: Partial<Record<keyof EnrollmentFormData, string>> = {};
    const requiredFields: (keyof EnrollmentFormData)[] = [
      'fullName', 'email', 'mobile', 'addressLine1', 'city', 'state', 'pincode',
    ];
    requiredFields.forEach(f => {
      const err = validateField(f, formData[f] as string);
      if (err) allErrors[f] = err;
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    setSubmitState('loading');
    try {
      const paymentId = await openEnrollmentCheckout({
        name: formData.fullName,
        email: formData.email,
        contact: formData.mobile,
      });

      const { enrollmentId } = await submitEnrollment(formData, paymentId);

      trackEvent('Purchase', { value: 1000, currency: env.razorpay.currency });
      trackCustom('EnrollmentPaymentSuccess', {
        enrollmentId,
        paymentMethod: formData.paymentMethod,
        paymentId,
        value: 1000,
        currency: env.razorpay.currency,
      });

      setSubmitState('success');
      if (submitBtnRef.current) launchConfetti(submitBtnRef.current);

      setTimeout(
        () =>
          navigate('/enrollment-confirmation', {
            state: { enrollmentId, paymentId, formData },
          }),
        900,
      );
    } catch (err) {
      setSubmitState('idle');
      if (err instanceof CheckoutDismissedError) {
        setSubmitError('Payment cancelled. You can try again when ready.');
      } else {
        setSubmitError(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
        );
      }
    }
  };

  const activeStep = getActiveStep();

  return (
    <div className={styles.page}>
      <canvas ref={confettiCanvasRef} className={styles.confettiCanvas} />
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>

        <h1 ref={headingRef} className={styles.heading}>
          {"Enroll in ProITBridge".split(' ').map((w, i) => (
            <span key={i} className={styles.headingWord}>{w}&nbsp;</span>
          ))}
        </h1>

        {/* Step progress */}
        <div className={styles.progressSteps}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`${styles.step} ${i <= activeStep ? styles.active : ''}`}>
                <div className={styles.stepDot} />
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepConnector} ${i < activeStep ? styles.filled : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Personal */}
        <div ref={personalRef} className={styles.sectionGroup}>
          <p className={styles.sectionHeading}>Personal Details</p>
          <div className={styles.fieldRow}>
            <div className={styles.inputWrapper}>
              <input
                placeholder=" "
                className={`${styles.input} ${errors.fullName ? styles.error : ''}`}
                value={formData.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                onBlur={e => handleBlur('fullName', e.target.value)}
              />
              <label className={styles.floatingLabel}>Full Name *</label>
              {errors.fullName && <p className={styles.errorMsg}>{errors.fullName}</p>}
            </div>
            <div className={styles.inputWrapper}>
              <input
                type="email"
                placeholder=" "
                className={`${styles.input} ${errors.email ? styles.error : ''}`}
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={e => handleBlur('email', e.target.value)}
              />
              <label className={styles.floatingLabel}>Email *</label>
              {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
            </div>
          </div>
          <div className={`${styles.fieldRow} ${styles.single}`}>
            <div className={styles.inputWrapper}>
              <input
                type="tel"
                placeholder=" "
                maxLength={10}
                className={`${styles.input} ${errors.mobile ? styles.error : ''}`}
                value={formData.mobile}
                onChange={e => handleChange('mobile', e.target.value)}
                onBlur={e => handleBlur('mobile', e.target.value)}
              />
              <label className={styles.floatingLabel}>Mobile (10 digits) *</label>
              {errors.mobile && <p className={styles.errorMsg}>{errors.mobile}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div ref={addressRef} className={styles.sectionGroup}>
          <p className={styles.sectionHeading}>Address</p>
          <div className={`${styles.fieldRow} ${styles.single}`}>
            <div className={styles.inputWrapper}>
              <select
                className={styles.select}
                value={formData.country}
                onChange={e => handleChange('country', e.target.value)}
              >
                <option value="India">India</option>
              </select>
              <label className={styles.floatingLabel}>Country *</label>
            </div>
          </div>
          <div className={`${styles.fieldRow} ${styles.single}`}>
            <div className={styles.inputWrapper}>
              <input
                placeholder=" "
                className={`${styles.input} ${errors.addressLine1 ? styles.error : ''}`}
                value={formData.addressLine1}
                onChange={e => handleChange('addressLine1', e.target.value)}
                onBlur={e => handleBlur('addressLine1', e.target.value)}
              />
              <label className={styles.floatingLabel}>Address Line 1 *</label>
              {errors.addressLine1 && <p className={styles.errorMsg}>{errors.addressLine1}</p>}
            </div>
          </div>
          <div className={`${styles.fieldRow} ${styles.single}`}>
            <div className={styles.inputWrapper}>
              <input
                placeholder=" "
                className={styles.input}
                value={formData.addressLine2}
                onChange={e => handleChange('addressLine2', e.target.value)}
              />
              <label className={styles.floatingLabel}>Address Line 2 (optional)</label>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.inputWrapper}>
              <input
                placeholder=" "
                className={`${styles.input} ${errors.city ? styles.error : ''}`}
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                onBlur={e => handleBlur('city', e.target.value)}
              />
              <label className={styles.floatingLabel}>City *</label>
              {errors.city && <p className={styles.errorMsg}>{errors.city}</p>}
            </div>
            <div className={styles.inputWrapper}>
              <input
                placeholder=" "
                maxLength={6}
                className={`${styles.input} ${errors.pincode ? styles.error : ''}`}
                value={formData.pincode}
                onChange={e => handleChange('pincode', e.target.value)}
                onBlur={e => handleBlur('pincode', e.target.value)}
              />
              <label className={styles.floatingLabel}>Pincode *</label>
              {errors.pincode && <p className={styles.errorMsg}>{errors.pincode}</p>}
            </div>
          </div>
          <div className={`${styles.fieldRow} ${styles.single}`}>
            <div className={styles.inputWrapper}>
              <select
                className={`${styles.select} ${errors.state ? styles.error : ''}`}
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                onBlur={e => handleBlur('state', e.target.value)}
              >
                <option value="" disabled>Select State / UT</option>
                {indianStates.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <label className={styles.floatingLabel}>State / UT *</label>
              {errors.state && <p className={styles.errorMsg}>{errors.state}</p>}
            </div>
          </div>
        </div>

        {/* Course */}
        <div ref={courseRef} className={styles.sectionGroup}>
          <p className={styles.sectionHeading}>Program Selection</p>
          <div className={styles.programGrid}>
            {Object.values(ProgramType).map(pt => (
              <label
                key={pt}
                className={`${styles.programCard} ${formData.programSelection === pt ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name="program"
                  value={pt}
                  checked={formData.programSelection === pt}
                  onChange={() => handleChange('programSelection', pt)}
                />
                <span className={styles.radioCircle}>
                  <span className={styles.radioDot} />
                </span>
                <span className={styles.programLabel}>{PROGRAM_LABELS[pt]}</span>
              </label>
            ))}
          </div>
          <div className={`${styles.fieldRow} ${styles.single}`}>
            <div className={styles.inputWrapper}>
              <select
                className={styles.select}
                value={formData.courseType}
                onChange={e => handleChange('courseType', e.target.value)}
              >
                {COURSE_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <label className={styles.floatingLabel}>Course Type *</label>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div ref={paymentRef} className={styles.sectionGroup}>
          <p className={styles.sectionHeading}>Payment Method</p>
          <div className={styles.paymentRow}>
            {Object.values(PaymentMethod).map(pm => (
              <button
                key={pm}
                type="button"
                className={`${styles.paymentPill} ${formData.paymentMethod === pm ? styles.selected : ''}`}
                onClick={() => handleChange('paymentMethod', pm)}
              >
                {pm}
              </button>
            ))}
          </div>
          <p className={styles.secureNote}>Secure payment via Razorpay</p>

          <div className={styles.feeRow}>
            <span className={styles.feeLabel}>One-time payment</span>
            <span className={styles.feeAmount}>Rs. 1,000</span>
          </div>

          <button
            ref={submitBtnRef}
            type="submit"
            disabled={submitState !== 'idle'}
            className={`${styles.submitBtn} ${submitState === 'success' ? styles.success : ''}`}
          >
            {submitState === 'idle' && 'Enroll Now'}
            {submitState === 'loading' && <span className={styles.spinner} />}
            {submitState === 'success' && (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 12l6 6L20 6" className={styles.checkSvg} />
                </svg>
                You&apos;re Enrolled! Confirmed
              </>
            )}
          </button>
          <p className={styles.encryptedNote}>
            Secure payment powered by Razorpay - 100% encrypted
          </p>
          {submitError && (
            <p
              role="alert"
              style={{
                marginTop: '0.75rem',
                color: '#ff8a8a',
                fontFamily: "'Manrope', system-ui, sans-serif",
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            >
              {submitError}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default EnrollmentForm;
