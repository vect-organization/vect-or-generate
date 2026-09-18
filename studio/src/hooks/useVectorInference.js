import { useState, useEffect, useCallback, useRef } from 'react';
import { createInferenceEngine } from '../services/inferenceEngine';
import { DOMAIN_CONFIG } from '../constants/domainConfig';

/**
 * Custom Hook for WebWorker ONNX / Instant Pseudo Inference
 * Delegating to the deep InferenceEngine module.
 */
export function useVectorInference(entities, setEntities) {
  const [query, setQuery] = useState(DOMAIN_CONFIG.defaultQuery);
  const [results, setResults] = useState([]);
  const [isInferencing, setIsInferencing] = useState(false);
  const [useRealModel, setUseRealModel] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelProgress, setModelProgress] = useState(null);

  const engineRef = useRef(null);

  // Initialize Inference Engine
  useEffect(() => {
    const engine = createInferenceEngine({ initialMode: 'pseudo' });
    engineRef.current = engine;

    const unsubStatus = engine.subscribeStatus((status) => {
      setModelStatus(status === 'idle' ? null : status);
    });

    const unsubProgress = engine.subscribeProgress((prog) => {
      setModelProgress(prog);
    });

    const unsubError = engine.subscribeError((err) => {
      alert('Model inference error: ' + err);
      setIsInferencing(false);
    });

    return () => {
      unsubStatus();
      unsubProgress();
      unsubError();
      engine.terminate();
    };
  }, []);

  const handleToggleRealModel = useCallback(async (useReal) => {
    setUseRealModel(prev => {
      if (useReal === prev) return prev;
      return useReal;
    });

    const engine = engineRef.current;
    if (!engine) return;

    if (useReal) {
      engine.setMode('onnx');
      try {
        const updated = await engine.embedAll(entities);
        setEntities(updated);
      } catch (err) {
        console.error('[useVectorInference] Real model batch embedding failed:', err);
      }
    } else {
      engine.setMode('pseudo');
      const updated = await engine.embedAll(entities);
      setEntities(updated);
      setModelStatus(null);
      setModelProgress(null);
    }
  }, [entities, setEntities]);

  const runInference = useCallback(async () => {
    if (!query.trim() || !engineRef.current) return;
    setIsInferencing(true);

    try {
      const topMatches = await engineRef.current.rankMatches(query, entities, { limit: 4 });
      setResults(topMatches);
    } catch (err) {
      console.error('[useVectorInference] Query inference error:', err);
    } finally {
      setIsInferencing(false);
    }
  }, [query, entities]);

  return {
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
  };
}
