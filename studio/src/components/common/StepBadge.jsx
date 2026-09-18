import React from 'react';

const STEP_STYLES = {
  1: {
    label: 'Step 1: Ingest & Schema',
    style: 'text-primary bg-primary/10 border-primary/20'
  },
  2: {
    label: 'Step 2: Curate & Sanitize',
    style: 'text-secondary bg-secondary/10 border-secondary/20'
  },
  3: {
    label: 'Step 3: Evaluate & Ship',
    style: 'text-primary-fixed bg-primary-fixed/10 border-primary-fixed/20'
  }
};

export default function StepBadge({ step = 1, className = '', label = null }) {
  const config = STEP_STYLES[step] || STEP_STYLES[1];

  return (
    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.style} ${className}`}>
      {label || config.label}
    </span>
  );
}
