import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl text-white">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy for SparkVibe App</h1>
      <p className="mb-4">Effective Date: September 28, 2025</p>
      
      <p className="mb-4">
        Welcome to SparkVibe App ("SparkVibe," "we," "us," or "our"), a geosocial networking platform that connects users based on real-time locations, moods, and vibes. This Privacy Policy outlines how we collect, use, disclose, and protect your personal information when you use our app, including features like location-based matching, ephemeral messaging, and the Guardian AI safety system. By using SparkVibe, you agree to these practices. If you disagree, please refrain from using the app. This policy complies with applicable laws (e.g., GDPR, CCPA/CPRA, CalOPPA) and may be updated—check the "Effective Date" for changes.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
      <p className="mb-4">
        We collect data to deliver and enhance our services:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Personal Information You Provide:</strong>
          <ul className="list-circle pl-6 mt-2">
            <li><strong>Account Data:</strong> Email, full name, username, and profile photo (via Google sign-in or manual entry).</li>
            <li><strong>Profile Data:</strong> Gender, age, bio, current mood, mood message, and privacy settings (e.g., visibility controls for bio/age/full name).</li>
            <li><strong>User Content:</strong> Messages, friend requests, ephemeral "bubbles," and interaction data (e.g., connects, blocks, chats).</li>
          </ul>
        </li>
        <li>
          <strong>Automatically Collected Information:</strong>
          <ul className="list-circle pl-6 mt-2">
            <li><strong>Location Data:</strong> Precise geolocation (latitude/longitude) for nearby user discovery, distance tracking, and Guardian AI (movement speed monitoring). Stored temporarily with location history.</li>
            <li><strong>Device and Usage Data:</strong> IP address, device type, app/browser version, session duration, and interaction logs (e.g., mood updates, marker clicks) for analytics and security.</li>
            <li><strong>Cookies/Tracking:</strong> Cookies, local storage, and similar technologies for authentication, preferences, and analytics. Third-party tools (e.g., Google Analytics) may process anonymized data.</li>
          </ul>
        </li>
        <li>
          <strong>Third-Party Data:</strong>
          <ul className="list-circle pl-6 mt-2">
            <li><strong>Google OAuth:</strong> Email, name, and profile photo from Google sign-in.</li>
            <li><strong>Supabase:</strong> Metadata collected by our backend provider for service operation.</li>
          </ul>
        </li>
      </ul>
      <p className="mb-4">
        We do not collect sensitive data (e.g., health, political views) unless voluntarily included in your bio (subject to privacy settings).
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
      <p className="mb-4">
        We use your data to:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Deliver services: Match users by location/mood, enable messaging, and display profiles per privacy settings.</li>
        <li>Enhance features: Analyze usage for mood heatmaps and Guardian AI (alerts for rapid movements).</li>
        <li>Communicate: Send notifications (e.g., new connections) via email/push.</li>
        <li>Ensure security: Detect fraud, enforce terms, and comply with legal obligations.</li>
        <li>Improve app: Use aggregated, anonymized data for development.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">3. How We Share Your Information</h2>
      <p className="mb-4">
        We do not sell your personal data. Sharing occurs only as follows:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>With Consent:</strong> Temporary location sharing (e.g., meetups) or ephemeral messages (visible to recipients, auto-deleted after 5 minutes).</li>
        <li><strong>Service Providers:</strong> Supabase (storage), Google (analytics/auth), and hosting services, bound by confidentiality.</li>
        <li><strong>User Interactions:</strong> Profile data (filtered by privacy settings) shared with nearby users; moods/locations visible within interaction radius.</li>
        <li><strong>Legal Requirements:</strong> Disclosed to comply with laws, prevent fraud, or protect safety (e.g., Guardian AI reports).</li>
        <li><strong>Business Transfers:</strong> Data may transfer in mergers/acquisitions with notice.</li>
      </ul>
      <p className="mb-4">
        No advertising data sharing without opt-in.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Data Security</h2>
      <p className="mb-4">
        We employ encryption, access controls, and other measures to protect data, but no method is 100% secure. Location data is anonymized where feasible, and ephemeral messages expire automatically. Report concerns to <a href="mailto:support@sparkvibe.app" className="underline text-purple-400">support@sparkvibe.app</a>.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Your Rights and Choices</h2>
      <p className="mb-4">
        Depending on your jurisdiction (e.g., GDPR/CCPA):
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Access, correct, or delete your data (contact support).</li>
        <li>Opt out of data sharing (adjust privacy settings in-app).</li>
        <li>Disable location sharing (revoke GPS permission).</li>
        <li>Withdraw consent (delete account).</li>
      </ul>
      <p className="mb-4">
        For CCPA: Request disclosure, deletion, or opt-out of "sales" (we don’t sell data). Email <a href="mailto:support@sparkvibe.app" className="underline text-purple-400">support@sparkvibe.app</a>.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Children's Privacy</h2>
      <p className="mb-4">
        SparkVibe is for users 18+. We do not knowingly collect data from children under 13 (COPPA). If detected, we delete it promptly.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">7. International Data Transfers</h2>
      <p className="mb-4">
        Data is stored in the US (via Supabase) and may transfer globally. We ensure compliance with frameworks like EU-US Data Privacy Framework.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Changes to This Policy</h2>
      <p className="mb-4">
        Updates may occur; significant changes will be notified in-app or via email. Continued use signifies acceptance.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">9. Contact Us</h2>
      <p className="mb-4">
        For questions, email <a href="mailto:support@sparkvibe.app" className="underline text-purple-400">support@sparkvibe.app</a> or visit <a href="https://sparkvibe.app/contact" className="underline text-purple-400">https://sparkvibe.app/contact</a>.
      </p>
    </div>
  );
};

export default PrivacyPolicy;