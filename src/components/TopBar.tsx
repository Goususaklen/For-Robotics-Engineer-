import React from 'react';

export type WorkspaceSection = 'workspace' | 'pinout' | 'telemetry' | 'protocols';

interface TopBarProps {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  isConnected: boolean;
  onToggleConnectModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onSelectSection,
  isConnected,
  onToggleConnectModal,
}) => {
  const navItems: { id: WorkspaceSection; label: string }[] = [
    { id: 'workspace', label: 'IDE & AI Architect' },
    { id: 'pinout', label: 'Board Pinout' },
    { id: 'telemetry', label: 'Serial & Plotter' },
    { id: 'protocols', label: 'Transport Link' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#070913]/95 border-b border-violet-500/20 sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectSection('workspace');
        }}
        className="text-lg font-bold tracking-tight text-slate-100 font-display whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-violet-400"
      >
        Singularity MCU
      </a>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav aria-label="Primary Workspace Navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'text-violet-300 border-violet-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100 hover:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onToggleConnectModal}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isConnected
              ? 'bg-blue-600/20 text-blue-200 border border-blue-400/40 hover:bg-blue-600/30'
              : 'bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.4)]'
          }`}
        >
          {isConnected ? 'Configure Link' : 'Connect Board'}
        </button>
      </div>
    </header>
  );
};
