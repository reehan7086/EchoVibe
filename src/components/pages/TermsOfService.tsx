import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl text-white">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions for SparkVibe App</h1>
      <p className="mb-4">Effective Date: September 28, 2025</p>
      
      <p className="mb-4">
        Welcome to SparkVibe App ("SparkVibe," "we," "us," or "our"), a geosocial networking platform connecting users via real-time locations, moods, and vibes. These Terms and Conditions ("Terms") govern your use of the app and services. By downloading, installing, or using SparkVibe, you agree to these Terms. If you disagree, do not use the app.
      </p>
      <p className="mb-4">
        These Terms include our <a href="https://sparkvibe.app/privacy" className="underline text-purple-400">Privacy Policy</a>. Updates may occur—check the "Effective Date" and notifications.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Eligibility</h2>
      <p className="mb-4">
        You must be 18+ and able to enter a binding contract. Using SparkVibe confirms compliance. We may terminate access for violations.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">2. Account and Security</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Create one account with accurate details (e.g., Google sign-in). Do not share credentials.</li>
        <li>You’re liable for account activity. Notify us of breaches.</li>
        <li>We may suspend/delete accounts for violations (e.g., abuse, fake profiles).</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">3. User Conduct and Content</h2>
      <p className="mb-4"><strong>Acceptable Use:</strong></p>
      <ul className="list-disc pl-6 mb-4">
        <li>Use lawfully. Connect authentically; no spam, harassment, or impersonation.</li>
        <li>Respect privacy: Share locations/moods only via app features.</li>
        <li>Prohibited: Hate speech, nudity, illegal acts, or disrupting features (e.g., spoofing locations).</li>
      </ul>
      <p className="mb-4"><strong>Your Content:</strong></p>
      <ul className="list-disc pl-6 mb-4">
        <li>You own profiles, messages, moods. Posting grants us a worldwide, royalty-free license to host, display, and moderate.</li>
        <li>We may remove violating content.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Location and Mood Features</h2>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Location Sharing:</strong> Opt-in; we use GPS for matching/safety. Disable anytime.</li>
        <li><strong>Mood Matching:</strong> Share moods voluntarily, visible per privacy settings.</li>
        <li><strong>Guardian AI:</strong> Monitors movement for safety; alerts for rapid activity.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Intellectual Property</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>SparkVibe owns the app, trademarks, and content. You get a limited, non-transferable license for personal use.</li>
        <li>Do not copy, modify, or reverse-engineer.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Third-Party Services</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Integrates Google (auth) and Supabase (backend); their terms apply.</li>
        <li>External links are not endorsed; use at your risk.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">7. Disclaimers and Limitations</h2>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>As-Is:</strong> App provided "as is." No warranties for accuracy, availability, or safety.</li>
        <li><strong>Location Accuracy:</strong> GPS may vary; use responsibly.</li>
        <li><strong>Liability:</strong> Not liable for interactions, data loss, or indirect damages. Max liability: fees paid (if any).</li>
        <li><strong>Indemnification:</strong> You indemnify us for claims from your use.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Termination</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Delete your account anytime (data retained per Privacy Policy).</li>
        <li>We may terminate for violations with notice.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">9. Governing Law and Disputes</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Governed by Delaware law (US). Disputes resolved in Delaware courts.</li>
        <li>EU users: Alternative dispute resolution via <a href="https://ec.europa.eu/consumers/odr/" className="underline text-purple-400">ODR platform</a>.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">10. Contact Us</h2>
      <p className="mb-4">
        Questions? Email <a href="mailto:support@sparkvibe.app" className="underline text-purple-400">support@sparkvibe.app</a> or visit <a href="https://sparkvibe.app/contact" className="underline text-purple-400">https://sparkvibe.app/contact</a>.
      </p>
    </div>
  );
};

export default TermsOfService;