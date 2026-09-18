import React from 'react';

const ACTIVE_COLOR_CLASSES = {
  primary: 'bg-primary/15 border-primary/50 text-primary shadow-sm',
  secondary: 'bg-secondary/15 border-secondary/50 text-secondary shadow-sm',
  tertiary: 'bg-tertiary/15 border-tertiary/50 text-tertiary shadow-sm',
};

const HOVER_COLOR_CLASSES = {
  primary: 'hover:border-primary/40 group-hover:text-primary',
  secondary: 'hover:border-secondary/40 group-hover:text-secondary',
  tertiary: 'hover:border-tertiary/40 group-hover:text-tertiary',
};

/**
 * Generic Action Toggle Tile Component
 */
export default React.memo(function ActionTile({
  title,
  description,
  icon,
  badgeText,
  isActive = false,
  disabled = false,
  onClick,
  colorVariant = 'primary',
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all group ${
        isActive
          ? ACTIVE_COLOR_CLASSES[colorVariant] || ACTIVE_COLOR_CLASSES.primary
          : `bg-surface-mica border-border-default text-on-surface hover:bg-surface-container-highest ${HOVER_COLOR_CLASSES[colorVariant] || HOVER_COLOR_CLASSES.primary}`
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold flex items-center gap-1">
          {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
          {title}
        </span>
        {badgeText && (
          <span className="text-[10px] font-code-sm opacity-90">{badgeText}</span>
        )}
      </div>
      {description && (
        <span className="text-[9px] text-on-surface-variant leading-tight">
          {description}
        </span>
      )}
    </button>
  );
});
