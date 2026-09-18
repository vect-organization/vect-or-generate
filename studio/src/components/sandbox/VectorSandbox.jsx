import React from 'react';
import SimilarityResultCard from './SimilarityResultCard';
import ArtifactExportPanel from './ArtifactExportPanel';
import StepBadge from '../common/StepBadge';

export default React.memo(function VectorSandbox({
  query,
  onQueryChange,
  onRunInference,
  results,
  isInferencing,
  useRealModel,
  onToggleRealModel,
  modelStatus,
  modelProgress,
  pendingVectorCount = 0,
  onVectorizePending,
  onExportBundle,
  domainName = 'general'
}) {
  return (
    <aside className="w-pane-right bg-surface-card flex flex-col flex-shrink-0 h-full overflow-y-auto border-l border-border-default">
      {/* Step 3 Header */}
      <div className="p-4 border-b border-border-default flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <StepBadge step={3} />
          <span className="text-[11px] font-code-sm text-outline">
            {useRealModel ? '🧠 ONNX E5 (Real)' : '⚡ Instant (Pseudo)'}
          </span>
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface text-[16px] font-semibold flex items-center gap-2 mt-2">
          <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
          Real-time Similarity Sandbox
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Pending Vectors Notification */}
        {pendingVectorCount > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-medium text-[12px]">
              <span className="material-symbols-outlined text-[17px]">warning</span>
              <span>{pendingVectorCount} new items need vectorization</span>
            </div>
            <button
              onClick={onVectorizePending}
              disabled={isInferencing}
              className="fluent-btn bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[12px] py-1.5 px-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              {isInferencing ? 'Vectorizing...' : `Vectorize ${pendingVectorCount} Items`}
            </button>
          </div>
        )}

        {/* Engine Switcher & Status */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {[
              { id: false, label: '⚡ Instant (Pseudo)' },
              { id: true, label: '🧠 High Precision (ONNX)' },
            ].map((mode) => {
              const active = useRealModel === mode.id;
              return (
                <button
                  key={String(mode.id)}
                  onClick={() => onToggleRealModel(mode.id)}
                  className={`flex-1 py-1.5 px-2.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-primary/20 text-primary border border-primary/50 font-bold'
                      : 'bg-surface-container text-on-surface-variant border border-border-default hover:bg-surface-container-highest'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          {modelStatus && (
            <div className="text-[10px] text-primary animate-pulse flex items-center justify-between px-1">
              <span>
                {modelStatus === 'loading'
                  ? 'Loading model...'
                  : modelStatus === 'embedding_entities'
                  ? 'Embedding KB...'
                  : 'Ready'}
              </span>
              {modelProgress !== null && <span>{Math.round(modelProgress * 100)}%</span>}
            </div>
          )}

          <textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Type query or passage to test similarity... (e.g. Feeling depressed and unable to focus)"
            className="bg-surface-mica border border-border-default rounded-lg p-3 font-body-md text-[12.5px] text-on-surface fluent-input outline-none resize-none h-20"
          />
          <button
            onClick={onRunInference}
            disabled={isInferencing}
            className="fluent-btn border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-label-md text-[12.5px] font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            {isInferencing ? 'Calculating Vectors...' : 'Run Vector Inference'}
          </button>
        </div>

        {/* Top Similarity Results */}
        <div className="flex flex-col gap-2">
          <h3 className="font-label-md text-label-md text-on-surface-variant flex justify-between items-center">
            <span>Top Semantic Matches</span>
            <div className="flex items-center gap-2">
              {results.length > 0 && (
                <button
                  onClick={(e) => {
                    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
                    const btn = e.currentTarget;
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<span class="material-symbols-outlined text-[12px]">check</span> Copied!';
                    setTimeout(() => btn.innerHTML = originalText, 1500);
                  }}
                  className="text-[10px] text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer border border-primary/20"
                  title="Copy results as JSON"
                >
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                  Copy JSON
                </button>
              )}
              <span className="text-[10px] font-code-sm text-outline">Ranked by Cosine Sim</span>
            </div>
          </h3>

          {results.length === 0 ? (
            <div className="bg-surface-mica border border-border-default/60 rounded-lg p-3.5 text-center text-outline text-[11.5px]">
              Run vector inference to see real-time cosine similarity scores.
            </div>
          ) : (
            results.map((res, idx) => (
              <SimilarityResultCard key={res.id || idx} result={res} />
            ))
          )}
        </div>

        {/* 5-Artifact Packaging & Final Shipping Zone */}
        <ArtifactExportPanel 
          onExport={onExportBundle}
          domainName={domainName}
        />
      </div>
    </aside>
  );
});
