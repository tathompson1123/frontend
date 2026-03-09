import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Save, Edit2, Check } from 'lucide-react';

// ─── Default step configs per template id ────────────────────────────────────
const TEMPLATE_DEFAULTS = {
  'lead-magnet-auto-wrap': {
    headline: 'Design Your Custom Vehicle Wrap',
    subheadline: 'Answer 4 quick questions to get a personalized wrap estimate.',
    ctaText: 'Start My Design',
    contactTitle: 'Almost done!',
    contactSubtitle: 'Where should we send your personalized estimate?',
    steps: [
      { question: 'What type of vehicle are you wrapping?', choices: ['Coupe / Sedan', 'SUV / Crossover', 'Truck', 'Van / Commercial'] },
      { question: 'How much of the vehicle are we wrapping?', choices: ['Full Wrap', 'Partial Wrap', 'Roof / Hood Only', 'Chrome Delete / Accents'] },
      { question: 'What kind of finish are you looking for?', choices: ['Gloss / Satin', 'Matte', 'Chrome / Reflective', 'Color Shift'] },
      { question: 'When do you want this done?', choices: ['ASAP', 'Within 1 month', '1-3 months', 'Just exploring'] },
    ],
  },
  'lead-magnet-cleaning': {
    headline: 'Get an Instant Cleaning Quote',
    subheadline: 'Answer 4 quick questions and see your price range in seconds.',
    ctaText: 'Get My Free Quote',
    contactTitle: 'Almost done!',
    contactSubtitle: 'Where should we send your quote?',
    steps: [
      { question: 'What type of cleaning do you need?', choices: ['Carpet Cleaning', 'House Cleaning', 'Deep Clean', 'Commercial / Office'] },
      { question: 'How large is the space?', choices: ['Studio / 1BR', '2–3 Bedrooms', '4–5 Bedrooms', 'Commercial Space'] },
      { question: 'How often would you like service?', choices: ['One-Time', 'Weekly', 'Bi-Weekly', 'Monthly'] },
      { question: 'When do you need it done?', choices: ['ASAP', 'This Week', 'This Month', 'Just Exploring'] },
    ],
  },
  'lead-magnet-landscaping': {
    headline: 'Get Your Free Landscape Estimate',
    subheadline: "Answer 4 quick questions and we'll send you a personalized estimate in seconds.",
    ctaText: 'Get My Free Estimate',
    contactTitle: 'Almost done!',
    contactSubtitle: 'Where should we send your estimate?',
    steps: [
      { question: 'What type of project are you looking for?', choices: ['Lawn Maintenance', 'Garden Design', 'Hardscaping / Patio', 'Full Landscape Renovation'] },
      { question: 'How large is the area being worked on?', choices: ['Small (under ¼ acre)', 'Medium (¼ – ½ acre)', 'Large (½ – 1 acre)', 'Estate (1+ acre)'] },
      { question: 'When are you looking to get started?', choices: ['ASAP', 'Within 1 Month', '1–3 Months', 'Just Planning'] },
      { question: 'What is your approximate budget?', choices: ['Under $1,000', '$1,000 – $5,000', '$5,000 – $15,000', '$15,000+'] },
    ],
  },
  'lead-magnet-renovation': {
    headline: 'What Will Your Project Cost?',
    subheadline: 'Answer 4 quick questions and get a free project estimate.',
    ctaText: 'Get My Free Estimate',
    contactTitle: 'Almost done!',
    contactSubtitle: 'Where should we send your estimate?',
    steps: [
      { question: 'What type of project are you planning?', choices: ['Kitchen Remodel', 'Bathroom Remodel', 'Full Home Renovation', 'Outdoor / Deck'] },
      { question: 'What is the scope of work?', choices: ['Minor Update / Refresh', 'Full Renovation', 'Addition / Expansion', 'Complete Gut / Rebuild'] },
      { question: 'When are you looking to start?', choices: ['ASAP', '1–3 Months', '3–6 Months', 'Just Planning'] },
      { question: 'What is your approximate budget?', choices: ['Under $10K', '$10K–$30K', '$30K–$75K', '$75K+'] },
    ],
  },
  'lead-magnet-photography': {
    headline: 'Find Your Perfect Package',
    subheadline: 'Answer 4 quick questions and discover which package fits your vision.',
    ctaText: 'Find My Package',
    contactTitle: 'Almost done!',
    contactSubtitle: 'Where should we send your package recommendation?',
    steps: [
      { question: 'What type of session are you looking for?', choices: ['Wedding', 'Portraits / Headshots', 'Family Session', 'Commercial / Branding'] },
      { question: 'Where would you like to shoot?', choices: ['Studio', 'Outdoor / Park', 'Your Home / Office', 'Venue / Event Space'] },
      { question: 'How long do you need coverage?', choices: ['Under 2 Hours', 'Half Day (4 hrs)', 'Full Day (8 hrs)', 'Multi-Day'] },
      { question: 'When is your session?', choices: ['This Month', '1–3 Months Out', '3–6 Months Out', '6+ Months Out'] },
    ],
  },
};

