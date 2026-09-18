# Generator Studio (`studio/`)

> **Interactive Web GUI Workbench for Building 10-Layer Semantic Knowledge Bases & In-Browser AI Vector Inference.**

---

## 🌟 Key Features

1. **10-Layer Semantic Architecture (L0〜L9/L10)**:
   - Visual layer navigation from raw source data (`L0`) to high-dimensional embeddings (`L6`), dynamic linter guidelines (`L7`/`L9`), and intent resolution (`L10`).
2. **In-Browser ONNX Vector Inference**:
   - High-precision text embedding computation using `multilingual-e5-small.onnx` via Transformers.js in Web Workers (WebGPU/WASM).
   - Zero-lag instant prototyping using mathematical pseudo-embeddings.
3. **Advanced Cleansing & Privacy Suite**:
   - Provenance stripping, back-translation syntactic obfuscation, ID permutation shuffle, and differential privacy noise ($\text{DP-}\epsilon$).
   - Real-time 2-axis radar visualization comparing Semantic Retention (Fidelity) vs. Syntactic Divergence (Privacy).
4. **Drag & Drop CSV/JSON Ingestion**:
   - Instant conversion of CSV/Excel exports into the standardized 10-layer VectOrg 0.3.0 schema.
5. **1-Click 5-Artifacts Sync & Export**:
   - Generates the complete artifact bundle ready for VectOrEdit: `kb_{domain}.json`, `kb_{domain}.safetensors`, `guideline_{domain}.json`, `ime_{domain}.txt`, and `audit_manifest_{domain}.json`.

---

## 🚀 Quick Start

### Run Development Server
```bash
# From workspace root
npm run studio

# Or inside studio/
cd studio
npm run dev
```

### Build Production Bundle
```bash
npm run build
```

---

## 📐 Technology Stack

- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS (Material Design 3 / Fluent Mica Dark Theme)
- **AI / Embeddings**: Transformers.js (`@huggingface/transformers`) + ONNX Runtime Web
- **Data Processing**: PapaParse (CSV) + Custom Vector Math Engine
- **Linter**: Oxlint
