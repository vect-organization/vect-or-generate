# VectOrEditOr 10-Layer Semantic Architecture & Base Specification

**Version**: 1.0.0  
**Compliance**: W3C Semantic Web Stack / Ontology Spectrum / DIKWP Model  
**Maintainer**: 1abcdefggs  
**License**: MIT  

---

## 1. 10-Layer Semantic Knowledge Hierarchy

VectOrEditOr operates by separating and synthesizing goals and domain knowledge based on the international 10-layer semantic architecture:

```
【 Pragmatic / Purpose Level 】
  ▲
  │  10. Intent & Purpose (Raison d'être)
  │      └ Authoring context defining who the text is for, its goal, and desired tone.
  │   9. Inference Rules & Dynamic Logic (Linter)
  │      └ Rule engine evaluating dynamic constraints and contextual suggestions (`guideline_*.json`).
  │
【 Semantic / Knowledge Network Level 】
  │   8. Knowledge Graph / Ontology
  │      └ Associative relation graph linking multiple entity sets (e.g. Directory ⇄ Address ⇄ Valuation).
  │   7. Schema & Slot Presets (Template)
  │      └ Structural blueprint and required field slots for target documents (`preset_*.json`).
  │   6. Corpus & Exemplars
  │      └ Historical reference texts, model sentences, and seasonal phrasing collections.
  │   5. Fact Base & Knowledge Base
  │      └ Entity records with 384-dimensional vector embeddings (`kb_*.json`).
  │
【 Syntactic & Lexical Level 】
  │   4. Taxonomy
  │      └ Hierarchical parent-child classifications (e.g. Mail > Letter > Postcard > New Year Card).
  │   3. Thesaurus
  │      └ Synonyms, paraphrases, and colloquial equivalence sets.
  │   2. Dictionary & Terminology
  │      └ 1-to-1 term and definition mappings.
  │   1. Controlled Vocabulary / Input Method Editor (IME)
  │      └ Standardized vocabulary list controlling orthographical variants (`ime_*.txt`).
  ▼
【 Raw Data / Characters Level 】
```

---

## 2. Standard 4-Prefix File Artifact Mapping

| File Artifact | Corresponding Layer | Role & Content | Format |
| :--- | :---: | :--- | :--- |
| **`kb_{domain}.json`** | Layers 5 / 8 / 6 | Entity knowledge base with precomputed 384-dim vector embeddings | JSON (Float32 Vector) |
| **`guideline_{domain}.json`** | Layers 9 / 10 | Dynamic real-time linter verification rules (regex and string constraints) | JSON (Rule specifications) |
| **`preset_{domain}.json`** | Layer 7 | Standard document blueprint with structural slots | JSON (Template structure) |
| **`ime_{domain}.txt`** | Layers 1 / 3 | Prefix-match and phonetic autocomplete dictionary | TSV (`reading\tword\tpos`) |

---

## 3. Standard Knowledge Base JSON Schema (`kb_{domain}.json`)

```json
[
  {
    "id": "Unique identifier (string: e.g. 'LEGAL-001', 'MED-F01')",
    "name": "Canonical term / title / label (string)",
    "reading": "Phonetic reading in Hiragana or Romanized alphabet (string: optional)",
    "text_for_vector": "Text passage evaluated for 384-dim vector embedding (string: required)",
    "vector": [ 0.0123, -0.0456, ... /* 384-dim normalized Float32 array */ ],
    "template": "Snippet text inserted into editor upon selection (string: optional)",
    "metadata": {
      "category": "Classification tag (string: optional)",
      "tags": ["tag1", "tag2"]
    }
  }
]
```
