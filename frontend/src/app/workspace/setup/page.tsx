'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

// ─── Types ──────────────────────────────────────────────────────
interface Region {
  id: string;
  name: string;
  locales: string[];
}

interface Persona {
  id: string;
  name: string;
}

// ─── Section Header ─────────────────────────────────────────────
function SectionHeader({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5 shadow shadow-indigo-600/30">
        {step}
      </div>
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{description}</p>
      </div>
    </div>
  );
}

// ─── Forbidden Phrase chip input ────────────────────────────────
function ForbiddenPhrasesInput({ phrases, onChange }: { phrases: string[]; onChange: (p: string[]) => void }) {
  const [input, setInput] = useState('');

  const addPhrase = () => {
    const trimmed = input.trim();
    if (trimmed && !phrases.includes(trimmed)) {
      onChange([...phrases, trimmed]);
      setInput('');
    }
  };

  const removePhrase = (p: string) => onChange(phrases.filter((x) => x !== p));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          id="forbidden-phrase-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhrase())}
          placeholder='e.g. "guaranteed", "100% accurate"'
          className="input-field flex-1"
        />
        <button id="btn-add-phrase" type="button" onClick={addPhrase} className="btn-secondary flex-shrink-0">
          Add
        </button>
      </div>
      {phrases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {phrases.map((p) => (
            <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/25">
              &ldquo;{p}&rdquo;
              <button
                type="button"
                onClick={() => removePhrase(p)}
                className="hover:text-rose-100 transition-colors ml-0.5"
                aria-label={`Remove ${p}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── OAuth Connection Button ─────────────────────────────────────
function OAuthButton({ icon, label, connected, id }: { icon: React.ReactNode; label: string; connected?: boolean; id: string }) {
  const [isConnected, setIsConnected] = useState(connected ?? false);
  return (
    <button
      id={id}
      type="button"
      onClick={() => setIsConnected((v) => !v)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 w-full
        ${isConnected
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200 hover:bg-slate-700/50'
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {isConnected ? (
        <span className="badge-emerald text-xs">Connected ✓</span>
      ) : (
        <span className="text-xs text-slate-500">Click to connect</span>
      )}
    </button>
  );
}

// ─── Main Setup Page ─────────────────────────────────────────────
export default function WorkspaceSetupPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const createOrUpdateWorkspace = useMutation(api.workspace.createOrUpdateWorkspace);

  // ── Phase 0 State: market_identity.json fields ──────────────
  const [businessModel, setBusinessModel] = useState<'B2B' | 'B2C' | 'Hybrid'>('B2B');
  const [regions, setRegions] = useState<Region[]>([
    { id: 'reg_na', name: 'North America', locales: ['en_US'] },
    { id: 'reg_emea', name: 'EMEA', locales: ['en_GB', 'es_ES', 'de_DE'] },
  ]);
  const [personas, setPersonas] = useState<Persona[]>([
    { id: 'per_devops', name: 'DevOps Engineers' },
    { id: 'per_cto', name: 'CTOs & VPs of Engineering' },
  ]);
  const [newRegion, setNewRegion] = useState('');
  const [newPersona, setNewPersona] = useState('');

  // ── Phase 0 State: brand_guidelines.json fields ──────────────
  const [primaryHex, setPrimaryHex] = useState('#6366f1');
  const [secondaryHex, setSecondaryHex] = useState('#a855f7');
  const [primaryFont, setPrimaryFont] = useState('Inter, sans-serif');

  // ── Phase 0 State: compliance_rules.json fields ─────────────
  const [forbiddenPhrases, setForbiddenPhrases] = useState<string[]>([
    '100% accurate', 'bulletproof', 'replaces developers', 'AGI',
  ]);

  // ──────────────────────────────────────────────────────────────
  // SAVE / SUBMIT HANDLER
  // ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);

    try {
      await createOrUpdateWorkspace({
        market_identity: {
          workspace_id: crypto.randomUUID(),
          business_model: businessModel,
          approved_regions: regions,
          approved_personas: personas,
        },
        brand_guidelines: {
          colors: { primary_hex: primaryHex, secondary_hex: secondaryHex },
          typography: { primary_font: primaryFont, secondary_font: 'Arial, sans-serif' },
          assets: { logo_urls: [] },
        },
        compliance_rules: {
          forbidden_phrases: forbiddenPhrases,
          mandatory_disclaimers_by_region: {},
          mandatory_disclaimers_by_topic: {},
        },
      });
      router.push('/main');
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const addRegion = () => {
    if (newRegion.trim()) {
      setRegions((prev) => [...prev, { id: `reg_${Date.now()}`, name: newRegion.trim(), locales: ['en_US'] }]);
      setNewRegion('');
    }
  };

  const addPersona = () => {
    if (newPersona.trim()) {
      setPersonas((prev) => [...prev, { id: `per_${Date.now()}`, name: newPersona.trim() }]);
      setNewPersona('');
    }
  };

  return (
    <div className="animate-in space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Configure Your{' '}
          <span className="text-gradient">Workspace Rules</span>
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          These are your <strong className="text-slate-300">immutable Phase 0 foundations</strong>. Every AI campaign run will inherit these compliance settings, brand guidelines, and persona definitions.
        </p>
      </div>

      {/* ─── 1. Compliance Rules ────────────────────────────────── */}
      <div className="glass-card p-6">
        <SectionHeader
          step={1}
          title="Compliance Rules"
          description="Define forbidden phrases the AI will never use. The Textual Governance Agent checks every draft against this list."
        />
        {/* TODO — CONVEX QUERY: useQuery(api.workspace.getComplianceRules) to prefill phrases */}
        <ForbiddenPhrasesInput phrases={forbiddenPhrases} onChange={setForbiddenPhrases} />

        <div className="mt-4 p-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
          <p className="text-xs text-amber-300">
            ⚠ These phrases will trigger a <strong>ROUTE_TO_REVISION</strong> event if detected in AI-generated drafts.
          </p>
        </div>
      </div>

      {/* ─── 2. Knowledge Base Integrations ─────────────────────── */}
      <div className="glass-card p-6">
        <SectionHeader
          step={2}
          title="Knowledge Base Integrations"
          description="Connect internal data silos. The Semantic Layer ingests these to give the AI factual grounding during content generation."
        />
        {/* TODO — OAUTH: Each button triggers an OAuth flow. On callback, store the access_token in Convex workspace_rules.integrations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OAuthButton id="oauth-sharepoint" label="SharePoint / OneDrive" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.5 3A5.5 5.5 0 0 0 6 8.5c0 .448.052.885.15 1.304A4.5 4.5 0 0 0 2.5 14.5 4.5 4.5 0 0 0 7 19h10a4 4 0 0 0 4-4 4 4 0 0 0-3.5-3.97A5.5 5.5 0 0 0 11.5 3z"/>
            </svg>
          } />
          <OAuthButton id="oauth-gdrive" label="Google Drive" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.28 3h11.44l3.79 6.56-5.72 9.9H2.49L6.28 3zm5.72 0L8 9.56l4 .01L15.72 3h-3.72zM2.49 19.46H9.5l-3.74-6.46-3.27 6.46zm16.02 0H9.5l2.5-4.33 6.51-.01v4.34z"/>
            </svg>
          } />
          <OAuthButton id="oauth-jira" label="Jira / Confluence" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.975 2.018L2.938 11.055a1.354 1.354 0 0 0 0 1.914l3.01 3.01 4.981-4.981a1.354 1.354 0 0 1 1.914 0l4.981 4.981 3.01-3.01a1.354 1.354 0 0 0 0-1.914L11.975 2.018zm0 7.942l-3.01 3.01 3.01 3.01 3.01-3.01-3.01-3.01z"/>
            </svg>
          } />
          <OAuthButton id="oauth-salesforce" label="Salesforce CRM" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.12 5.27c.72-.78 1.73-1.27 2.88-1.27a4.26 4.26 0 0 1 3.83 2.38 3.18 3.18 0 0 1 1.42-.33 3.2 3.2 0 0 1 3.2 3.2c0 .17-.01.34-.04.5A2.86 2.86 0 0 1 22 12.14a2.86 2.86 0 0 1-2.86 2.86H5.71A3.71 3.71 0 0 1 2 11.29a3.71 3.71 0 0 1 5.31-3.35A4.28 4.28 0 0 1 9.12 5.27z"/>
            </svg>
          } />
        </div>
      </div>

      {/* ─── 3. Publishing Channels ─────────────────────────────── */}
      <div className="glass-card p-6">
        <SectionHeader
          step={3}
          title="Publishing Channel Connections"
          description="Connect outbound distribution channels. Approved assets will be pushed directly to these platforms."
        />
        {/* TODO — OAUTH: Store channel tokens in Convex for the Automated Publishing step (Phase 5→6) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OAuthButton id="oauth-linkedin" label="LinkedIn (Company Page)" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zm2-5a2 2 0 0 1 0 4 2 2 0 0 1 0-4z"/>
            </svg>
          } />
          <OAuthButton id="oauth-instagram" label="Instagram (Business)" icon={
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
            </svg>
          } />
          <OAuthButton id="oauth-email" label="Email Platform (Mailchimp)" icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          } />
          <OAuthButton id="oauth-cms" label="CMS (WordPress / Contentful)" icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253" />
            </svg>
          } />
        </div>
      </div>

      {/* ─── 4. Market Identity ─────────────────────────────────── */}
      <div className="glass-card p-6">
        <SectionHeader
          step={4}
          title="Market Identity & Persona DNA"
          description="Define your business model, approved target regions, and campaign personas. Marketing users select from these during campaign creation."
        />

        {/* Business Model */}
        <div className="mb-6">
          <label className="input-label">Business Model</label>
          <div className="flex gap-3">
            {(['B2B', 'B2C', 'Hybrid'] as const).map((model) => (
              <button
                key={model}
                id={`model-${model.toLowerCase()}`}
                type="button"
                onClick={() => setBusinessModel(model)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200
                  ${businessModel === model
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>

        {/* Approved Regions */}
        <div className="mb-6">
          <label className="input-label">Approved Target Regions</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {regions.map((r) => (
              <span key={r.id} className="flex items-center gap-1.5 badge-indigo text-xs">
                🌍 {r.name}
                <span className="text-slate-500 text-[10px]">({r.locales.join(', ')})</span>
                <button type="button" onClick={() => setRegions((prev) => prev.filter((x) => x.id !== r.id))}
                  className="hover:text-rose-300 ml-1 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input id="new-region-input" type="text" value={newRegion} onChange={(e) => setNewRegion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
              placeholder="e.g. APAC, LatAm" className="input-field flex-1" />
            <button id="btn-add-region" type="button" onClick={addRegion} className="btn-secondary flex-shrink-0">Add</button>
          </div>
        </div>

        {/* Approved Personas */}
        <div>
          <label className="input-label">Approved Personas / Target Audiences</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {personas.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 badge-violet text-xs">
                👤 {p.name}
                <button type="button" onClick={() => setPersonas((prev) => prev.filter((x) => x.id !== p.id))}
                  className="hover:text-rose-300 ml-1 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input id="new-persona-input" type="text" value={newPersona} onChange={(e) => setNewPersona(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPersona())}
              placeholder="e.g. CTOs, Fitness Enthusiasts" className="input-field flex-1" />
            <button id="btn-add-persona" type="button" onClick={addPersona} className="btn-secondary flex-shrink-0">Add</button>
          </div>
        </div>
      </div>

      {/* ─── 5. Brand Guidelines ────────────────────────────────── */}
      <div className="glass-card p-6">
        <SectionHeader
          step={5}
          title="Brand Guidelines"
          description="Set your primary brand colors and typography. The Visual Governance Agent will verify all generated assets against these hex codes."
        />
        {/* TODO — CONVEX MUTATION: These values feed directly into brand_guidelines.json for visual governance checks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="primary-hex" className="input-label">Primary Color</label>
            <div className="flex gap-2">
              <input id="primary-hex-picker" type="color" value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input id="primary-hex" type="text" value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)}
                className="input-field flex-1 font-mono" />
            </div>
          </div>
          <div>
            <label htmlFor="secondary-hex" className="input-label">Secondary Color</label>
            <div className="flex gap-2">
              <input id="secondary-hex-picker" type="color" value={secondaryHex} onChange={(e) => setSecondaryHex(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input id="secondary-hex" type="text" value={secondaryHex} onChange={(e) => setSecondaryHex(e.target.value)}
                className="input-field flex-1 font-mono" />
            </div>
          </div>
          <div>
            <label htmlFor="primary-font" className="input-label">Primary Typeface</label>
            <input id="primary-font" type="text" value={primaryFont} onChange={(e) => setPrimaryFont(e.target.value)}
              className="input-field" />
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: primaryHex }} />
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: secondaryHex }} />
          <div className="flex-1">
            <p className="text-sm text-slate-300" style={{ fontFamily: primaryFont }}>Preview — {primaryFont}</p>
            <p className="text-xs text-slate-500 mt-0.5">The Visual Governance Agent will verify hex_variance for these exact values</p>
          </div>
        </div>
      </div>

      {/* ─── Action Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <p className="text-sm text-slate-500">
          All settings are saved to your Convex workspace and inherited by every campaign.
        </p>
        <button
          id="btn-save-workspace"
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Saving workspace rules…
            </>
          ) : (
            'Save Workspace Rules & Continue →'
          )}
        </button>
      </div>
    </div>
  );
}
