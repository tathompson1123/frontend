// ============================================
// NEW PAGE PANEL
// Page templates with wireframe previews
// ============================================

const PAGE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch',
    preview: BlankPreview,
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Hero + features + CTA',
    preview: LandingPreview,
  },
  {
    id: 'about',
    name: 'About',
    description: 'Story + team section',
    preview: AboutPreview,
  },
  {
    id: 'services',
    name: 'Services',
    description: 'Services grid + pricing',
    preview: ServicesPreview,
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Contact info + form',
    preview: ContactPreview,
  },
];

export default function NewPagePanel({ onAddPage }) {
  return (
    <div className="p-4">
      <p className="text-xs text-gray-500 mb-4">
        Choose a template to add a new page
      </p>

      <div className="space-y-3">
        {PAGE_TEMPLATES.map((tpl) => {
          const Preview = tpl.preview;
          return (
            <button
              key={tpl.id}
              onClick={() => onAddPage?.({ templateId: tpl.id, name: tpl.name })}
              className="w-full text-left border border-gray-200 rounded-xl overflow-hidden hover:border-amber-400 hover:shadow-md transition-all group"
            >
              {/* Wireframe preview */}
              <div className="bg-gray-50 p-3 border-b border-gray-100 group-hover:bg-amber-50/40 transition-colors">
                <Preview />
              </div>
              {/* Label */}
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-gray-800">{tpl.name}</p>
                <p className="text-xs text-gray-400">{tpl.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// WIREFRAME PREVIEWS
// CSS-only mini layout mockups
// ============================================

function BlankPreview() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ height: 80 }}>
      <div className="h-2 bg-gray-200 mx-2 mt-2 rounded-sm" />
      <div className="flex items-center justify-center h-14">
        <div className="text-gray-300 text-xs">+ Add sections</div>
      </div>
    </div>
  );
}

function LandingPreview() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ height: 80 }}>
      {/* Nav */}
      <div className="h-2 bg-gray-200 mx-2 mt-1.5 rounded-sm" />
      {/* Hero */}
      <div className="bg-purple-100 mx-2 mt-1 rounded-sm flex items-center justify-center" style={{ height: 24 }}>
        <div className="h-1 w-10 bg-purple-300 rounded-sm" />
      </div>
      {/* 3-col features */}
      <div className="flex gap-1 mx-2 mt-1">
        <div className="flex-1 bg-gray-100 rounded-sm" style={{ height: 12 }} />
        <div className="flex-1 bg-gray-100 rounded-sm" style={{ height: 12 }} />
        <div className="flex-1 bg-gray-100 rounded-sm" style={{ height: 12 }} />
      </div>
      {/* CTA */}
      <div className="flex justify-center mt-1">
        <div className="bg-amber-300 rounded-sm" style={{ width: 30, height: 8 }} />
      </div>
    </div>
  );
}

function AboutPreview() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ height: 80 }}>
      {/* Nav */}
      <div className="h-2 bg-gray-200 mx-2 mt-1.5 rounded-sm" />
      {/* Hero */}
      <div className="bg-blue-100 mx-2 mt-1 rounded-sm" style={{ height: 18 }} />
      {/* 2-col: text + image */}
      <div className="flex gap-1 mx-2 mt-1">
        <div className="flex-1 space-y-0.5">
          <div className="bg-gray-200 rounded-sm" style={{ height: 4 }} />
          <div className="bg-gray-100 rounded-sm" style={{ height: 4 }} />
          <div className="bg-gray-100 rounded-sm w-3/4" style={{ height: 4 }} />
        </div>
        <div className="flex-1 bg-gray-200 rounded-sm" style={{ height: 22 }} />
      </div>
      {/* Team row */}
      <div className="flex gap-1 mx-2 mt-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-1 bg-gray-100 rounded-sm" style={{ height: 10 }} />
        ))}
      </div>
    </div>
  );
}

function ServicesPreview() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ height: 80 }}>
      {/* Nav */}
      <div className="h-2 bg-gray-200 mx-2 mt-1.5 rounded-sm" />
      {/* Hero */}
      <div className="bg-green-100 mx-2 mt-1 rounded-sm" style={{ height: 14 }} />
      {/* Services grid 2x2 */}
      <div className="grid grid-cols-2 gap-1 mx-2 mt-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 rounded-sm" style={{ height: 12 }} />
        ))}
      </div>
      {/* Pricing */}
      <div className="flex gap-1 mx-2 mt-1">
        <div className="flex-1 bg-gray-200 rounded-sm" style={{ height: 8 }} />
        <div className="flex-1 bg-amber-200 rounded-sm" style={{ height: 8 }} />
        <div className="flex-1 bg-gray-200 rounded-sm" style={{ height: 8 }} />
      </div>
    </div>
  );
}

function ContactPreview() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden" style={{ height: 80 }}>
      {/* Nav */}
      <div className="h-2 bg-gray-200 mx-2 mt-1.5 rounded-sm" />
      {/* Hero */}
      <div className="bg-rose-100 mx-2 mt-1 rounded-sm" style={{ height: 14 }} />
      {/* 2-col: info + form */}
      <div className="flex gap-1 mx-2 mt-1">
        <div className="flex-1 space-y-0.5">
          <div className="bg-gray-200 rounded-sm" style={{ height: 4 }} />
          <div className="bg-gray-100 rounded-sm" style={{ height: 4 }} />
          <div className="bg-gray-100 rounded-sm" style={{ height: 4 }} />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="bg-gray-100 rounded-sm" style={{ height: 6 }} />
          <div className="bg-gray-100 rounded-sm" style={{ height: 6 }} />
          <div className="bg-rose-300 rounded-sm" style={{ height: 5 }} />
        </div>
      </div>
    </div>
  );
}
