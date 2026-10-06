import { useState } from 'react';

// Shown only while a rep is inside a prospect's account (set by ImpersonatePage), so
// nobody forgets whose dashboard is on screen or leaves that login behind.
export default function ImpersonationBanner() {
  const [who] = useState(() => {
    try { return localStorage.getItem('impersonating'); } catch { return null; }
  });
  if (!who) return null;

  const exit = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('impersonating');
    } catch { /* storage unavailable — nothing to clear */ }
    window.location.href = '/analytics';
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-3 bg-amber-500 text-white text-sm font-semibold pl-4 pr-2 py-2 rounded-full shadow-lg">
      <span>Demo: viewing as {who}</span>
      <button onClick={exit} className="bg-white/25 hover:bg-white/40 rounded-full px-3 py-1 text-xs">Exit</button>
    </div>
  );
}
