import { useState, useEffect, useRef } from 'react';
import { Truck, Sparkles, RefreshCw, Mail, Copy, Check, Download, Upload, X, AlertTriangle, ChevronDown, Search } from 'lucide-react';

// Vehicle wrap concept generator.
//
// Replaces the prototype's generic SVG silhouettes: the backend generates a real
// three-view layout sheet — side, front and rear — of the customer's actual vehicle, has
// Claude decide the single message to lead with, then paints two directions onto that
// same sheet — one built around an original character, one without — so the concepts are
// comparable rather than two different vans, and the rear panel gets designed instead of
// guessed at.
//
// These are SALES mockups for winning the job, not print-ready artwork — worth saying
// out loud in the UI so nobody forwards one to a wrap shop as a spec.

const emptyForm = {
  businessName: '',
  service: '',
  phone: '',
  website: '',
  primaryColor: '#FF6B1A',
  accentColor: '#FFC53D',
  // Most runs are for the same style of vehicle, so default to a common one rather than
  // making every business start from a blank vehicle section — still fully editable.
  year: '2020',
  make: 'Ford',
  model: 'F150',
  trim: '',
  customerEmail: '',
  serviceArea: '',
  yearsInBusiness: '',
  socialHandle: '',
};

// Credentials the customer ticks rather than the model inventing. A wrap runs for five
// years, so "Licensed & Insured" on a van belonging to a business that never claimed it is
// not a design flourish — the backend and the prompt both refuse to print any of these
// unless they arrive from here.
const BADGE_OPTIONS = [
  'Licensed & Insured',
  '24/7 Emergency Service',
  'Free Estimates',
  'Family Owned & Operated',
  'Financing Available',
  'Veteran Owned',
];

const MAX_SERVICES = 7;

