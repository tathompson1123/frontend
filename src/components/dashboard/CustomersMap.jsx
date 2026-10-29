import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';
import { loadLeaflet, clusterPlans, esc } from './RecurringCustomers';

const DAY_MS = 86400000;

// Colour by how recently we served them: warm = recent, grey = long ago.
const RECENCY = [
  { key: 'recent', label: 'Last 90 days', color: '#16a34a', test: (d) => d != null && d <= 90 },
  { key: 'year', label: '3–12 months', color: '#f59e0b', test: (d) => d != null && d <= 365 },
  { key: 'old', label: 'Over a year', color: '#64748b', test: (d) => d != null },
  { key: 'never', label: 'No visit recorded', color: '#cbd5e1', test: () => true },
];

const daysSince = (ymd) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.max(0, Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / DAY_MS));
};
const recencyOf = (p) => RECENCY.find((r) => r.test(daysSince(p.last_service_date)));
const fmtDate = (ymd) => {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function CustomersMap({ apiUrl, authFetch }) {
  const [points, setPoints] = useState([]);
  const [stats, setStats] = useState({ pending: 0, notFound: 0, noAddress: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [colorMode, setColorMode] = useState('recency'); // 'recency' | 'area'
  const [radius, setRadius] = useState(2);
  const [ready, setReady] = useState(!!window.L);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const stopRef = useRef(false);

  const load = useCallback(async () => {
    const res = await authFetch(`${apiUrl}/api/customers/map`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load the map');
    setPoints(data.points || []);
    setStats({ pending: data.pending, notFound: data.notFound, noAddress: data.noAddress, total: data.total });
    return data;
  }, [apiUrl, authFetch]);

  // Place unplaced addresses a few at a time (the lookups are rate-limited), refreshing as we go.
  const placeRemaining = useCallback(async () => {
    setPlacing(true);
    stopRef.current = false;
    try {
      for (let i = 0; i < 400 && !stopRef.current; i++) {
        const res = await authFetch(`${apiUrl}/api/customers/map/geocode`, { method: 'POST', body: '{}' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not place customers');
        await load();
        if (!data.remaining || !data.processed) break;
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }, [apiUrl, authFetch, load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await load();
        if (!cancelled && data.pending > 0) placeRemaining();
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; stopRef.current = true; };
  }, [load, placeRemaining]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(() => { if (!cancelled) setReady(true); }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    const L = window.L;
    const map = L.map(containerRef.current).setView([39.5, -98.35], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, [ready]);

  const clusters = useMemo(() => (colorMode === 'area' ? clusterPlans(points, radius) : []), [points, colorMode, radius]);

  // Re-fit only when the set of customers changes, not on every colour toggle.
  const fitKey = useRef('');
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    const colorFor = new Map();
    if (colorMode === 'area') {
      clusters.forEach((c) => {
        c.members.forEach((m) => colorFor.set(m.id, c.color));
        L.circle([c.center.lat, c.center.lng], {
          radius: c.radiusMi * 1609.34, color: c.color, weight: 2, opacity: 0.7, fillColor: c.color, fillOpacity: 0.12,
        }).addTo(layer).bindTooltip(`Area ${c.index + 1} · ${c.members.length} customer${c.members.length === 1 ? '' : 's'}`, { sticky: true });
      });
    }

    const bounds = [];
    points.forEach((p) => {
      const color = colorMode === 'area' ? (colorFor.get(p.id) || '#64748b') : recencyOf(p).color;
      L.circleMarker([p.lat, p.lng], { radius: 7, color: '#ffffff', weight: 1.5, fillColor: color, fillOpacity: 0.9 })
        .addTo(layer)
        .bindPopup(
          `<div style="min-width:170px">
             <div style="font-weight:700">${esc(p.name)}</div>
             <div style="font-size:12px;color:#475569">${esc(p.address)}</div>
             <div style="margin-top:6px;font-size:12px">${p.total_jobs ? esc(p.total_jobs) + ' job' + (p.total_jobs === 1 ? '' : 's') + ' · ' : ''}Last: ${esc(fmtDate(p.last_service_date))}</div>
             ${p.last_service ? `<div style="font-size:12px;color:#475569">${esc(p.last_service)}</div>` : ''}
             ${p.phone ? `<div style="font-size:12px;margin-top:4px"><a href="tel:${esc(p.phone)}">${esc(p.phone)}</a></div>` : ''}
           </div>`
        );
      bounds.push([p.lat, p.lng]);
    });
    const key = String(points.length);
    if (bounds.length && fitKey.current !== key) {
      fitKey.current = key;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [points, colorMode, clusters, ready]);

  const recencyCounts = useMemo(() => {
    const c = {};
    points.forEach((p) => { const k = recencyOf(p).key; c[k] = (c[k] || 0) + 1; });
    return c;
  }, [points]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading customer map…</div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button onClick={() => setColorMode('recency')} className={`px-3 py-1.5 text-sm font-medium ${colorMode === 'recency' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Last served</button>
          <button onClick={() => setColorMode('area')} className={`px-3 py-1.5 text-sm font-medium ${colorMode === 'area' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>Area</button>
        </div>
        {colorMode === 'area' && (
          <label className="flex items-center gap-2 text-xs text-gray-600">
            Pocket size
            <input type="range" min="0.5" max="8" step="0.5" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
            {radius} mi
          </label>
        )}
        <span className="text-sm text-gray-600 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> {points.length} of {stats.total} customers on the map
        </span>
        <button onClick={() => { setError(''); load().then((d) => d.pending > 0 && placeRemaining()).catch((e) => setError(e.message)); }} className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${placing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {placing && (
        <p className="text-xs text-blue-800 bg-blue-50 rounded-lg px-3 py-2">
          Placing {stats.pending} customer{stats.pending === 1 ? '' : 's'} on the map… this takes about a second per address and only happens once per address. You can leave this open or come back later.
        </p>
      )}
      {error && <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div ref={containerRef} style={{ height: 520, width: '100%' }} className="rounded-lg border border-gray-200 z-0" />

      {colorMode === 'recency' && (
        <div className="flex flex-wrap gap-2">
          {RECENCY.filter((r) => recencyCounts[r.key]).map((r) => (
            <div key={r.key} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs">
              <span className="w-3 h-3 rounded-full" style={{ background: r.color }} />
              <span className="font-semibold text-gray-800">{r.label}</span>
              <span className="text-gray-500">{recencyCounts[r.key]}</span>
            </div>
          ))}
        </div>
      )}
      {colorMode === 'area' && clusters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {clusters.map((c) => (
            <div key={c.index} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs">
              <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
              <span className="font-semibold text-gray-800">Area {c.index + 1}</span>
              <span className="text-gray-500">{c.members.length} customer{c.members.length === 1 ? '' : 's'}</span>
            </div>
          ))}
        </div>
      )}

      {(stats.noAddress > 0 || stats.notFound > 0) && (
        <p className="text-xs text-gray-500">
          {stats.noAddress > 0 && <>{stats.noAddress} customer{stats.noAddress === 1 ? ' has' : 's have'} no address on file (they appear once they book, or after you re-import a CSV that includes addresses). </>}
          {stats.notFound > 0 && <>{stats.notFound} address{stats.notFound === 1 ? ' could' : 'es could'} not be found on the map.</>}
        </p>
      )}
    </div>
  );
}
