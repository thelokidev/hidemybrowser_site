export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-12 prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>Terms of Service</h1>
      <p><em>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>

      <p>
        These Terms of Service ("Terms") govern your access to and use of HideMyBrowser (the "Service").
        By accessing or using the Service, you agree to be bound by these Terms. If you do not agree,
        do not use the Service.
      </p>

      <h2>1. Account Registration</h2>
      <p>
        You must be at least 18 years old to use the Service. You are responsible for maintaining the
        confidentiality of your account credentials and for all activities under your account. You agree
        to provide accurate and complete information and keep it up to date.
      </p>

      <h2>2. Subscriptions and Billing</h2>
      <p>
        Some features require a paid subscription. Subscription terms, pricing, and renewal periods are
        shown at checkout. Subscriptions renew automatically until canceled. You may cancel at any time; 
        access continues through the end of the current billing period. Unless required by law, fees are
        non‑refundable.
      </p>

      <h2>3. Acceptable Use</h2>
      <p>
        You agree not to misuse the Service. Prohibited activities include, without limitation: violating
        laws or third‑party rights; attempting to gain unauthorized access; reverse engineering; deploying
        malware; sending spam; scraping at scale without permission; or using the Service for any high‑risk
        activity where failure could lead to harm.
      </p>

      <h2>4. Intellectual Property</h2>
      <p>
        The Service, including software, designs, logos, and content, is owned by us or our licensors and
        protected by intellectual property laws. We grant you a limited, non‑exclusive, non‑transferable,
        revocable license to use the Service in accordance with these Terms.
      </p>

      <h2>5. User Content</h2>
      <p>
        If you submit or upload content, you grant us a worldwide, non‑exclusive, royalty‑free license to
        host, store, reproduce, and display that content solely for operating and improving the Service.
        You represent that you have all rights necessary to grant this license and that your content does
        not violate any law or rights of others.
      </p>

      <h2>6. Third‑Party Services</h2>
      <p>
        The Service may rely on or link to third‑party services (e.g., authentication, payments, analytics).
        Your use of those services may be subject to separate terms and policies.
      </p>

      <h2>7. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time if you breach these Terms or if
        we are required to do so by law. You may stop using the Service at any time. Upon termination, the
        rights granted to you will cease immediately.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
        WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON‑INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
        SECURE, OR ERROR‑FREE.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR
        GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR AGGREGATE LIABILITY SHALL NOT
        EXCEED THE AMOUNT YOU PAID TO US FOR THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE EVENT
        GIVING RISE TO THE CLAIM.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from any claims, damages, liabilities, costs, and
        expenses (including reasonable attorneys’ fees) arising out of or related to your use of the
        Service or violation of these Terms.
      </p>

      <h2>11. Changes to the Service and Terms</h2>
      <p>
        We may modify the Service or these Terms at any time. If we make material changes, we will provide
        notice (e.g., by posting an updated version or sending an email). Your continued use of the Service
        after changes become effective constitutes acceptance of the revised Terms.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of your local jurisdiction unless otherwise required by
        applicable law. Venue for any dispute will be the courts located in our principal place of
        business unless applicable law requires otherwise.
      </p>

      <h2>13. Contact</h2>
      <p>
        If you have questions about these Terms, please contact us at support@hidemybrowser.com.
      </p>
    </main>
  )
}
