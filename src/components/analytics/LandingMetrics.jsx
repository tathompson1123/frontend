import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Eye, Users, MousePointerClick, Target, RefreshCw, Smartphone, Monitor, Tablet } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PAGES = [{ key: 'learnmore', label: '/learnmore' }, { key: 'book-a-call', label: '/book-a-call' }];
const RANGES = [{ days: 7, label: '7 days' }, { days: 30, label: '30 days' }, { days: 90, label: '90 days' }];
const DEVICE_ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

const pct = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(num / den < 0.1 ? 1 : 0)}%` : '—');

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wide">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Empty({ children = 'Nothing yet for this period.' }) {
  return <p className="text-sm text-gray-400 py-6 text-center">{children}</p>;
}

export default function LandingMetrics({ token }) {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState('learnmore');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/landing/summary?page=${page}&days=${days}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load metrics');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days, page, headers]);

  useEffect(() => { load(); }, [load]);

  const funnelTop = data?.funnel?.[0]?.people || 0;
  const maxDaily = Math.max(1, ...(data?.daily || []).map(d => d.visitors));
  const scrollMap = Object.fromEntries((data?.scroll || []).map(r => [r.target, r.people]));
  const videoMap = Object.fromEntries((data?.video || []).map(r => [r.target, r.people]));
  const quizDone = data?.funnel?.find(f => f.key === 'quiz_done')?.people || 0;
  const booked = data?.funnel?.find(f => f.key === 'booked')?.people || 0;
  const clicked = data?.funnel?.find(f => f.key === 'clicked')?.people || 0;
  const maxClicks = Math.max(1, ...(data?.clicks || []).map(c => c.clicks));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{page} page</h2>
          <p className="text-xs text-gray-500">Anonymous visitors only. Your own team's visits are not counted.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
            {PAGES.map(p => (
              <button
                key={p.key}
                onClick={() => { setData(null); setPage(p.key); }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${page === p.key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${days === r.days ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

      {loading && !data ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi icon={Users} label="Visitors" value={data.totals.visitors.toLocaleString()} sub={`${data.totals.pageviews.toLocaleString()} page views`} />
            <Kpi icon={MousePointerClick} label="Clicked something" value={pct(clicked, funnelTop)} sub={`${clicked.toLocaleString()} people`} />
            <Kpi icon={Target} label="Quiz completed" value={quizDone.toLocaleString()} sub={`${pct(quizDone, funnelTop)} of visitors`} />
            <Kpi icon={Eye} label="Calls booked" value={booked.toLocaleString()} sub={`${pct(booked, funnelTop)} of visitors`} />
          </div>

          <Card title="Funnel" subtitle="How many visitors reached each step (each person counted once).">
            {funnelTop === 0 ? <Empty>No visits recorded yet. They'll appear here as people land on the page.</Empty> : (
              <div className="space-y-2.5">
                {data.funnel.map((step, i) => {
                  const prev = i === 0 ? null : data.funnel[i - 1].people;
                  return (
                    <div key={step.key}>
                      <div className="flex items-baseline justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800">{step.label}</span>
                        <span className="text-gray-500">
                          <b className="text-gray-900">{step.people.toLocaleString()}</b>
                          <span className="text-xs ml-2">{pct(step.people, funnelTop)} of visitors{prev ? ` · ${pct(step.people, prev)} of previous step` : ''}</span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${funnelTop ? (step.people / funnelTop) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {page === 'book-a-call' && (
            <Card title="Where they leave the booking page" subtitle="Furthest point reached when they closed the page without booking. Anyone who booked later is excluded.">
              {(data.quizAbandon || []).length === 0 ? <Empty /> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500 text-left"><th className="pb-2 font-semibold">Left at</th><th className="pb-2 font-semibold text-right">People</th></tr></thead>
                  <tbody>
                    {[...data.quizAbandon].sort((a, b) => a.target.localeCompare(b.target)).map(r => (
                      <tr key={r.target} className="border-t border-gray-100">
                        <td className="py-2 text-gray-800">{r.target}</td>
                        <td className="py-2 text-right font-semibold text-gray-900">{r.people}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}

          {page === 'learnmore' && <Card title="Where they leave the quiz" subtitle="Last place people were when they closed the quiz or the page without booking. Anyone who booked later is excluded.">
            {(() => {
              const reached = Object.fromEntries((data.quizReached || []).map(r => [r.target, r.people]));
              const stages = [
                ['1 Business type', '1'], ['2 Struggle', '2'], ['3 Revenue', '3'], ['4 Contact details', '4'],
              ];
              const left = Object.fromEntries((data.quizAbandon || []).map(r => [r.target, r.people]));
              const calendarLeft = left['Calendar - no time picked'] || 0;
              if (!(data.quizReached || []).length && !(data.quizAbandon || []).length) return <Empty />;
              return (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 text-left">
                      <th className="pb-2 font-semibold">Quiz step</th>
                      <th className="pb-2 font-semibold text-right">Reached</th>
                      <th className="pb-2 font-semibold text-right">Left here</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map(([label, key]) => (
                      <tr key={key} className="border-t border-gray-100">
                        <td className="py-2 text-gray-800">{label}</td>
                        <td className="py-2 text-right text-gray-600">{reached[key] || 0}</td>
                        <td className="py-2 text-right font-semibold text-gray-900">
                          {left[label] || 0} <span className="text-xs text-gray-500 font-normal">{pct(left[label] || 0, reached[key] || 0)}</span>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-100">
                      <td className="py-2 text-gray-800">Calendar (quiz done, no time picked)</td>
                      <td className="py-2 text-right text-gray-600">{quizDone}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">
                        {calendarLeft} <span className="text-xs text-gray-500 font-normal">{pct(calendarLeft, quizDone)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </Card>}

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Where they click" subtitle="Every button and link, by its label.">
              {data.clicks.length === 0 ? <Empty /> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 text-left">
                      <th className="pb-2 font-semibold">Button / link</th>
                      <th className="pb-2 font-semibold text-right">Clicks</th>
                      <th className="pb-2 font-semibold text-right">People</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.clicks.map(c => (
                      <tr key={c.target} className="border-t border-gray-100">
                        <td className="py-2 pr-3">
                          <div className="text-gray-800 truncate max-w-[260px]" title={c.target}>{c.target}</div>
                          <div className="h-1 bg-gray-100 rounded mt-1"><div className="h-full bg-amber-400 rounded" style={{ width: `${(c.clicks / maxClicks) * 100}%` }} /></div>
                        </td>
                        <td className="py-2 text-right font-semibold text-gray-900">{c.clicks}</td>
                        <td className="py-2 text-right text-gray-600">{c.people}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <div className="space-y-6">
              <Card title="How far they scroll" subtitle="Share of visitors who got this far down the page.">
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[25, 50, 75, 100].map(m => (
                    <div key={m} className="bg-gray-50 rounded-xl py-3">
                      <p className="text-xl font-bold text-gray-900">{pct(scrollMap[String(m)] || 0, funnelTop)}</p>
                      <p className="text-[11px] text-gray-500">{m}%</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Video" subtitle="Share of visitors who played it, and how far they watched.">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-gray-50 rounded-xl py-3">
                    <p className="text-xl font-bold text-gray-900">{pct(data.funnel.find(f => f.key === 'played')?.people || 0, funnelTop)}</p>
                    <p className="text-[11px] text-gray-500">played</p>
                  </div>
                  {[25, 50, 75].map(m => (
                    <div key={m} className="bg-gray-50 rounded-xl py-3">
                      <p className="text-xl font-bold text-gray-900">{pct(videoMap[String(m)] || 0, funnelTop)}</p>
                      <p className="text-[11px] text-gray-500">reached {m}%</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Where visitors come from" subtitle="From the ad's UTM source, or the site that sent them.">
              {data.sources.length === 0 ? <Empty /> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500 text-left"><th className="pb-2 font-semibold">Source</th><th className="pb-2 font-semibold text-right">Visitors</th><th className="pb-2 font-semibold text-right">Quiz</th><th className="pb-2 font-semibold text-right">Booked</th></tr></thead>
                  <tbody>
                    {data.sources.map(r => (
                      <tr key={r.source} className="border-t border-gray-100">
                        <td className="py-2 text-gray-800">{r.source}</td>
                        <td className="py-2 text-right font-semibold text-gray-900">{r.visitors}</td>
                        <td className="py-2 text-right text-gray-600">{r.leads}</td>
                        <td className="py-2 text-right text-gray-600">{r.booked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Ad campaigns" subtitle="Needs UTM tags on the ad link, e.g. ?utm_source=facebook&utm_campaign=fall-offer.">
              {data.campaigns.length === 0 ? <Empty>No tagged campaigns yet. Add utm_campaign to your ad links.</Empty> : (
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-gray-500 text-left"><th className="pb-2 font-semibold">Campaign</th><th className="pb-2 font-semibold text-right">Visitors</th><th className="pb-2 font-semibold text-right">Quiz</th><th className="pb-2 font-semibold text-right">Booked</th></tr></thead>
                  <tbody>
                    {data.campaigns.map(r => (
                      <tr key={r.campaign} className="border-t border-gray-100">
                        <td className="py-2 text-gray-800 truncate max-w-[220px]" title={r.campaign}>{r.campaign}</td>
                        <td className="py-2 text-right font-semibold text-gray-900">{r.visitors}</td>
                        <td className="py-2 text-right text-gray-600">{r.leads}</td>
                        <td className="py-2 text-right text-gray-600">{r.booked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card title="Visitors per day" subtitle="Pacific time. Orange marks days with a completed quiz.">
                {data.daily.length === 0 ? <Empty /> : (
                  <div className="flex items-end gap-1 h-36">
                    {data.daily.map(d => (
                      <div key={d.day} className="flex-1 min-w-0 flex flex-col justify-end h-full group relative">
                        <div
                          className={`w-full rounded-t ${d.leads > 0 ? 'bg-orange-500' : 'bg-amber-300'}`}
                          style={{ height: `${Math.max(3, (d.visitors / maxDaily) * 100)}%` }}
                        />
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[11px] rounded px-2 py-1 whitespace-nowrap z-10">
                          {d.day}: {d.visitors} visitors{d.leads ? `, ${d.leads} quiz` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
            <Card title="Devices">
              {data.devices.length === 0 ? <Empty /> : (
                <div className="space-y-3">
                  {data.devices.map(d => {
                    const Icon = DEVICE_ICONS[d.device] || Monitor;
                    return (
                      <div key={d.device} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700 capitalize"><Icon className="w-4 h-4 text-gray-400" />{d.device}</span>
                        <span className="text-gray-900 font-semibold">{d.visitors} <span className="text-xs text-gray-500 font-normal">{pct(d.visitors, data.totals.visitors)}</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
