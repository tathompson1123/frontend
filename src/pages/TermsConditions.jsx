// Terms & Conditions, including the SMS program terms an A2P 10DLC registration has
// to point at. Section 9 is the part carriers actually read: program description,
// frequency, rates disclaimer, STOP/HELP keywords and the carrier liability line. It
// must stay consistent with what the campaign registration says and with what the
// messages actually do.
import { Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-white">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
        <p className="text-gray-500 mb-8">Last updated: August 4, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Agreement</h2>
            <p>
              These Terms &amp; Conditions govern your use of SORCE ("we", "us", "the Service"), operated by
              SORCE Integrations. By creating an account, booking a call with us, or using any part of the
              Service, you agree to these terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. The Service</h2>
            <p>
              SORCE provides software for service businesses, including booking, customer messaging, review
              requests, lead capture, invoicing and related tools. Features vary by plan and may change as the
              Service develops.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Accounts</h2>
            <p>
              You are responsible for the accuracy of the information on your account, for keeping your
              credentials secure, and for all activity that takes place under your login. Tell us promptly at
              help@sorceintegrations.com if you believe your account has been accessed without your permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Billing</h2>
            <p>
              Paid plans are billed in advance on a recurring basis until cancelled. Fees are non-refundable
              except where required by law. You can cancel at any time from your dashboard; access continues to
              the end of the period you have paid for. We will give notice before any price change takes effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Your Responsibilities When Messaging</h2>
            <p>
              If you use the Service to contact your own customers, you are the sender of those messages. You are
              responsible for obtaining and retaining consent from each recipient, for honouring opt-out requests,
              and for complying with all applicable law including the TCPA, CAN-SPAM and carrier requirements.
              You may not use the Service to send unsolicited messages, or content that is unlawful, deceptive,
              or covered by carrier-prohibited categories.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service to break the law or infringe anyone's rights</li>
              <li>Attempt to gain unauthorised access to the Service or other users' data</li>
              <li>Interfere with, overload or disrupt the Service or its infrastructure</li>
              <li>Resell or white-label the Service without a written agreement with us</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Third-Party Services</h2>
            <p>
              The Service relies on third parties including Twilio, SendGrid, Stripe, Zoom and AI providers.
              Your use of the Service is also subject to their terms, and we are not responsible for outages,
              filtering decisions or changes made by those providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Intellectual Property</h2>
            <p>
              We own the Service and everything in it apart from your content. You keep ownership of the
              business information, customer data and materials you put into the Service, and you grant us the
              licence needed to operate the Service on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. SMS Program Terms</h2>
            <p>
              <strong>Program description.</strong> SORCE Integrations sends appointment confirmations and
              reminders by text to business owners who have asked to speak with us. When you book or agree to a
              discovery call, you receive one confirmation message with the date, time and video link, followed
              by up to two reminders before the call — one around 24 hours ahead and one around 2 hours ahead.
            </p>
            <p>
              {/* Must stay consistent with the A2P campaign registration, which states
                  opt-in is verbal with no web form. A reviewer reads both; a
                  contradiction between them is a rejection. */}
              <strong>How you opt in.</strong> Consent is given verbally during a call with a member of our
              team, who reads a short disclosure and records your consent with the date, their name and the
              number you gave. We only message numbers with that record, and we do not buy, rent, share or
              import phone numbers from third-party lists.
            </p>
            <p>
              <strong>Message frequency.</strong> Up to three messages per booked appointment. We do not send
              recurring marketing messages on this program.
            </p>
            <p>
              <strong>Cost.</strong> Message and data rates may apply. SORCE does not charge for these messages;
              your mobile carrier's standard rates apply.
            </p>
            <p>
              <strong>Opting out.</strong> Reply <strong>STOP</strong> to any message to stop receiving them.
              You will receive one confirmation and then no further messages. Reply <strong>START</strong> to
              resume.
            </p>
            <p>
              <strong>Help.</strong> Reply <strong>HELP</strong> to any message, email
              help@sorceintegrations.com, or reply to a message directly and a member of our team will respond.
            </p>
            <p>
              <strong>Carriers.</strong> Mobile carriers are not liable for delayed or undelivered messages.
              Delivery is not guaranteed and depends on your carrier and device.
            </p>
            <p>
              <strong>Privacy.</strong> No mobile information will be shared with third parties or affiliates
              for marketing or promotional purposes. Text messaging originator opt-in data and consent are
              never shared with any third parties. See our{' '}
              <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Disclaimers</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee that the
              Service will be uninterrupted or error-free, or that using it will produce any particular
              business result.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, SORCE is not liable for indirect, incidental or
              consequential damages, or for lost profits or data. Our total liability for any claim relating to
              the Service is limited to the amount you paid us in the twelve months before the claim arose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Termination</h2>
            <p>
              You may stop using the Service at any time. We may suspend or terminate access if these terms are
              breached, if usage puts the Service or other users at risk, or if required by a provider or by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">13. Changes</h2>
            <p>
              We may update these terms as the Service changes. Material changes will be notified through the
              Service or by email, and the "last updated" date above will change. Continuing to use the Service
              after that means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">14. Contact</h2>
            <p>Questions about these terms:</p>
            <p className="mt-2 font-medium text-gray-900">
              SORCE Integrations<br />
              Email: help@sorceintegrations.com
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          © 2026 SORCE. Built for service businesses.
        </div>
      </footer>
    </div>
  );
}
