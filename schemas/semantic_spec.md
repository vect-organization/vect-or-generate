# VectOrg 10-Layer Semantic Architecture & Base Specification

**Version**: 1.0.0  
**Compliance**: W3C Semantic Web Stack / Ontology Spectrum / DIKWP Model  
**Maintainer**: 1abcdefggs  
**License**: MIT  

---

## 1. 10-Layer Semantic Knowledge Hierarchy

VectOrEdit operates by separating and synthesizing goals and domain knowledge based on the international 10-layer semantic architecture:

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
{
  "domain": "medical_psychiatry",
  "version": "0.3.0",
  "prefix": "#",
  "dimension": 384,
  "metric": "cosine",
  "is_sanitized": false,
  "fidelity_score": 100.0,
  "entities": [
    {
      "id": "#01",
      "name": "Depression (Depressive Episode)",
      "reading": "depression",
      "definition": "A mood disorder characterized by persistent depressive mood, loss of interest or pleasure, and fatigue.",
      "layer": 4,
      "layerName": "L4 Semantic",
      "category": "Mood Disorder",
      "code": "ICD-10: F32",
      "synonyms": ["Major Depressive Disorder", "Depressive State", "Melancholia"],
      "inEditor": true,
      "metadata": {
        "source": {
          "type": "official_guideline",
          "title": "Clinical Practice Guidelines for Depression",
          "url": "https://example.org/guidelines/depression.html",
          "retrieved_at": "2026-08-22",
          "raw_snippet": "Depression is a syndrome accompanied by disturbances in mood, motivation, and thinking..."
        }
      },
      "vector": [ 0.0123, -0.0456, 0.0789, 0.0 /* 384-dim normalized Float32 array */ ]
    }
  ]
}
```

