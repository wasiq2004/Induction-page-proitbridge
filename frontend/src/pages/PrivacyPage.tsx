import LegalPageLayout, { legalStyles as s } from './LegalPageLayout';

function PrivacyPage() {
  return (
    <LegalPageLayout
      kicker="Legal"
      title="Privacy Policy"
      meta={
        <>
          <strong>Website:</strong> https://aicourses.proitbridge.com<br />
          <strong>Owned By:</strong> PROITBRIDGE (OPC) PRIVATE LIMITED<br />
          <strong>Last Updated:</strong> 01 November 2025
        </>
      }
    >
      <section className={s.section}>
        <h2>1. What Data We Collect</h2>
        <p>
          Name, Email, Phone Number, Messages submitted via forms, and analytics data like
          IP address, browser details, and behavior.
        </p>
      </section>

      <section className={s.section}>
        <h2>2. How We Use Your Data</h2>
        <p>
          To contact you, improve website performance, ensure security, and process your
          requests. We do not sell personal information.
        </p>
      </section>

      <section className={s.section}>
        <h2>3. Cookies</h2>
        <p>We use cookies for analytics. You may disable cookies in your browser.</p>
      </section>

      <section className={s.section}>
        <h2>4. Sharing of Information</h2>
        <p>We may share data with service providers, legal authorities, or internal teams when necessary.</p>
      </section>

      <section className={s.section}>
        <h2>5. Data Retention</h2>
        <p>Data is retained only as long as required for operations or legal obligations.</p>
      </section>

      <section className={s.section}>
        <h2>6. Your Rights</h2>
        <p>You may request correction, deletion, or withdrawal of consent via email.</p>
      </section>

      <section className={s.section}>
        <h2>7. Children</h2>
        <p>We do not knowingly collect information from children under 13.</p>
      </section>

      <section className={s.section}>
        <h2>8. Contact</h2>
        <p>
          <a href="mailto:info@proitbridge.com">info@proitbridge.com</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}

export default PrivacyPage;
