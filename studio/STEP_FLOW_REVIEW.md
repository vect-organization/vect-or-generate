# Studio STEP1–3 Flow Review

Reviewed against `studio/src` (App.jsx, hooks, components). Entries are appended as the review proceeds.

## Layout intent
- 3 columns always visible, left to right: input -> work -> output (NotebookLM-like: Sources | Chat | Studio).
- Purpose: the whole pipeline and its 3 steps are visible at a glance.

## STEP 1: Ingest & Schema (left column)
Code: `LayerNavigator.jsx`, `CsvImporter.jsx`, `csvParser.js`

Current flow:
```
File (CSV/TSV/JSON/XML, drag & drop)
  -> parseAndNormalizeData()
  -> handleImportCsv: entities = [...imported, ...entities]
```
- Imported entities get no vector (`vector: []`).
- Layer selection (L0–L9) and `activeLayerMask` only change the grid view.

User notes:
- Input should be about bringing in source data. The L1–L10 list is the whole vect project's architecture, so it is questionable whether Step 1 needs it.
- Counterpoint: showing L1–L10 while using the tools/Editor may help users grasp the overall design and logic, which deepens understanding.

Code facts relevant to this question:
- `selectedLayer` (default 4) filters the DataGrid: `item.layer === selectedLayer` (`DataGrid.jsx:38-39`). So the layer list is currently the only way to browse entities by layer, and a default of 4 hides entities in the other layers.
- `activeLayerMask` (checkboxes) is stored in `App.jsx` but never read by DataGrid, the sandbox or the packager. The checkboxes currently do nothing functional.
- Neither value is part of the import step; `CsvImporter` does not assign a layer.

Options (undecided):
- A. Keep as is, but make it purely a layer filter/legend with a short explanation per layer.
- B. Separate roles: Step 1 holds only Ingest (file import, source list, counts); move the L1–L10 navigator out to a persistent "map" element (header or collapsible panel) that shows where the data sits in the 10 layers.
- C. Keep in Step 1 but make it meaningful for input: on import, let the user assign or confirm the target layer, so the layer list answers "where does this data go?".

Decisions:
- The layer checkboxes (`activeLayerMask`) are planned for removal. Removal scope when implemented: checkbox UI and `onToggleLayer` in `LayerNavigator.jsx`, `activeLayerMask` / `handleToggleLayer` state in `App.jsx`. Not yet implemented.
- Layer list direction (A/B/C) still undecided.

## STEP 2: Curate & Sanitize (center column)
Code: `DataGrid.jsx`, `useCleansingEngine.js`, `CleansingEnginePanel.jsx`, `FidelityRadar.jsx`

User notes:
- (pending)

## STEP 3: Evaluate & Ship (right column)
Code: `VectorSandbox.jsx`, `useVectorInference.js`, `ArtifactExportPanel.jsx`, `core/packager`

User notes:
- Question: does Step 3 output the dictionary in the format of `schemas/knowledge_base.schema.v2.json`?

Code facts (answer):
- Export path: `packageArtifactBundle` (`core/packager/index.mjs`) -> `compileData` (`core/compiler/pipeline.mjs`) -> `kb_{domain}.json`.
- `compileData` emits the LEGACY shape: `schemaVersion: '0.3.0'` with a flat `entities[]` (id, name, reading, definition, layer, vector...). It never emits `concepts[]`/`forms[]`.
- That is valid under schema v2 (the `entities[]` branch of its `anyOf`), but it is not the new concept-centric v2 format (notations, labels, senses, relations, embeddings per facet).
- The Studio itself only edits flat entities (name/reading/definition/layer), so it cannot author concepts[] data today.
- `compileData` hard-codes `is_sanitized: false` and `fidelity_score: 100`. The Studio's cleansing result is only passed into the audit manifest (`privacyAudit`), so kb_*.json does not reflect it (to be confirmed against `auditGenerator.mjs:68`, which also sets `is_sanitized: false`).

## Open issues found in code
1. Strip Source off / Reset restores `INITIAL_ENTITIES`, discarding imported and edited data.
2. `addNoise` has no guard for empty vectors (imported entities have `vector: []`).
3. Export is not gated on vectorization (`pendingVectorCount` is display only).
4. `activeLayerMask` is not passed to `packageArtifactBundle`.
5. `handleSync` is an alert stub; nothing is written to vect-or-data.
6. Fidelity/privacy scores are constants from `CLEANSING_PARAMS`, not measured.
7. Order of vectorize / noise / export is not enforced; re-embedding wipes noise.
