import React from 'react';

const VARIANT_STYLES = {
  'gradient-primary': 'bg-gradient-to-r from-primary to-secondary',
  'gradient-secondary': 'bg-gradient-to-r from-tertiary to-secondary',
  'primary': 'bg-primary',
  'secondary': 'bg-secondary',
  'default': 'bg-border-default',
};

/**
 * Shared Progress Bar / Metric Gauge Component
 */
export default React.memo(function MetricProgressBar({
  value = 0,
  variant = 'gradient-primary',
  height = 'h-1.5',
  className = '',
}) {
  const clampedValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={`w-full bg-surface-container-highest rounded-full overflow-hidden ${height} ${className}`}>
      <div
        className={`h-full transition-all duration-500 rounded-full ${VARIANT_STYLES[variant] || VARIANT_STYLES.default}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
});
