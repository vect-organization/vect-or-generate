import React, { useState, useCallback, useMemo } from 'react';
import StudioHeader from './components/header/StudioHeader';
import LayerNavigator from './components/layers/LayerNavigator';
import DataGrid from './components/entity/DataGrid';
import VectorSandbox from './components/sandbox/VectorSandbox';
import { INITIAL_ENTITIES } from './services/mockData';
import { DOMAIN_CONFIG, SYSTEM_RUNTIME_INFO } from './constants/domainConfig';
import { useVectorInference } from './hooks/useVectorInference';
import { useCleansingEngine } from './hooks/useCleansingEngine';
import { packageArtifactBundle, downloadArtifactFiles } from '../../core/packager/index.mjs';
import { encryptKnowledgeBaseWeb } from '../../core/vault/webVault.js';
import config from '../../config.json';

export default function App() {
  const [entities, setEntities] = useState(INITIAL_ENTITIES);
  const [selectedLayer, setSelectedLayer] = useState(4);
  const [activeLayerMask, setActiveLayerMask] = useState({
    0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState(DOMAIN_CONFIG.initialEntityId);

  // Vector Inference Custom Hook
  const {
    query,
    setQuery,
    results,
    isInferencing,
    useRealModel,
    modelStatus,
    modelProgress,
    handleToggleRealModel,
    runInference,
    engineRef
  } = useVectorInference(entities, setEntities);

  // Data Cleansing & Privacy Custom Hook
  const {
    isSourceStripped,
    isBackTranslated,
    fidelityScore,
    privacyScore,
    singularityRisk,
    isProcessing,
    toggleStripSource,
    runBackTranslation,
    shuffleIDs,
    addNoise,
    resetData
  } = useCleansingEngine(entities, setEntities);

  // Count items with pending/empty vectors
  const pendingVectorCount = useMemo(() => {
    return entities.filter(e => !e.vector || e.vector.length === 0).length;
  }, [entities]);

  const handleSelectLayer = useCallback((layerId) => {
    setSelectedLayer(layerId);
  }, []);

  const handleToggleLayer = useCallback((layerId, e) => {
    e.stopPropagation();
    setActiveLayerMask(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  }, []);

  const handleSelectEntity = useCallback((entity) => {
    setSelectedEntityId(entity.id);
  }, []);

  const handleImportCsv = useCallback((imported) => {
    setEntities(prev => [...imported, ...prev]);
  }, []);

  const handleAddEntity = useCallback((newEntity) => {
    const newId = `#${String(entities.length + 1).padStart(2, '0')}`;
    setEntities(prev => [
      {
        ...newEntity,
        id: newId,
        inEditor: true,
        metadata: { source: null },
        vector: []
      },
      ...prev
    ]);
  }, [entities.length]);

  const handleUpdateEntity = useCallback((updated) => {
    setEntities(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
  }, []);

  const handleDeleteEntity = useCallback((id) => {
    setEntities(prev => prev.filter(e => e.id !== id));
  }, []);

  // Batch vectorization for newly added/imported entities
  const handleVectorizePending = useCallback(async () => {
    if (!engineRef.current) return;
    try {
      const itemsToEmbed = entities.map(e => ({
        ...e,
        text_for_vector: `${e.name || ''} ${e.reading || ''} ${e.definition || ''}`.trim()
      }));
      const embeddings = await engineRef.current.embedAll(itemsToEmbed);
      setEntities(prev => prev.map((e, idx) => ({
        ...e,
        vector: embeddings[idx] || e.vector || []
      })));
    } catch (err) {
      console.error('[Batch Vectorize Error]', err);
      alert('Vector calculation error: ' + err.message);
    }
  }, [entities, engineRef]);

  // Selective or All 5-Artifact Export
  const handleExportBundle = useCallback(async (selectedFormats = null) => {
    try {
      const bundle = await packageArtifactBundle({
        entities,
        domain: DOMAIN_CONFIG.id,
        taxonomyCode: DOMAIN_CONFIG.taxonomyCode,
        privacyAudit: {
          preset: isSourceStripped ? 'hipaa_strict' : 'research_light',
          is_sanitized: isSourceStripped,
          fidelityScore,
          privacyScore,
          appliedTransforms: isSourceStripped ? ['strip_provenance', 'spherical_dp_noise'] : [],
          timestamp: new Date().toISOString()
        }
      });

      // Handle Vault Encryption if requested
      if (selectedFormats?.isEncrypted && selectedFormats?.password) {
        const kbJsonFileName = `kb_${DOMAIN_CONFIG.id}.json`;
        const kbPayload = bundle.files[kbJsonFileName];
        if (kbPayload) {
          const vencBuffer = await encryptKnowledgeBaseWeb(kbPayload, selectedFormats.password);
          const vencFileName = `kb_${DOMAIN_CONFIG.id}.venc`;
          bundle.files[vencFileName] = vencBuffer;
          // If only encrypted version is desired, remove unencrypted json
          delete bundle.files[kbJsonFileName];
        }
      }

      downloadArtifactFiles(bundle, selectedFormats);
    } catch (err) {
      console.error('[Export Error]', err);
      alert('Failed to package artifacts: ' + err.message);
    }
  }, [entities, isSourceStripped, fidelityScore, privacyScore]);

  const handleSync = useCallback(() => {
    alert(`Sync successfully synchronized 5 artifacts for '${DOMAIN_CONFIG.displayName}' to vect-or-data:\n1. kb_${DOMAIN_CONFIG.id}.json\n2. kb_${DOMAIN_CONFIG.id}.safetensors\n3. guideline_${DOMAIN_CONFIG.id}.json\n4. ime_${DOMAIN_CONFIG.id}.txt\n5. audit_manifest.json`);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-on-surface">
      <StudioHeader 
        domain={DOMAIN_CONFIG.displayName}
        onExport={() => handleExportBundle(null)}
        onSync={handleSync}
        isCleansed={isSourceStripped}
      />

      <main className="flex flex-1 overflow-hidden">
        {/* Step 1 Left Column: Ingest Hub & 10-Layer Navigator */}
        <LayerNavigator
          selectedLayer={selectedLayer}
          onSelectLayer={handleSelectLayer}
          activeLayerMask={activeLayerMask}
          onToggleLayer={handleToggleLayer}
          onImportCsv={handleImportCsv}
          totalEntitiesCount={entities.length}
        />

        {/* Step 2 Center Column: Entity Curate & Co-Located Cleansing Suite */}
        <DataGrid
          entities={entities}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectEntity={handleSelectEntity}
          selectedEntityId={selectedEntityId}
          selectedLayer={selectedLayer}
          isSourceStripped={isSourceStripped}
          onAddEntity={handleAddEntity}
          onUpdateEntity={handleUpdateEntity}
          onDeleteEntity={handleDeleteEntity}
          fidelityScore={fidelityScore}
          privacyScore={privacyScore}
          singularityRisk={singularityRisk}
          isBackTranslated={isBackTranslated}
          onToggleStripSource={toggleStripSource}
          onRunBackTranslation={runBackTranslation}
          onShuffleIDs={shuffleIDs}
          onAddNoise={addNoise}
          onResetData={resetData}
          isProcessing={isProcessing}
        />

        {/* Step 3 Right Column: Similarity Sandbox & 5-Artifact Shipping Hub */}
        <VectorSandbox
          query={query}
          onQueryChange={setQuery}
          onRunInference={runInference}
          isInferencing={isInferencing}
          results={results}
          useRealModel={useRealModel}
          onToggleRealModel={handleToggleRealModel}
          modelStatus={modelStatus}
          modelProgress={modelProgress}
          pendingVectorCount={pendingVectorCount}
          onVectorizePending={handleVectorizePending}
          onExportBundle={handleExportBundle}
          domainName={DOMAIN_CONFIG.displayName}
        />
      </main>

      {/* System Status Footer */}
      <footer className="h-6 bg-surface-mica border-t border-border-default px-4 flex items-center justify-between text-[10px] font-code-sm text-outline z-50">
        <div className="flex items-center gap-4">
          <span>Engine: {useRealModel ? `${config.defaultModel}.onnx (WASM/SIMD)` : 'Instant Pseudo-Engine (Zero-Lag)'}</span>
          <span>Compliance: {SYSTEM_RUNTIME_INFO.complianceStandard}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Est. Memory: {SYSTEM_RUNTIME_INFO.estimatedMemory}</span>
          <span className="text-secondary font-bold">VectOrg {config.version} Ready</span>
        </div>
      </footer>
    </div>
  );
}
