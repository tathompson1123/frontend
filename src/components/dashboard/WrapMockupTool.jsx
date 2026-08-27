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
  // Several images: a logo plus real job photos. The logo drives brand colour, the
  // photos give the design something true to work with.
  const [images, setImages] = useState([]);
  const [autoColors, setAutoColors] = useState(true);
  // How far the design may depart from what the customer already has.
  const [designMode, setDesignMode] = useState('reinvent');
  // Separate axis from designMode: one is how far to depart from their artwork, the
  // other is how loud the result should be.
  const [designIntensity, setDesignIntensity] = useState('bold');
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

  const generate = async () => {
    setError(null);
    if (!form.businessName.trim()) return setError('Business name is required.');
    if (!form.year || !form.make.trim() || !form.model.trim()) {
      return setError('Vehicle year, make and model are required.');
    }

    setGenerating(true);
    setResult(null);
    try {
      // multipart, so the optional logo rides along with the fields.
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v ?? ''));
      // Same field name repeated — multer's .array() collects them.
      images.forEach(({ file }) => body.append('images', file));
      body.append('autoColors', autoColors ? 'true' : 'false');
      body.append('designMode', designMode);
      body.append('designIntensity', designIntensity);

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
        Name, phone, website, their logo, and the vehicle. The trade, palette and layout are
        designed from the artwork — three directions rendered onto a photo of that vehicle.
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
          <Field label="Business name" value={form.businessName} onChange={update('businessName')} placeholder="American Plumbing" />
          <Field label="Phone" value={form.phone} onChange={update('phone')} placeholder="(360) 438-0611" />
          <Field label="Website" value={form.website} onChange={update('website')} placeholder="americanplumbingwa.com" />
          <Field
            label="Trade — only if the name doesn't say it"
            value={form.service}
            onChange={update('service')}
            placeholder="usually read from the logo"
          />

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
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {result?.brandColors?.source === 'artwork' ? (
                <>
                  <p className="text-xs text-gray-500 mb-2">Sampled from the artwork:</p>
                  <div className="flex items-center gap-2">
                    <Swatch hex={result.brandColors.primary} label="Brand" />
                    <Swatch
                      hex={result.brandColors.accent}
                      label={result.brandColors.accentDerived ? 'Accent (derived)' : 'Accent'}
                    />
                  </div>
                  {result.brandColors.palette?.length > 2 && (
                    <div className="flex gap-1 mt-2">
                      {result.brandColors.palette.map(hex => (
                        <span key={hex} title={hex} className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: hex }} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  {images.length > 0
                    ? 'Colors will be sampled from your images when you generate.'
                    : 'Upload a logo below and its colors will be used automatically.'}
                </p>
              )}
            </div>
          ) : (
            <div className="flex gap-3 mb-4">
              <ColorField label="Brand color" value={form.primaryColor} onChange={update('primaryColor')} />
              <ColorField label="Accent color" value={form.accentColor} onChange={update('accentColor')} />
            </div>
          )}

          {/* Artwork — passed to the image model as references, so the customer's real
              logo is reproduced rather than an invented one. */}
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Logo &amp; photos (up to {MAX_IMAGES})
          </label>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
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
          <p className="text-[11px] text-gray-400 mb-4">
            First image is treated as the logo. Job photos help — they're used small, behind
            a contrast panel, never under text. These are references for the design; they
            aren't rendered as concepts themselves.
          </p>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickImages} className="hidden" />

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
          <p className="text-[11px] text-gray-400 mb-4">
            {designMode === 'evolve'
              ? 'Every colour will trace back to the artwork you upload — nothing new invented.'
              : 'Builds a new colour strategy and layout, using their logo as one element.'}
          </p>

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
          <p className="text-[11px] text-gray-400 mb-4">
            {designIntensity === 'simple'
              ? 'Drops mascots and ornament, but still commits hard on colour — a washed-out van is never the goal.'
              : 'Best for trades that need to be noticed. Most home services want this.'}
          </p>

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
              Rendering the vehicle photo, then 3 wrap concepts on it. Usually a minute or
              two, longer if Google throttles and it has to wait out a rate limit.
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
