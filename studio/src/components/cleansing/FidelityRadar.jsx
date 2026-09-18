import React from 'react';
import StatusBadge from '../common/StatusBadge';
import MetricProgressBar from '../common/MetricProgressBar';

function getFidelityColor(score) {
  if (score >= 95) return 'text-secondary';
  if (score >= 90) return 'text-primary';
  return 'text-error';
}

function getPrivacyColor(score) {
  if (score >= 90) return 'text-secondary';
  if (score >= 70) return 'text-primary';
  return 'text-outline';
}

export default React.memo(function FidelityRadar({ 
  fidelityScore = 98.2, 
  privacyScore = 92.4, 
  singularityRisk = 'LOW', 
  isBackTranslated = false, 
  isSourceStripped = false 
}) {
  return (
    <div className="bg-surface-card border border-border-default rounded-xl p-3.5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-label-caps text-[11px] text-on-surface flex items-center gap-1.5 font-bold">
          <span className="material-symbols-outlined text-primary text-[16px]">verified_user</span>
          Fidelity &amp; Privacy Radar (2-Axis)
        </h4>
        <StatusBadge
          variant={singularityRisk === 'LOW' ? 'secondary' : 'error'}
          className="font-bold uppercase"
        >
          Singularity Risk: {singularityRisk}
        </StatusBadge>
      </div>

      {/* 2-Axis Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Metric 1: Semantic Retention (Fidelity) */}
        <div className="bg-surface-mica p-2.5 rounded-lg border border-border-default/80 flex flex-col gap-1">
          <span className="text-[10px] text-on-surface-variant font-medium">Semantic Retention (Fidelity)</span>
          <div className="flex items-baseline justify-between">
            <span className={`font-code-md text-[18px] font-bold ${getFidelityColor(fidelityScore)}`}>
              {fidelityScore.toFixed(1)}%
            </span>
            <span className="text-[10px] text-outline">Cosine Sim</span>
          </div>
          <MetricProgressBar
            value={fidelityScore}
            variant="gradient-primary"
            height="h-1"
            className="mt-1"
          />
        </div>

        {/* Metric 2: Syntactic Divergence (Privacy/Safety) */}
        <div className="bg-surface-mica p-2.5 rounded-lg border border-border-default/80 flex flex-col gap-1">
          <span className="text-[10px] text-on-surface-variant font-medium">Syntactic Divergence (Privacy)</span>
          <div className="flex items-baseline justify-between">
            <span className={`font-code-md text-[18px] font-bold ${getPrivacyColor(privacyScore)}`}>
              {privacyScore.toFixed(1)}%
            </span>
            <span className="text-[10px] text-outline">Syntactic</span>
          </div>
          <MetricProgressBar
            value={privacyScore}
            variant="gradient-secondary"
            height="h-1"
            className="mt-1"
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <StatusBadge
          variant={isSourceStripped ? 'primary' : 'outline'}
          icon={isSourceStripped ? 'lock' : 'link'}
        >
          {isSourceStripped ? 'Source Strip: ACTIVE' : 'Source: RETAINED'}
        </StatusBadge>

        <StatusBadge
          variant={isBackTranslated ? 'secondary' : 'outline'}
          icon="translate"
        >
          {isBackTranslated ? 'Back-Translation: 100%' : 'Original Syntax'}
        </StatusBadge>
      </div>
    </div>
  );
});
