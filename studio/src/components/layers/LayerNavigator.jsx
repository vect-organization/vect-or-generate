import React from 'react';
import CsvImporter from '../entity/CsvImporter';
import StepBadge from '../common/StepBadge';
import { DOMAIN_CONFIG, SEMANTIC_LAYERS } from '../../constants/domainConfig';

export default React.memo(function LayerNavigator({ 
  selectedLayer, 
  onSelectLayer, 
  activeLayerMask, 
  onToggleLayer,
  onImportCsv,
  totalEntitiesCount = 0
}) {
  return (
    <aside className="w-pane-left bg-surface-card border-r border-border-default flex flex-col flex-shrink-0 h-full">
      {/* Step 1 Header */}
      <div className="p-4 border-b border-border-default">
        <div className="flex items-center justify-between mb-1">
          <StepBadge step={1} />
          <span className="text-[11px] font-code-sm text-outline">{totalEntitiesCount} Items</span>
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface text-[16px] font-semibold flex items-center gap-2 mt-2">
          <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
          10-Layer Navigator
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant text-[11px] mt-0.5">
          W3C / DIKWP Hierarchy Space
        </p>

        {/* Csv Importer Hub */}
        <div className="mt-3">
          <CsvImporter onImport={onImportCsv} />
        </div>
      </div>

      {/* Layer Tree */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
        {SEMANTIC_LAYERS.map((layer) => {
          const isSelected = selectedLayer === layer.id;
          const isChecked = activeLayerMask[layer.id] !== false;

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-primary/15 border border-primary/40 shadow-sm' 
                  : 'fluent-hover text-on-surface-variant hover:text-on-surface border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-primary' : 'text-outline'}`}>
                  {layer.icon}
                </span>
                <div className="flex flex-col truncate">
                  <span className={`font-code-sm text-[12px] font-medium leading-tight ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                    {layer.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/70 truncate">
                    {layer.desc}
                  </span>
                </div>
              </div>
              
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleLayer(layer.id);
                }}
                className="rounded border-border-default bg-surface-card text-primary focus:ring-primary focus:ring-offset-surface-card ml-2 cursor-pointer"
              />
            </div>
          );
        })}
      </div>

      {/* Domain Metadata Config */}
      <div className="p-4 border-t border-border-default bg-surface-mica">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Domain Settings</h3>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="font-code-sm text-[11px] text-on-surface-variant">Taxonomy Code</span>
            <input
              type="text"
              defaultValue={DOMAIN_CONFIG.taxonomyCode}
              className="bg-surface-card border border-border-default rounded-lg px-2 py-1.5 font-code-sm text-[12px] text-on-surface fluent-input outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 mt-1">
            <span className="font-code-sm text-[11px] text-on-surface-variant">Vector Dimension</span>
            <div className="bg-surface-card border border-border-default rounded-lg px-2 py-1.5 font-code-sm text-[12px] text-secondary flex justify-between">
              <span>{DOMAIN_CONFIG.dimension} {DOMAIN_CONFIG.precision}</span>
              <span className="text-outline text-[10px]">{DOMAIN_CONFIG.normalization}</span>
            </div>
          </label>
        </div>
      </div>
    </aside>
  );
});
