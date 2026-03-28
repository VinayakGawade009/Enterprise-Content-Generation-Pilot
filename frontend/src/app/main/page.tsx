'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc } from '../../../convex/_generated/dataModel';

// ─── Types ────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  status: 'PENDING_GATE_1' | 'PENDING_GATE_2' | 'PENDING_GATE_3' | 'PUBLISHED' | 'DRAFTING' | 'REJECTED';
  format: string;
  updated: string;
  persona: string;
}

// Removed MOCK_CAMPAIGNS

// ─── Status Badge Renderer ────────────────────────────────────
function StatusBadge({ status }: { status: Campaign['status'] }) {
  const map: Record<string, { label: string; className: string; dot: string }> = {
    PENDING_GATE_1: { label: 'Gate 1 Review', className: 'badge-amber', dot: 'status-dot-pending' },
    PENDING_GATE_2: { label: 'Gate 2 Review', className: 'badge-amber', dot: 'status-dot-pending' },
    PENDING_GATE_3: { label: 'Gate 3 Review', className: 'badge-amber', dot: 'status-dot-pending' },
    PUBLISHED: { label: 'Published', className: 'badge-emerald', dot: 'status-dot-active' },
    DRAFTING: { label: 'Drafting…', className: 'badge-indigo', dot: 'status-dot-pending' },
    REJECTED: { label: 'Rejected', className: 'badge-rose', dot: 'status-dot-idle' },
    PROCESSING: { label: 'Processing…', className: 'badge-indigo', dot: 'status-dot-pending' },
    GATE_1_TEXT: { label: 'Text Review', className: 'badge-amber', dot: 'status-dot-pending' },
    GATE_2_LOCALIZATION: { label: 'Locale Review', className: 'badge-amber', dot: 'status-dot-pending' },
    GATE_4_VISUALS: { label: 'Visual Review', className: 'badge-amber', dot: 'status-dot-pending' },
  };
  const { label, className, dot } = map[status] || { label: status, className: 'badge-slate', dot: 'status-dot-idle' };
  return (
    <span className={`${className} gap-2`}>
      <span className={dot} />
      {label}
    </span>
  );
}

// ─── Campaign Row ─────────────────────────────────────────────
function CampaignRow({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  return (
    <div
      id={`campaign-row-${campaign.id}`}
      onClick={() => router.push(`/campaigns/${campaign.id}/execute`)}
      className="glass-card-sm flex items-center gap-4 px-5 py-4 hover:border-indigo-500/30 hover:bg-slate-800/50 cursor-pointer transition-all duration-200 group"
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-500/40 transition-colors">
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100 group-hover:text-white truncate">{campaign.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{campaign.format} · {campaign.persona}</p>
      </div>

      {/* Status */}
      <StatusBadge status={campaign.status} />

      {/* Time */}
      <span className="text-xs text-slate-600 hidden sm:block flex-shrink-0 w-16 text-right">{campaign.updated}</span>

      {/* Arrow */}
      <svg className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}

// ─── Settings Dropdown ────────────────────────────────────────
function SettingsMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        id="btn-settings"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
        Settings
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 glass-card py-2 z-50 shadow-xl shadow-black/40 animate-in">
          <Link href="/workspace/edit" id="btn-edit-workspace" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Workspace Rules
          </Link>
          <div className="border-t border-slate-800 my-1" />
          <button onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors w-full">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────
export default function MainDashboard() {
  const campaignsData = useQuery(api.campaigns.getRecent, { limit: 10 });

  // Map Convex docs to UI interface
  const campaigns: Campaign[] = campaignsData ? campaignsData.map((doc) => ({
    id: doc._id,
    name: doc.campaign_brief.creative_objective.slice(0, 40) + '...',
    status: doc.status as any,
    format: doc.campaign_brief.desired_formats.join(' · '),
    updated: new Date(doc._creationTime).toLocaleTimeString(),
    persona: doc.campaign_brief.target_personas.join(', '),
  })) : [];

  const stats = [
    { label: 'Active Campaigns', value: '3', icon: '🚀', delta: '+2 this week' },
    { label: 'Pending Review', value: '3', icon: '⏸', delta: 'Awaiting your action' },
    { label: 'Published', value: '1', icon: '✅', delta: 'Last: 1d ago' },
    { label: 'Governed Drafts', value: '12', icon: '🛡', delta: '0 violations this week' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top Nav ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80" style={{ backdropFilter: 'blur(12px)', background: 'rgba(10,14,26,0.9)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white tracking-tight">ECGP</span>
            </div>
            <div className="w-px h-5 bg-slate-700" />
            <span className="text-sm text-slate-400">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="status-dot-active" />
              <span className="text-xs text-emerald-300 font-medium">Workspace Active</span>
            </div>
            <SettingsMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {/* ── Welcome ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Good morning 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Your enterprise content pipeline is ready. 3 campaigns are awaiting review.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            id="btn-create-campaign"
            className="btn-primary flex-shrink-0 text-base px-6 py-3 shadow-xl shadow-indigo-600/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create New Campaign
          </Link>
        </div>

        {/* ── Stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm font-medium text-slate-300">{stat.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.delta}</p>
            </div>
          ))}
        </div>

        {/* ── Recent Campaigns ────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
              <p className="text-sm text-slate-500">Click any campaign to view its execution status.</p>
            </div>
            <span className="badge-indigo">{campaigns.length} total</span>
          </div>

          <div className="space-y-2">
            {campaignsData === undefined ? (
              <div className="glass-card p-8 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-8 h-8 animate-spin mb-3 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-sm font-medium text-slate-300">Loading campaigns...</p>
              </div>
            ) : campaignsData.length === 0 ? (
              <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No recent campaigns found.</h3>
                <p className="text-sm text-slate-400 mb-6 font-medium">Create your first one to kick off the pipeline!</p>
                <Link href="/campaigns/new" className="btn-primary space-x-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Build Campaign</span>
                </Link>
              </div>
            ) : (
              campaigns.map((c) => <CampaignRow key={c.id} campaign={c} />)
            )}
          </div>
        </div>

        {/* ── System Health Strip ──────────────────────────────── */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">System Health</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Knowledge Base Sync', ok: true },
              { label: 'Textual Governance', ok: true },
              { label: 'Visual Governance', ok: true },
              { label: 'LangSmith Telemetry', ok: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span className={item.ok ? 'status-dot-active' : 'status-dot-pending'} />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
