import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold">SORCE</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: March 29, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Introduction</h2>
            <p>
              SORCE ("we," "our," or "us") operates the SORCE platform, including our website, dashboard,
              AI-powered website generation tools, booking system, payment processing, and mobile applications
              (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Account Information</h3>
            <p>When you create an account, we collect your name, email address, phone number, and business details.</p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Business Data</h3>
            <p>
              We collect information you provide about your business, including business name, industry, services
              offered, location, and any content you provide for website generation.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Customer & Lead Data</h3>
            <p>
              When your customers interact with your SORCE-generated website (e.g., submitting contact forms,
              booking appointments, or engaging with chat agents), we collect the information they provide,
              including name, email, phone number, and message content.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Payment Information</h3>
            <p>
              Payment processing is handled by third-party providers (e.g., Square, Stripe). We do not store
              full credit card numbers. We may receive transaction details such as amount, date, and last four
              digits of the card.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Usage & Device Data</h3>
            <p>
              We automatically collect information about how you use the Service, including IP address, browser
              type, device information, pages visited, and interaction patterns.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Generate and host websites using AI-powered tools</li>
              <li>Process bookings, payments, and customer communications</li>
              <li>Send SMS messages and notifications on your behalf (with consent)</li>
              <li>Power AI chat agents and lead form responses</li>
              <li>Send you service-related communications and updates</li>
              <li>Detect, prevent, and address fraud or security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. SMS &amp; Communications</h2>
            <p>
              Our Service may send SMS messages to your customers on your behalf (e.g., booking confirmations,
              lead follow-ups). SMS messaging is initiated only when you enable it and your customers provide
              consent. Message and data rates may apply. Customers can opt out of SMS at any time by replying STOP.
            </p>
            <p>
              SORCE also sends SMS directly to business owners who have asked to speak with us — for example,
              a confirmation and reminders for a scheduled discovery call. Consent for these messages is given
              either on our booking form or verbally during a call with our team, and is recorded with the date
              and the team member who took it. Message frequency is limited to messages about that appointment.
              Message and data rates may apply. Reply STOP to opt out or HELP for help.
            </p>
            {/* Mobile carriers require this stated explicitly and verbatim before they
                will approve an A2P 10DLC campaign. Do not reword or remove it. */}
            <p className="font-medium text-gray-900">
              No mobile information will be shared with third parties or affiliates for marketing or
              promotional purposes. All of the above categories exclude text messaging originator opt-in
              data and consent; this information will not be shared with any third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. AI-Generated Content</h2>
            <p>
              Our Service uses artificial intelligence (including third-party AI providers) to generate website
              content, chat responses, and other materials. Information you provide about your business may be
              sent to AI providers for processing. We do not use your data to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third parties that help us operate the Service (hosting, payment processing, SMS delivery, AI providers)</li>
              <li><strong>Your Customers:</strong> Information you choose to display on your generated website is publicly accessible</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
            <p className="font-medium text-gray-900">
              Text messaging originator opt-in data and consent are excluded from every category above.
              This information is never shared with third parties or affiliates for any purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information,
              including encryption in transit (TLS/SSL), secure token storage, and access controls. However,
              no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide the
              Service. You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 13. We do not knowingly collect personal
              information from children under 13. If we become aware of such collection, we will delete
              the information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes
              by posting the updated policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="mt-2 font-medium text-gray-900">
              SORCE<br />
              Email: help@sorceintegrations.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          © 2026 SORCE. Built for service businesses.
        </div>
      </footer>
    </div>
  );
}
