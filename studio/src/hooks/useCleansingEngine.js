import { useState, useCallback } from 'react';
import { 
  stripSourceProvenance, 
  shuffleEntities, 
  addDifferentialNoise 
} from '../services/vectorMath';
import { INITIAL_ENTITIES } from '../services/mockData';
import { CLEANSING_PARAMS } from '../constants/domainConfig';

/**
 * Custom Hook for Cleansing & Privacy Operations
 */
export function useCleansingEngine(entities, setEntities) {
  const [isSourceStripped, setIsSourceStripped] = useState(false);
  const [isBackTranslated, setIsBackTranslated] = useState(false);
  const [fidelityScore, setFidelityScore] = useState(CLEANSING_PARAMS.baselineFidelity);
  const [privacyScore, setPrivacyScore] = useState(CLEANSING_PARAMS.baselinePrivacy);
  const [singularityRisk, setSingularityRisk] = useState('LOW');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleStripSource = useCallback(() => {
    setIsSourceStripped(prev => {
      const next = !prev;
      if (next) {
        setEntities(current => stripSourceProvenance(current));
        setPrivacyScore(p => Math.min(CLEANSING_PARAMS.maxPrivacyThreshold, p + CLEANSING_PARAMS.stripSourcePrivacyBoost));
      } else {
        setEntities(INITIAL_ENTITIES);
        setPrivacyScore(CLEANSING_PARAMS.baselinePrivacy);
      }
      return next;
    });
  }, [setEntities]);

  const runBackTranslation = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setEntities(current => current.map(item => ({
        ...item,
        definition: item.definition.includes('[Sanitized via Paraphrase]')
          ? item.definition
          : `[Sanitized via Paraphrase] ${item.definition}`,
        vector: item.vector ? addDifferentialNoise(item.vector, CLEANSING_PARAMS.backTranslationNoise) : item.vector
      })));
      setIsBackTranslated(true);
      setFidelityScore(CLEANSING_PARAMS.backTranslationFidelity);
      setPrivacyScore(CLEANSING_PARAMS.backTranslationPrivacy);
      setSingularityRisk('LOW');
      setIsProcessing(false);
    }, 400);
  }, [setEntities]);

  const shuffleIDs = useCallback(() => {
    setEntities(current => shuffleEntities(current));
    setPrivacyScore(p => Math.min(CLEANSING_PARAMS.maxPrivacyThreshold, p + CLEANSING_PARAMS.shufflePrivacyBoost));
  }, [setEntities]);

  const addNoise = useCallback(() => {
    setEntities(current => current.map(item => ({
      ...item,
      vector: addDifferentialNoise(item.vector, CLEANSING_PARAMS.differentialPrivacyNoise)
    })));
    setFidelityScore(f => Math.max(CLEANSING_PARAMS.minFidelityThreshold, f - CLEANSING_PARAMS.differentialPrivacyPenalty));
    setPrivacyScore(p => Math.min(CLEANSING_PARAMS.maxPrivacyThreshold, p + CLEANSING_PARAMS.differentialPrivacyBoost));
  }, [setEntities]);

  const resetData = useCallback(() => {
    setEntities(INITIAL_ENTITIES);
    setIsSourceStripped(false);
    setIsBackTranslated(false);
    setFidelityScore(CLEANSING_PARAMS.baselineFidelity);
    setPrivacyScore(CLEANSING_PARAMS.baselinePrivacy);
    setSingularityRisk('LOW');
  }, [setEntities]);

  return {
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
  };
}