export default function WrapMockupTool({ apiUrl, authFetch, user }) {
  const [form, setForm] = useState(emptyForm);
  // Several images: a logo plus real job photos. The logo drives brand colour, the
  // photos give the design something true to work with.
  const [images, setImages] = useState([]);
  const [autoColors, setAutoColors] = useState(true);
  // How far the design may depart from what the customer already has.
  const [designMode, setDesignMode] = useState('reinvent');
  // Separate axis from designMode: one is how far to depart from their artwork, the
  // other is how loud the result should be.
  const [designIntensity, setDesignIntensity] = useState('bold');
  // What actually gets printed on the panels. The dense look is mostly a content problem:
  // with only a name and a phone number there is nothing to fill a van with, and the design
  // comes back padded with empty colour.
  const [services, setServices] = useState([]);
  const [serviceDraft, setServiceDraft] = useState('');
  const [badges, setBadges] = useState([]);
  // Credentials that don't match one of the standard checkboxes — a chip list rather than a
  // single field, because a site scan can hand back several at once ("No Overtime Charges",
  // "Same-Day Service") and a lone text box can only ever hold one of them cleanly.
  const [customBadges, setCustomBadges] = useState([]);
  const [customBadgeDraft, setCustomBadgeDraft] = useState('');
  const [contentOpen, setContentOpen] = useState(false);
  // Website scan — reads the wrap content off the business's own site so the salesperson
  // isn't typing seven services from memory.
  const [scanUrl, setScanUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanNote, setScanNote] = useState(null); // { source, missing } — shown once, dismissible
  // Queued runs. Newest first. A run no longer blocks the form: hitting Generate snapshots
  // the current business, fires it in the background, and clears the form immediately so
  // the next one can be typed while this one is still rendering.
  const [jobs, setJobs] = useState([]);
  const [queuedNote, setQueuedNote] = useState(null); // business name of the run just queued
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [emailJobId, setEmailJobId] = useState(null); // which job's email modal is open
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const vehicleLabel = [form.year, form.make, form.model, form.trim].filter(Boolean).join(' ');

  const addService = (raw) => {
    // A pasted "furnaces, boilers, mini splits" should become three chips, not one.
    const next = String(raw).split(',').map(s => s.trim()).filter(Boolean);
    if (next.length === 0) return;
    setServices(prev => {
      const merged = [...prev];
      for (const item of next) {
        if (merged.length >= MAX_SERVICES) break;
        if (!merged.some(s => s.toLowerCase() === item.toLowerCase())) merged.push(item);
      }
      return merged;
    });
    setServiceDraft('');
  };

  const toggleBadge = (badge) =>
    setBadges(prev => (prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]));

  const addCustomBadge = (raw) => {
    const next = String(raw).split(',').map(s => s.trim()).filter(Boolean);
    if (next.length === 0) return;
    setCustomBadges(prev => {
      const merged = [...prev];
      for (const item of next) {
        if (!merged.some(b => b.toLowerCase() === item.toLowerCase())
          && !badges.some(b => b.toLowerCase() === item.toLowerCase())) {
          merged.push(item);
        }
      }
      return merged;
    });
    setCustomBadgeDraft('');
  };

  const contentCount = services.length + badges.length + customBadges.length;

  /** A plain <a download> is silently ignored for a cross-origin URL — Cloudinary is a
      different origin from this app, so it was falling back to just opening the image in a
      new tab. Fetching the bytes and downloading a blob: URL instead works regardless of
      origin, as long as the response can be read at all (Cloudinary's delivery URLs are
      served with permissive CORS). If that fetch fails for some reason, opening the image
      in a new tab is the fallback — no worse than what this replaces. */
  const downloadImage = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  /** data:mime;base64,... -> File, so a scanned image can ride in the same multipart field
      a manually picked file would. */
  const dataUrlToFile = async (dataUrl, name) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name || 'image', { type: blob.type || 'image/png' });
  };

  const scanSite = async () => {
    const target = scanUrl.trim();
    if (!target) return setScanError('Enter a website address first.');
    setScanError(null);
    setScanning(true);
    try {
      const res = await authFetch(`${apiUrl}/api/tools/brand-scan`, {
        method: 'POST',
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read that site');

      // Fill in whatever came back without clobbering something already typed — a
      // salesperson who filled in the phone by hand before remembering the site exists
      // shouldn't have it overwritten by a scan that read the same number anyway.
      setForm(f => ({
        ...f,
        businessName: f.businessName || data.businessName || f.businessName,
        service: f.service || data.trade || f.service,
        phone: f.phone || data.phone || f.phone,
        website: f.website || data.website || target,
        serviceArea: f.serviceArea || data.serviceArea || f.serviceArea,
        yearsInBusiness: f.yearsInBusiness || data.yearsInBusiness || f.yearsInBusiness,
        socialHandle: f.socialHandle || data.socialHandle || f.socialHandle,
      }));

      if (data.services?.length) {
        setServices(prev => {
          const merged = [...prev];
          for (const s of data.services) {
            if (merged.length >= MAX_SERVICES) break;
            if (!merged.some(x => x.toLowerCase() === s.toLowerCase())) merged.push(s);
          }
          return merged;
        });
      }
      if (data.credentials?.length) {
        const standard = new Set(BADGE_OPTIONS.map(b => b.toLowerCase()));
        const matched = data.credentials.filter(c => standard.has(c.toLowerCase()));
        const extra = data.credentials.filter(c => !standard.has(c.toLowerCase()));
        if (matched.length) {
          setBadges(prev => Array.from(new Set([...prev,
            ...matched.map(m => BADGE_OPTIONS.find(b => b.toLowerCase() === m.toLowerCase()))])));
        }
        if (extra.length) addCustomBadge(extra.join(','));
      }

      // The logo becomes the first upload (treated as the logo by the backend), job photos
      // follow. Any download the frontend itself failed on (blob() throwing) is skipped
      // rather than sinking the whole scan.
      const newImages = [];
      if (data.logo) {
        try { newImages.push(await dataUrlToFile(data.logo.dataUrl, data.logo.name)); }
        catch { /* one bad image shouldn't lose the rest of the scan */ }
      }
      for (const photo of data.photos || []) {
        try { newImages.push(await dataUrlToFile(photo.dataUrl, photo.name)); }
        catch { /* same */ }
      }
      if (newImages.length) {
        setImages(prev => {
          const room = MAX_IMAGES - prev.length;
          if (room <= 0) return prev;
          return [...prev, ...newImages.slice(0, room).map(file => ({ file, preview: URL.createObjectURL(file) }))];
        });
      }

      if (data.services?.length || data.credentials?.length) setContentOpen(true);
      setScanNote({ source: data.sourceUrl || target, missing: data.missing || [] });
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/tools/wrap-mockups`);
      if (!res.ok) return;
      const data = await res.json();
      setHistory(Array.isArray(data.mockups) ? data.mockups : []);
    } catch (err) { console.error(err); }
  };

  const MAX_IMAGES = 5;

  const pickImages = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`Up to ${MAX_IMAGES} images.`);
      return;
    }
    const tooBig = picked.find(f => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" is over 5 MB.`);
      return;
    }
    setImages(prev => [
      ...prev,
      ...picked.slice(0, room).map(file => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    // Reset the input so re-picking the same file still fires onChange.
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (idx) => {
    setImages(prev => {
      const next = [...prev];
      const [gone] = next.splice(idx, 1);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return next;
    });
  };

  // The success banner is a confirmation, not a status board — it names the business that
  // was just queued and then gets out of the way on its own.
  useEffect(() => {
    if (!queuedNote) return;
    const t = setTimeout(() => setQueuedNote(null), 5000);
    return () => clearTimeout(t);
  }, [queuedNote]);

  /** Once a run finishes it's already saved server-side and reachable from Previous runs
      below, so keeping it in the working list too just means finished designs pile up next
      to the one actually being reviewed. A still-generating or failed job is left alone
      (it needs attention or hasn't reached the database yet) — only completed jobs other
      than the one that just finished get dropped. */
  const keepOnlyLatestDone = (list, justCompletedId) =>
    list.filter(j => j.status !== 'done' || j.id === justCompletedId);

  /** Fires the actual request for one job and updates it in place when it settles. Split
      out from queueGenerate so a failed run's exact original snapshot (images, services,
      badges included) can be resubmitted from a Retry button without the salesperson
      re-entering anything. */
  const runJob = async (jobId, snapshot) => {
    try {
      const body = new FormData();
      Object.entries(snapshot.form).forEach(([k, v]) => body.append(k, v ?? ''));
      // Same field name repeated — multer's .array() collects them.
      snapshot.images.forEach(file => body.append('images', file));
      body.append('autoColors', snapshot.autoColors ? 'true' : 'false');
      body.append('designMode', snapshot.designMode);
      body.append('designIntensity', snapshot.designIntensity);
      body.append('services', JSON.stringify(snapshot.services));
      body.append('badges', JSON.stringify(snapshot.badges));

      // No Content-Type header — the browser must set the multipart boundary itself.
      const res = await authFetch(`${apiUrl}/api/tools/wrap-mockup`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate mockups');
      setJobs(prev => keepOnlyLatestDone(
        prev.map(j => (j.id === jobId ? { ...j, status: 'done', data, error: null } : j)),
        jobId
      ));
      fetchHistory();
    } catch (err) {
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'error', error: err.message } : j)));
    }
  };

  const queueGenerate = () => {
    setError(null);
    if (!form.businessName.trim()) return setError('Business name is required.');
    if (!form.year || !form.make.trim() || !form.model.trim()) {
      return setError('Vehicle year, make and model are required.');
    }

    // Snapshot everything the request needs before the form gets cleared out from under it.
    const snapshot = {
      form: { ...form },
      images: images.map(img => img.file),
      autoColors, designMode, designIntensity,
      services: [...services],
      badges: [...badges, ...customBadges],
    };
    const vehicle = [snapshot.form.year, snapshot.form.make, snapshot.form.model, snapshot.form.trim]
      .filter(Boolean).join(' ');
    const jobId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setJobs(prev => [{
      id: jobId, status: 'generating',
      businessName: snapshot.form.businessName, vehicle,
      phone: snapshot.form.phone, customerEmail: snapshot.form.customerEmail,
      data: null, error: null, snapshot,
    }, ...prev]);

    // The preview thumbnails' object URLs are no longer needed — the request already read
    // the underlying File objects into the snapshot above.
    images.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); });

    // Clear the form for the next business. Standing preferences (mode, intensity,
    // auto-colours) carry over — they're the salesperson's settings, not a fact about this
    // one business.
    setForm(emptyForm);
    setImages([]);
    setServices([]);
    setServiceDraft('');
    setBadges([]);
    setCustomBadges([]);
    setCustomBadgeDraft('');
    setContentOpen(false);
    setScanUrl('');
    setScanNote(null);
    setScanError(null);

    setQueuedNote(snapshot.form.businessName);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    runJob(jobId, snapshot);
  };

  const retryJob = (job) => {
    if (!job.snapshot) return;
    setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: 'generating', error: null } : j)));
    runJob(job.id, job.snapshot);
  };

  const emailJob = jobs.find(j => j.id === emailJobId) || null;
  const emailBody = emailJob?.data ? `Hi there,

Here are a few wrap concepts we put together for your ${emailJob.data.vehicle}.

${emailJob.data.creativeSummary || ''}

${emailJob.data.variants.map((v, i) => `${i + 1}. ${v.label} — ${v.rationale || ''}`).join('\n')}

Each one is built to read at a glance from other drivers, with the phone number where it actually gets seen in traffic. Let us know which direction feels right, or if you'd like elements blended from a couple of them.

Best,
${user?.businessName || ''}
${emailJob.phone || ''}` : '';

  const copyEmail = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <span className="text-xs font-mono tracking-widest text-gray-400">SORCE TOOLS</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Wrap Mockup Generator</h1>
      <p className="text-gray-500 mb-8 max-w-2xl">
        Name, phone, website, their logo, and the vehicle. The trade, palette and layout are
        designed from the artwork — two directions, one with a character and one without,
        each rendered as the side, front and rear of that vehicle.
        <span className="block text-xs text-gray-400 mt-1">
          These are concepts for winning the job — not print-ready artwork for an installer.
        </span>
      </p>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {queuedNote && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>
            Generating mockups for <strong>{queuedNote}</strong> — it'll land at the top of
            the list on the right when it's ready. Keep going with the next business.
          </span>
          <button onClick={() => setQueuedNote(null)} className="ml-auto text-emerald-400 hover:text-emerald-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results — a queue, not a single slot, and on top rather than beside the form so a
          finished (or generating) render is the first thing on the page, not something to
          scroll or look sideways for. Newest first, so the run just started lands at the
          top where the scroll-to-top on submit already puts the viewport. */}
      <div className="mb-8">
        {jobs.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400">
            Fill in the customer's details and generate to see both directions here.
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onEmail={() => setEmailJobId(job.id)}
                onRetry={() => retryJob(job)}
                onDownload={downloadImage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inputs — full page width now rather than a narrow sidebar, so related fields sit
          side by side instead of stacking one to a row all the way down. */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-10">
        {/* Read the wrap content off their own website rather than typing it from memory —
            logo, services, credentials they actually claim, service area, socials. Fills
            the fields below; nothing here generates anything, so it's still all editable
            before a run gets spent on it. */}
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          Have their website? Scan it first
        </label>
        <div className="flex gap-2 mb-1">
          <input
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); scanSite(); } }}
            placeholder="theirbusiness.com"
            disabled={scanning}
            className="flex-1 max-w-md px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-gray-50"
          />
          <button
            onClick={scanSite}
            disabled={scanning || !scanUrl.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition disabled:opacity-50 whitespace-nowrap"
          >
            {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {scanning ? 'Scanning…' : 'Scan'}
          </button>
          {/* Same action as the button at the bottom of the form — here too so scan then
              generate doesn't mean scrolling down every time. */}
          <button
            onClick={queueGenerate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          Pulls their logo, services and any credentials they actually state — never invents
          one. Fills the fields below without overwriting anything you've already typed.
        </p>

        {scanError && (
          <div className="flex items-start gap-2 p-2.5 mb-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>{scanError}</span>
          </div>
        )}
        {scanNote && (
          <div className="p-2.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            <div className="flex items-start justify-between gap-2">
              <span>Read from {scanNote.source}</span>
              <button onClick={() => setScanNote(null)} className="text-emerald-400 hover:text-emerald-600 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {scanNote.missing?.length > 0 && (
              <ul className="mt-1.5 pl-4 list-disc space-y-0.5 text-emerald-700">
                {scanNote.missing.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Business name" value={form.businessName} onChange={update('businessName')} placeholder="American Plumbing" />
          <Field label="Phone" value={form.phone} onChange={update('phone')} placeholder="(360) 438-0611" />
          <Field label="Website" value={form.website} onChange={update('website')} placeholder="americanplumbingwa.com" />
          <Field
            label="Trade — only if the name doesn't say it"
            value={form.service}
            onChange={update('service')}
            placeholder="usually read from the logo"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <div>
            {/* Artwork — passed to the image model as references, so the customer's real
                logo is reproduced rather than an invented one. */}
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Logo &amp; photos (up to {MAX_IMAGES})
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={img.preview} className="relative group">
                    <img src={img.preview} alt={img.file.name} className="w-full h-16 object-contain bg-gray-50 rounded border border-gray-200" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300"
                      title={`Remove ${img.file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 px-1 text-[10px] bg-amber-600 text-white rounded-tr">logo</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {images.length < MAX_IMAGES && (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-1 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-700 transition"
              >
                <Upload className="w-4 h-4" /> {images.length === 0 ? 'Upload logo / photos' : 'Add another'}
              </button>
            )}
            <p className="text-[11px] text-gray-400">
              First image is treated as the logo, and it's reproduced as-is — never redrawn or
              recoloured. Job photos help: they're used full-bleed and tinted, never as small
              insets. These are references for the design; they aren't rendered as concepts
              themselves.
            </p>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickImages} className="hidden" />
          </div>

          <div>
            {/* Brand colours. When artwork is uploaded these are sampled from it, so the
                pickers act as an override rather than the source of truth. */}
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoColors}
                onChange={(e) => setAutoColors(e.target.checked)}
                className="w-4 h-4 accent-amber-600"
              />
              <span className="text-xs font-semibold text-gray-600">
                Pull brand colors from the uploaded images
              </span>
            </label>

            {autoColors ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                {/* The sampled palette used to be shown here once a run finished, but the
                    form is cleared the moment a run is queued — by the time colours would be
                    known, this business's fields are already gone. The palette itself still
                    shows up per job, under its render, once it's ready. */}
                <p className="text-xs text-gray-500">
                  {images.length > 0
                    ? 'Colors will be sampled from your images when you generate.'
                    : 'Upload a logo and its colors will be used automatically.'}
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <ColorField label="Brand color" value={form.primaryColor} onChange={update('primaryColor')} />
                <ColorField label="Accent color" value={form.accentColor} onChange={update('accentColor')} />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              How far should we go?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <ModeButton
                active={designMode === 'evolve'}
                onClick={() => setDesignMode('evolve')}
                title="Keep close to reference"
                blurb="Their palette, their logo, their character — cleaned up and laid out properly."
              />
              <ModeButton
                active={designMode === 'reinvent'}
                onClick={() => setDesignMode('reinvent')}
                title="Completely redesign"
                blurb="Start over. New colour strategy, bold layout, their logo as one element."
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {designMode === 'evolve'
                ? 'Every colour will trace back to the artwork you upload — nothing new invented.'
                : 'Builds a new colour strategy and layout, using their logo as one element.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              How loud?
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <ModeButton
                active={designIntensity === 'bold'}
                onClick={() => setDesignIntensity('bold')}
                title="Go bold"
                blurb="Saturated colour, an oversized signature, real visual energy."
              />
              <ModeButton
                active={designIntensity === 'simple'}
                onClick={() => setDesignIntensity('simple')}
                title="Keep it simple"
                blurb="Two colours, one quiet mark, lots of space. Restrained, not timid."
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {designIntensity === 'simple'
                ? 'Drops mascots, service lists and ornament for a narrow palette and lots of space. Restrained, not timid.'
                : 'The full trade-truck treatment: every panel wrapped, an illustrated mascot, services and contact at full size.'}
            </p>
          </div>
        </div>

        {/* Wrap content. Collapsed by default so a quick run still only needs a name and a
            vehicle, but this is the section that decides whether the panels come back full
            or padded with empty colour. */}
        <button
          type="button"
          onClick={() => setContentOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 mt-4 mb-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
        >
          <span className="text-xs font-semibold text-gray-600">
            What goes on the wrap
            {contentCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                {contentCount}
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${contentOpen ? 'rotate-180' : ''}`} />
        </button>

        {contentOpen && (
          <div className="mb-4 px-3 py-3 rounded-lg border border-gray-200">
            <p className="text-[11px] text-gray-400 mb-3">
              All optional — but a wrap with nothing to say comes back sparse. Nothing here
              is invented for you: a credential you don't tick never gets printed.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Services ({services.length}/{MAX_SERVICES})
                </label>
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {services.map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => setServices(prev => prev.filter((_, j) => j !== i))}
                          className="p-0.5 rounded hover:bg-amber-200"
                          aria-label={`Remove ${s}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {services.length < MAX_SERVICES && (
                  <input
                    value={serviceDraft}
                    onChange={(e) => setServiceDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addService(serviceDraft);
                      }
                    }}
                    // Not losing a half-typed service to a stray click is worth more than
                    // the tidiness of only committing on Enter.
                    onBlur={() => addService(serviceDraft)}
                    placeholder="Furnaces, boilers, mini splits…  (Enter to add)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Credentials they actually have
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-2">
                  {BADGE_OPTIONS.map(badge => (
                    <label key={badge} className="flex items-center gap-2 cursor-pointer text-[12px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={badges.includes(badge)}
                        onChange={() => toggleBadge(badge)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-400"
                      />
                      {badge}
                    </label>
                  ))}
                </div>
                {customBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {customBadges.map((b, i) => (
                      <span
                        key={`${b}-${i}`}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800"
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => setCustomBadges(prev => prev.filter((_, j) => j !== i))}
                          className="p-0.5 rounded hover:bg-amber-200"
                          aria-label={`Remove ${b}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  value={customBadgeDraft}
                  onChange={(e) => setCustomBadgeDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addCustomBadge(customBadgeDraft);
                    }
                  }}
                  onBlur={() => addCustomBadge(customBadgeDraft)}
                  placeholder="Anything else — 4.9★ on Google, BBB A+…  (Enter to add)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <Field label="Service area" value={form.serviceArea} onChange={update('serviceArea')} placeholder="Whatcom County" />
              <Field label="Established" value={form.yearsInBusiness} onChange={update('yearsInBusiness')} placeholder="Since 2009" />
              <Field label="Social handle" value={form.socialHandle} onChange={update('socialHandle')} placeholder="@bayviewhvac" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <Field label="Year" value={form.year} onChange={update('year')} placeholder="2023" />
          <Field label="Make" value={form.make} onChange={update('make')} placeholder="Ford" />
          <Field label="Model" value={form.model} onChange={update('model')} placeholder="Transit" />
          <Field label="Trim" value={form.trim} onChange={update('trim')} placeholder="XLT" />
          <Field label="Customer email (optional)" value={form.customerEmail} onChange={update('customerEmail')} placeholder="customer@email.com" />
        </div>

        <button
          onClick={queueGenerate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
        >
          <Sparkles className="w-4 h-4" /> Generate mockups
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Runs in the background — usually a minute or two, longer if Google throttles.
          Queue up the next business as soon as this one starts.
        </p>
      </div>

      {/* Previous runs — last on the page, below the working list and the form. */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Previous runs</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {history.map(h => {
              const loadable = h.status === 'done' || !h.status;
              return (
                <button
                  key={h.id}
                  disabled={!loadable}
                  onClick={() => {
                    if (!loadable) return;
                    const historyJobId = `history-${h.id}`;
                    setJobs(prev => (prev.some(j => j.id === historyJobId)
                      ? prev
                      : keepOnlyLatestDone([{
                        id: historyJobId, status: 'done',
                        businessName: h.business_name, vehicle: h.vehicle,
                        phone: '', customerEmail: h.customer_email || '',
                        data: {
                          vehicle: h.vehicle,
                          creativeSummary: h.creative_summary,
                          dominantMessage: h.dominant_message,
                          variants: Array.isArray(h.variants) ? h.variants : [],
                        },
                        error: null,
                        // No snapshot — a past run's original artwork isn't available to
                        // resend, so this entry has no Retry.
                        snapshot: null,
                      }, ...prev], historyJobId)));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left p-3 bg-white border rounded-lg transition ${
                    loadable ? 'border-gray-200 hover:border-amber-300' : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">{h.business_name}</p>
                  <p className="text-xs text-gray-500 truncate">{h.vehicle}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(h.created_at).toLocaleDateString()}
                    {h.status === 'generating' && <span className="ml-1 text-amber-500">· interrupted</span>}
                    {h.status === 'failed' && <span className="ml-1 text-red-500">· failed</span>}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {emailJob && (
        <div
          onClick={() => setEmailJobId(null)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="font-bold text-gray-900 mb-3">Email draft — {emailJob.businessName}</h3>
            <textarea
              readOnly
              value={emailBody}
              className="w-full h-64 p-3 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">
              Attach the PNGs you downloaded — the images aren't embedded in this draft.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={copyEmail}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy text'}
              </button>
              <a
                href={`mailto:${emailJob.customerEmail || ''}?subject=${encodeURIComponent(`Wrap concepts for ${emailJob.businessName}`)}&body=${encodeURIComponent(emailBody)}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
              >
                <Mail className="w-4 h-4" /> Open in email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One queued run — generating, failed, or the finished pair of concepts. */
function JobCard({ job, onEmail, onRetry, onDownload }) {
  if (job.status === 'generating') {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900">{job.businessName}</h3>
            <p className="text-xs text-gray-500">{job.vehicle}</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Rendering the vehicle sheet, then 2 wrap concepts on it — usually a minute or two,
          longer if Google throttles and it has to wait out a rate limit.
        </p>
      </div>
    );
  }

  if (job.status === 'error') {
    return (
      <div className="bg-white rounded-xl border-2 border-red-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">{job.businessName}</h3>
            <p className="text-xs text-gray-500 mb-2">{job.vehicle}</p>
            <p className="text-sm text-red-700">{job.error}</p>
          </div>
          {job.snapshot && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition whitespace-nowrap flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const result = job.data;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
        <div className="text-xs font-mono text-gray-400 mb-2">
          CONCEPTS FOR — {job.businessName} — {result.vehicle?.toUpperCase()}
        </div>
        {result.inferredTrade && (
          <p className="text-xs text-gray-500 mb-2">
            Read as: <span className="font-semibold text-gray-900">{result.inferredTrade}</span>
          </p>
        )}
        {result.dominantMessage && (
          <p className="text-sm text-gray-900 font-semibold mb-1">{result.dominantMessage}</p>
        )}
        {result.brandRead && (
          <p className="text-xs text-gray-500 italic mb-2">{result.brandRead}</p>
        )}
        {result.ctaType && (
          <p className="text-xs text-gray-400 mb-2">
            Leads with the <span className="font-semibold text-gray-600">{result.ctaType}</span>
            {result.ctaType === 'phone' ? ' — urgent trade' : ' — considered purchase'}
          </p>
        )}
        {/* The logo is the seed of the brand: a generic mark caps how good any wrap
            can be, and that's worth telling the customer before they spend on vinyl. */}
        {result.brandWarning && (
          <div className="flex items-start gap-2 p-3 mt-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-semibold text-amber-900 mb-0.5">Worth raising with them</p>
              <p className="text-xs text-amber-800">{result.brandWarning}</p>
            </div>
          </div>
        )}
        {result.creativeSummary && (
          <p className="text-sm text-gray-600">{result.creativeSummary}</p>
        )}
        <button
          onClick={onEmail}
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
        >
          <Mail className="w-4 h-4" /> Draft customer email
        </button>
      </div>

      {/* One of the two failed to render — said plainly rather than quietly hiding it. */}
      {result.partial && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {result.partial.length} of {result.variants.length + result.partial.length} directions
            failed to render ({result.partial.map(f => f.label).join(', ')}). The rest are below
            {job.snapshot ? ' — Retry to try the missing one again.' : '.'}
          </span>
        </div>
      )}

      {result.variants.map((variant, i) => (
        <div key={variant.id} className="bg-white rounded-xl border-2 border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-xs font-mono text-amber-600">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-bold text-gray-900">{variant.label}</h3>
              {variant.rationale && <p className="text-sm text-gray-500">{variant.rationale}</p>}
              {variant.signature && (
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">Signature:</span> {variant.signature}
                </p>
              )}
              {variant.color_strategy && (
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-600">
                  {variant.color_strategy}
                </span>
              )}
            </div>
            <button
              onClick={() => onDownload(
                variant.imageUrl,
                `${job.businessName.replace(/\s+/g, '-').toLowerCase()}-${variant.id}.png`
              )}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> PNG
            </button>
          </div>
          <img src={variant.imageUrl} alt={variant.label} className="w-full rounded-lg bg-gray-100" />

          {/* What the design was told to print. Worth showing next to the render
              because the image model can drop or garble a string, and this is the
              list to check it against before anything is sent to a customer. */}
          {(variant.palette?.length > 0 || variant.wordmark || variant.mascot) && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {variant.palette?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {variant.palette.map((c, j) => (
                    <span key={`${c.hex}-${j}`} className="inline-flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded border border-gray-200"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[10px] font-mono text-gray-500">
                        {c.role} {c.hex}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <dl className="text-[11px] text-gray-500 space-y-0.5">
                {variant.tagline && <ManifestRow label="Tagline" value={variant.tagline} />}
                {variant.servicesShown?.length > 0 && (
                  <ManifestRow label="Services" value={variant.servicesShown.join(' · ')} />
                )}
                {variant.credentialsShown?.length > 0 && (
                  <ManifestRow label="Badges" value={variant.credentialsShown.join(' · ')} />
                )}
                {variant.phoneDisplay && <ManifestRow label="Phone" value={variant.phoneDisplay} />}
                {variant.websiteDisplay && <ManifestRow label="Web" value={variant.websiteDisplay} />}
                {variant.mascot && <ManifestRow label="Mascot" value={variant.mascot} />}
              </dl>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** One line of the printed-copy manifest under a render. */
function ManifestRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <dt className="flex-shrink-0 w-14 font-semibold text-gray-400">{label}</dt>
      <dd className="text-gray-600">{value}</dd>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-400"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5">
        <input type="color" value={value} onChange={onChange} className="w-7 h-7 border-0 bg-transparent p-0 cursor-pointer" />
        <span className="font-mono text-xs text-gray-500">{value}</span>
      </div>
    </div>
  );
}

function Swatch({ hex, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 h-6 rounded border border-gray-300" style={{ background: hex }} />
      <div className="leading-tight">
        <span className="block font-mono text-[10px] text-gray-600">{hex}</span>
        <span className="block text-[10px] text-gray-400">{label}</span>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, title, blurb }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 transition ${
        active ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className={`block text-xs font-bold mb-0.5 ${active ? 'text-amber-800' : 'text-gray-800'}`}>
        {title}
      </span>
      <span className="block text-[11px] leading-snug text-gray-500">{blurb}</span>
    </button>
  );
}
