import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Mail, Shield, Loader2, X, Check, Trash2, Clock, Copy, Pencil, Phone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TeamMembers({ token }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // { id, name, email, title, phone }
  const [savingEdit, setSavingEdit] = useState(false);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  );

  const flash = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/team`, { headers: authHeaders });
      const data = await res.json();
      setTeam(data.team || []);
    } catch {
      flash('Could not load the team', 'error');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (member) => {
    if (!window.confirm(`Revoke ${member.name}'s access to the dashboard?`)) return;
    try {
      await fetch(`${API_URL}/api/discovery/team/${member.id}`, { method: 'DELETE', headers: authHeaders });
      flash(`${member.name}'s access revoked`);
      load();
    } catch {
      flash('Could not revoke access', 'error');
    }
  };

  const saveEdit = async () => {
    if (!editing?.name?.trim()) { flash('Name cannot be empty', 'error'); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/team/${editing.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          name: editing.name, email: editing.email,
          title: editing.title, phone: editing.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save');
      setTeam(t => t.map(m => (m.id === editing.id ? { ...m, ...data.member } : m)));
      setEditing(null);
      flash('Saved');
    } catch (err) {
      flash(err.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const changeRole = async (member, role) => {
    const verb = role === 'admin' ? 'Make an admin' : 'Drop back to member';
    if (!window.confirm(
      role === 'admin'
        ? `Make ${member.name} an admin? They'll see analytics, revenue and billing, and be able to invite and revoke others.`
        : `Drop ${member.name} back to member? They'll only see the discovery call calendar.`
    )) return;
    try {
      const res = await fetch(`${API_URL}/api/discovery/team/${member.id}/role`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${verb} failed`);
      flash(`${member.name} is now ${role === 'admin' ? 'an admin' : 'a member'}`);
      load();
    } catch (err) {
      flash(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.kind === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-500">
            Members see the discovery call calendar only. Admins also see analytics,
            revenue and billing, and can invite or revoke people.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Invite a team member
        </button>
      </div>

      {team.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No team members yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Right now everyone shares the master password. Invite people to give them their own login.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {team.map(member => (
            <div key={member.id} className="p-5 flex items-center gap-4 flex-wrap">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  {member.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                  {!member.active ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Revoked</span>
                  ) : member.invite_pending ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Invite pending
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {member.email}
                </p>
                {/* Called out rather than tucked away: without it, a prospect's reply
                    about this person's call has nowhere to go. */}
                <p className={`text-sm flex items-center gap-1.5 mt-0.5 ${member.phone ? 'text-gray-500' : 'text-amber-700'}`}>
                  <Phone className="w-3.5 h-3.5" />
                  {member.phone || 'No phone — call replies for them fall back to the catch-all number'}
                </p>
                {member.title && <p className="text-xs text-gray-400 mt-0.5">{member.title}</p>}
              </div>
              {member.active && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditing({
                      id: member.id, name: member.name || '', email: member.email || '',
                      title: member.title || '', phone: member.phone || '',
                    })}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    title="Edit name, email, title and phone"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => changeRole(member, member.role === 'admin' ? 'member' : 'admin')}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    title={member.role === 'admin'
                      ? 'Drop back to member — discovery calls only'
                      : 'Make admin — analytics, revenue, billing and team'}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {member.role === 'admin' ? 'Make member' : 'Make admin'}
                  </button>
                  <button
                    onClick={() => revoke(member)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revoke
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             onClick={() => !savingEdit && setEditing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit team member</h3>
              <button onClick={() => setEditing(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { k: 'name', label: 'Name', required: true },
                { k: 'email', label: 'Email', type: 'email', required: true, hint: 'This is their login.' },
                { k: 'title', label: 'Title', hint: 'Shown to prospects in the confirmation email.' },
                { k: 'phone', label: 'Mobile', type: 'tel',
                  hint: 'Where replies about their discovery calls get forwarded. Use +1XXXXXXXXXX.' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={f.type || 'text'}
                    value={editing[f.k]}
                    onChange={e => setEditing(v => ({ ...v, [f.k]: e.target.value }))}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
                  />
                  {f.hint && <p className="text-xs text-gray-400 mt-1">{f.hint}</p>}
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-200 flex items-center justify-end gap-2">
              <button onClick={() => setEditing(null)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 transition flex items-center gap-1.5"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <InviteModal
          authHeaders={authHeaders}
          onClose={() => setShowInvite(false)}
          onInvited={(member, inviteUrl) => {
            setShowInvite(false);
            load();
            flash(`Invite sent to ${member.email}`);
            console.log('Invite link (in case the email bounces):', inviteUrl);
          }}
        />
      )}
    </div>
  );
}

function InviteModal({ authHeaders, onClose, onInvited }) {
  const [form, setForm] = useState({ name: '', email: '', title: '', phone: '', role: 'member' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/discovery/team/invite`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send the invite');
      setInviteUrl(data.inviteUrl);
      onInvited(data.member, data.inviteUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invite a team member</h3>
            <p className="text-sm text-gray-500">They'll set their own password by email</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full name *</label>
            <input
              required value={form.name} onChange={set('name')} placeholder="Alex Rivera"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email *</label>
            <input
              required type="email" value={form.email} onChange={set('email')} placeholder="alex@sorceintegrations.com"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Title</label>
              <input
                value={form.title} onChange={set('title')} placeholder="Growth Specialist"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Shown in confirmation emails</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Access</label>
              <select
                value={form.role} onChange={set('role')}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Admins can invite others</p>
            </div>
          </div>

          {inviteUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-900 mb-1.5">Invite link (if the email doesn't land)</p>
              <div className="flex gap-2">
                <input readOnly value={inviteUrl} className="flex-1 px-2 py-1.5 text-xs bg-white border border-blue-200 rounded font-mono truncate" />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="px-2.5 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition"
            >
              Close
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
