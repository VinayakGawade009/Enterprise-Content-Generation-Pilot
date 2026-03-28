'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

// ─── Types ─────────────────────────────────────────────────────
type OutputType = 'LinkedIn' | 'Instagram' | 'Facebook' | 'Blog';
type Format = 'Video' | 'Image' | 'Text Only';

// ─── Sub-components ───────────────────────────────────────────
function ToggleChip<T extends string>({
  options, value, onChange, id,
}: { options: T[]; value: T; onChange: (v: T) => void; id: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          id={`${id}-${opt.toLowerCase().replace(' ', '-')}`}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
            ${value === opt
              ? 'bg-indigo-600 text-white border border-indigo-500 shadow shadow-indigo-600/30'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────
function UploadZone({ files, onFiles }: { files: File[]; onFiles: (f: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    onFiles([...files, ...dropped]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/40'}`}
    >
      <input
        ref={inputRef}
        id="asset-upload"
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => onFiles([...files, ...Array.from(e.target.files ?? [])])}
      />
      <div className="flex flex-col items-center gap-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-slate-300 font-medium">
            {isDragging ? 'Drop files here' : 'Drop campaign assets here or click to browse'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Images, Videos, PDFs, Docs — these feed into the Semantic Layer context</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {files.map((f, i) => (
            <span key={i} className="badge-indigo text-xs max-w-[160px] truncate">
              📎 {f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function NewCampaignPage() {
  const router = useRouter();
  const [objective, setObjective] = useState('');
  const [outputType, setOutputType] = useState<OutputType>('LinkedIn');
  const [format, setFormat] = useState<Format>('Video');
  const [createCaptions, setCreateCaptions] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['North America']);
  const [selectedPersona, setSelectedPersona] = useState('DevOps Engineers');
  const [enableLocalization, setEnableLocalization] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');
  const [isLaunching, setIsLaunching] = useState(false);

  const createCampaign = useMutation(api.campaigns.create);
  const workspace = useQuery(api.workspace.getMyWorkspace);

  const approvedRegions = workspace?.market_identity.approved_regions ?? [];
  const approvedPersonas = workspace?.market_identity.approved_personas ?? [];

  const REGIONS = approvedRegions.map(r => r.name);
  const PERSONAS = approvedPersonas.map(p => p.name);
  
  const OUTPUT_TYPES = ['Social Media', 'Email', 'Display Ads', 'Video Ads'];

  const toggleRegion = (r: string) =>
    setSelectedRegions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  const handleRunCampaign = async () => {
    if (!objective.trim()) return;
    setIsLaunching(true);

    const campaignBrief = {
      campaign_id: Math.random().toString(36).substring(7),
      initiated_by: "user_001", // Placeholder
      creative_objective: objective,
      target_regions: selectedRegions,
      target_personas: [selectedPersona],
      desired_formats: [`${outputType}_${format}`],
      enable_localization: enableLocalization,
      selected_language: enableLocalization ? selectedLanguage : undefined,
    };

    try {
      const campaignId = await createCampaign({
        campaign_brief: campaignBrief,
      });

      const response = await fetch('http://localhost:8000/api/campaign/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_id: campaignId,
          ...campaignBrief,
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate backend');
      router.push(`/campaigns/${campaignId}/execute`);
    } catch (err) {
      console.error(err);
      setIsLaunching(false);
    }
  };

  const chatMessages = [
    { role: 'system', text: 'Welcome! Describe the campaign you want to create. I\'ll use your workspace\'s approved personas, regions, and compliance rules to generate governed content.' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Campaign</h1>
        <p className="text-slate-400 text-sm mt-1">
          Describe your campaign objective. The AI pipeline will handle the rest, with Human-in-the-Loop governance gates.
        </p>
      </div>

      <div className="space-y-6">
        {/* ── Chat-style objective input ────────────────────────── */}
        <div className="glass-card p-6">
          <label className="input-label mb-3 block">Campaign Objective</label>

          {/* System message */}
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-300">
              {chatMessages[0].text}
            </div>
          </div>

          {/* User input */}
          <div className="relative">
            <textarea
              id="campaign-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Announce the general availability of the AutoHeal Agent. Focus on how it automatically fixes PR errors and deploys safely to AWS EC2. Target DevOps engineers in North America and EMEA."
              rows={4}
              className="input-field resize-none pr-12"
            />
            <div className="absolute bottom-3 right-3 text-xs text-slate-600">
              {objective.length}/1000
            </div>
          </div>
        </div>

        {/* ── Campaign-specific Assets ──────────────────────────── */}
        <div className="glass-card p-6">
          <label className="input-label mb-3 block">Campaign-Specific Assets</label>
          <p className="text-xs text-slate-500 mb-3">Upload product specs, images, or internal docs. These supplement the workspace knowledge base for this campaign only.</p>
          <UploadZone files={files} onFiles={setFiles} />
        </div>

        {/* ── Output Configuration ──────────────────────────────── */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="section-title">Output Configuration</h2>

          <div>
            <label className="input-label mb-2 block">Output Platform</label>
            <ToggleChip<OutputType>
              id="output-type"
              options={['LinkedIn', 'Instagram', 'Facebook', 'Blog']}
              value={outputType}
              onChange={setOutputType}
            />
          </div>

          <div>
            <label className="input-label mb-2 block">Format</label>
            <ToggleChip<Format>
              id="format"
              options={['Video', 'Image', 'Text Only']}
              value={format}
              onChange={setFormat}
            />
          </div>

          <div>
            <label className="input-label mb-2 block">Target Regions</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  id={`region-${r.toLowerCase().replace(/\s/g, '-')}`}
                  type="button"
                  onClick={() => toggleRegion(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
                    ${selectedRegions.includes(r)
                      ? 'bg-indigo-600 text-white border border-indigo-500'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200'
                    }`}
                >
                  🌍 {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label mb-2 block">Target Persona</label>
            <ToggleChip<string>
              id="persona"
              options={PERSONAS}
              value={selectedPersona}
              onChange={setSelectedPersona}
            />
          </div>

          <div className="flex flex-col gap-4 pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-3">
              <input
                id="create-captions"
                type="checkbox"
                checked={createCaptions}
                onChange={(e) => setCreateCaptions(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="create-captions" className="text-sm text-slate-300 cursor-pointer">
                Create captions for the post
                <span className="ml-2 text-xs text-slate-500">(Automatically generates platform-optimized copy with hashtags)</span>
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  id="enable-localization"
                  type="checkbox"
                  checked={enableLocalization}
                  onChange={(e) => setEnableLocalization(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                />
                <label htmlFor="enable-localization" className="text-sm text-slate-300 font-medium cursor-pointer">
                  Enable Regional Localization
                  <span className="ml-2 text-xs text-slate-500">(Transcreate content for regional Indian markets)</span>
                </label>
              </div>

              {enableLocalization && (
                <div className="ml-7 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 block">Target Indian Language</label>
                  <ToggleChip<string>
                    id="selected-language"
                    options={[
                      'Hindi', 'Bengali', 'Telugu', 'Marathi',
                      'Tamil', 'Urdu', 'Gujarati', 'Kannada',
                      'Odia', 'Malayalam', 'Punjabi', 'Assamese'
                    ]}
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary Bar ───────────────────────────────────────── */}
        <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
          <span className="badge-indigo">📺 {outputType}</span>
          <span className="badge-violet">🎬 {format}</span>
          <span className="badge-indigo">🌍 {selectedRegions.join(', ')}</span>
          <span className="badge-violet">👤 {selectedPersona}</span>
          {enableLocalization && <span className="badge-violet">🇮🇳 {selectedLanguage}</span>}
          {createCaptions && <span className="badge-emerald">✍ Captions</span>}
          {files.length > 0 && <span className="badge-amber">📎 {files.length} asset{files.length !== 1 ? 's' : ''}</span>}
        </div>

        {/* ── Run Campaign Button ───────────────────────────────── */}
        <div className="flex items-center justify-between pb-8">
          <p className="text-xs text-slate-500">
            Clicking Run will initiate the LangGraph AI pipeline. You&apos;ll review content at each HITL gate.
          </p>
          <button
            id="btn-run-campaign"
            type="button"
            onClick={handleRunCampaign}
            disabled={!objective.trim() || isLaunching}
            className="btn-primary px-8 py-3 text-base shadow-xl shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLaunching ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Launching pipeline…
              </>
            ) : (
              <>
                ⚡ Run Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
