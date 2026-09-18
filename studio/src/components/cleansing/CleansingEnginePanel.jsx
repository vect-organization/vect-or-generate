import React from 'react';
import ActionTile from '../common/ActionTile';

export default React.memo(function CleansingEnginePanel({
  isSourceStripped,
  onToggleStripSource,
  onRunBackTranslation,
  onShuffleIDs,
  onAddNoise,
  onResetData,
  isProcessing
}) {
  const actions = [
    {
      id: 'strip',
      title: 'Strip Source',
      description: 'Remove raw URLs and text provenance',
      icon: isSourceStripped ? 'shield' : 'shield_with_house',
      badgeText: isSourceStripped ? 'ON' : 'OFF',
      isActive: isSourceStripped,
      onClick: onToggleStripSource,
      colorVariant: 'primary'
    },
    {
      id: 'back_trans',
      title: 'Back-Translation',
      description: 'Paraphrase to anonymize style',
      icon: 'translate',
      badgeText: 'Run',
      onClick: onRunBackTranslation,
      colorVariant: 'secondary'
    },
    {
      id: 'shuffle',
      title: 'Order Shuffle',
      description: 'Block inference from insertion order',
      icon: 'shuffle',
      badgeText: 'UUID',
      onClick: onShuffleIDs,
      colorVariant: 'primary'
    },
    {
      id: 'noise',
      title: 'Add DP Noise',
      description: 'Prevent reverse vector reconstruction',
      icon: 'blur_on',
      badgeText: 'DP-ε',
      onClick: onAddNoise,
      colorVariant: 'tertiary'
    }
  ];

  return (
    <div className="bg-surface-card border border-border-default rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-label-caps text-[12px] text-primary font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">cleaning_services</span>
          Advanced Cleansing &amp; Privacy Suite
        </h3>
        <span className="text-[10px] font-code-sm text-outline">Engine: Active</span>
      </div>

      <p className="text-[11px] text-on-surface-variant leading-relaxed">
        Eliminates source identification risks while preserving vector semantic distance and accuracy.
      </p>

      {/* Control Actions Grid */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        {actions.map((act) => (
          <ActionTile
            key={act.id}
            title={act.title}
            description={act.description}
            icon={act.icon}
            badgeText={act.badgeText}
            isActive={act.isActive}
            disabled={isProcessing}
            onClick={act.onClick}
            colorVariant={act.colorVariant}
          />
        ))}
      </div>

      {/* Reset Action */}
      <button
        onClick={onResetData}
        className="text-[10px] text-on-surface-variant hover:text-error transition-colors flex items-center justify-center gap-1 pt-1 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[12px]">restart_alt</span>
        Reset to Original Data
      </button>
    </div>
  );
});
