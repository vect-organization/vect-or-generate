import React from 'react';

const VARIANT_STYLES = {
  primary: 'bg-primary/10 text-primary border-primary/30',
  secondary: 'bg-secondary/10 text-secondary border-secondary/30',
  error: 'bg-error/10 text-error border-error/30',
  outline: 'bg-surface-mica text-outline border-border-default',
  container: 'bg-surface-container-highest text-on-surface border-border-default',
  default: 'bg-surface-card text-on-surface-variant border-border-default',
};

const DEFAULT_DOT_COLORS = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  error: 'bg-error',
  outline: 'bg-outline',
  container: 'bg-primary',
  default: 'bg-secondary',
};

/**
 * Shared Status Badge Component
 */
export default React.memo(function StatusBadge({
  variant = 'default',
  dot = false,
  dotColor,
  icon,
  children,
  className = '',
  ...props
}) {
  const activeDotColor = dotColor || DEFAULT_DOT_COLORS[variant] || 'bg-primary';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-code-sm ${VARIANT_STYLES[variant] || VARIANT_STYLES.default} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${activeDotColor} animate-pulse`} />
      )}
      {icon && (
        <span className="material-symbols-outlined text-[12px]">{icon}</span>
      )}
      <span>{children}</span>
    </span>
  );
});
