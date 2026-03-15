# Ditis Roadmap

## Ditis Core — Platform

### Data Layer
- [x] SQLite database with Drizzle ORM
- [x] Schema: `targets` table with 6-factor scoring model
- [x] Seed data: 13 targets (Tier 1–4) from spec
- [x] Drizzle migrations (auto-applied on startup)
- [x] `expeditions` table (stage, status, budget, team, dates)
- [ ] `sensor_passes` table (drone surveys linked to targets)
- [x] `field_reports` table (free-text + structured findings — `notes` table)
- [x] `sources` table (archival documents, links, confidence weight)

### Scoring Engine
- [x] 6-factor weighted composite score
- [x] Score stored and indexed for fast ranking
- [x] Score recalculation API endpoint (`PATCH /targets/:id/scores`)
- [x] Go/No-Go gate indicator (score + legal feasibility thresholds)
- [x] Event-driven re-score when new source is added (historical_confidence = avg source confidence_weight)
- [ ] Drift/decay model (score degrades without recent validation)

### REST API
- [x] JSON REST API under `/api/` prefix (targets, sources, notes, expeditions CRUD)
- [x] OpenAPI 3.1 spec auto-generated via `hono-openapi` at `/api/openapi.json`
- [x] Scalar API reference UI at `/api/docs`
- [x] Zod request/response schemas (`src/schemas.ts`)

### Ingest Pipeline
- [x] Manual target entry form (UI)
- [ ] Archival document upload + OCR (basic)
- [ ] NLP/NER extraction (ships, dates, locations, cargo)
- [ ] Geocoding of location references from historical text
- [ ] Sensor data ingest (sonar imagery → anomaly flag)

---

## Ditis Core — UI

### Map
- [x] Full-screen Deck.gl + MapLibre GL map
- [x] Targets as color-coded score dots
- [x] Hover tooltip (name, score, tier)
- [x] Click to fly-to and select target
- [x] Dark / light mode toggle (persisted)
- [x] Search/filter sidebar synced to map (non-matching dots greyed out)
- [x] Layer toggles (historical trade routes: Spanish Flota, Manila Galleon, Portuguese India, Dutch/English East India)
- [ ] Search area draw tool → filter targets within polygon
- [ ] Heatmap overlay for target density
- [x] Replace externally loaded libraries with direct imports & build with `bun build`

### Sidebar & Target Intelligence
- [x] Ranked target list (score DESC)
- [x] Score badges color-coded (green / amber / red)
- [x] Tier badges (T1–T4)
- [x] Go/No-Go pill on each target row
- [x] Detail panel: composite score, 6 factor sliders, metadata, description
- [x] Inline score editing (adjust factors, see score update live)
- [x] Source documents panel (list of archival sources per target)
- [x] Research notes panel (timestamped free-text notes per target)
- [x] Pipeline stats bar (target count + total estimated value)
- [x] Target status workflow selector (Research → Survey → Validation → Recovery → Complete)
- [x] Target create (modal form) and delete (via ⋯ kebab menu)
- [x] Expedition history panel (past and planned survey/recovery expeditions)
- [x] Go/No-Go gate status indicator (score ≥ 65 + legal_feasibility ≥ 50)
- [x] Monte Carlo ROI simulation (10,000 trials, per-target, configurable budget + finder share)
- [x] Print intelligence report (browser print via ⋯ kebab menu)
- [ ] "Go / No-Go" gate per expedition phase (depends on sensor_passes)

### Expedition Planner
- [ ] Auto-generated expedition plan from target data
- [ ] Stage-gate workflow (Research → Survey → Validation → Recovery)
- [x] Monte Carlo ROI simulation
- [ ] Cost estimate builder (equipment, crew, permits, logistics)

### Public Landing Page

- [ ] Implement public website as a static site with markdown content

### Administration Features

- [ ] SSO-based authentication and user roles
- [ ] Deployment of the platform 
- [ ] Deployment of the landing page

---

## Operations

### Q2 2026
- [ ] Company formation (legal entity)
- [ ] Pre-seed raise ($500K–$1M)
- [ ] Founding team hired (CTO, Marine Archaeologist, Maritime Lawyer)
- [ ] Investor deck

### Q3 2026 — Ditis Core MVP
- [x] Data lake + basic target scoring
- [x] GIS prototype (map interface)
- [x] Initial archival ingest (1715 Fleet + all 13 targets seeded with primary sources)
- [ ] FL state salvage lease application

### Q4 2026 — First Expedition
- [ ] Drone fleet procured (AUV + aerial mag)
- [ ] FL lease secured
- [ ] First sensor survey (1715 Fleet search area)
- [ ] Sensor data ingested into Ditis Core

### Q1 2027
- [ ] First recovery attempt
- [ ] Conservation pipeline tested
- [ ] Artifacts catalogued with chain-of-custody

### Q2 2027
- [ ] Seed round close ($2–5M)

### Q3 2027
- [ ] UK farmland operations launch
- [ ] Landowner agreements signed
- [ ] Drone mag surveys begin

### Q4 2027 — Ditis Core v2
- [ ] Knowledge graph (DuckPGQ) — entity resolution across sources
- [ ] NLP pipeline operational (archival ingest at scale)
- [ ] Sonar anomaly classifier trained and deployed

### 2028+
- [ ] Scale to Tier 2 targets (Bahamas/Keys, Great Lakes, NC)
- [ ] Media deals / documentary
- [ ] Ditis Core data licensing (external)
