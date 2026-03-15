# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ditis is a tech-enabled treasure hunting startup building **Ditis Core** — a proprietary data intelligence platform that combines autonomous drone systems, advanced sensor arrays, and an AI-driven data fusion pipeline to discover and recover high-value lost assets worldwide.

The full strategic, operational, and technical blueprint lives in `SPEC.md`. Feature roadmap and completion status live in `ROADMAP.md`.

## What's Running Now

The current codebase is a working MVP — not a prototype or spec. It runs as a single Bun process serving both the map UI and a documented REST API.

| Layer | Technology |
|---|---|
| Runtime | Bun (TypeScript) |
| Web framework | Hono v4 |
| Database | SQLite via `bun:sqlite` + Drizzle ORM |
| Migrations | Drizzle Kit (auto-applied at startup) |
| UI | Server-rendered HTML + HTMX + Deck.gl + MapLibre GL |
| Client bundle | Bun.build → `public/app.js` |
| CSS | Tailwind CSS v4 (CLI) → `public/app.css` |
| Theming | CSS custom properties, dark/light via `[data-theme]` on `<html>` |
| API docs | hono-openapi + Scalar UI at `/api/docs` |
| Linter/formatter | Biome (tabs, strict) |

## Planned Full-Stack Architecture

Long-term target (from SPEC.md) — not yet built:

```
Historical Archives / Sensor Feeds / Environmental APIs
        ↓
Data Ingest Layer (OCR, NLP, APIs → S3 / DuckDB Data Lake)
        ↓
Fusion Engine (Entity Resolution, Knowledge Graph via DuckPGQ)
        ↓
AI/ML Suite (NLP/NER, sonar anomaly classification, drift modeling)
        ↓
Decision Layer (Target Scoring Dashboard, Expedition Planner)
        ↓
Visualization UI (GIS mapping via Deck.gl, Investor Portal)
```

## Code Structure

| File/Dir | Purpose |
|---|---|
| `src/index.ts` | Hono app entry point; mounts static files, API, and UI routes |
| `src/api.ts` | JSON REST API (`/api/*`); all routes documented with `describeRoute` |
| `src/routes/ui.ts` | All HTMX route handlers (HTML partials) |
| `src/templates/` | HTML template functions: `page`, `detail`, `target-row`, `sources`, `notes`, `helpers` |
| `src/client/` | Browser-side TypeScript: `main.ts` (entry), `map.ts` (deck.gl + maplibre), `score.ts` (slider logic), `theme.ts` (map style constants) |
| `src/db.ts` | Drizzle DB setup, migrations, seed data (targets + demo sources/notes), query functions |
| `src/schema.ts` | Drizzle table definitions (`targets`, `sources`, `notes`) |
| `src/schemas.ts` | Zod schemas for API request/response validation and OpenAPI spec |
| `src/scoring.ts` | 6-factor weighted composite score formula and helpers |
| `styles/app.css` | All CSS; imported by Tailwind CLI to produce `public/app.css` |
| `build.ts` | JS bundle script (runs `Bun.build` → `public/app.js`) |
| `dev.ts` | Dev runner: spawns server, JS watcher, and CSS watcher concurrently |
| `public/` | Build output (gitignored): `app.js`, `app.css` |

**Routing split:** HTMX UI routes live in `src/routes/ui.ts`. JSON API routes live in `api.ts`, mounted at `/api`. Static assets (`public/`) are served by Hono's `serveStatic`. Routes without `describeRoute` are excluded from the OpenAPI spec.

**Seeding:** Targets seed on first run if the `targets` table is empty. Demo sources and notes seed if the `sources` table is empty. To reset everything: `rm ditis.db` — the DB is recreated and re-seeded on next start.

## Commands

```bash
bun install                 # install dependencies
bun dev                     # dev: server + JS watcher + CSS watcher on :3001
bun run build               # production build (CSS + JS bundles → public/)
bun start                   # production server on :3001 (run build first)
bun tsc                     # typecheck (no emit)
bun lint                    # biome check + autofix
bunx drizzle-kit generate   # generate migration after schema changes
bunx drizzle-kit studio     # open Drizzle Studio (DB browser) on :4983
rm ditis.db && bun start    # wipe and re-seed the database
```

API docs available at `http://localhost:3000/api/docs` when running.

## Development Roadmap

| Milestone | Target |
|---|---|
| Company formation & pre-seed raise | Q2 2026 |
| Ditis Core MVP (data lake, archival ingest, target scoring) | Q3 2026 |
| First survey expedition (1715 Spanish Fleet, FL) | Q4 2026 |
| Seed round ($2–5M) | Q2 2027 |
| Ditis Core v2 (knowledge graph, NLP, anomaly classifier) | Q4 2027 |
