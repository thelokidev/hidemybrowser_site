export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-12 prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>Privacy Policy</h1>
      <p><em>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

      <p>
        This Privacy Policy describes how HideMyBrowser ("we", "us", or "our") collects, uses, and shares
        your information when you use our website, applications, and services (collectively, the "Service").
      </p>

      <h2>Information We Collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li>Account details such as name, email address, and authentication identifiers.</li>
        <li>Payment information processed by our payment provider (we do not store full card details).</li>
        <li>Support communications and other content you submit.</li>
      </ul>

      <h3>Information collected automatically</h3>
      <ul>
        <li>Device and usage data such as IP address, browser type, operating system, pages viewed, and timestamps.</li>
        <li>Diagnostics, crash data, and performance metrics to improve the Service.</li>
        <li>Cookies and similar technologies for authentication, preferences, and analytics.</li>
      </ul>

      <h3>Information from third parties</h3>
      <ul>
        <li>Authentication providers (e.g., Google, GitHub) provide basic profile information after your consent.</li>
        <li>Payment processors provide subscription status and billing events.</li>
      </ul>

      <h2>How We Use Information</h2>
      <ul>
        <li>Provide, operate, and maintain the Service.</li>
        <li>Authenticate users and secure accounts.</li>
        <li>Process payments and manage subscriptions.</li>
        <li>Monitor usage, fix issues, and improve performance.</li>
        <li>Communicate with you about updates, security, and support.</li>
        <li>Comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2>Legal Bases for Processing</h2>
      <p>
        Where required by law, we process personal data based on: performance of a contract, legitimate
        interests (e.g., security, improvement), compliance with legal obligations, and your consent (e.g.,
        certain analytics or marketing communications).
      </p>

      <h2>Sharing of Information</h2>
      <p>
        We do not sell your personal information. We share information with trusted service providers who
        assist in operating the Service (e.g., hosting, authentication, payments, analytics). These parties
        are bound by contractual obligations to protect your data and use it only for the services they
        provide to us. We may disclose information to comply with law, protect rights and safety, or in
        connection with a merger, acquisition, or asset sale.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain information for as long as necessary to provide the Service, comply with legal obligations,
        resolve disputes, and enforce agreements. Retention periods vary by data type and context.
      </p>

      <h2>Security</h2>
      <p>
        We implement technical and organizational measures to protect your information. However, no method of
        transmission or storage is 100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>International Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than your own. We take steps
        to ensure appropriate safeguards are in place in accordance with applicable laws.
      </p>

      <h2>Your Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or restrict the use of your
        personal data, to object to processing, and to data portability. You may also withdraw consent at any
        time where processing is based on consent. To exercise these rights, contact us at
        privacy@hidemybrowser.com.
      </p>

      <h2>Cookies</h2>
      <p>
        We use cookies necessary for authentication and functionality, and optional cookies for analytics.
        You can control cookies through your browser settings. Disabling certain cookies may affect Service
        functionality.
      </p>

      <h2>Children's Privacy</h2>
      <p>
        The Service is not directed to children under 16 and we do not knowingly collect personal information
        from children. If you believe a child has provided us personal information, contact us and we will
        take appropriate steps to remove it.
      </p>

      <h2>Changes to This Policy</h2>
      <p>
        We may update this Policy periodically. We will post the updated version with a revised "Last updated"
        date. Your continued use of the Service after changes become effective constitutes acceptance.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about this Privacy Policy, contact us at privacy@hidemybrowser.com.
      </p>
    </main>
  )
}
