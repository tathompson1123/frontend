// The one booking form, used from two places.
//
// Discovery Calls opens it blank to book a stranger. Leads opens it with a `lead`, which
// swaps the contact inputs for a read-only summary and posts to the lead's own endpoint so
// the pipeline row links by id instead of being matched back by email or phone.
//
// Contact fields are deliberately not editable in lead mode: they'd look like they were
// editing the lead, and they wouldn't be. Fix the lead, then book.
import { useState } from 'react';
import { X, Loader2, Mail, Phone, Building2, CalendarDays } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// datetime-local wants wall-clock time with no zone, so this has to go through the local
// getters rather than toISOString, which would shift the value by the UTC offset.
export const toLocalInput = (iso) => {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtWhen = (iso) => iso
  ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '';

export default function BookCallModal({
  team, defaultDate, authHeaders, onClose, onCreated, lead = null,
}) {
  const initial = new Date(defaultDate || Date.now());
  if (!initial.getHours()) initial.setHours(10, 0, 0, 0);

  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    scheduledAt: toLocalInput(initial.toISOString()),
    durationMinutes: 30,
    // Booking shouldn't quietly reassign a prospect, so the lead's owner is preselected.
    assignedTo: lead?.assigned_to ? String(lead.assigned_to) : '',
    notes: '',
    sendNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // A lead with neither is unbookable — the backend rejects it, but saying so up front
  // beats letting them fill in a time first.
  const unreachable = !!lead && !lead.email && !lead.phone;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setConflict(null);
    setSaving(true);
    try {
      const url = lead
        ? `${API_URL}/api/discovery/leads/${lead.id}/book`
        : `${API_URL}/api/discovery/calls`;
      const body = {
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: form.durationMinutes,
        assignedTo: form.assignedTo || null,
        notes: form.notes,
        sendNotifications: form.sendNotifications,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        // Only the blank form carries contact details; in lead mode they come off the row.
        ...(lead ? {} : { name: form.name, email: form.email, phone: form.phone, company: form.company }),
      };
      const res = await fetch(url, { method: 'POST', headers: authHeaders, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.status === 409 && data.call) {
        setConflict(data.call);
        throw new Error(data.error || 'This lead already has a call booked');
      }
      if (!res.ok) throw new Error(data.error || 'Could not book that call');
      onCreated(data.call, data.delivery, data.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {lead ? `Book a call with ${lead.name}` : 'Book a discovery call'}
            </h3>
            <p className="text-sm text-gray-500">
              {lead
                ? "It'll show up in Discovery Calls straight away"
                : "They'll get a confirmation text and email"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {lead ? (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {lead.company && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" /> {lead.company}
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-3.5 h-3.5 text-gray-400" /> {lead.email}
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {lead.phone}
                </div>
              )}
              <p className="text-xs text-gray-400 pt-1">
                From the lead. Edit the lead to change these.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
                <input
                  required value={form.name} onChange={set('name')} placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone *</label>
                  <input
                    type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 123-4567"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email" value={form.email} onChange={set('email')} placeholder="jane@business.com"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Business</label>
                <input
                  value={form.company} onChange={set('company')} placeholder="Smith Plumbing"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">When *</label>
              <input
                required type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Who's taking it *</label>
              {/* Was "Me", which sent no assignee at all. On a shared-password session
                  that resolved to nobody, so the confirmation email introduced the rep
                  as "Your SORCE specialist" instead of naming a person. Forcing the
                  choice means the prospect always gets a real name, photo and bio. */}
              <select
                required
                value={form.assignedTo} onChange={set('assignedTo')}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">Select a team member…</option>
                {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={3} value={form.notes} onChange={set('notes')}
              placeholder="Where they came from, what they're after..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none resize-y"
            />
          </div>

          <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox" checked={form.sendNotifications}
              onChange={e => setForm(f => ({ ...f, sendNotifications: e.target.checked }))}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-400"
            />
            <span className="text-sm text-gray-700">Send the confirmation text and email now</span>
          </label>

          {unreachable && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              This lead has no phone number or email. Add one to the lead first — we can't
              send them an invite without it.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
              {conflict && (
                <div className="mt-1.5 flex items-center gap-1.5 text-red-800 font-medium">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Already set for {fmtWhen(conflict.scheduled_at)}. Reschedule it from Discovery Calls.
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving || unreachable}
              className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Book the call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
