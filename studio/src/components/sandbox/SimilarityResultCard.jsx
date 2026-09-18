import React from 'react';
import MetricProgressBar from '../common/MetricProgressBar';

export default React.memo(function SimilarityResultCard({ result }) {
  if (!result) return null;

  const scorePct = (result.similarity * 100);
  const isHigh = result.similarity >= 0.85;

  return (
    <div
      className={`bg-surface-mica border rounded-lg p-2.5 relative overflow-hidden group fluent-card transition-all ${
        isHigh ? 'border-primary/40' : 'border-border-default'
      }`}
    >
      <div className="flex justify-between items-end mb-1 relative z-10">
        <div>
          <span className="font-code-sm text-[10.5px] text-outline">{result.id}</span>
          <div className="font-body-md text-[13px] font-medium text-on-surface">
            {result.name}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[11px] text-secondary">
              {result.inEditor ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span className="text-[9.5px] font-label-caps text-on-surface-variant">
              {result.inEditor ? 'Active in Editor' : 'Standalone'}
            </span>
          </div>
        </div>
        <span className={`font-code-md text-[14px] font-bold ${isHigh ? 'text-primary' : 'text-outline'}`}>
          {result.similarity.toFixed(3)}
        </span>
      </div>

      <MetricProgressBar
        value={Math.max(5, scorePct)}
        variant={isHigh ? 'gradient-primary' : 'default'}
        height="h-1"
        className="relative z-10"
      />
    </div>
  );
});
