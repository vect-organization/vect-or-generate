import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { NAV_ITEMS } from '../../constants/domainConfig';

export default React.memo(function StudioHeader({ 
  domain = 'Medical Psychiatry', 
  onExport, 
  onSync, 
  isCleansed 
}) {
  return (
    <header className="bg-surface-mica/80 backdrop-blur-md border-b border-border-default flex justify-between items-center h-16 px-gutter w-full sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-pane-left flex-shrink-0 font-headline-md text-[18px] font-semibold text-primary tracking-tight truncate" title="Generator Studio">
          Generator Studio
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`px-3 py-1.5 rounded-lg font-label-md text-[13px] font-medium transition-colors cursor-pointer ${
                item.active
                  ? 'bg-surface-card text-on-surface border border-border-default'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-mica'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Global Actions / Controls */}
      <div className="flex items-center gap-3">
        {/* Domain Badge */}
        <div className="flex items-center gap-2 bg-surface-card px-3 py-1.5 rounded-lg border border-border-default">
          <span className="text-[11px] font-label-md text-on-surface-variant">Domain:</span>
          <span className="text-[12px] font-code-sm font-semibold text-on-surface">
            {domain}
          </span>
        </div>

        {/* Model Status Badge */}
        <StatusBadge variant="primary" dot className="px-2.5 py-1">
          E5 Multilingual Ready
        </StatusBadge>

        {/* Sync Button */}
        <button
          onClick={onSync}
          className="fluent-btn bg-surface-card hover:bg-surface-container-highest text-on-surface text-[12px] font-medium px-3 py-1.5 rounded-lg border border-border-default transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">sync_alt</span>
          Sync to vect-or-data
        </button>

        {/* Provenance Status Tag */}
        <StatusBadge
          variant={isCleansed ? 'secondary' : 'outline'}
          icon={isCleansed ? 'verified_user' : 'link'}
          className="text-[11px] py-1"
        >
          {isCleansed ? 'Provenance: Sanitized' : 'Provenance: Linked'}
        </StatusBadge>

        {/* Export Button */}
        <button 
          onClick={onExport}
          className="fluent-btn bg-primary hover:bg-primary/90 text-on-primary text-[12px] font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Export 3-Artifacts
        </button>

        {/* Setting Icons */}
        <div className="flex items-center gap-1 text-on-surface-variant border-l border-border-default pl-2 ml-1">
          {['settings', 'help_outline'].map((icon) => (
            <button
              key={icon}
              className="p-1.5 hover:text-primary transition-colors rounded-lg fluent-hover cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
});
