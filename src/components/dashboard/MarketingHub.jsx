import { useState } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import EmailCampaigns from './EmailCampaigns';
import SmsCampaigns from './SmsCampaigns';

// Wraps the Email Marketing and SMS Marketing tools behind a sub-tab bar. During
// onboarding we render the email tool directly so its guided flow isn't disrupted.
export default function MarketingHub({ apiUrl, authFetch, user, onDirtyChange, inOnboarding }) {
  const [tab, setTab] = useState('email');

  if (inOnboarding) {
    return (
      <EmailCampaigns
        apiUrl={apiUrl}
        authFetch={authFetch}
        user={user}
        onDirtyChange={onDirtyChange}
        inOnboarding={inOnboarding}
      />
    );
  }

  const tabs = [
    { id: 'email', label: 'Email', Icon: Mail },
    { id: 'sms', label: 'SMS', Icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col">
      {/* Sub-tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto w-full px-4">
          <div className="flex gap-1">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'email' ? (
        <EmailCampaigns
          apiUrl={apiUrl}
          authFetch={authFetch}
          user={user}
          onDirtyChange={onDirtyChange}
          inOnboarding={false}
        />
      ) : (
        <SmsCampaigns apiUrl={apiUrl} authFetch={authFetch} user={user} />
      )}
    </div>
  );
}
