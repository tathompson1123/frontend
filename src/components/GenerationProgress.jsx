import { Loader2, Sparkles, Code2, Palette, Layout, CheckCircle2, Terminal } from 'lucide-react';

// Steps mapped to progress % thresholds (60-second timeline)
const STEPS = [
  { id: 1, text: 'Initializing AI engine...',      icon: Terminal,     pct: 0  },
  { id: 2, text: 'Analyzing your business...',      icon: Sparkles,     pct: 8  },
  { id: 3, text: 'Drafting site structure...',       icon: Layout,       pct: 20 },
  { id: 4, text: 'Generating components...',         icon: Code2,        pct: 37 },
  { id: 5, text: 'Applying styles and themes...',    icon: Palette,      pct: 58 },
  { id: 6, text: 'Writing copy and content...',      icon: Terminal,     pct: 75 },
  { id: 7, text: 'Finalizing your website...',       icon: CheckCircle2, pct: 92 },
];

const CIRCUMFERENCE = 301.59; // 2π × 48

export default function GenerationProgress({ businessName, progress = 0, buildStatus }) {
  const isDone = progress >= 100;

  let currentStepIndex = 0;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (progress >= STEPS[i].pct) { currentStepIndex = i; break; }
  }

  const strokeOffset = CIRCUMFERENCE - (Math.min(progress, 100) / 100) * CIRCUMFERENCE;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden"
      style={{ background: '#f8fafc', fontFamily: 'inherit' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0.25 }}
      >
        <div
          style={{
            width: 700, height: 700,
            borderRadius: '50%',
            filter: 'blur(160px)',
            background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 50%, transparent 100%)',
          }}
        />
      </div>

      <div className="max-w-2xl w-full z-10 flex flex-col gap-10">

        {/* ── Circular progress + icon ── */}
        <div className="flex flex-col items-center gap-5">
          {/* Spinning ring */}
          <div className="gp-spin" style={{ display: 'inline-block' }}>
            <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
              {/* Track */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#e2e8f0" strokeWidth="4" />
              </svg>
              {/* Progress arc */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx="50" cy="50" r="48"
                  fill="none"
                  stroke="#E76F51"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeOffset}
                  style={{ transition: 'stroke-dashoffset 0.4s ease-out' }}
                />
              </svg>
              {/* Center icon */}
              {isDone
                ? <CheckCircle2 size={40} color="#E76F51" />
                : <Sparkles size={40} color="#E76F51" className="gp-blink" />}
            </div>
          </div>

          {/* Heading */}
          <div className="text-center flex flex-col gap-1">
            <h2 className="text-3xl font-bold" style={{ color: '#0f172a' }}>
              {isDone ? 'Website Ready!' : `Building ${businessName || 'your website'}`}
            </h2>
            <p className="font-mono text-sm" style={{ color: '#64748b' }}>
              {Math.round(progress)}% complete &bull; Estimated time: ~60s
            </p>
          </div>
        </div>

        {/* ── Step list ── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex flex-col gap-5">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStepIndex && !isDone;
              const isPast   = index < currentStepIndex || isDone;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-4"
                  style={{
                    opacity:    isActive ? 1 : isPast ? 0.4 : 0.2,
                    transform:  isActive ? 'scale(1)' : 'scale(0.97)',
                    transition: 'opacity 0.5s, transform 0.5s',
                  }}
                >
                  {/* Icon bubble */}
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: 40, height: 40,
                      border: isActive
                        ? '1px solid rgba(234,88,12,0.4)'
                        : isPast
                        ? '1px solid #d1fae5'
                        : '1px solid #e2e8f0',
                      background: isActive
                        ? 'rgba(251,191,36,0.12)'
                        : isPast
                        ? '#d1fae5'
                        : '#f1f5f9',
                      color: isActive ? '#d97706' : isPast ? '#059669' : '#94a3b8',
                    }}
                  >
                    {isPast
                      ? <CheckCircle2 size={20} />
                      : isActive
                      ? <Loader2 size={20} className="animate-spin" />
                      : <StepIcon size={20} />}
                  </div>

                  {/* Label */}
                  <p
                    className="flex-1 font-medium"
                    style={{ color: isActive ? '#0f172a' : '#94a3b8' }}
                  >
                    {step.text}
                  </p>

                  {/* "Processing…" badge */}
                  {isActive && (
                    <span
                      className="text-xs font-mono gp-fade-up"
                      style={{ color: '#F4A261' }}
                    >
                      Processing...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Scrolling code skeleton ── */}
        <div
          className="relative overflow-hidden rounded-xl p-4"
          style={{
            height: 112,
            border: '1px solid #e2e8f0',
            background: '#f1f5f9',
          }}
        >
          {/* Fade-out mask */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, #f1f5f9 100%)' }}
          />
          <div className="gp-scroll font-mono text-xs flex flex-col gap-3" style={{ color: '#64748b' }}>
            <p><span style={{ color: '#ec4899' }}>import</span> {'{ motion }'} <span style={{ color: '#ec4899' }}>from</span> <span style={{ color: '#4ade80' }}>'motion/react'</span>;</p>
            <p><span style={{ color: '#ec4899' }}>export default function</span> <span style={{ color: '#60a5fa' }}>Hero</span>() {'{'}</p>
            <p className="pl-4"><span style={{ color: '#ec4899' }}>return</span> (</p>
            <p className="pl-8">{'<'}motion.section</p>
            <p className="pl-12">initial={'{'}{'{'} opacity: 0 {'}'}{'}'}</p>
            <p className="pl-12">animate={'{'}{'{'} opacity: 1 {'}'}{'}'}</p>
            <p className="pl-8">{'>'}</p>
            <p className="pl-12">{'<'}h1 className=<span style={{ color: '#4ade80' }}>"text-6xl font-bold"</span>{'>'}</p>
            <p className="pl-16">Welcome to your new site</p>
            <p className="pl-12">{'</'}h1{'>'}</p>
            <p className="pl-8">{'</'}motion.section{'>'}</p>
            <p className="pl-4">);</p>
            <p>{'}'}</p>
            <p style={{ color: '#3f3f46' }}>{'// Generating more sections...'}</p>
            <p><span style={{ color: '#ec4899' }}>const</span> <span style={{ color: '#60a5fa' }}>theme</span> = {'{'} primary: <span style={{ color: '#4ade80' }}>'#E76F51'</span>, teal: <span style={{ color: '#4ade80' }}>'#2A9D8F'</span> {'}'};</p>
            <p style={{ color: '#3f3f46' }}>{'// Applying brand styles...'}</p>
            <p className="pl-4">background: theme.primary,</p>
            <p className="pl-4">borderRadius: <span style={{ color: '#4ade80' }}>'12px'</span>,</p>
          </div>
        </div>

      </div>
    </div>
  );
}
