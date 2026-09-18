import React, { useMemo, useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import StepBadge from '../common/StepBadge';
import FidelityRadar from '../cleansing/FidelityRadar';
import CleansingEnginePanel from '../cleansing/CleansingEnginePanel';
import EntityModal from './EntityModal';
import EntityDetailDrawer from './EntityDetailDrawer';

export default React.memo(function DataGrid({ 
  entities = [], 
  searchTerm = '', 
  onSearchChange, 
  onSelectEntity, 
  selectedEntityId, 
  selectedLayer, 
  isSourceStripped,
  onAddEntity,
  onUpdateEntity,
  onDeleteEntity,
  // Cleansing props integrated into Step 2 Center Column
  fidelityScore,
  privacyScore,
  singularityRisk,
  isBackTranslated,
  onToggleStripSource,
  onRunBackTranslation,
  onShuffleIDs,
  onAddNoise,
  onResetData,
  isProcessing
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);

  const filtered = useMemo(() => {
    let result = entities;

    if (selectedLayer !== null && selectedLayer !== undefined) {
      result = result.filter(item => item.layer === selectedLayer);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(item => (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.reading && item.reading.toLowerCase().includes(q)) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.definition && item.definition.toLowerCase().includes(q))
      ));
    }

    return result;
  }, [entities, searchTerm, selectedLayer]);

  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find(e => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  const handleOpenAdd = () => {
    setEditingEntity(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entity, e) => {
    e.stopPropagation();
    setEditingEntity(entity);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data) => {
    if (editingEntity) {
      onUpdateEntity({ ...editingEntity, ...data });
    } else {
      onAddEntity(data);
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-surface-mica min-w-0 border-r border-border-default h-full overflow-hidden">
      {/* Step 2 Header & Action Bar */}
      <div className="p-4 border-b border-border-default flex justify-between items-center bg-surface-card flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <StepBadge step={2} />
          <h1 className="font-headline-md text-headline-md text-on-surface text-[17px] font-semibold">
            Entity &amp; Knowledge DataGrid
          </h1>
          <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[11px] font-code-sm text-outline whitespace-nowrap">
            {filtered.length} Entities
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-1 justify-end">
          {/* View RAW JSON Button */}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
            className="fluent-btn bg-surface-container hover:bg-surface-container-highest text-on-surface text-[12px] font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 border border-border-default"
            title="View Raw JSON (Current Filter)"
          >
            <span className="material-symbols-outlined text-[16px]">data_object</span>
            View RAW
          </button>

          {/* Add Entity Button */}
          <button
            onClick={handleOpenAdd}
            className="fluent-btn bg-primary hover:bg-primary/90 text-on-primary text-[12px] font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Entity
          </button>

          {/* Search Box */}
          <div className="flex items-center gap-2 bg-surface-mica border border-border-default rounded-lg px-3 py-1.5 w-64 fluent-input transition-all flex-shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[17px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search term, reading, ICD-10..."
              className="bg-transparent border-none p-0 focus:ring-0 font-body-md text-[13px] text-on-surface w-full placeholder-on-surface-variant outline-none"
            />
            {searchTerm && (
              <button onClick={() => onSearchChange('')} className="text-outline hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-surface-card z-10 border-b border-border-default font-label-md text-label-md text-on-surface-variant">
            <tr>
              <th className="px-3.5 py-2 font-medium">ID</th>
              <th className="px-3.5 py-2 font-medium">Term</th>
              <th className="px-3.5 py-2 font-medium">Reading</th>
              <th className="px-3.5 py-2 font-medium">Layer</th>
              <th className="px-3.5 py-2 font-medium">Taxonomy / Meta</th>
              <th className="px-3.5 py-2 font-medium">
                {isSourceStripped ? 'Provenance (Sanitized)' : 'Source Provenance'}
              </th>
              <th className="px-3.5 py-2 font-medium">Synonyms</th>
              <th className="px-3.5 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md divide-y divide-border-default/60">
            {filtered.map((item) => {
              const isSelected = selectedEntityId === item.id;
              const source = item.metadata?.source;

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectEntity(item)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'fluent-hover'
                  }`}
                >
                  <td className="px-3.5 py-2.5 font-code-sm text-code-sm text-outline">{item.id}</td>
                  <td className="px-3.5 py-2.5 font-medium text-on-surface font-headline-md text-[13px]">
                    {item.name}
                  </td>
                  <td className="px-3.5 py-2.5 text-on-surface-variant text-[12px]">{item.reading}</td>
                  <td className="px-3.5 py-2.5">
                    <StatusBadge variant="container" className="rounded text-[10px]">
                      {item.layerName || `L${item.layer}`}
                    </StatusBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-primary-fixed-dim text-[11px] font-code-sm font-medium">
                    {item.code || '-'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    {isSourceStripped ? (
                      <StatusBadge variant="outline" icon="lock" className="text-[10px]">
                        Sanitized (None)
                      </StatusBadge>
                    ) : source ? (
                      typeof source === 'string' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          <span className="material-symbols-outlined text-[12px]">dataset</span>
                          {source}
                        </span>
                      ) : (
                        <a
                          href={source.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary-fixed hover:underline bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 transition-colors"
                          title={source.title || 'Source'}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {source.type === 'wikipedia' ? 'public' : 'verified'}
                          </span>
                          {source.title && source.title.length > 15 ? source.title.substring(0, 15) + '...' : (source.title || 'Source')}
                        </a>
                      )
                    ) : (
                      <span className="text-[10px] text-outline">Direct Input</span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 text-on-surface-variant text-[11px] truncate max-w-xs">
                    {item.synonyms && item.synonyms.length > 0 
                      ? item.synonyms.join(', ')
                      : '-'
                    }
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleOpenEdit(item, e)}
                        className="p-1 hover:text-primary text-outline rounded transition-colors cursor-pointer"
                        title="Edit Entity"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete entity '${item.name}'?`)) {
                            onDeleteEntity(item.id);
                          }
                        }}
                        className="p-1 hover:text-red-400 text-outline rounded transition-colors cursor-pointer"
                        title="Delete Entity"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Extracted Entity Detail Drawer */}
      <EntityDetailDrawer entity={selectedEntity} />

      {/* Step 2 Bottom: Advanced Cleansing Suite & 2-Axis Radar Co-Location */}
      <div className="p-4 border-t border-border-default bg-surface-card flex-shrink-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cleansing Controls */}
        <CleansingEnginePanel
          isSourceStripped={isSourceStripped}
          onToggleStripSource={onToggleStripSource}
          onRunBackTranslation={onRunBackTranslation}
          onShuffleIDs={onShuffleIDs}
          onAddNoise={onAddNoise}
          onResetData={onResetData}
          isProcessing={isProcessing}
        />

        {/* 2-Axis Radar & Singularity Evaluation */}
        <FidelityRadar
          fidelityScore={fidelityScore}
          privacyScore={privacyScore}
          singularityRisk={singularityRisk}
          isSourceStripped={isSourceStripped}
          isBackTranslated={isBackTranslated}
        />
      </div>

      {/* Entity Add/Edit Modal */}
      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={editingEntity}
      />
    </section>
  );
});
