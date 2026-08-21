# VectOrGenerate (`vect-or-generate`)

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Version-0.2.0-indigo.svg?style=for-the-badge" alt="Version 0.2.0" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg?style=for-the-badge" alt="Node.js >= 18.0.0" />
  <img src="https://img.shields.io/badge/AI_Model-Multilingual_E5-purple.svg?style=for-the-badge" alt="Multilingual E5 Small" />
  <img src="https://img.shields.io/badge/Vector_Dim-384--dim_Float32-critical.svg?style=for-the-badge" alt="384-dim Float32" />
  <img src="https://img.shields.io/badge/Standard-W3C_DIKWP_10--Layer-teal.svg?style=for-the-badge" alt="10-Layer Semantic" />
</p>

**VectOrGenerate** is a standalone, AI-powered knowledge synthesis pipeline and vector dictionary builder for [VectOrEditOr](https://github.com/vect-or-edit-or).  
It transforms arbitrary domain text (medical, legal, creative, real estate) into compliant **10-Layer Semantic Knowledge Bases**, generating 384-dimensional vector embeddings locally via ONNX Runtime without external API keys or cloud dependencies.

---

## 🍳 Concept Architecture (The Kitchen Model)

VectOrGenerate adopts a clean, modular input-to-output pipeline structured around a clear **"Kitchen & Recipe"** workflow:

```mermaid
flowchart LR
    subgraph Step1 [1. Ingredients]
        In["inputs/<br/>(Raw CSV / JSON / Text)"]
    end

    subgraph Step2 [2. Recipes]
        Recipe["recipes/<br/>(Conversion Scripts)"]
    end

    subgraph Step3 [3. Core Engine]
        Core["core/<br/>(E5 Embedder & Validator)"]
    end

    subgraph Step4 [4. Compiled Dishes]
        Out["outputs/<br/>(kb_*.json / guideline_*.json)"]
    end

    In --> Recipe
    Recipe --> Core
    Core --> Out
```

| Component | Directory | Role & Description |
| :--- | :--- | :--- |
| **Standards** | `schemas/` | W3C/DIKWP 10-layer semantic specifications and JSON Schema contracts. |
| **Templates** | `templates/` | Starter templates for raw items and custom conversion recipes. |
| **Ingredients** | `inputs/` | Dropzone for source documents, CSVs, or unvectorized JSON files. |
| **Recipes** | `recipes/` | Parsers and workflow scripts defining how raw data is processed. |
| **Kitchen** | `core/` | Reusable Transformer embedding engine (`multilingual-e5-small`) and validators. |
| **Dishes** | `outputs/` | Ready-to-use 384-dim vector knowledge bases (`kb_*.json`) for VectOrEditOr. |

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/1abcdefggs/vect-or-generate.git
cd vect-or-generate

# Install dependencies (Transformers ONNX runtime)
npm install
```

### 2. Generate a Knowledge Base

#### A. Using the Standard CLI
Place your raw JSON file into `inputs/my_domain_data.json`, then run:

```bash
# Generate 384-dim vector embeddings
node bin/cli.mjs --input inputs/my_domain_data.json --output outputs/kb_my_domain.json

# Or using the domain shorthand:
node bin/cli.mjs --domain my_domain
```

#### B. Dry-Run Mode (Validation Only)
Quickly validate JSON structure and schema compliance without computing embeddings:

```bash
node bin/cli.mjs --input inputs/my_domain_data.json --output outputs/kb_my_domain.json --dry-run
```

---

## 📐 Base Specification (`schemas/`)

Every output produced by VectOrGenerate strictly conforms to the **10-Layer Semantic Hierarchy**:

```
【 Purpose / Pragmatic 】
  10. Intent & Purpose (Context & Goal)
   9. Dynamic Inference & Lint Rules  -> outputs/guideline_{domain}.json

【 Semantic / Knowledge 】
   8. Knowledge Graph / Ontology
   7. Document Schema / Slot Presets  -> outputs/preset_{domain}.json
   6. Domain Corpus & Sample Phrases
   5. Fact Base & 384-dim Vectors     -> outputs/kb_{domain}.json

【 Lexical & Syntactic 】
   4. Taxonomy (Hierarchy)
   3. Thesaurus (Synonyms)
   2. Terminology & Definitions
   1. Controlled Vocabulary / IME     -> outputs/ime_{domain}.txt
```

---

## 🛠️ Programmatic API Usage

You can embed VectOrGenerate into Web UIs, Electron apps, or Node.js backends:

```javascript
import { embedPassage, embedQuery } from 'vect-or-generate';

// 1. Embed a document passage (adds "passage: " prefix for E5)
const docVector = await embedPassage("Clause snippet regarding confidentiality obligations and disclosure restrictions.");
console.log("Vector dimensions:", docVector.length); // 384

// 2. Embed a user search query (adds "query: " prefix for E5)
const queryVector = await embedQuery("NDA non-disclosure agreement obligations");
console.log("Query dimensions:", queryVector.length); // 384
```

---

## 📄 License & Copyright

Copyright (c) 2026 1abcdefggs  
Released under the [MIT License](LICENSE).  
Repository: [https://github.com/1abcdefggs/vect-or-generate](https://github.com/1abcdefggs/vect-or-generate)
