'use client';

/**
 * /workspace/edit — Edit Mode for Workspace Rules.
 *
 * This is the SAME UI as /workspace/setup, but in "edit mode":
 *  - Pre-populated from Convex via useQuery(api.workspace.getMyWorkspace)
 *  - CTA changes from "Save & Continue →" to "Save Workspace Rules"
 *  - No onboarding messaging
 *
 * Accessible from: /main → Settings → "Edit Workspace Rules"
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

interface Region { id: string; name: string; locales: string[] }
interface Persona { id: string; name: string }

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

function ForbiddenPhrasesInput({ phrases, onChange }: { phrases: string[]; onChange: (p: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !phrases.includes(input.trim())) { onChange([...phrases, input.trim()]); setInput(''); } };
  const remove = (p: string) => onChange(phrases.filter((x) => x !== p));
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input id="edit-phrase-input" type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder='Add a forbidden phrase…' className="input-field flex-1" />
        <button id="btn-edit-add-phrase" type="button" onClick={add} className="btn-secondary flex-shrink-0">Add</button>
      </div>
      {phrases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {phrases.map((p) => (
            <span key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/25">
              &ldquo;{p}&rdquo;
              <button type="button" onClick={() => remove(p)} className="hover:text-rose-100 transition-colors ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function OAuthButton({ icon, label, connected, id }: { icon: React.ReactNode; label: string; connected?: boolean; id: string }) {
  const [isConnected, setIsConnected] = useState(connected ?? false);
  return (
    <button id={id} type="button" onClick={() => setIsConnected((v) => !v)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 w-full
        ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200 hover:bg-slate-700/50'}`}>
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {isConnected ? <span className="badge-emerald text-xs">Connected ✓</span> : <span className="text-xs text-slate-500">Click to connect</span>}
    </button>
  );
}

export default function WorkspaceEditPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const workspace = useQuery(api.workspace.getMyWorkspace);
  const createOrUpdateWorkspace = useMutation(api.workspace.createOrUpdateWorkspace);

  const [businessModel, setBusinessModel] = useState<'B2B' | 'B2C' | 'Hybrid'>('B2B');
  const [regions, setRegions] = useState<Region[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [newRegion, setNewRegion] = useState('');
  const [newPersona, setNewPersona] = useState('');
  const [primaryHex, setPrimaryHex] = useState('#6366f1');
  const [secondaryHex, setSecondaryHex] = useState('#a855f7');
  const [primaryFont, setPrimaryFont] = useState('Inter, sans-serif');
  const [forbiddenPhrases, setForbiddenPhrases] = useState<string[]>([]);

  useEffect(() => {
    if (workspace) {
      setBusinessModel(workspace.market_identity.business_model as any);
      setRegions(workspace.market_identity.approved_regions);
      setPersonas(workspace.market_identity.approved_personas);
      setPrimaryHex(workspace.brand_guidelines.colors.primary_hex);
      setSecondaryHex(workspace.brand_guidelines.colors.secondary_hex);
      setPrimaryFont(workspace.brand_guidelines.typography.primary_font);
      setForbiddenPhrases(workspace.compliance_rules.forbidden_phrases);
    }
  }, [workspace]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await createOrUpdateWorkspace({
        market_identity: {
          workspace_id: workspace?.market_identity.workspace_id || crypto.randomUUID(),
          business_model: businessModel,
          approved_regions: regions,
          approved_personas: personas,
        },
        brand_guidelines: {
          colors: { primary_hex: primaryHex, secondary_hex: secondaryHex },
          typography: { primary_font: primaryFont, secondary_font: 'Arial, sans-serif' },
          assets: { logo_urls: workspace?.brand_guidelines.assets.logo_urls || [] },
        },
        compliance_rules: {
          forbidden_phrases: forbiddenPhrases,
          mandatory_disclaimers_by_region: workspace?.compliance_rules.mandatory_disclaimers_by_region || {},
          mandatory_disclaimers_by_topic: workspace?.compliance_rules.mandatory_disclaimers_by_topic || {},
        },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const addRegion = () => { if (newRegion.trim()) { setRegions((p) => [...p, { id: `reg_${Date.now()}`, name: newRegion.trim(), locales: ['en_US'] }]); setNewRegion(''); } };
  const addPersona = () => { if (newPersona.trim()) { setPersonas((p) => [...p, { id: `per_${Date.now()}`, name: newPersona.trim() }]); setNewPersona(''); } };

  return (
    <div className="animate-in space-y-8">
      {/* Edit Mode Banner */}
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-3">
        <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-semibold text-indigo-300">Editing Workspace Rules</p>
          <p className="text-xs text-slate-400">Changes will take effect on the next campaign run. Existing running campaigns will not be affected.</p>
        </div>
        <Link href="/main" className="btn-ghost text-xs">← Back to Dashboard</Link>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 animate-in">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-emerald-300 font-medium">Workspace rules saved successfully!</p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white">Edit Workspace Rules</h1>

      {/* 1. Compliance Rules */}
      <div className="glass-card p-6">
        <SectionHeader step={1} title="Compliance Rules" description="Update forbidden phrases. The Textual Governance Agent will enforce these on all future campaigns." />
        <ForbiddenPhrasesInput phrases={forbiddenPhrases} onChange={setForbiddenPhrases} />
      </div>

      {/* 2. Knowledge Base Integrations */}
      <div className="glass-card p-6">
        <SectionHeader step={2} title="Knowledge Base Integrations" description="Manage connected internal data sources for the Semantic Layer." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OAuthButton id="edit-oauth-sharepoint" label="SharePoint / OneDrive" connected icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 3A5.5 5.5 0 0 0 6 8.5c0 .448.052.885.15 1.304A4.5 4.5 0 0 0 2.5 14.5 4.5 4.5 0 0 0 7 19h10a4 4 0 0 0 4-4 4 4 0 0 0-3.5-3.97A5.5 5.5 0 0 0 11.5 3z"/></svg>} />
          <OAuthButton id="edit-oauth-gdrive" label="Google Drive" icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.28 3h11.44l3.79 6.56-5.72 9.9H2.49L6.28 3zm5.72 0L8 9.56l4 .01L15.72 3h-3.72zM2.49 19.46H9.5l-3.74-6.46-3.27 6.46zm16.02 0H9.5l2.5-4.33 6.51-.01v4.34z"/></svg>} />
          <OAuthButton id="edit-oauth-jira" label="Jira / Confluence" connected icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.975 2.018L2.938 11.055a1.354 1.354 0 0 0 0 1.914l3.01 3.01 4.981-4.981a1.354 1.354 0 0 1 1.914 0l4.981 4.981 3.01-3.01a1.354 1.354 0 0 0 0-1.914L11.975 2.018zm0 7.942l-3.01 3.01 3.01 3.01 3.01-3.01-3.01-3.01z"/></svg>} />
          <OAuthButton id="edit-oauth-salesforce" label="Salesforce CRM" icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.12 5.27c.72-.78 1.73-1.27 2.88-1.27a4.26 4.26 0 0 1 3.83 2.38 3.18 3.18 0 0 1 1.42-.33 3.2 3.2 0 0 1 3.2 3.2c0 .17-.01.34-.04.5A2.86 2.86 0 0 1 22 12.14a2.86 2.86 0 0 1-2.86 2.86H5.71A3.71 3.71 0 0 1 2 11.29a3.71 3.71 0 0 1 5.31-3.35A4.28 4.28 0 0 1 9.12 5.27z"/></svg>} />
        </div>
      </div>

      {/* 3. Market Identity */}
      <div className="glass-card p-6">
        <SectionHeader step={3} title="Market Identity & Persona DNA" description="Update your business model, target regions, and campaign personas." />
        <div className="mb-6">
          <label className="input-label">Business Model</label>
          <div className="flex gap-3">
            {(['B2B', 'B2C', 'Hybrid'] as const).map((model) => (
              <button key={model} id={`edit-model-${model.toLowerCase()}`} type="button" onClick={() => setBusinessModel(model)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-200
                  ${businessModel === model ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>
                {model}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="input-label">Approved Regions</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {regions.map((r) => (
              <span key={r.id} className="flex items-center gap-1.5 badge-indigo text-xs">
                🌍 {r.name}
                <button type="button" onClick={() => setRegions((p) => p.filter((x) => x.id !== r.id))} className="hover:text-rose-300 ml-1 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input id="edit-region-input" type="text" value={newRegion} onChange={(e) => setNewRegion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())} placeholder="e.g. APAC" className="input-field flex-1" />
            <button id="btn-edit-add-region" type="button" onClick={addRegion} className="btn-secondary">Add</button>
          </div>
        </div>
        <div>
          <label className="input-label">Approved Personas</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {personas.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 badge-violet text-xs">
                👤 {p.name}
                <button type="button" onClick={() => setPersonas((pv) => pv.filter((x) => x.id !== p.id))} className="hover:text-rose-300 ml-1 transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input id="edit-persona-input" type="text" value={newPersona} onChange={(e) => setNewPersona(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPersona())} placeholder="e.g. Fitness Enthusiasts" className="input-field flex-1" />
            <button id="btn-edit-add-persona" type="button" onClick={addPersona} className="btn-secondary">Add</button>
          </div>
        </div>
      </div>

      {/* 4. Brand Guidelines */}
      <div className="glass-card p-6">
        <SectionHeader step={4} title="Brand Guidelines" description="Update hex codes and typography. Visual Governance will re-verify on next campaign." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="input-label">Primary Color</label>
            <div className="flex gap-2">
              <input id="edit-primary-picker" type="color" value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input id="edit-primary-hex" type="text" value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)} className="input-field flex-1 font-mono" />
            </div>
          </div>
          <div>
            <label className="input-label">Secondary Color</label>
            <div className="flex gap-2">
              <input id="edit-secondary-picker" type="color" value={secondaryHex} onChange={(e) => setSecondaryHex(e.target.value)} className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
              <input id="edit-secondary-hex" type="text" value={secondaryHex} onChange={(e) => setSecondaryHex(e.target.value)} className="input-field flex-1 font-mono" />
            </div>
          </div>
          <div>
            <label className="input-label">Primary Typeface</label>
            <input id="edit-primary-font" type="text" value={primaryFont} onChange={(e) => setPrimaryFont(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Link href="/main" className="btn-secondary">← Cancel</Link>
        <button id="btn-save-workspace-edit" type="button" onClick={handleSave} disabled={isSaving}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
          {isSaving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Saving…</>
          ) : ('Save Workspace Rules')}
        </button>
      </div>
    </div>
  );
}
