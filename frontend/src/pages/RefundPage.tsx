import LegalPageLayout, { legalStyles as s } from './LegalPageLayout';

function RefundPage() {
  return (
    <LegalPageLayout
      kicker="Policy"
      title="Cancellation & Refund Policy"
      meta={
        <>
          <strong>Website:</strong> https://aicourses.proitbridge.com<br />
          <strong>Owned By:</strong> PROITBRIDGE (OPC) PRIVATE LIMITED<br />
          <strong>Last Updated:</strong> 01 November 2025
        </>
      }
    >
      <section className={s.section}>
        <h2>1. Booking Fee</h2>
        <p>
          A <span className={s.strike}>₹299</span>₹89 refundable booking fee is collected to
          reserve a slot for our Career Exploration Call (Induction Call). This session helps
          learners understand the course structure, expectations, and career outcomes.
        </p>
      </section>

      <section className={s.section}>
        <h2>2. No Cancellation Before the Call</h2>
        <p>
          There is no cancellation option before attending the Career Exploration Call.
          Learners must attend the call to be eligible for a refund.
        </p>
      </section>

      <section className={s.section}>
        <h2>3. Refund Eligibility</h2>
        <p>
          Refund of the <span className={s.strike}>₹299</span>₹89 booking fee is issued only
          after attending the Career Exploration Call and choosing not to proceed further
          with the full course.
        </p>
        <p>Refund is applicable when:</p>
        <ul>
          <li>You attend the call completely</li>
          <li>You decide not to move forward with the program</li>
        </ul>
        <p>
          If you choose to proceed with the full course enrollment, the{' '}
          <span className={s.strike}>₹299</span>₹89 fee becomes non-refundable.
        </p>
      </section>

      <section className={s.section}>
        <h2>4. Refund Processing Time</h2>
        <p>Refunds are processed within 24–48 hours to the original payment method.</p>
      </section>

      <section className={s.section}>
        <h2>5. Non-Refundable Cases</h2>
        <p>Refund will not be issued if:</p>
        <ul>
          <li>You do not attend the scheduled call</li>
          <li>You miss or disconnect during the call</li>
          <li>You provide incorrect contact details</li>
          <li>You decide to proceed with the course</li>
          <li>You request refund without attending the call</li>
        </ul>
      </section>

      <section className={s.section}>
        <h2>6. How to Request a Refund</h2>
        <p>
          To request a refund, contact us with your registered name, email, phone number,
          and payment ID at:{' '}
          <a href="mailto:info@proitbridge.com">info@proitbridge.com</a>
        </p>
      </section>

      <section className={s.section}>
        <h2>7. Contact Information</h2>
        <p>
          <strong>PROITBRIDGE (OPC) PRIVATE LIMITED</strong>
          <br />
          857, Anagha, 1st Main, AECS Layout, B-Block, Singasandra,
          <br />
          Bengaluru – 560068, Karnataka
          <br />
          <strong>Email:</strong>{' '}
          <a href="mailto:info@proitbridge.com">info@proitbridge.com</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}

export default RefundPage;
