/**
 * Generator Studio - Domain & Environment Configuration
 */

import config from '../../../config.json';

export const DOMAIN_CONFIG = {
  id: "general_knowledge",
  displayName: "General Knowledge Dictionary",
  version: config.version,
  taxonomyCode: "ISO 24613 / W3C SKOS",
  dimension: config.dimension,
  precision: "Float32",
  normalization: "L2 Normalized",
  metric: "cosine",
  defaultQuery: "Artificial intelligence and machine learning models",
  initialEntityId: "#01",
};

export const SEMANTIC_LAYERS = [
  { id: 0, name: "L0 Raw String", icon: "layers", desc: "Original Source / Provenance", count: 5 },
  { id: 1, name: "L1 Lemma", icon: "account_tree", desc: "Headword / Standard Notation", count: 5 },
  { id: 2, name: "L2 Morph", icon: "hub", desc: "Part of Speech / Morpheme", count: 5 },
  { id: 3, name: "L3 Syntax", icon: "settings_input_component", desc: "Syntax / Dependency", count: 4 },
  { id: 4, name: "L4 Semantic", icon: "psychology", desc: "Concept / Definition", count: 5, active: true },
  { id: 5, name: "L5 Pragmatic", icon: "data_object", desc: "Context / Domain Hierarchy", count: 3 },
  { id: 6, name: "L6 Vector", icon: "scatter_plot", desc: `${config.dimension}-dim Embeddings`, count: 5 },
  { id: 7, name: "L7 Linter", icon: "rule", desc: "Policy / Verification Rules", count: 2 },
  { id: 8, name: "L8 Logic", icon: "account_tree", desc: "Causal Graph / Ontology", count: 1 },
  { id: 9, name: "L9 Skeleton", icon: "description", desc: "Document Blueprint / Template", count: 1 },
];


export const NAV_ITEMS = [
  { id: "models", label: "Models", active: true },
  { id: "datasets", label: "Datasets", active: false },
  { id: "layers", label: "Layers", active: false },
  { id: "inference", label: "Inference", active: false },
];

export const CLEANSING_PARAMS = {
  baselineFidelity: 98.4,
  baselinePrivacy: 91.8,
  stripSourcePrivacyBoost: 8.2,
  backTranslationFidelity: 96.8,
  backTranslationPrivacy: 98.5,
  backTranslationNoise: 0.03,
  shufflePrivacyBoost: 3.5,
  differentialPrivacyNoise: 0.05,
  differentialPrivacyPenalty: 2.8,
  differentialPrivacyBoost: 5.0,
  minFidelityThreshold: 70.0,
  maxPrivacyThreshold: 100.0,
};

export const SYSTEM_RUNTIME_INFO = {
  estimatedMemory: "42.8 MB",
  complianceStandard: "PASSED (ISO/IEC 27701 & ISO 8000 Data Quality)",
};
