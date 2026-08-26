import { useState, useEffect, useRef } from 'react';
import { Truck, Sparkles, RefreshCw, Mail, Copy, Check, Download, Upload, X, AlertTriangle } from 'lucide-react';

// Vehicle wrap concept generator.
//
// Replaces the prototype's generic SVG silhouettes: the backend generates a real
// side-profile photo of the customer's actual vehicle, has Claude decide the single
// message to lead with, then paints three directions onto that same photo. One base
// photo for all three, so the concepts are comparable rather than three different vans.
//
// These are SALES mockups for winning the job, not print-ready artwork — worth saying
// out loud in the UI so nobody forwards one to a wrap shop as a spec.

const emptyForm = {
  businessName: '',
  service: '',
  tagline: '',
  phone: '',
  website: '',
  primaryColor: '#FF6B1A',
  accentColor: '#FFC53D',
  year: '',
  make: '',
  model: '',
  trim: '',
  customerEmail: '',
};

export default function WrapMockupTool({ apiUrl, authFetch, user }) {
  const [form, setForm] = useState(emptyForm);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const vehicleLabel = [form.year, form.make, form.model, form.trim].filter(Boolean).join(' ');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await authFetch(`${apiUrl}/api/tools/wrap-mockups`);
      if (!res.ok) return;
      const data = await res.json();
      setHistory(Array.isArray(data.mockups) ? data.mockups : []);
    } catch (err) { console.error(err); }
  };

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5 MB.');
      return;
    }
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogo(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const generate = async () => {
    setError(null);
    if (!form.businessName.trim()) return setError('Business name is required.');
    if (!form.service.trim()) return setError('Enter the main service to lead with.');
    if (!form.year || !form.make.trim() || !form.model.trim()) {
      return setError('Vehicle year, make and model are required.');
    }

    setGenerating(true);
    setResult(null);
    try {
      // multipart, so the optional logo rides along with the fields.
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v ?? ''));
      if (logo) body.append('logo', logo);

      // No Content-Type header — the browser must set the multipart boundary itself.
      const res = await authFetch(`${apiUrl}/api/tools/wrap-mockup`, { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate mockups');
      setResult(data);
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const emailBody = result ? `Hi there,

Here are a few wrap concepts we put together for your ${result.vehicle}.

${result.creativeSummary || ''}

${result.variants.map((v, i) => `${i + 1}. ${v.label} — ${v.rationale || ''}`).join('\n')}

Each one is built to read at a glance from other drivers, with the phone number where it actually gets seen in traffic. Let us know which direction feels right, or if you'd like elements blended from a couple of them.

Best,
${user?.businessName || ''}
${form.phone}` : '';

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
        Enter the customer's business and their exact vehicle. Three wrap directions get
        rendered onto a photo of that vehicle, ready to send.
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

      <div className="grid lg:grid-cols-[360px_1fr] gap-8 items-start">
        {/* Inputs */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 lg:sticky lg:top-6">
          <Field label="Business name" value={form.businessName} onChange={update('businessName')} placeholder="Summit Roofing Co." />
          <Field label="Main service to lead with" value={form.service} onChange={update('service')} placeholder="Roofing & storm repair" />
          <Field label="Tagline / credential (optional)" value={form.tagline} onChange={update('tagline')} placeholder="Licensed & insured since 2012" />
          <Field label="Phone" value={form.phone} onChange={update('phone')} placeholder="(360) 555-0142" />
          <Field label="Website" value={form.website} onChange={update('website')} placeholder="summitroofing.com" />

          <div className="flex gap-3 mb-4">
            <ColorField label="Brand color" value={form.primaryColor} onChange={update('primaryColor')} />
            <ColorField label="Accent color" value={form.accentColor} onChange={update('accentColor')} />
          </div>

          {/* Logo — passed to the image model as a reference so the real mark is used
              rather than an invented one. */}
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Logo (optional)</label>
          {logoPreview ? (
            <div className="flex items-center gap-3 mb-4 p-2 border border-gray-200 rounded-lg">
              <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-contain rounded" />
              <span className="text-xs text-gray-500 truncate flex-1">{logo?.name}</span>
              <button onClick={clearLogo} className="text-gray-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-700 transition"
            >
              <Upload className="w-4 h-4" /> Upload logo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={pickLogo} className="hidden" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year" value={form.year} onChange={update('year')} placeholder="2023" />
            <Field label="Make" value={form.make} onChange={update('make')} placeholder="Ford" />
            <Field label="Model" value={form.model} onChange={update('model')} placeholder="Transit" />
            <Field label="Trim" value={form.trim} onChange={update('trim')} placeholder="XLT" />
          </div>

          <Field label="Customer email (optional)" value={form.customerEmail} onChange={update('customerEmail')} placeholder="customer@email.com" />

          <button
            onClick={generate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition disabled:opacity-60"
          >
            {generating
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Rendering concepts…</>
              : <><Sparkles className="w-4 h-4" /> Generate mockups</>}
          </button>
          {generating && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Four images to render — this usually takes a minute or two.
            </p>
          )}
        </div>

        {/* Results */}
        <div>
          {!result ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400">
              Fill in the customer's details and generate to see three directions here.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                <div className="text-xs font-mono text-gray-400 mb-2">
                  CONCEPTS FOR — {result.vehicle?.toUpperCase()}
                </div>
                {result.dominantMessage && (
                  <p className="text-sm text-gray-900 font-semibold mb-1">{result.dominantMessage}</p>
                )}
                {result.creativeSummary && (
                  <p className="text-sm text-gray-600">{result.creativeSummary}</p>
                )}
                <button
                  onClick={() => setEmailOpen(true)}
                  className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
                >
                  <Mail className="w-4 h-4" /> Draft customer email
                </button>
              </div>

              {/* Fewer than three came back — said plainly rather than quietly showing two. */}
              {result.partial && (
                <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {result.partial.length} of 3 directions failed to render
                    ({result.partial.map(f => f.label).join(', ')}). The rest are below — generate again to retry.
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
                    </div>
                    <a
                      href={variant.imageUrl}
                      download={`${form.businessName.replace(/\s+/g, '-').toLowerCase()}-${variant.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" /> PNG
                    </a>
                  </div>
                  <img src={variant.imageUrl} alt={variant.label} className="w-full rounded-lg bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Previous runs</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {history.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setResult({
                      vehicle: h.vehicle,
                      creativeSummary: h.creative_summary,
                      dominantMessage: h.dominant_message,
                      variants: Array.isArray(h.variants) ? h.variants : [],
                    })}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-amber-300 transition"
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">{h.business_name}</p>
                    <p className="text-xs text-gray-500 truncate">{h.vehicle}</p>
                    <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {emailOpen && (
        <div
          onClick={() => setEmailOpen(false)}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-6 w-full max-w-xl">
            <h3 className="font-bold text-gray-900 mb-3">Email draft</h3>
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
                href={`mailto:${form.customerEmail}?subject=${encodeURIComponent(`Wrap concepts for ${form.businessName}`)}&body=${encodeURIComponent(emailBody)}`}
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
