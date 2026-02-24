import { X } from 'lucide-react';

export default function DomainPolicyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Domain Management Policy</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
          <p className="text-xs text-gray-400">Last updated: February 2026</p>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">1. Domain Ownership & Registration</h3>
            <p>
              Domains purchased through SORCE are registered by SORCE on your behalf using our domain registrar account.
              While you have full operational control of your domain, the domain is held under SORCE's registrar account.
              You retain the right to transfer your domain to any registrar at any time. SORCE will not withhold, sell, or
              transfer your domain to any third party without your explicit written consent.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">2. Domain Renewals</h3>
            <p className="mb-2">
              Domains are registered for one year and renewed automatically before expiration, provided your SORCE
              subscription is active and in good standing.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Renewal reminder emails sent 60, 30, and 7 days before expiration</li>
              <li>Renewal fees charged to the payment method on file</li>
              <li>Failed payments retried up to 3 times over 7 days before entering grace period</li>
              <li>SORCE is not responsible for domain loss due to failed payment after the grace period</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">3. Cancellation & Account Termination</h3>
            <p className="mb-2">If you cancel your SORCE subscription:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Your domain remains active for the remainder of its registration period</li>
              <li>You have <strong>30 days</strong> to request a free transfer — SORCE provides your EPP/auth code within 3 business days</li>
              <li>After 30 days, SORCE may allow the domain to expire if no transfer is initiated</li>
              <li>Transfer reminder emails sent at cancellation, 15 days, and 28 days post-cancellation</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">4. Domain Transfer Out</h3>
            <p className="mb-2">To transfer your domain away from SORCE at any time:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Submit a transfer request via your dashboard or by emailing support</li>
              <li>SORCE will unlock the domain and provide your EPP/auth code within 3 business days</li>
              <li>Initiate the transfer through your chosen registrar (standard ICANN 60-day lock applies)</li>
              <li>No transfer fee is charged by SORCE</li>
            </ol>
            <p className="mt-2 text-gray-500 text-xs">
              Note: Transferring your domain will disconnect it from your SORCE-hosted website unless you manually update your DNS records.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">5. Service Interruptions</h3>
            <p>
              SORCE maintains its registrar account with reasonable care, including automatic balance top-ups to prevent
              failures. In the event of a registrar outage or failed renewal beyond SORCE's control, we will notify
              affected users within 24 hours and make commercially reasonable efforts to restore domain function within
              48 hours. SORCE's liability for domain-related losses is limited to the amount paid for the domain registration.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">6. Prohibited Uses</h3>
            <p>
              Domains registered through SORCE may not be used for spam, phishing, illegal activity, or any use that
              violates SORCE's Terms of Service. SORCE reserves the right to suspend a domain in response to abuse
              complaints or legal orders, with notice to the domain owner where legally permitted.
            </p>
          </section>

          <section className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-900 mb-1">Contact</h3>
            <p className="text-gray-600">
              For domain transfers, disputes, or renewal issues email{' '}
              <a href="mailto:support@sorce.com" className="text-blue-600 hover:underline">support@sorce.com</a>{' '}
              with subject line: <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">Domain Request - yourdomain.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
