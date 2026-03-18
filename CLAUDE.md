# iso27001 — ISO/IEC 27001:2022 ISMS

## What This Is
Structured knowledge base for ISO/IEC 27001:2022 Information Security Management System and Annex A controls. SPA explorer with JSON data layers.

## Architecture
- **SPA**: `index.html` + `app.js` + `style.css` (vanilla JS, no build step)
- **Data**: JSON files across controls, requirements, cross-references, risk-management, evidence, templates
- **Schema**: GRC Portfolio v2.0 Standardized Schema

## Key Data Files
- `controls/library.json` — 93 Annex A controls across 4 themes (organizational, people, physical, technological)
- `controls/domains.json` — Domain structure
- `requirements/by-domain/` — 4 themes: organizational.json (37 controls), people.json (8), physical.json (14), technological.json (34)
- `cross-references/nist-mapping.json` — Cross-mapped to NIST CSF 2.0
- `cross-references/rmit-mapping.json` — Cross-mapped to BNM RMiT
- `templates/soa-template.json` — Statement of Applicability template

## Conventions
- Kebab-case slugs for all IDs
- Control numbering: A.5-A.8 (Organizational, People, Physical, Technological)
- 2022 edition consolidated from 114 to 93 controls — do not use 2013 numbering

## Important
- ISO 27001:2022 restructured controls into 4 themes (was 14 domains in 2013)
- SoA (Statement of Applicability) must justify inclusion/exclusion of each control
- Annex A controls are normative reference — clause 4-10 are ISMS management requirements

## Related Repos
- `nacsa/` — ISO 27001 mappings in `cross-references/framework-mappings.json`
- `nist/` — NIST CSF 2.0 cross-walk
- `RMIT/` — RMiT comparison mappings
- `soc2/` — SOC 2 to ISO 27001 mapping
