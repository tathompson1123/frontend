import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Star, MapPin, List, Map as MapIcon, Pause, Play, X, Clock, Phone, RefreshCw, AlertCircle } from 'lucide-react';

// Recurring customers: who is on a repeat plan, what schedule they're on, and where they
// live. The map has two colourings —
//   • Day of week: which weekday each customer is serviced (route planning)
//   • Area: neighbourhood "pockets" of customers found by proximity (where the business
//     is dense, and which days those pockets fall on)

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_COLORS = ['#64748b', '#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#ef4444', '#0891b2'];
const AREA_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#0891b2', '#ea580c', '#4f46e5', '#65a30d', '#db2777', '#0d9488', '#a16207'];
// Listed in the order the business sells them: monthly / bi-monthly first.
// "Bi-monthly" here means twice a month (the business's own term), not every other month.
const BILLING_BADGE = {
  awaiting_card: ['Waiting for card', 'bg-amber-100 text-amber-800'],
  active: ['Billing active', 'bg-green-100 text-green-800'],
  paused: ['Billing paused', 'bg-gray-200 text-gray-700'],
  failed: ['Billing problem', 'bg-red-100 text-red-800'],
  canceled: ['Billing canceled', 'bg-gray-200 text-gray-700'],
};
const FREQ_OPTIONS = [
  ['monthly', 'Monthly'],
  ['bimonthly', 'Bi-monthly (twice a month)'],
  ['biweekly', 'Bi-weekly (every 2 weeks)'],
  ['weekly', 'Weekly'],
  ['quarterly', 'Quarterly'],
  ['yearly', 'Yearly'],
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtDate = (ymd) => {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const fmtTime = (hm) => {
  if (!hm) return '';
  const [h, m] = hm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const money = (n) => (n == null ? '—' : `$${Number(n).toFixed(2)}`);

function miles(a, b) {
  const R = 3958.8;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Greedy proximity clustering: join the nearest existing pocket if its centre is within
// `radius` miles, otherwise start a new one. Good enough for "where are my customers
// bunched up" without pulling in a clustering library.
function clusterPlans(plans, radius) {
  const clusters = [];
  for (const p of plans) {
    let best = null;
    let bestDist = Infinity;
    for (const c of clusters) {
      const d = miles(c.center, p);
      if (d < bestDist) { best = c; bestDist = d; }
    }
    if (best && bestDist <= radius) {
      best.members.push(p);
      best.center = {
        lat: best.members.reduce((s, m) => s + m.lat, 0) / best.members.length,
        lng: best.members.reduce((s, m) => s + m.lng, 0) / best.members.length,
      };
    } else {
      clusters.push({ center: { lat: p.lat, lng: p.lng }, members: [p] });
    }
  }
  // Biggest pocket gets the first colour.
  clusters.sort((a, b) => b.members.length - a.members.length);
  clusters.forEach((c, i) => {
    c.index = i;
    c.color = AREA_COLORS[i % AREA_COLORS.length];
    c.radiusMi = Math.max(0.4, ...c.members.map((m) => miles(c.center, m))) + 0.25;
  });
  return clusters;
}

let leafletPromise = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const existing = document.getElementById('leaflet-js');
    const script = existing || document.createElement('script');
    script.addEventListener('load', () => resolve(window.L));
    script.addEventListener('error', () => { leafletPromise = null; reject(new Error('Map failed to load')); });
    if (!existing) {
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(script);
    } else if (window.L) {
      resolve(window.L);
    }
  });
  return leafletPromise;
}

function PlansMap({ plans, colorMode, radius, hiddenDays }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [ready, setReady] = useState(!!window.L);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(() => { if (!cancelled) setReady(true); }).catch((e) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const L = window.L;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([39.5, -98.35], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, [ready]);

  const clusters = useMemo(
    () => (colorMode === 'area' ? clusterPlans(plans, radius) : []),
    [plans, colorMode, radius]
  );

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    const visible = plans.filter((p) => !hiddenDays.has(p.weekday));
    const colorFor = new Map();
    if (colorMode === 'area') {
      clusters.forEach((c) => c.members.forEach((m) => colorFor.set(m.id, c.color)));
      clusters.forEach((c) => {
        L.circle([c.center.lat, c.center.lng], {
          radius: c.radiusMi * 1609.34, color: c.color, weight: 2, opacity: 0.7, fillColor: c.color, fillOpacity: 0.12,
        }).addTo(layer).bindTooltip(`Area ${c.index + 1} · ${c.members.length} customer${c.members.length === 1 ? '' : 's'}`, { sticky: true });
      });
    }

    const bounds = [];
    visible.forEach((p) => {
      const color = colorMode === 'area' ? (colorFor.get(p.id) || '#64748b') : DAY_COLORS[p.weekday];
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 9, color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 0.95,
      }).addTo(layer);
      marker.bindPopup(
        `<div style="min-width:180px">
           <div style="font-weight:700">★ ${esc(p.customer_name)}</div>
           <div style="font-size:12px;color:#475569">${esc(p.customer_address)}</div>
           <div style="margin-top:6px;font-size:12px"><b style="color:${DAY_COLORS[p.weekday]}">${DAYS[p.weekday]}s</b> · ${esc(p.frequency_label)} · ${esc(fmtTime(p.start_time))}</div>
           <div style="font-size:12px">Next: ${esc(fmtDate(p.next_date))}</div>
           <div style="font-size:12px;color:#475569">${esc(p.service_names.join(', '))} · ${esc(money(p.per_visit))}</div>
         </div>`
      );
      bounds.push([p.lat, p.lng]);
    });
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [plans, colorMode, clusters, hiddenDays, ready]);

  if (loadError) return <div className="p-6 text-sm text-red-600">{loadError}</div>;
  return (
    <div>
      <div ref={containerRef} style={{ height: 560, width: '100%' }} className="rounded-lg border border-gray-200 z-0" />
      {colorMode === 'area' && clusters.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {clusters.map((c) => {
            const dayCounts = {};
            c.members.forEach((m) => { dayCounts[m.weekday] = (dayCounts[m.weekday] || 0) + 1; });
            const days = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]).map(([d, n]) => `${DAYS[d].slice(0, 3)}${n > 1 ? ` ×${n}` : ''}`).join(', ');
            return (
              <div key={c.index} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs">
                <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                <span className="font-semibold text-gray-800">Area {c.index + 1}</span>
                <span className="text-gray-500">{c.members.length} customer{c.members.length === 1 ? '' : 's'} · {days}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RecurringCustomers({ apiUrl, authFetch }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [colorMode, setColorMode] = useState('day'); // 'day' | 'area'
  const [radius, setRadius] = useState(2);
  const [hiddenDays, setHiddenDays] = useState(() => new Set());
  const [freqFilter, setFreqFilter] = useState('all');
  const [showPaused, setShowPaused] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${apiUrl}/api/recurring`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setPlans(data.plans || []);
    } catch (e) {
      setError(e.message || 'Failed to load recurring customers');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, authFetch]);

  useEffect(() => { load(); }, [load]);

  const act = async (plan, request, doneMessage) => {
    setBusyId(plan.id);
    setNotice('');
    try {
      const res = await authFetch(`${apiUrl}/api/recurring/${plan.id}${request.path || ''}`, {
        method: request.method,
        body: JSON.stringify(request.body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Something went wrong');
      setNotice(doneMessage);
      await load();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (plan, status, msg) => act(plan, { method: 'PATCH', path: '/status', body: { status } }, msg);
  const changeFrequency = (plan, frequency) => {
    if (frequency === plan.frequency) return;
    const label = FREQ_OPTIONS.find(([v]) => v === frequency)?.[1];
    if (!window.confirm(`Switch ${plan.customer_name} to ${label}? Their upcoming visits will be rebuilt from their next scheduled visit.`)) return;
    act(plan, { method: 'PUT', body: { frequency } }, `${plan.customer_name} is now ${label}.`);
  };
  const cancelPlan = (plan) => {
    if (!window.confirm(`Stop ${plan.customer_name}'s recurring plan and remove their upcoming visits?${plan.billed ? ' Their Square subscription will be canceled and they will not be charged again.' : ''} Past visits stay.`)) return;
    setStatus(plan, 'cancelled', `${plan.customer_name}'s recurring plan was cancelled.`);
  };

  const filtered = useMemo(() => plans.filter((p) => {
    if (!showPaused && p.status === 'paused') return false;
    if (freqFilter === 'all') return true;
    if (freqFilter === 'other') return !['monthly', 'bimonthly'].includes(p.frequency);
    return p.frequency === freqFilter;
  }), [plans, freqFilter, showPaused]);

  const mappable = filtered.filter((p) => p.lat != null && p.lng != null && p.status === 'active');
  const unmapped = filtered.filter((p) => (p.lat == null || p.lng == null) && p.status === 'active');
  const activeCount = plans.filter((p) => p.status === 'active').length;
  // Billed plans pay one flat price per period; schedule-only plans fall back to per-visit price.
  const perMonth = plans.filter((p) => p.status === 'active').reduce((sum, p) => {
    if (p.billed) {
      const periodsPerMonth = { month: 1, quarter: 1 / 3, year: 1 / 12 }[p.billing_period] || 1;
      return sum + (p.plan_price || 0) * periodsPerMonth;
    }
    const visitsPerMonth = { weekly: 52 / 12, biweekly: 26 / 12, bimonthly: 2, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }[p.frequency] || 0;
    return sum + (p.per_visit || 0) * visitsPerMonth;
  }, 0);

  const byDay = useMemo(() => {
    const groups = DAYS.map(() => []);
    // A row with an unreadable weekday is shown under Sunday rather than crashing the tab.
    filtered.forEach((p) => groups[Number.isInteger(p.weekday) && p.weekday >= 0 && p.weekday <= 6 ? p.weekday : 0].push(p));
    groups.forEach((g) => g.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')));
    return groups;
  }, [filtered]);

  const toggleDay = (d) => setHiddenDays((prev) => {
    const next = new Set(prev);
    next.has(d) ? next.delete(d) : next.add(d);
    return next;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            Recurring Customers
          </h2>
          <p className="text-sm text-gray-500">
            {activeCount} active plan{activeCount === 1 ? '' : 's'} · about ${perMonth.toFixed(0)}/month in recurring work
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {[['all', 'All'], ['monthly', 'Monthly'], ['bimonthly', 'Bi-monthly'], ['other', 'Other']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setFreqFilter(v)}
                className={`px-3 py-1.5 text-sm font-medium ${freqFilter === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${view === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              <List className="w-4 h-4" /> Schedule
            </button>
            <button onClick={() => setView('map')} className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${view === 'map' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
              <MapIcon className="w-4 h-4" /> Live Map
            </button>
          </div>
          <button onClick={load} className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notice && (
        <div className="mx-4 mt-3 px-3 py-2 text-sm bg-blue-50 text-blue-800 rounded-lg flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && <div className="m-4 p-3 text-sm bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {loading && plans.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">Loading recurring customers…</div>
      ) : plans.length === 0 && !error ? (
        <div className="text-center py-16 px-6">
          <Star className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No recurring customers yet</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            When you book a service, pick <b>Repeat</b> (Monthly, Every 2 months, …) and every visit lands on the schedule automatically.
          </p>
        </div>
      ) : view === 'map' ? (
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Color by</span>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button onClick={() => setColorMode('day')} className={`px-3 py-1.5 text-sm font-medium ${colorMode === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Day of week</button>
                <button onClick={() => setColorMode('area')} className={`px-3 py-1.5 text-sm font-medium ${colorMode === 'area' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Area</button>
              </div>
            </div>
            {colorMode === 'area' ? (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                Pocket size
                <input type="range" min="0.5" max="6" step="0.5" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
                <span className="w-14 text-gray-800 font-medium">{radius} mi</span>
              </label>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => {
                  const count = mappable.filter((p) => p.weekday === i).length;
                  if (!count) return null;
                  const off = hiddenDays.has(i);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDay(i)}
                      title={off ? 'Show' : 'Hide'}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${off ? 'opacity-40 border-gray-200 bg-gray-50' : 'border-gray-300 bg-white'}`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ background: DAY_COLORS[i] }} />
                      {d} <span className="text-gray-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {mappable.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              No active recurring customers with a locatable address yet.
            </div>
          ) : (
            <PlansMap plans={mappable} colorMode={colorMode} radius={radius} hiddenDays={hiddenDays} />
          )}
          {unmapped.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 flex gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Not on the map (no address or address couldn't be found): {unmapped.map((p) => p.customer_name).join(', ')}.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 space-y-5">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showPaused} onChange={(e) => setShowPaused(e.target.checked)} />
            Show paused plans
          </label>
          {byDay.map((group, day) => group.length === 0 ? null : (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full" style={{ background: DAY_COLORS[day] }} />
                <h3 className="font-bold text-gray-900">{DAYS[day]}s</h3>
                <span className="text-sm text-gray-400">{group.length} customer{group.length === 1 ? '' : 's'}</span>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 ${p.status === 'paused' ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-white border-gray-200'}`}
                    style={{ borderLeft: `4px solid ${DAY_COLORS[day]}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span className="text-amber-500">★</span>
                          <span className="truncate">{p.customer_name}</span>
                          {p.status === 'paused' && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Paused</span>}
                        </p>
                        {p.customer_address && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {p.customer_address}
                            {p.lat == null && <span className="text-amber-600 ml-1">(not on map)</span>}
                          </p>
                        )}
                        {p.customer_phone && (
                          <a href={`tel:${p.customer_phone}`} className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {p.customer_phone}
                          </a>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {p.billed ? (
                          <>
                            <p className="font-bold text-green-700">{money(p.plan_price)}</p>
                            <p className="text-xs text-gray-400">per {p.billing_period}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-green-700">{money(p.per_visit)}</p>
                            <p className="text-xs text-gray-400">per visit · not billed</p>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mt-2 truncate">{p.service_names.join(' + ') || '—'}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
                      {p.billed ? (
                        <>
                          <span className="px-2 py-1 rounded-md bg-purple-100 text-purple-800 font-semibold">{p.plan_name}</span>
                          {BILLING_BADGE[p.billing_status] && (
                            <span className={`px-2 py-1 rounded-md font-semibold ${BILLING_BADGE[p.billing_status][1]}`}>{BILLING_BADGE[p.billing_status][0]}</span>
                          )}
                        </>
                      ) : (
                        <select
                          value={p.frequency}
                          disabled={busyId === p.id}
                          onChange={(e) => changeFrequency(p, e.target.value)}
                          className="border border-gray-300 rounded-md px-2 py-1 bg-white font-semibold"
                          title="Change how often"
                        >
                          {FREQ_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                        </select>
                      )}
                      <span className="flex items-center gap-1 text-gray-600"><Clock className="w-3 h-3" /> {DAYS[day].slice(0, 3)} {fmtTime(p.start_time)}</span>
                      {p.employee_name && <span className="text-gray-500">· {p.employee_name}</span>}
                      <span className="text-gray-400">· {p.completed_count} done</span>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Upcoming</p>
                      {p.upcoming.length === 0 ? (
                        <p className="text-xs text-gray-400">{p.status === 'paused' ? 'Paused — nothing scheduled' : 'Nothing scheduled'}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {p.upcoming.map((u, i) => (
                            <span key={u.id} className={`px-2 py-0.5 rounded-full text-xs ${i === 0 ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-100 text-gray-700'}`}>
                              {fmtDate(u.date)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {p.billed && p.billing_status === 'awaiting_card' && (
                      <p className="mt-2 text-xs text-amber-800 bg-amber-50 rounded-md px-2 py-1.5">
                        The customer hasn't saved a card yet, so nothing is being charged. Their visits are already on the schedule.
                      </p>
                    )}
                    {p.billed && p.billing_status === 'failed' && (
                      <p className="mt-2 text-xs text-red-800 bg-red-50 rounded-md px-2 py-1.5">
                        {p.billing_error || 'Square could not charge this customer\'s card.'} Check the subscription in Square.
                      </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-xs flex-wrap">
                      {p.billed && ['awaiting_card', 'failed'].includes(p.billing_status) && !p.has_card && (
                        <button disabled={busyId === p.id} onClick={() => act(p, { method: 'POST', path: '/send-card-link', body: {} }, `Card link sent to ${p.customer_email}.`)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold">
                          Resend card link
                        </button>
                      )}
                      {p.billed && p.billing_status === 'failed' && p.has_card && (
                        <button disabled={busyId === p.id} onClick={() => act(p, { method: 'POST', path: '/start-billing', body: {} }, 'Billing started.')} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold">
                          Retry billing
                        </button>
                      )}
                      {p.status === 'active' ? (
                        <button disabled={busyId === p.id} onClick={() => setStatus(p, 'paused', `${p.customer_name} paused — upcoming visits removed${p.billed ? ' and billing paused in Square' : ''}.`)} className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      ) : (
                        <button disabled={busyId === p.id} onClick={() => setStatus(p, 'active', `${p.customer_name} resumed — visits added back to the schedule.`)} className="flex items-center gap-1 text-green-700 hover:text-green-900">
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}
                      <button disabled={busyId === p.id} onClick={() => cancelPlan(p)} className="flex items-center gap-1 text-red-600 hover:text-red-800">
                        <X className="w-3 h-3" /> Stop plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-gray-500 py-10">No plans match this filter.</p>}
        </div>
      )}
    </div>
  );
}
