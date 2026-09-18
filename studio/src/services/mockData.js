import { pseudoEmbedText } from './vectorMath';

/**
 * 10-Layer Semantic Architecture Sample Knowledge Entities (VectOrg 0.3.0 Standard)
 * Covering all 10 layers from L0 Raw String to L9 Skeleton Template
 */
export const INITIAL_ENTITIES = [
  // --- L0: Raw String & External Provenance ---
  {
    id: "#00",
    name: "ISO 24613 Language Resource Management Specification (Raw Extract)",
    reading: "iso standard extract",
    definition: "Lexical Markup Framework (LMF) Core Model ISO 24613-1 official specification archive.",
    layer: 0,
    layerName: "L0 Raw String",
    category: "standards_archive",
    code: "RAW: ISO-24613-1",
    synonyms: ["ISO 24613", "LMF Specification"],
    inEditor: false,
    metadata: {
      source: {
        type: "official_standard",
        title: "ISO 24613-1:2019 Core Model",
        url: "https://www.iso.org/standard/66827.html",
        retrieved_at: "2026-09-18",
        raw_snippet: "Part 1: Core model provides meta-model specification for electronic dictionaries and NLP lexicons."
      }
    },
    vector: pseudoEmbedText("ISO 24613 Language Resource Management Lexical Markup Framework Core Model")
  },

  // --- L1 / L4: Lemma / Concept Definition ---
  {
    id: "#01",
    name: "Artificial Intelligence",
    reading: "artificial intelligence",
    definition: "The capability of computational systems to perform cognitive tasks typically associated with human intelligence such as reasoning, learning, and problem solving.",
    layer: 4,
    layerName: "L4 Semantic",
    category: "computer_science",
    code: "WD: Q11660",
    synonyms: ["AI", "Machine Intelligence", "Synthetic Intelligence"],
    inEditor: true,
    metadata: {
      wikidata: "Q11660",
      source: {
        type: "encyclopedia",
        title: "Artificial Intelligence - Standard Definition",
        url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
        retrieved_at: "2026-09-18",
        raw_snippet: "Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of humans or animals."
      }
    },
    vector: pseudoEmbedText("Artificial Intelligence Machine Learning Cognitive Systems Reasoning Learning Q11660")
  },

  // --- L4: Semantic / Concept Definition ---
  {
    id: "#02",
    name: "Vector Embedding",
    reading: "vector embedding",
    definition: "A continuous vector representation of discrete concepts (words, phrases, entities) projected into a high-dimensional dense geometric space.",
    layer: 4,
    layerName: "L4 Semantic",
    category: "natural_language_processing",
    code: "CONCEPT: NLP-VEC-01",
    synonyms: ["Dense Vector", "Word Embedding", "Semantic Vector"],
    inEditor: true,
    metadata: {
      source: {
        type: "technical_reference",
        title: "Dense Vector Representations in NLP",
        url: "https://example.org/nlp/embeddings",
        retrieved_at: "2026-09-18",
        raw_snippet: "Embeddings map discrete categorical variables into a continuous vector space where semantic distance corresponds to conceptual similarity."
      }
    },
    vector: pseudoEmbedText("Vector Embedding Dense Vector High-Dimensional Geometry Semantic Search NLP")
  },

  // --- L4: Semantic ---
  {
    id: "#03",
    name: "Ontology",
    reading: "ontology",
    definition: "A formal representation of knowledge as a set of concepts within a domain and the relationships between those concepts.",
    layer: 4,
    layerName: "L4 Semantic",
    category: "knowledge_representation",
    code: "W3C: OWL-2",
    synonyms: ["Knowledge Graph", "Conceptual Model"],
    inEditor: true,
    metadata: {
      source: {
        type: "w3c_recommendation",
        title: "W3C OWL 2 Overview",
        url: "https://www.w3.org/TR/owl2-overview/",
        retrieved_at: "2026-09-18",
        raw_snippet: "An ontology is an explicit formal specification of the terms in the domain and relations among them."
      }
    },
    vector: pseudoEmbedText("Ontology Knowledge Graph Conceptual Schema OWL W3C Relations Taxonomies")
  },

  // --- L5: Pragmatic / Domain Context ---
  {
    id: "#05",
    name: "Semantic Search Engine",
    reading: "semantic search engine",
    definition: "An information retrieval application leveraging vector proximity and ontology constraints to find conceptually relevant answers beyond lexical keyword matching.",
    layer: 5,
    layerName: "L5 Pragmatic",
    category: "application_architecture",
    code: "ARCH: SEARCH-01",
    synonyms: ["Neural Search", "Vector Retrieval System"],
    inEditor: true,
    metadata: {
      source: {
        type: "architecture_whitepaper",
        title: "Local-First Semantic Search Architecture",
        url: "https://example.org/search/architecture",
        retrieved_at: "2026-09-18",
        raw_snippet: "Semantic search uses vector similarity combined with symbolic filtering to deliver context-aware retrieval."
      }
    },
    vector: pseudoEmbedText("Semantic Search Engine Vector Search Approximate Nearest Neighbor HNSW Retrieval")
  },

  // --- L7: Policy / Linter Validation Rule ---
  {
    id: "#07",
    name: "Policy Rule: Vector Dimension Consistency",
    reading: "vector dimension consistency rule",
    definition: "Validation constraint enforcing that all dense vector embeddings strictly match the model specification (384 dimensions Float32).",
    layer: 7,
    layerName: "L7 Linter",
    category: "validation_rule",
    code: "RULE: DIM-CHECK-384",
    synonyms: ["Dimension Check", "Shape Validator"],
    inEditor: false,
    metadata: {
      source: {
        type: "schema_specification",
        title: "Knowledge Base Integrity Rules",
        url: "https://example.org/schema/rules",
        retrieved_at: "2026-09-18",
        raw_snippet: "Any vector with dimension not equal to 384 must be rejected at compile time."
      }
    },
    vector: pseudoEmbedText("Policy Rule Linter Validation Constraint Dimension Check 384 Float32 Integrity")
  },

  // --- L9: Skeleton / Document Blueprint Template ---
  {
    id: "#09",
    name: "Standard Dictionary Article Blueprint",
    reading: "dictionary article blueprint",
    definition: "Standard structural template for dictionary entries specifying slots for headword, reading, definition, etymology, and usage examples.",
    layer: 9,
    layerName: "L9 Skeleton",
    category: "document_template",
    code: "TMPL: LEX-ARTICLE-01",
    synonyms: ["Dictionary Template", "Lexical Entry Schema"],
    inEditor: false,
    metadata: {
      source: {
        type: "editorial_guide",
        title: "Lexicographic Entry Formatting Guide",
        url: "https://example.org/guide/lexicon",
        retrieved_at: "2026-09-18",
        raw_snippet: "Each entry must include an orthographic headword, phonetic transcription, part-of-speech tag, definition, and domain categorization."
      }
    },
    vector: pseudoEmbedText("Dictionary Entry Template Article Blueprint Lexicography Schema Layout")
  }
];