// ─── Preview panels ───────────────────────────────────────────────────────────

function IntroPreview({ data, primaryColor }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: primaryColor }}></div>
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{data.headline || 'Your Headline'}</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{data.subheadline || 'Your subheadline goes here.'}</p>
          <button
            className="w-full py-3 rounded-xl text-white text-sm font-semibold"
            style={{ background: primaryColor }}
          >
            {data.ctaText || 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestionPreview({ step, stepIndex, primaryColor }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: primaryColor }}></div>
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-400 mb-4 text-center">Step {stepIndex + 1}</p>
          <p className="text-base font-bold text-gray-900 mb-4 text-center leading-snug">
            {step.question || 'Your question goes here?'}
          </p>
          <div className="space-y-2">
            {(step.choices || ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4']).map((choice, i) => (
              <div
                key={i}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
              >
                {choice}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPreview({ data, primaryColor }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: primaryColor }}></div>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">{data.contactTitle || 'Almost done!'}</h2>
          <p className="text-sm text-gray-500 mb-5 text-center">{data.contactSubtitle || 'Where should we send your results?'}</p>
          <div className="space-y-3">
            <div className="w-full h-10 rounded-lg border-2 border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-400">Full Name</div>
            <div className="w-full h-10 rounded-lg border-2 border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-400">Email Address</div>
            <div className="w-full h-10 rounded-lg border-2 border-gray-200 bg-gray-50 px-3 flex items-center text-sm text-gray-400">Phone (optional)</div>
            <div className="flex items-start gap-2 text-xs text-gray-400 mt-1">
              <div className="w-4 h-4 rounded border-2 border-gray-300 mt-0.5 flex-shrink-0"></div>
              <span>I consent to receive text messages about my results.</span>
            </div>
            <button
              className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-1"
              style={{ background: primaryColor }}
            >
              Get My Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step editor panels ───────────────────────────────────────────────────────

function IntroEditor({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Headline</label>
        <textarea
          value={data.headline}
          onChange={e => onChange({ ...data, headline: e.target.value })}
          rows={2}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none resize-none"
          placeholder="Enter your headline..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Subheadline</label>
        <textarea
          value={data.subheadline}
          onChange={e => onChange({ ...data, subheadline: e.target.value })}
          rows={3}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none resize-none"
          placeholder="Enter your subheadline..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">CTA Button Text</label>
        <input
          type="text"
          value={data.ctaText}
          onChange={e => onChange({ ...data, ctaText: e.target.value })}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Get Started"
        />
      </div>
    </div>
  );
}

function QuestionEditor({ step, onChange }) {
  const updateChoice = (i, value) => {
    const newChoices = [...(step.choices || [])];
    newChoices[i] = value;
    onChange({ ...step, choices: newChoices });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</label>
        <textarea
          value={step.question}
          onChange={e => onChange({ ...step, question: e.target.value })}
          rows={2}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none resize-none"
          placeholder="What is your question?"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Answer Choices</label>
        <div className="space-y-2">
          {(step.choices || ['', '', '', '']).map((choice, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono w-5 text-right flex-shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={choice}
                onChange={e => updateChoice(i, e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                placeholder={`Choice ${i + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactEditor({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Step Title</label>
        <input
          type="text"
          value={data.contactTitle}
          onChange={e => onChange({ ...data, contactTitle: e.target.value })}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Almost done!"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact Step Subtitle</label>
        <textarea
          value={data.contactSubtitle}
          onChange={e => onChange({ ...data, contactSubtitle: e.target.value })}
          rows={2}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none resize-none"
          placeholder="Where should we send your results?"
        />
      </div>
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
        <p className="text-xs text-blue-700 font-medium">The form fields (Name, Email, Phone) and SMS consent checkbox are fixed and required for lead capture.</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LeadMagnetEditor({ section, theme, apiUrl, authFetch, onSave, onClose }) {
  const templateId = section?.template;
  const defaults = TEMPLATE_DEFAULTS[templateId] || TEMPLATE_DEFAULTS['lead-magnet-cleaning'];

  // Merge saved content with defaults
  const savedContent = section?.content || {};
  const [editorStep, setEditorStep] = useState(0); // 0 = intro, 1..N = question, N+1 = contact
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState(() => {
    const savedSteps = savedContent.steps && savedContent.steps.length > 0
      ? savedContent.steps
      : defaults.steps;

    return {
      headline:        savedContent.headline        || defaults.headline,
      subheadline:     savedContent.subheadline     || defaults.subheadline,
      ctaText:         savedContent.ctaText         || defaults.ctaText,
      contactTitle:    savedContent.contactTitle    || defaults.contactTitle,
      contactSubtitle: savedContent.contactSubtitle || defaults.contactSubtitle,
      steps: savedSteps.map(s => ({
        question: s.question || '',
        choices: (s.choices || []).slice(0, 4).concat(Array(Math.max(0, 4 - (s.choices || []).length)).fill('')),
      })),
    };
  });

  const totalEditorSteps = formData.steps.length + 2; // intro + questions + contact
  const primaryColor = theme?.primaryColor || '#6366f1';

  const getStepLabel = (i) => {
    if (i === 0) return 'Intro Screen';
    if (i === formData.steps.length + 1) return 'Contact Form';
    return `Question ${i}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await authFetch(`${apiUrl}/api/website/lead-magnet-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          headline:        formData.headline,
          subheadline:     formData.subheadline,
          ctaText:         formData.ctaText,
          contactTitle:    formData.contactTitle,
          contactSubtitle: formData.contactSubtitle,
          steps:           formData.steps,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSaveSuccess(true);
      setTimeout(() => {
        if (onSave) onSave();
      }, 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isContactStep = editorStep === formData.steps.length + 1;
  const isIntroStep = editorStep === 0;
  const questionIndex = isIntroStep || isContactStep ? null : editorStep - 1;

  const currentStep = questionIndex !== null ? formData.steps[questionIndex] : null;

  const updateStep = (updatedStep) => {
    const newSteps = [...formData.steps];
    newSteps[questionIndex] = updatedStep;
    setFormData({ ...formData, steps: newSteps });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit Lead Magnet Wizard
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {getStepLabel(editorStep)} &mdash; step {editorStep + 1} of {totalEditorSteps}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max">
            {Array.from({ length: totalEditorSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => setEditorStep(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  editorStep === i
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                style={editorStep === i ? { background: primaryColor } : {}}
              >
                {getStepLabel(i)}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: Preview */}
          <div className="w-5/12 border-r border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 bg-white">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview</span>
              </div>
              <div className="flex-1 overflow-auto">
                {isIntroStep && (
                  <IntroPreview data={formData} primaryColor={primaryColor} />
                )}
                {questionIndex !== null && currentStep && (
                  <QuestionPreview step={currentStep} stepIndex={questionIndex} primaryColor={primaryColor} />
                )}
                {isContactStep && (
                  <ContactPreview data={formData} primaryColor={primaryColor} />
                )}
              </div>
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800">
                  {isIntroStep ? 'Edit Intro Screen' : isContactStep ? 'Edit Contact Step' : `Edit Question ${questionIndex + 1}`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isIntroStep
                    ? 'The first thing visitors see when they find the quiz.'
                    : isContactStep
                    ? 'The final step where visitors enter their contact info.'
                    : 'Visitors pick one answer and advance to the next step.'}
                </p>
              </div>

              {isIntroStep && (
                <IntroEditor data={formData} onChange={setFormData} />
              )}
              {questionIndex !== null && currentStep && (
                <QuestionEditor step={currentStep} onChange={updateStep} />
              )}
              {isContactStep && (
                <ContactEditor data={formData} onChange={setFormData} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditorStep(Math.max(0, editorStep - 1))}
              disabled={editorStep === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setEditorStep(Math.min(totalEditorSteps - 1, editorStep + 1))}
              disabled={editorStep === totalEditorSteps - 1}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-red-600 font-medium">{error}</span>
            )}
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              style={{ background: saveSuccess ? '#16a34a' : primaryColor }}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
