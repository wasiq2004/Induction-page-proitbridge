import LegalPageLayout, { legalStyles as s } from './LegalPageLayout';

function TermsPage() {
  return (
    <LegalPageLayout
      kicker="Legal"
      title="Terms & Conditions"
      meta={
        <>
          <strong>Website:</strong> https://aicourses.proitbridge.com<br />
          <strong>Owned By:</strong> PROITBRIDGE (OPC) PRIVATE LIMITED<br />
          <strong>Last Updated:</strong> 01 November 2025
        </>
      }
    >
      <section className={s.section}>
        <h2>1. Introduction</h2>
        <p>
          Welcome to our website. By accessing or using this platform, you agree to be bound
          by these Terms &amp; Conditions. If you do not agree, please discontinue using the
          site immediately.
        </p>
      </section>

      <section className={s.section}>
        <h2>2. Use of Website</h2>
        <p>
          This site provides information about our AI &amp; Data Science training services.
          You must be 18+ to use this website.
        </p>
      </section>

      <section className={s.section}>
        <h2>3. Acceptable Use</h2>
        <p>
          You agree not to misuse the website, attempt hacking, introduce malware, use bots,
          copy content without permission, or provide false information.
        </p>
      </section>

      <section className={s.section}>
        <h2>4. Intellectual Property</h2>
        <p>
          All content on this site belongs to PROITBRIDGE (OPC) PRIVATE LIMITED. Unauthorized
          copying or reproduction is prohibited.
        </p>
      </section>

      <section className={s.section}>
        <h2>5. Third-Party Links</h2>
        <p>We are not responsible for the content or privacy practices of external websites.</p>
      </section>

      <section className={s.section}>
        <h2>6. Limitation of Liability</h2>
        <p>We are not liable for any damages arising from use of this website.</p>
      </section>

      <section className={s.section}>
        <h2>7. User Submissions</h2>
        <p>By submitting information, you allow us to contact you. You confirm details are accurate.</p>
      </section>

      <section className={s.section}>
        <h2>8. Privacy Policy</h2>
        <p>Information is handled as per our Privacy Policy.</p>
      </section>

      <section className={s.section}>
        <h2>9. Governing Law</h2>
        <p>These terms are governed by Indian law, Bengaluru jurisdiction.</p>
      </section>

      <section className={s.section}>
        <h2>10. Contact</h2>
        <p>
          <strong>Email:</strong>{' '}
          <a href="mailto:info@proitbridge.com">info@proitbridge.com</a>
          <br />
          <strong>Address:</strong> 857, Anagha, AECS Layout, Singasandra, Bangalore – 560068
        </p>
      </section>
    </LegalPageLayout>
  );
}

export default TermsPage;
