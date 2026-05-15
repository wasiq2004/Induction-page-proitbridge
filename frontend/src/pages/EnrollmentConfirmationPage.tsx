import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '@components/BrandLogo';
import {
  downloadInvoice,
  type InvoiceData,
} from '@lib/invoiceGenerator';
import { sendInvoiceEmail } from '@lib/invoiceEmailSender';
import { trackCustom } from '@lib/metaPixel';
import { env } from '@lib/env';
import type { EnrollmentFormData } from '@t/index';

interface LocationState {
  enrollmentId?: string;
  paymentId?: string;
  formData?: EnrollmentFormData;
}

const PROGRAM_LABELS: Record<string, string> = {
  ADVANCED_DATA_ANALYST: 'Advanced Data Analyst',
  ADVANCED_DATA_SCIENCE_AI: 'Advanced Data Science & AI',
  AGENTIC_AI_GEN_AI: 'Agentic AI & GenAI',
  COMBO: 'Combo (All Programs)',
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  ONLINE_LIVE: 'Online Live',
  SELF_PACED: 'Self-paced',
  HYBRID: 'Hybrid',
};

function EnrollmentConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatchedRef = useRef(false);

  const state = (location.state ?? null) as LocationState | null;
  const enrollmentId = state?.enrollmentId;
  const paymentId = state?.paymentId;
  const formData = state?.formData;

  useEffect(() => {
    if (!enrollmentId || !paymentId || !formData) {
      navigate('/', { replace: true });
      return;
    }
    if (dispatchedRef.current) return;
    dispatchedRef.current = true;

    const invoiceData: InvoiceData = {
      enrollmentId,
      paymentId,
      program: PROGRAM_LABELS[formData.programSelection] ?? formData.programSelection,
      courseType: COURSE_TYPE_LABELS[formData.courseType] ?? formData.courseType,
      amountInRupees: env.razorpay.enrollmentAmount / 100,
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        address: [
          formData.addressLine1,
          formData.addressLine2,
          formData.city,
          formData.state,
          formData.pincode,
          formData.country,
        ]
          .filter(Boolean)
          .join(', '),
        state: formData.state,
        country: formData.country,
      },
    };

    // Slight delay so the page paints before the browser blocks UI for the
    // download. The ref guard prevents double-dispatch in StrictMode.
    const t = window.setTimeout(() => {
      downloadInvoice(invoiceData);
      sendInvoiceEmail(invoiceData);
    }, 500);

    trackCustom('EnrollmentComplete', {
      enrollmentId,
      program: formData.programSelection,
    });

    return () => window.clearTimeout(t);
  }, [enrollmentId, paymentId, formData, navigate]);

  if (!enrollmentId || !paymentId || !formData) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '3rem 1.5rem',
        background:
          'radial-gradient(circle at 12% 8%, rgba(43, 200, 245, 0.12), transparent 22%), radial-gradient(circle at 88% 18%, rgba(46, 125, 232, 0.14), transparent 26%), linear-gradient(180deg, #03101F 0%, #082341 100%)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2.5rem',
          }}
        >
          <BrandLogo compact showTagline />
          <span
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 999,
              fontSize: '0.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Enrollment Confirmed
          </span>
        </header>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 600,
            marginBottom: '1rem',
            letterSpacing: '0.01em',
          }}
        >
          You're enrolled. Welcome to ProITBridge.
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: '2rem' }}>
          Your payment was successful and your seat in the program is confirmed. Your tax
          invoice is downloading automatically — keep a copy for your records.
        </p>

        <section
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              marginBottom: '1rem',
            }}
          >
            Enrollment Summary
          </h2>
          <Row label="Enrollment ID" value={enrollmentId} />
          <Row label="Payment Reference" value={paymentId} />
          <Row
            label="Program"
            value={PROGRAM_LABELS[formData.programSelection] ?? formData.programSelection}
          />
          <Row
            label="Course Type"
            value={COURSE_TYPE_LABELS[formData.courseType] ?? formData.courseType}
          />
          <Row label="Name" value={formData.fullName} />
          <Row label="Email" value={formData.email} />
          <Row label="Mobile" value={formData.mobile} />
          <Row label="Amount Paid" value={`Rs. ${(env.razorpay.enrollmentAmount / 100).toFixed(2)}`} />
        </section>

        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
          Didn't receive the invoice download?{' '}
          <button
            type="button"
            onClick={() => {
              const invoiceData: InvoiceData = {
                enrollmentId,
                paymentId,
                program: PROGRAM_LABELS[formData.programSelection] ?? formData.programSelection,
                courseType: COURSE_TYPE_LABELS[formData.courseType] ?? formData.courseType,
                amountInRupees: env.razorpay.enrollmentAmount / 100,
                customer: {
                  fullName: formData.fullName,
                  email: formData.email,
                  mobile: formData.mobile,
                  address: [
                    formData.addressLine1,
                    formData.addressLine2,
                    formData.city,
                    formData.state,
                    formData.pincode,
                    formData.country,
                  ]
                    .filter(Boolean)
                    .join(', '),
                  state: formData.state,
                  country: formData.country,
                },
              };
              downloadInvoice(invoiceData);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6FD3F2',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            Download invoice
          </button>
          .
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '0.92rem',
      }}
    >
      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default EnrollmentConfirmationPage;
