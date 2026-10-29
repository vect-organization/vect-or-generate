## [0.3.4] - 2026-10-01

### Added
- `recipes/icd10cm_v2_recipe.mjs`: CDC ICD-10-CM → schema v2; synthesizes missing category ancestors (`stub: true`) so `broader` is closed (A-F: 4874/4874 dangling → 0); `notations[].version` = release
- `scripts/migrate-v1-to-v2.mjs` (Phase5): scheme-qualified ids (`c:<scheme>:<id>`), `forms[]` for reading, `legacy` bucket, registry-resolved embedding facet, `lang` default `und`
- `core/compiler/projectV2.mjs`: `normalizeKbPayload()` — array / `{entities}` / `{concepts}` → engine items
- `core/validator.mjs#validateKnowledgeBaseV2`: registry membership + referential integrity + embedding dim
- `tests/migrate.test.mjs`
- `registry/facets.json` 1.1.0: `modelId` / `geometry` / prefixes on embedding facets, open `vocabularies`

### Changed
- `schemas/knowledge_base.schema.v2.json`: closed enums (relation type, external source, modality) and `layer` max removed → registry-validated; v0.3.0 files with `version` only and pre-embedding inputs now validate
- `core/registryLoader.mjs`: JSON import attribute instead of `node:fs` (usable from Studio)
- `core/compiler/pipeline.mjs`: emits `schemaVersion` (shape, fixed `0.3.0`) separately from `version` (build); fixes `tests/compiler.test.mjs` drift
- `core/packager/guidelineGenerator.mjs`: `schemaVersion: 0.4.0`, per-rule `facet`, `requiredLayers` derived from registry
- `studio/src/services/csvParser.js`: no silent rewrite of out-of-range `layer` to 4 (`layerUnmapped` flag); correct `layerName`
- `core/vault/index.js` (same file in vect-or-edit): `.venc` files are now encrypted with one shared app secret (the one `webVault.js` already used), so a file made by the CLI, the Studio or the Editor opens in the others. Decrypting still tries the old per-machine `VECTOR_APP_SECRET` and the old fallback, so existing files keep opening. `VECTOR_APP_SECRET` is no longer required.

## [0.3.3] - 2026-09-18

- Bumped package version to **0.3.3** in `package.json` and `config.json`.
- Updated README version badge to reflect 0.3.3.

## [0.3.2] - 2026-09-18

- Bumped package version to **0.3.2** in `package.json` and `config.json`.
- Updated README version badge to reflect 0.3.2.
- Adjusted documentation references to the new version.
- Ran `npm audit fix` to address high‑severity dependencies.
