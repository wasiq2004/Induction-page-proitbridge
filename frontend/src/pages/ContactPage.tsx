import LegalPageLayout, { legalStyles as s } from './LegalPageLayout';

function MailIcon() {
  return (
    <svg
      className={s.contactIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className={s.contactIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      className={s.contactIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className={s.contactIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <line x1="9" y1="8" x2="9" y2="8" />
      <line x1="15" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="15" y2="12" />
      <line x1="10" y1="21" x2="10" y2="17" />
      <line x1="14" y1="21" x2="14" y2="17" />
    </svg>
  );
}

function ContactPage() {
  return (
    <LegalPageLayout kicker="Get in touch" title="Contact Us">
      <section className={s.section}>
        <div className={s.contactGrid}>
          <div className={s.contactCard}>
            <BuildingIcon />
            <div>
              <h3>Company</h3>
              <p>PROITBRIDGE (OPC) PRIVATE LIMITED</p>
            </div>
          </div>

          <div className={s.contactCard}>
            <MailIcon />
            <div>
              <h3>Email</h3>
              <a href="mailto:info@proitbridge.com">info@proitbridge.com</a>
            </div>
          </div>

          <div className={s.contactCard}>
            <ClockIcon />
            <div>
              <h3>Support Hours</h3>
              <p>Mon – Sat, 10 AM – 7 PM IST</p>
            </div>
          </div>

          <div className={s.contactCard}>
            <MapPinIcon />
            <div>
              <h3>Address</h3>
              <p>
                857, Anagha, 1st Main, AECS Layout,
                <br />
                B-Block, Singasandra,
                <br />
                Bengaluru – 560068, Karnataka
              </p>
            </div>
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}

export default ContactPage;
