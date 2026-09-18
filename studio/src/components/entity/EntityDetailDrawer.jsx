import React from 'react';

export default React.memo(function EntityDetailDrawer({ entity }) {
  if (!entity) return null;

  return (
    <div className="p-3.5 bg-surface-card border-t border-border-default flex-shrink-0 flex items-start justify-between">
      <div className="flex flex-col gap-1 max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="font-code-sm text-primary font-bold text-[12px]">{entity.id}</span>
          <h3 className="font-bold text-[14px] text-on-surface">{entity.name}</h3>
          <span className="text-outline text-[11px]">({entity.reading})</span>
          {entity.code && (
            <span className="text-secondary text-[11px] font-code-sm font-medium">{entity.code}</span>
          )}
        </div>
        <p className="text-[11.5px] text-on-surface-variant leading-relaxed">
          {entity.definition || 'No definition provided.'}
        </p>
      </div>
    </div>
  );
});
