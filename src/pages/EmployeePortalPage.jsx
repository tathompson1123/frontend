import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Settings, Plus, Bell, User, ChevronLeft, MoreHorizontal,
  Lock, Paperclip, Star, Send, CheckCircle, Circle, MapPin,
  TrendingUp, Clock, Briefcase, LogOut, ChevronRight, AlertCircle,
  Phone, Mail, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PRIMARY = '#C17B1C';
const PRIMARY_DARK = '#9A6015';
const BG = '#FEF9EC';
const BG_HEADER = '#C17B1C';

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Simple SVG line chart ────────────────────────────────────────────────────
function LineChart({ data = [25, 32, 40, 48, 60, 75, 90, 105, 118] }) {
  const W = 300, H = 110, PX = 28, PY = 16;
  const max = Math.max(...data, 30);
  const pts = data.map((v, i) => {
    const x = PX + (i / (data.length - 1)) * (W - 2 * PX);
    const y = PY + (1 - v / max) * (H - 2 * PY);
    return [x, y];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${pts[0][0]},${H - PY} ` + pts.map(([x, y]) => `${x},${y}`).join(' ') + ` ${pts[pts.length - 1][0]},${H - PY}`;
  const yLabels = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <div style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 4px 4px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity="0.18" />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yLabels.map((v, i) => {
          const y = PY + (1 - v / max) * (H - 2 * PY);
          return <line key={i} x1={PX} x2={W - PX} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />;
        })}
        {/* Area fill */}
        <polygon points={area} fill="url(#lineGrad)" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={PRIMARY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={PRIMARY} />
        {/* Y labels */}
        {yLabels.map((v, i) => {
          const y = PY + (1 - v / max) * (H - 2 * PY);
          return <text key={i} x={PX - 4} y={y + 4} fontSize="9" fill="#9ca3af" textAnchor="end">{v}</text>;
        })}
      </svg>
    </div>
  );
}

// ── Bar chart (ratings) ──────────────────────────────────────────────────────
function MiniBarChart({ color = PRIMARY }) {
  const bars = [65, 80, 55, 90, 72, 85, 70];
  const max = 100;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 44 }}>
      {bars.map((v, i) => (
        <div key={i} style={{
          width: 14,
          height: `${(v / max) * 44}px`,
          background: i % 2 === 0 ? color : '#F59E0B',
          borderRadius: '2px 2px 0 0',
          opacity: 0.85
        }} />
      ))}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? PRIMARY : '#d1d5db', position: 'relative', transition: 'background 0.2s', padding: 0
      }}
    >
      <span style={{
        display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s'
      }} />
    </button>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    confirmed: { label: 'Confirmed', bg: '#dcfce7', color: '#16a34a' },
    in_progress: { label: 'In Progress', bg: '#fef9c3', color: '#b45309' },
    completed: { label: 'Completed', bg: '#dbeafe', color: '#1d4ed8' },
    pending: { label: 'Pending', bg: '#f3f4f6', color: '#6b7280' },
    cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
    no_show: { label: 'No Show', bg: '#fce7f3', color: '#be185d' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

// ── Booking list row ──────────────────────────────────────────────────────────
function BookingRow({ booking, onPress }) {
  const done = booking.status === 'completed';
  return (
    <button onClick={onPress} style={{
      display: 'flex', alignItems: 'center', width: '100%', background: 'none', border: 'none',
      borderBottom: '1px solid #f3f4f6', padding: '12px 0', gap: 12, cursor: 'pointer', textAlign: 'left'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
          {fmtTime(booking.start_time)} – {booking.customer_name || 'Customer'},{' '}
          {booking.items?.[0]?.service_name || 'Service'}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
          {fmtTime(booking.start_time)} – {fmtTime(booking.end_time)}
        </div>
      </div>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: done ? PRIMARY : '#d1d5db',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {done && <CheckCircle size={16} color="#fff" />}
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function EmployeePortalPage() {
  const [token, setToken] = useState(() => localStorage.getItem('empToken') || '');
  const [employee, setEmployee] = useState(() => {
    try { return JSON.parse(localStorage.getItem('empInfo') || 'null'); } catch { return null; }
  });

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState('home');  // home | bookings | new | notifications | profile
  const [screen, setScreen] = useState('dashboard');   // dashboard | job-detail | chat | invoice | performance
  const [showAll, setShowAll] = useState(false);

  // Data
  const [todayBookings, setTodayBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [customUpdateText, setCustomUpdateText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // ── Verify token on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/employee-auth/verify`, { headers: authHeaders(token) })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.employee) {
          setEmployee(d.employee);
          localStorage.setItem('empInfo', JSON.stringify(d.employee));
        } else {
          handleLogout();
        }
      })
      .catch(() => {});
  }, [token]);

  // ── Load today's schedule ──────────────────────────────────────────────────
  const loadSchedule = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const r = await fetch(`${API_URL}/api/employee/my-schedule?date=${today}`, { headers: authHeaders(token) });
      const d = await r.json();
      setTodayBookings(d.bookings || []);
    } catch {}
    setDataLoading(false);
  }, [token]);

  // ── Load all bookings ──────────────────────────────────────────────────────
  const loadAllBookings = useCallback(async () => {
    if (!token) return;
    try {
      const url = showAll
        ? `${API_URL}/api/employee/my-schedule?showAll=true`
        : `${API_URL}/api/employee/my-bookings`;
      const r = await fetch(url, { headers: authHeaders(token) });
      const d = await r.json();
      setAllBookings(d.bookings || []);
    } catch {}
  }, [token, showAll]);

  useEffect(() => { if (token) loadSchedule(); }, [loadSchedule]);
  useEffect(() => { if (token && activeTab === 'bookings') loadAllBookings(); }, [loadAllBookings, activeTab]);

  // ── Load messages for selected booking ────────────────────────────────────
  useEffect(() => {
    if (!selectedBooking || screen !== 'chat') return;
    fetch(`${API_URL}/api/employee/my-bookings/${selectedBooking.id}/messages`, { headers: authHeaders(token) })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => {});
  }, [selectedBooking, screen, token]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Load invoice ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedBooking || screen !== 'invoice') return;
    const items = (selectedBooking.items || []).filter(i => i?.service_name).map(i => ({
      name: i.service_name,
      price: parseFloat(i.price) || 0
    }));
    setInvoiceItems(items);
  }, [selectedBooking, screen]);

  const invoiceTotal = invoiceItems.reduce((s, i) => s + i.price, 0);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/employee-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });
      const d = await r.json();
      if (!r.ok) { setLoginError(d.error || 'Login failed'); return; }
      localStorage.setItem('empToken', d.token);
      localStorage.setItem('empInfo', JSON.stringify(d.employee));
      setToken(d.token);
      setEmployee(d.employee);
    } catch { setLoginError('Connection error. Please try again.'); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('empToken');
    localStorage.removeItem('empInfo');
    setToken('');
    setEmployee(null);
    setScreen('dashboard');
    setActiveTab('home');
  };

  // ── Status updates ─────────────────────────────────────────────────────────
  const sendStatusUpdate = async (type) => {
    if (!selectedBooking) return;
    setStatusLoading(true);
    try {
      const statusMap = { onmyway: 'in_progress', completed: 'completed' };
      const msgMap = {
        onmyway: `Hi ${selectedBooking.customer_name || 'there'}! Your technician is on the way and will arrive shortly.`,
        completed: `Hi ${selectedBooking.customer_name || 'there'}! Your job has been completed. Thank you for choosing us!`,
        custom: customUpdateText
      };
      if (statusMap[type]) {
        await fetch(`${API_URL}/api/employee/my-bookings/${selectedBooking.id}/status`, {
          method: 'PUT', headers: authHeaders(token),
          body: JSON.stringify({ status: statusMap[type], statusMessage: msgMap[type] })
        });
        setSelectedBooking({ ...selectedBooking, status: statusMap[type] });
      } else if (type === 'custom' && customUpdateText.trim()) {
        await fetch(`${API_URL}/api/employee/my-bookings/${selectedBooking.id}/notes`, {
          method: 'PUT', headers: authHeaders(token),
          body: JSON.stringify({ notes: customUpdateText })
        });
        setCustomUpdateText('');
        setShowCustomInput(false);
      }
    } catch {}
    setStatusLoading(false);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !selectedBooking) return;
    const text = msgInput.trim();
    setMsgInput('');
    setMsgLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/employee/my-bookings/${selectedBooking.id}/messages`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ message: text })
      });
      const d = await r.json();
      if (d.message) setMessages(prev => [...prev, d.message]);
    } catch {}
    setMsgLoading(false);
  };

  // ── Send invoice ───────────────────────────────────────────────────────────
  const sendInvoice = async () => {
    if (!selectedBooking) return;
    try {
      await fetch(`${API_URL}/api/employee/my-bookings/${selectedBooking.id}/invoice/send`, {
        method: 'POST', headers: authHeaders(token)
      });
      alert('Invoice sent successfully!');
    } catch { alert('Failed to send invoice'); }
  };

  // ── Performance stats from bookings ────────────────────────────────────────
  const completedCount = allBookings.filter(b => b.status === 'completed').length;
  const avgRating = allBookings.filter(b => b.customer_rating).length > 0
    ? (allBookings.filter(b => b.customer_rating).reduce((s, b) => s + b.customer_rating, 0) / allBookings.filter(b => b.customer_rating).length).toFixed(1)
    : '—';
  const totalHours = allBookings.filter(b => b.status === 'completed')
    .reduce((s, b) => s + (b.items?.[0]?.duration || 1), 0);

  // navigate to detail screen
  const openBooking = (booking) => {
    setSelectedBooking(booking);
    setScreen('job-detail');
  };

  // ── Tab change ────────────────────────────────────────────────────────────
  const handleTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') setScreen('dashboard');
    else if (tab === 'bookings') setScreen('bookings');
    else if (tab === 'profile') setScreen('performance');
    else if (tab === 'notifications') setScreen('notifications');
  };

  // greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = employee?.name?.split(' ')[0] || 'there';

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (!token || !employee) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {/* Header banner */}
        <div style={{ background: BG_HEADER, width: '100%', maxWidth: 430, borderRadius: '16px 16px 0 0', padding: '28px 24px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>S</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>SORCE Employee</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>Sign in to your account</p>
        </div>

        {/* Login card */}
        <div style={{ background: '#fff', width: '100%', maxWidth: 430, borderRadius: '0 0 16px 16px', padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          {loginError && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} color="#dc2626" />
              <span style={{ fontSize: 14, color: '#dc2626' }}>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email</label>
              <input
                type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                required autoComplete="email"
                placeholder="you@example.com"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
              <input
                type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                required autoComplete="current-password"
                placeholder="••••••••"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loginLoading} style={{
              width: '100%', padding: '14px', background: loginLoading ? '#d1d5db' : PRIMARY,
              color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: loginLoading ? 'not-allowed' : 'pointer', marginTop: 4
            }}>
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
            Need an account? Ask your employer to send you an invite.
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHARED UI PIECES
  // ════════════════════════════════════════════════════════════════════════════

  const TopBar = ({ title, onBack, showBell = true }) => (
    <div style={{ background: BG_HEADER, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, minHeight: 52 }}>
      {onBack ? (
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff' }}>
          <ChevronLeft size={22} color="#fff" />
        </button>
      ) : (
        <div style={{ width: 30 }} />
      )}
      <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 17, color: '#fff' }}>{title}</span>
      {showBell ? (
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Bell size={20} color="rgba(255,255,255,0.9)" />
        </button>
      ) : <div style={{ width: 30 }} />}
    </div>
  );

  const ContextBar = ({ icon, label, extras }) => (
    <div style={{ background: '#f3f4f6', borderRadius: 12, margin: '12px 16px 0', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, background: PRIMARY, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon || <Briefcase size={16} color="#fff" />}
      </div>
      <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: '#111827' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {extras}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <MoreHorizontal size={18} color="#9ca3af" />
        </button>
      </div>
    </div>
  );

  const Card = ({ children, style }) => (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0f0f0', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', ...style }}>
      {children}
    </div>
  );

  const OrangeBtn = ({ children, onClick, disabled, dark }) => (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px', background: disabled ? '#d1d5db' : dark ? PRIMARY_DARK : PRIMARY,
      color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s'
    }}>
      {children}
    </button>
  );

  const DarkBtn = ({ children, onClick }) => (
    <button onClick={onClick} style={{
      width: '100%', padding: '15px', background: '#1f2937',
      color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer'
    }}>
      {children}
    </button>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SCREENS
  // ════════════════════════════════════════════════════════════════════════════

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const DashboardScreen = () => {
    const nextJob = todayBookings.find(b => b.status !== 'completed');
    const doneCount = todayBookings.filter(b => b.status === 'completed').length;
    const totalCount = todayBookings.length;
    const progress = totalCount > 0 ? doneCount / totalCount : 0;

    return (
      <>
        <TopBar title="SORCE" onBack={null} />

        {/* App context strip */}
        <div style={{ background: '#f3f4f6', margin: '12px 16px 0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: PRIMARY, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>S</span>
          </div>
          <span style={{ flex: 1, fontWeight: 600, color: '#111827' }}>SORCE</span>
          <Bell size={18} color="#f59e0b" />
        </div>

        {/* Sub-nav row */}
        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => { setActiveTab('bookings'); setScreen('bookings'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: PRIMARY, fontSize: 13, fontWeight: 600 }}
          >
            <ChevronLeft size={14} /> Dashboard Overview
          </button>
          <Bell size={18} color="#f59e0b" />
        </div>

        <div style={{ padding: '4px 16px 100px', overflowY: 'auto' }}>
          {/* Greeting */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '4px 0 16px', lineHeight: 1.2 }}>
            {greeting},<br />{firstName}!
          </h1>

          {/* Today's schedule card */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Today's Schedule</span>
              <button
                onClick={() => { setActiveTab('bookings'); setScreen('bookings'); }}
                style={{ background: PRIMARY, color: '#fff', border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Today ›
              </button>
            </div>

            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af' }}>Loading...</div>
            ) : todayBookings.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: 14, padding: '8px 0' }}>No bookings today</div>
            ) : (
              <>
                <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Today's Schedule</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    {fmtTime(todayBookings[0]?.start_time)} – {fmtTime(todayBookings[todayBookings.length - 1]?.end_time)} ›
                  </div>
                </div>

                {nextJob && (
                  <div
                    style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 10, marginBottom: 10, cursor: 'pointer' }}
                    onClick={() => openBooking(nextJob)}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      Next Job: {nextJob.customer_name || 'Booking'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {nextJob.items?.[0]?.service_name || 'Service'} ›
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                    Completed Tasks: {doneCount}/{totalCount}
                  </div>
                  <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, background: PRIMARY, borderRadius: 4, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Recent ratings card */}
          <Card>
            <button
              onClick={() => { setActiveTab('profile'); setScreen('performance'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Recent Customer Ratings</span>
                <ChevronRight size={16} color="#9ca3af" />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <MiniBarChart color={PRIMARY} />
                <MiniBarChart color="#F59E0B" />
              </div>
            </button>
          </Card>
        </div>
      </>
    );
  };

  // ── Bookings ───────────────────────────────────────────────────────────────
  const BookingsScreen = () => (
    <>
      <TopBar title="My Bookings" onBack={() => { setActiveTab('home'); setScreen('dashboard'); }} />

      <div style={{ padding: '12px 16px 100px', overflowY: 'auto' }}>
        {/* Toggle */}
        <div style={{ background: '#f3f4f6', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{
            background: !showAll ? PRIMARY : 'transparent',
            color: !showAll ? '#fff' : '#374151',
            borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
            cursor: 'pointer'
          }} onClick={() => setShowAll(false)}>My Bookings</span>
          <Toggle checked={showAll} onChange={v => setShowAll(v)} />
          <span style={{
            color: showAll ? '#374151' : '#9ca3af',
            fontSize: 13, fontWeight: showAll ? 700 : 400, cursor: 'pointer'
          }} onClick={() => setShowAll(true)}>All Company<br />Bookings</span>
        </div>

        {/* Map placeholder */}
        <div style={{
          height: 120, background: '#f0ede8', borderRadius: 12, marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'
        }}>
          {/* Grid lines */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, height: 1, background: '#e5e0d8', top: `${(i + 1) * 17}%` }} />
          ))}
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: '#e5e0d8', left: `${(i + 1) * 12}%` }} />
          ))}
          {/* Pins */}
          {[{ x: '25%', y: '40%' }, { x: '45%', y: '25%' }, { x: '58%', y: '55%' }, { x: '72%', y: '30%' }].map((pos, i) => (
            <div key={i} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)' }}>
              <MapPin size={20} color="#ef4444" fill="#ef4444" />
            </div>
          ))}
        </div>

        {/* Booking list */}
        {dataLoading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Loading...</div>
        ) : allBookings.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: 32, textAlign: 'center', color: '#9ca3af' }}>
            No bookings found
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, padding: '0 16px', border: '1px solid #f0f0f0' }}>
            {allBookings.map(b => (
              <BookingRow key={b.id} booking={b} onPress={() => openBooking(b)} />
            ))}
          </div>
        )}
      </div>
    </>
  );

  // ── Job Detail ─────────────────────────────────────────────────────────────
  const JobDetailScreen = () => {
    if (!selectedBooking) return null;
    const jobTitle = selectedBooking.customer_name || 'Job';
    const serviceName = selectedBooking.items?.[0]?.service_name || 'Service';
    const isOnMyWay = selectedBooking.status === 'in_progress';
    const isDone = selectedBooking.status === 'completed';

    return (
      <>
        <TopBar title="Job Details" onBack={() => setScreen(activeTab === 'bookings' ? 'bookings' : 'dashboard')} />
        <ContextBar
          label="In-app Job"
          extras={
            <>
              <Lock size={16} color="#9ca3af" />
              <Paperclip size={16} color="#9ca3af" />
            </>
          }
        />

        <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 12, lineHeight: 1.2 }}>
            {jobTitle}
          </h1>

          {/* Status card */}
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Status</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{serviceName}</span>
              <StatusBadge status={selectedBooking.status} />
            </div>
          </Card>

          {/* Notification preview */}
          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: '10px 14px', marginBottom: 14, maxWidth: '80%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#111827', lineHeight: 1.4 }}>
              Hey {selectedBooking.customer_name || 'there'}! Your technician is en route and will see you soon! 🚗
            </p>
          </div>

          {/* Detail row */}
          <Card style={{ marginBottom: 20, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{serviceName}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                {fmtDate(selectedBooking.booking_date)} · {fmtTime(selectedBooking.start_time)}
              </div>
            </div>
            <ChevronRight size={16} color="#9ca3af" />
          </Card>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OrangeBtn
              onClick={() => sendStatusUpdate('onmyway')}
              disabled={statusLoading || isOnMyWay || isDone}
            >
              {isOnMyWay ? '✓ On My Way Sent' : 'Send "On My Way" Update'}
            </OrangeBtn>

            <OrangeBtn
              dark
              onClick={() => sendStatusUpdate('completed')}
              disabled={statusLoading || isDone}
            >
              {isDone ? '✓ Job Completed' : 'Send "Job Completed" Update'}
            </OrangeBtn>

            {!showCustomInput ? (
              <DarkBtn onClick={() => setShowCustomInput(true)}>Send Custom Update</DarkBtn>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={customUpdateText}
                  onChange={e => setCustomUpdateText(e.target.value)}
                  placeholder="Type your custom message to the customer..."
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowCustomInput(false); setCustomUpdateText(''); }} style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => sendStatusUpdate('custom')} disabled={!customUpdateText.trim()} style={{ flex: 2, padding: 12, background: PRIMARY, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Send Update
                  </button>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button onClick={() => setScreen('chat')} style={{ flex: 1, padding: '12px 0', background: '#fff', border: `1.5px solid ${PRIMARY}`, borderRadius: 10, color: PRIMARY, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Send size={15} /> Chat
              </button>
              <button onClick={() => setScreen('invoice')} style={{ flex: 1, padding: '12px 0', background: '#fff', border: `1.5px solid ${PRIMARY}`, borderRadius: 10, color: PRIMARY, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Briefcase size={15} /> Invoice
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // ── Chat ───────────────────────────────────────────────────────────────────
  const ChatScreen = () => {
    if (!selectedBooking) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title={selectedBooking.customer_name || 'Chat'} onBack={() => setScreen('job-detail')} />
        <ContextBar
          label="In-app Job"
          extras={<><Lock size={16} color="#9ca3af" /><Paperclip size={16} color="#9ca3af" /></>}
        />

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#d1d5db', padding: '32px 0', fontSize: 14 }}>No messages yet. Start the conversation!</div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_type === 'employee';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: 11, color: isMe ? PRIMARY : '#6b7280', fontWeight: 700, marginBottom: 3 }}>
                  {isMe ? 'Technician:' : 'Customer:'}
                </div>
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isMe ? PRIMARY : '#f3f4f6', color: isMe ? '#fff' : '#111827',
                  fontSize: 14, lineHeight: 1.5
                }}>
                  {msg.message}
                </div>
              </div>
            );
          })}

          {/* Customer profile shortcut */}
          {messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e5e7eb', border: `2px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#6b7280" />
                </div>
                <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>Customer<br />Profile</span>
              </button>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} style={{ padding: '10px 16px', background: '#fff', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 24, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
          />
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Paperclip size={20} color="#9ca3af" />
          </button>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Lock size={20} color="#9ca3af" />
          </button>
          <button type="submit" disabled={!msgInput.trim() || msgLoading} style={{
            width: 38, height: 38, borderRadius: '50%', background: msgInput.trim() ? PRIMARY : '#e5e7eb',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Send size={16} color="#fff" />
          </button>
        </form>
      </div>
    );
  };

  // ── Invoice ────────────────────────────────────────────────────────────────
  const InvoiceScreen = () => {
    if (!selectedBooking) return null;
    return (
      <>
        <TopBar title="Invoice" onBack={() => setScreen('job-detail')} />
        <ContextBar label={selectedBooking.customer_name || 'Customer'} />

        <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Invoice</h1>

          <Card style={{ marginBottom: 20 }}>
            {invoiceItems.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>No line items</div>
            ) : (
              invoiceItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < invoiceItems.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <span style={{ fontSize: 15, color: '#374151' }}>{item.name}</span>
                  <span style={{ fontSize: 15, color: '#374151' }}>- ${item.price.toFixed(2)}</span>
                </div>
              ))
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: '2px solid #e5e7eb' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Total:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>${invoiceTotal.toFixed(2)}</span>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OrangeBtn onClick={sendInvoice}>Send Invoice</OrangeBtn>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>OR</div>

            <OrangeBtn dark onClick={() => alert('Collect Payment — integrate Square tap-to-pay here')}>
              Collect Payment
            </OrangeBtn>
          </div>
        </div>
      </>
    );
  };

  // ── Performance ────────────────────────────────────────────────────────────
  const PerformanceScreen = () => (
    <>
      <TopBar title="Employee Performance" onBack={() => { setActiveTab('home'); setScreen('dashboard'); }} />
      <ContextBar label={employee?.businessName || 'Business'} />

      <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 16, lineHeight: 1.2 }}>
          Employee<br />Performance
        </h1>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>This Week's Summary</span>
            <span style={{ background: PRIMARY, color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>Top Performer</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>Completed Jobs:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{completedCount || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>Average Customer Rating:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{avgRating}/5</span>
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>Total Hours Tracked:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{totalHours || '—'}</span>
          </div>
        </Card>

        {/* Chart */}
        <Card>
          <LineChart />
        </Card>
      </div>
    </>
  );

  // ── Notifications ──────────────────────────────────────────────────────────
  const NotificationsScreen = () => (
    <>
      <TopBar title="Notifications" onBack={() => { setActiveTab('home'); setScreen('dashboard'); }} />
      <div style={{ padding: '16px 16px 100px' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px 0', fontSize: 15 }}>
          <Bell size={40} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
          No new notifications
        </div>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ════════════════════════════════════════════════════════════════════════════
  const screenComponents = {
    dashboard: <DashboardScreen />,
    bookings: <BookingsScreen />,
    'job-detail': <JobDetailScreen />,
    chat: <ChatScreen />,
    invoice: <InvoiceScreen />,
    performance: <PerformanceScreen />,
    notifications: <NotificationsScreen />
  };

  const bottomTabs = [
    { id: 'home', icon: <Home size={22} />, label: 'Home' },
    { id: 'settings', icon: <Settings size={22} />, label: 'Settings' },
    { id: 'new', icon: null, label: '' },
    { id: 'notifications', icon: <Bell size={22} />, label: 'Alerts' },
    { id: 'profile', icon: <User size={22} />, label: 'Profile' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Phone shell */}
      <div style={{
        width: '100%', maxWidth: 430, minHeight: '100vh',
        background: '#fff', display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 0 40px rgba(0,0,0,0.12)'
      }}>
        {/* Screen content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: screen === 'chat' ? 'hidden' : 'auto', paddingBottom: screen === 'chat' ? 0 : 0 }}>
          {screenComponents[screen] || screenComponents.dashboard}
        </div>

        {/* Bottom navigation */}
        <div style={{
          position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '8px 0 12px', zIndex: 50, boxShadow: '0 -2px 12px rgba(0,0,0,0.06)'
        }}>
          {bottomTabs.map(tab => {
            if (tab.id === 'new') {
              return (
                <button key="new" style={{ background: PRIMARY, width: 52, height: 52, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${PRIMARY}66`, marginTop: -10 }}>
                  <Plus size={26} color="#fff" strokeWidth={2.5} />
                </button>
              );
            }
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'settings') return; // TODO
                  handleTab(tab.id);
                }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                <span style={{ color: isActive ? PRIMARY : '#9ca3af' }}>{tab.icon}</span>
                {tab.label && <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, color: isActive ? PRIMARY : '#9ca3af' }}>{tab.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Logout button (small, top-right on dashboard) */}
        {screen === 'dashboard' && (
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ position: 'absolute', top: 14, right: 46, background: 'none', border: 'none', cursor: 'pointer', padding: 4, zIndex: 10 }}
          >
            <LogOut size={18} color="rgba(255,255,255,0.7)" />
          </button>
        )}
      </div>
    </div>
  );
}
