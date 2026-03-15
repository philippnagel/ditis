import { Hono } from "hono";
import { api } from "./api.js";
import {
	addNote,
	addSource,
	deleteNote,
	deleteSource,
	getAllTargets,
	getNotesForTarget,
	getSourcesForTarget,
	getTarget,
	type Note,
	type Source,
	type Target,
	updateScores,
	updateStatus,
} from "./db.js";
import type { ScoreFactors } from "./scoring.js";
import { FACTOR_META, scoreColor, tierLabel } from "./scoring.js";

const app = new Hono();
app.route("/api", api);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/", (c) => {
	return c.html(renderPage(getAllTargets()));
});

app.get("/targets/:id/detail", (c) => {
	const id = Number(c.req.param("id"));
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	return c.html(
		renderDetail(target, getSourcesForTarget(id), getNotesForTarget(id)),
	);
});

app.patch("/targets/:id/scores", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const factors: ScoreFactors = {
		historical_confidence: Number(body.historical_confidence),
		value_score: Number(body.value_score),
		location_precision: Number(body.location_precision),
		legal_feasibility: Number(body.legal_feasibility),
		recovery_ease: Number(body.recovery_ease),
		sensor_validation: Number(body.sensor_validation),
	};
	updateScores(id, factors);
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);

	// OOB swap re-renders the full sorted target list so rank + badge update
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;

	// HX-Trigger tells the client to refresh the map layer with the new score
	c.header(
		"HX-Trigger",
		JSON.stringify({ scoreUpdated: { id: target.id, score: target.score } }),
	);

	return c.html(
		renderDetail(target, getSourcesForTarget(id), getNotesForTarget(id)) +
			listOob,
	);
});

app.patch("/targets/:id/status", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const status = String(body.status);
	const validStatuses = [
		"research",
		"survey",
		"validation",
		"recovery",
		"complete",
	];
	if (!validStatuses.includes(status)) return c.text("Invalid status", 400);
	updateStatus(id, status as Target["status"]);
	const target = getTarget(id);
	if (!target)
		return c.html(`<p class="detail-empty">Target not found.</p>`, 404);
	const allTargets = getAllTargets();
	const listOob = `<div id="target-list" hx-swap-oob="true">${allTargets.map((t, i) => renderTargetRow(t, i + 1)).join("")}</div>`;
	return c.html(
		renderDetail(target, getSourcesForTarget(id), getNotesForTarget(id)) +
			listOob,
	);
});

app.post("/targets/:id/sources", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const type = String(body.type);
	if (!["archival", "sonar", "survey", "imagery"].includes(type))
		return c.text("Invalid type", 400);
	addSource({
		target_id: id,
		title: String(body.title),
		url: body.url ? String(body.url) : null,
		type: type as "archival" | "sonar" | "survey" | "imagery",
		confidence_weight: Number(body.confidence_weight) || 70,
		excerpt: body.excerpt ? String(body.excerpt) : null,
	});
	return c.html(renderSourcesInner(id, getSourcesForTarget(id)));
});

app.delete("/targets/:id/sources/:sid", (c) => {
	const id = Number(c.req.param("id"));
	deleteSource(Number(c.req.param("sid")));
	return c.html(renderSourcesInner(id, getSourcesForTarget(id)));
});

app.post("/targets/:id/notes", async (c) => {
	const id = Number(c.req.param("id"));
	const body = await c.req.parseBody();
	const content = String(body.content).trim();
	if (content) addNote(id, content);
	return c.html(renderNotesInner(id, getNotesForTarget(id)));
});

app.delete("/targets/:id/notes/:nid", (c) => {
	const id = Number(c.req.param("id"));
	deleteNote(Number(c.req.param("nid")));
	return c.html(renderNotesInner(id, getNotesForTarget(id)));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function fmtDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

// ─── HTML fragments ───────────────────────────────────────────────────────────

function renderTargetRow(t: Target, rank: number): string {
	const color = scoreColor(t.score);
	return `
    <div class="target-row" id="target-row-${t.id}" data-id="${t.id}" data-lat="${t.lat}" data-lng="${t.lng}"
         onclick="selectTarget(${t.id}, ${t.lng}, ${t.lat})"
         hx-get="/targets/${t.id}/detail"
         hx-target="#detail-panel"
         hx-swap="innerHTML">
      <span class="rank">${rank}</span>
      <div class="target-info">
        <div class="target-name">${t.name}</div>
        <div class="target-meta">
          <span class="tier-badge tier-${t.tier}">T${t.tier}</span>
          <span class="status-badge status-${t.status}">${t.status.toUpperCase()}</span>
        </div>
      </div>
      <div class="score-badge" id="score-badge-${t.id}" style="color:${color}">${t.score}</div>
    </div>`;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
	archival: "ARCHIVAL",
	sonar: "SONAR",
	survey: "SURVEY",
	imagery: "IMAGERY",
};

function renderSourcesInner(tid: number, srcs: Source[]): string {
	const items = srcs
		.map((s) => {
			const titleHtml = s.url
				? `<a href="${escHtml(s.url)}" target="_blank" rel="noopener">${escHtml(s.title)}</a>`
				: escHtml(s.title);
			const excerptHtml = s.excerpt
				? `<div class="source-excerpt">${escHtml(s.excerpt)}</div>`
				: "";
			return `
      <div class="source-item">
        <span class="source-type-badge source-type-${s.type}">${SOURCE_TYPE_LABELS[s.type]}</span>
        <div class="source-body">
          <div class="source-title">${titleHtml}</div>
          ${excerptHtml}
          <div class="source-footer">
            <span class="confidence-pill">${s.confidence_weight}% conf.</span>
            <span class="source-date">${fmtDate(s.created_at)}</span>
          </div>
        </div>
        <button class="del-btn"
                hx-delete="/targets/${tid}/sources/${s.id}"
                hx-target="#sources-section-${tid}"
                hx-swap="innerHTML"
                title="Remove">×</button>
      </div>`;
		})
		.join("");

	return `
  <div class="section-label">
    SOURCES <span class="section-count">${srcs.length}</span>
  </div>
  <div class="sources-list">${srcs.length ? items : '<p class="empty-state">No sources added yet.</p>'}</div>
  <form class="add-form"
        hx-post="/targets/${tid}/sources"
        hx-target="#sources-section-${tid}"
        hx-swap="innerHTML">
    <input name="title" placeholder="Title *" required>
    <div class="add-form-row">
      <select name="type">
        <option value="archival">Archival</option>
        <option value="sonar">Sonar</option>
        <option value="survey">Survey</option>
        <option value="imagery">Imagery</option>
      </select>
      <div class="confidence-row">
        <label>Conf.</label>
        <input type="range" name="confidence_weight" min="0" max="100" value="70"
               oninput="this.nextElementSibling.textContent=this.value">
        <span>70</span>
      </div>
    </div>
    <input name="url" placeholder="URL (optional)">
    <textarea name="excerpt" placeholder="Excerpt or notes..."></textarea>
    <button class="add-btn" type="submit">+ Add Source</button>
  </form>`;
}

function renderNotesInner(tid: number, nts: Note[]): string {
	const items = nts
		.map(
			(n) => `
      <div class="note-item">
        <div class="note-header">
          <span class="note-date">${fmtDate(n.created_at)}</span>
          <button class="del-btn"
                  hx-delete="/targets/${tid}/notes/${n.id}"
                  hx-target="#notes-section-${tid}"
                  hx-swap="innerHTML"
                  title="Delete">×</button>
        </div>
        <div class="note-content">${escHtml(n.content)}</div>
      </div>`,
		)
		.join("");

	return `
  <div class="section-label">
    RESEARCH NOTES <span class="section-count">${nts.length}</span>
  </div>
  <div class="notes-list">${nts.length ? items : '<p class="empty-state">No notes yet.</p>'}</div>
  <form class="add-form"
        hx-post="/targets/${tid}/notes"
        hx-target="#notes-section-${tid}"
        hx-swap="innerHTML">
    <textarea name="content" placeholder="Add a research note..." required></textarea>
    <button class="add-btn" type="submit">+ Add Note</button>
  </form>`;
}

function renderDetail(t: Target, srcs: Source[], nts: Note[]): string {
	const color = scoreColor(t.score);
	const factors = Object.entries(FACTOR_META) as [
		keyof typeof FACTOR_META,
		{ label: string; weight: string },
	][];

	const valueFmt =
		t.est_value_usd >= 1e9
			? `$${(t.est_value_usd / 1e9).toFixed(1)}B`
			: `$${(t.est_value_usd / 1e6).toFixed(1)}M`;

	const depthFmt = t.depth_m != null ? `${t.depth_m}m` : "Terrestrial";

	const sliders = factors
		.map(([key, { label, weight }]) => {
			const val = t[key] as number;
			const fc = scoreColor(val);
			return `
        <div class="factor-row">
          <div class="factor-label-row">
            <span>${label}</span>
            <span class="factor-meta"><b id="val-${key}">${val}</b> · ${weight}</span>
          </div>
          <input type="range" class="factor-slider" id="factor-${key}" name="${key}"
                 min="0" max="100" value="${val}"
                 oninput="updateScore(this)"
                 style="--pct:${val}%;--fill:${fc}">
        </div>`;
		})
		.join("");

	return `
    <div class="detail-card">
      <div class="detail-header">
        <div class="detail-name">${t.name}</div>
        <div class="detail-header-badges">
          <div class="tier-badge tier-${t.tier}">${tierLabel(t.tier)}</div>
          <select class="status-select status-${t.status}"
                  name="status"
                  hx-patch="/targets/${t.id}/status"
                  hx-target="#detail-panel"
                  hx-swap="innerHTML"
                  hx-trigger="change"
                  hx-include="this">
            ${["research", "survey", "validation", "recovery", "complete"]
							.map(
								(s) =>
									`<option value="${s}"${s === t.status ? " selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`,
							)
							.join("")}
          </select>
        </div>
      </div>
      <div class="composite-score" id="live-score-wrap" style="color:${color}">
        <span id="live-score">${t.score}</span><span class="composite-denom">/100</span>
      </div>
      <form hx-patch="/targets/${t.id}/scores"
            hx-target="#detail-panel"
            hx-swap="innerHTML">
        <div class="factors">${sliders}</div>
        <button id="save-scores-btn" class="save-btn" type="submit">Save Score Changes</button>
      </form>
      <dl class="detail-meta">
        <dt>Est. Value</dt><dd>${valueFmt}+</dd>
        <dt>Depth</dt><dd>${depthFmt}</dd>
        <dt>Coordinates</dt><dd>${t.lat.toFixed(3)}°, ${t.lng.toFixed(3)}°</dd>
        <dt>Legal</dt><dd>${t.legal_framework}</dd>
      </dl>
      <p class="detail-notes">${t.description}</p>
      <hr class="section-divider">
      <div id="sources-section-${t.id}">${renderSourcesInner(t.id, srcs)}</div>
      <hr class="section-divider">
      <div id="notes-section-${t.id}">${renderNotesInner(t.id, nts)}</div>
    </div>`;
}

// ─── Full page ────────────────────────────────────────────────────────────────

function renderPage(targets: Target[]): string {
	const targetRows = targets.map((t, i) => renderTargetRow(t, i + 1)).join("");
	const targetsJson = JSON.stringify(targets);
	const totalValue = targets.reduce((sum, t) => sum + t.est_value_usd, 0);
	const valueFmt =
		totalValue >= 1e9
			? `$${(totalValue / 1e9).toFixed(1)}B+`
			: `$${(totalValue / 1e6).toFixed(1)}M+`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ditis Core</title>
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css">
  <script>document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark';</script>
  <style>${CSS}</style>
</head>
<body>
  <aside id="sidebar">
    <header class="sidebar-header">
      <div>
        <div class="logo">DITIS CORE</div>
        <div class="logo-sub">Target Intelligence</div>
      </div>
      <button id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode">◐</button>
    </header>
    <div class="pipeline-stats">
      <span class="pipeline-stat"><span class="pipeline-num">${targets.length}</span> TARGETS</span>
      <span class="pipeline-sep">·</span>
      <span class="pipeline-stat"><span class="pipeline-num">${valueFmt}</span> PIPELINE</span>
    </div>
    <div class="list-header">RANKED BY SCORE</div>
    <div id="target-list">${targetRows}</div>
    <div id="detail-panel">
      <p class="detail-empty">Select a target to view intelligence report.</p>
    </div>
  </aside>
  <div id="map"></div>
  <div id="tooltip"></div>

  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <script src="https://unpkg.com/deck.gl@9.0.3/dist.min.js"></script>
  <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js"></script>
  <script>
    const TARGETS = ${targetsJson};
    ${CLIENT_JS}
  </script>
</body>
</html>`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root, [data-theme="dark"] {
    --bg:        #070d17;
    --surface:   #0d1520;
    --surface2:  #111c2d;
    --border:    #1a2840;
    --text:      #dde6f0;
    --muted:     #4a6280;
    --accent:    #10b981;
    --accent-bg: #052e1c;
    --row-sep:   #0c1624;
    --tip-bg:    #0d1520ee;
  }

  [data-theme="light"] {
    --bg:        #f0f4f8;
    --surface:   #ffffff;
    --surface2:  #eef2f7;
    --border:    #d1dce8;
    --text:      #1a2840;
    --muted:     #7a90a8;
    --accent:    #059669;
    --accent-bg: #d1fae5;
    --row-sep:   #e8eef5;
    --tip-bg:    #ffffffee;
  }

  html, body { height: 100%; overflow: hidden; background: var(--bg); color: var(--text);
    font-family: system-ui, -apple-system, sans-serif; font-size: 13px; }

  body { display: flex; }

  /* ── Sidebar ── */
  #sidebar {
    width: 320px; flex-shrink: 0;
    display: flex; flex-direction: column;
    background: var(--surface); border-right: 1px solid var(--border);
    height: 100vh; overflow: hidden; z-index: 10;
  }

  .sidebar-header {
    padding: 14px 16px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo { font-size: 11px; font-weight: 700; letter-spacing: .18em; color: var(--accent); }
  .logo-sub { font-size: 10px; color: var(--muted); letter-spacing: .08em; margin-top: 2px; }

  #theme-toggle {
    background: none; border: 1px solid var(--border); border-radius: 6px;
    color: var(--muted); cursor: pointer; font-size: 14px;
    padding: 4px 8px; line-height: 1; transition: color .15s, border-color .15s;
    flex-shrink: 0;
  }
  #theme-toggle:hover { color: var(--accent); border-color: var(--accent); }

  .list-header {
    padding: 8px 16px; font-size: 10px; font-weight: 600; letter-spacing: .12em;
    color: var(--muted); text-transform: uppercase; border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .list-header .count {
    display: inline-block; background: var(--border); color: var(--muted);
    border-radius: 10px; padding: 0 6px; margin-left: 4px; font-size: 9px;
  }

  #target-list {
    overflow-y: auto; flex: 0 0 auto; max-height: 44vh;
    border-bottom: 1px solid var(--border);
  }

  .target-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 16px; cursor: pointer;
    border-bottom: 1px solid var(--row-sep);
    transition: background .1s;
  }
  .target-row:hover { background: var(--surface2); }
  .target-row.active { background: var(--accent-bg); border-left: 2px solid var(--accent); padding-left: 14px; }

  .rank { font-size: 10px; color: var(--muted); min-width: 16px; text-align: right;
    font-variant-numeric: tabular-nums; }

  .target-info { flex: 1; min-width: 0; }
  .target-name { font-size: 12px; font-weight: 500; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; }
  .target-meta { display: flex; align-items: center; gap: 5px; margin-top: 2px; }

  .tier-badge {
    font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
    letter-spacing: .04em; white-space: nowrap;
  }
  .tier-1 { background: #14532d; color: #86efac; }
  .tier-2 { background: #1e3a5f; color: #93c5fd; }
  .tier-3 { background: #7c2d12; color: #fdba74; }
  .tier-4 { background: #2e1065; color: #c4b5fd; }

  /* ── Pipeline stats ── */
  .pipeline-stats {
    padding: 8px 16px; background: var(--accent-bg); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .pipeline-stat { font-size: 10px; color: var(--muted); letter-spacing: .06em; text-transform: uppercase; }
  .pipeline-num { font-size: 12px; font-weight: 700; color: var(--accent); }
  .pipeline-sep { color: var(--muted); font-size: 10px; }

  /* ── Status badges ── */
  .status-badge {
    font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
    letter-spacing: .04em; white-space: nowrap;
  }
  .status-research   { background: #1a2840; color: var(--muted); }
  .status-survey     { background: #1e3a5f; color: #93c5fd; }
  .status-validation { background: #78350f; color: #fcd34d; }
  .status-recovery   { background: #7c2d12; color: #fdba74; }
  .status-complete   { background: #14532d; color: #86efac; }

  /* ── Status select in detail header ── */
  .detail-header-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
  .status-select {
    font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
    letter-spacing: .04em; cursor: pointer; border: none;
    font-family: inherit; outline: none;
  }
  .status-select.status-research   { background: #1a2840; color: var(--muted); }
  .status-select.status-survey     { background: #1e3a5f; color: #93c5fd; }
  .status-select.status-validation { background: #78350f; color: #fcd34d; }
  .status-select.status-recovery   { background: #7c2d12; color: #fdba74; }
  .status-select.status-complete   { background: #14532d; color: #86efac; }
  .status-select option { background: var(--surface); color: var(--text); font-weight: 400; }

  .target-location { font-size: 10px; color: var(--muted); }
  .score-badge { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums;
    min-width: 34px; text-align: right; }

  /* ── Detail panel ── */
  #detail-panel { flex: 1; overflow-y: auto; }

  .detail-empty { padding: 20px 16px; color: var(--muted); font-size: 12px;
    line-height: 1.5; }

  .detail-card { padding: 14px 16px 24px; }

  .detail-header { margin-bottom: 6px; }
  .detail-name { font-size: 13px; font-weight: 600; line-height: 1.4; }

  .composite-score { font-size: 38px; font-weight: 800; line-height: 1;
    margin: 8px 0 14px; font-variant-numeric: tabular-nums; }
  .composite-denom { font-size: 16px; font-weight: 400; color: var(--muted); margin-left: 2px; }

  /* ── Factor sliders ── */
  .factors { margin-bottom: 10px; }
  .factor-row { margin-bottom: 9px; }
  .factor-label-row { display: flex; justify-content: space-between;
    font-size: 10px; color: var(--muted); margin-bottom: 4px; }
  .factor-meta { color: #6b8aaa; }
  .factor-meta b { color: var(--text); font-weight: 600; }

  .factor-slider {
    width: 100%; height: 4px; cursor: pointer; outline: none;
    -webkit-appearance: none; appearance: none; border-radius: 2px;
    background: linear-gradient(to right, var(--fill, var(--accent)) var(--pct, 50%), var(--border) var(--pct, 50%));
  }
  .factor-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%;
    background: var(--fill, var(--accent)); cursor: pointer;
    border: 2px solid var(--surface); box-shadow: 0 0 0 1px var(--fill, var(--accent));
  }
  .factor-slider::-moz-range-thumb {
    width: 13px; height: 13px; border-radius: 50%; border: 2px solid var(--surface);
    background: var(--fill, var(--accent)); cursor: pointer;
  }
  .factor-slider::-moz-range-progress {
    height: 4px; border-radius: 2px; background: var(--fill, var(--accent));
  }

  .save-btn {
    width: 100%; margin-top: 10px; padding: 7px;
    background: var(--surface2); color: var(--muted);
    border: 1px solid var(--border); border-radius: 6px;
    font-size: 11px; font-weight: 600; cursor: pointer; letter-spacing: .04em;
    transition: all .15s;
  }
  .save-btn.unsaved { background: var(--accent-bg); color: var(--accent); border-color: var(--accent); }
  .save-btn.unsaved:hover { background: var(--accent); color: #fff; }

  .detail-meta { font-size: 11px; line-height: 1.9; color: #6b8aaa;
    border-top: 1px solid var(--border); padding-top: 10px; margin: 12px 0 10px;
    display: grid; grid-template-columns: auto 1fr; gap: 0 10px; }
  .detail-meta dt { color: var(--muted); }
  .detail-meta dd { color: var(--text); }

  .detail-notes { font-size: 11px; color: var(--muted); line-height: 1.6; }

  /* ── Section structure ── */
  hr.section-divider { border: none; border-top: 1px solid var(--border); margin: 14px 0; }

  .section-label {
    font-size: 9px; font-weight: 700; letter-spacing: .12em;
    color: var(--muted); text-transform: uppercase; margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }
  .section-count {
    background: var(--border); color: var(--muted); border-radius: 8px;
    padding: 0 5px; font-size: 8px; font-weight: 600;
  }
  .empty-state { font-size: 10px; color: var(--muted); padding: 4px 0 8px; font-style: italic; }

  /* ── Sources ── */
  .source-item {
    display: flex; gap: 8px; align-items: flex-start;
    padding: 7px 0; border-bottom: 1px solid var(--row-sep);
  }
  .source-item:last-child { border-bottom: none; }
  .source-type-badge {
    font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 3px;
    letter-spacing: .04em; white-space: nowrap; flex-shrink: 0; margin-top: 1px;
  }
  .source-type-archival { background: #1e3a5f; color: #93c5fd; }
  .source-type-sonar    { background: #14532d; color: #86efac; }
  .source-type-survey   { background: #7c2d12; color: #fdba74; }
  .source-type-imagery  { background: #2e1065; color: #c4b5fd; }

  .source-body { flex: 1; min-width: 0; }
  .source-title { font-size: 11px; font-weight: 500; }
  .source-title a { color: var(--accent); text-decoration: none; }
  .source-title a:hover { text-decoration: underline; }
  .source-excerpt { font-size: 10px; color: var(--muted); line-height: 1.5; margin-top: 2px; }
  .source-footer { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
  .confidence-pill {
    font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px;
    background: var(--surface2); color: var(--muted); border: 1px solid var(--border);
  }
  .source-date { font-size: 9px; color: var(--muted); }

  .del-btn {
    background: none; border: none; color: var(--muted); cursor: pointer;
    font-size: 15px; line-height: 1; padding: 0 2px; flex-shrink: 0;
    transition: color .1s;
  }
  .del-btn:hover { color: #ef4444; }

  /* ── Notes ── */
  .note-item { padding: 7px 0; border-bottom: 1px solid var(--row-sep); }
  .note-item:last-child { border-bottom: none; }
  .note-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
  .note-date { font-size: 9px; color: var(--muted); }
  .note-content { font-size: 11px; line-height: 1.55; color: var(--text); white-space: pre-wrap; }

  /* ── Add forms ── */
  .add-form { margin-top: 10px; display: flex; flex-direction: column; gap: 5px; }
  .add-form input, .add-form textarea, .add-form select {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 5px; padding: 5px 8px; font-size: 11px; color: var(--text);
    outline: none; font-family: inherit;
  }
  .add-form input:focus, .add-form textarea:focus, .add-form select:focus { border-color: var(--accent); }
  .add-form textarea { resize: vertical; min-height: 56px; }
  .add-form select option { background: var(--surface); }
  .add-form-row { display: flex; gap: 5px; }
  .add-form-row > * { flex: 1; }
  .add-btn {
    padding: 5px 10px; background: var(--accent-bg); color: var(--accent);
    border: 1px solid var(--accent); border-radius: 5px; font-size: 11px;
    font-weight: 600; cursor: pointer; transition: background .15s; letter-spacing: .04em;
  }
  .add-btn:hover { background: var(--accent); color: #fff; }
  .confidence-row { display: flex; align-items: center; gap: 6px; }
  .confidence-row label { font-size: 10px; color: var(--muted); white-space: nowrap; flex-shrink: 0; }
  .confidence-row input[type=range] { flex: 1; height: 3px; cursor: pointer;
    -webkit-appearance: none; appearance: none; background: var(--border); border-radius: 2px; }
  .confidence-row input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%;
    background: var(--accent); border: 1px solid var(--surface);
  }
  .confidence-row span { font-size: 10px; font-weight: 600; color: var(--text); min-width: 22px; }

  /* ── Map ── */
  #map { flex: 1; }

  /* ── Tooltip ── */
  #tooltip {
    position: fixed; z-index: 999; pointer-events: none; display: none;
    background: var(--tip-bg); border: 1px solid var(--border); border-radius: 6px;
    padding: 8px 12px;
  }
  .tip-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
  .tip-meta { font-size: 10px; color: var(--muted); }

  /* ── Scrollbars ── */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

// ─── Client JS ────────────────────────────────────────────────────────────────

const CLIENT_JS = `
  let _overlay = null;
  let _map = null;
  let _selectedId = null;

  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return [r, g, b, a];
  }

  function scoreHex(s) {
    if (s >= 70) return '#10b981';
    if (s >= 50) return '#f59e0b';
    if (s >= 35) return '#ef4444';
    return '#6b7280';
  }

  const FACTOR_WEIGHTS = {
    historical_confidence: 0.25,
    value_score: 0.2,
    location_precision: 0.2,
    legal_feasibility: 0.15,
    recovery_ease: 0.1,
    sensor_validation: 0.1,
  };

  function updateScore(input) {
    // Update displayed value next to the slider
    const valEl = document.getElementById('val-' + input.name);
    if (valEl) valEl.textContent = input.value;

    // Update slider track fill via CSS vars
    const fc = scoreHex(parseInt(input.value));
    input.style.setProperty('--pct', input.value + '%');
    input.style.setProperty('--fill', fc);

    // Recompute composite score live
    let score = 0;
    for (const [key, weight] of Object.entries(FACTOR_WEIGHTS)) {
      const el = document.getElementById('factor-' + key);
      if (el) score += parseInt(el.value) * weight;
    }
    score = Math.round(score * 10) / 10;

    const scoreEl = document.getElementById('live-score');
    const wrap = document.getElementById('live-score-wrap');
    if (scoreEl) scoreEl.textContent = score;
    if (wrap) wrap.style.color = scoreHex(score);

    // Mark save button as having unsaved changes
    const saveBtn = document.getElementById('save-scores-btn');
    if (saveBtn && !saveBtn.classList.contains('unsaved')) {
      saveBtn.classList.add('unsaved');
      saveBtn.textContent = 'Save Score Changes ●';
    }
  }
  window.updateScore = updateScore;

  function buildLayers(selectedId) {
    return [new deck.ScatterplotLayer({
      id: 'targets',
      data: TARGETS,
      getPosition: d => [d.lng, d.lat],
      getRadius: d => selectedId === d.id ? 110000 : 70000,
      radiusUnits: 'meters',
      radiusMinPixels: 5,
      radiusMaxPixels: 28,
      getFillColor: d => hexToRgba(scoreHex(d.score), selectedId === d.id ? 255 : 195),
      getLineColor: d => selectedId === d.id ? [16,185,129,255] : [255,255,255,50],
      lineWidthMinPixels: selectedId ? 1.5 : 1,
      stroked: true,
      pickable: true,
      autoHighlight: true,
      highlightColor: [16, 185, 129, 80],
      onClick: info => info.object && selectTarget(info.object.id, info.object.lng, info.object.lat),
      onHover: ({ object, x, y }) => {
        const tip = document.getElementById('tooltip');
        if (object) {
          tip.style.cssText = 'display:block;left:' + (x+14) + 'px;top:' + (y+14) + 'px';
          tip.innerHTML =
            '<div class="tip-name">' + object.name + '</div>' +
            '<div class="tip-meta">Score: ' + object.score + ' · Tier ' + object.tier + '</div>';
        } else {
          tip.style.display = 'none';
        }
      },
      updateTriggers: { getRadius: selectedId, getFillColor: selectedId, getLineColor: selectedId }
    })];
  }

  const MAP_STYLES = {
    dark:  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    light: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  };

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.dataset.theme === 'light' ? 'dark' : 'light';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
    _map && _map.setStyle(MAP_STYLES[next]);
  }
  window.toggleTheme = toggleTheme;

  function initMap() {
    const theme = document.documentElement.dataset.theme || 'dark';
    _map = new maplibregl.Map({
      container: 'map',
      style: MAP_STYLES[theme],
      center: [10, 25],
      zoom: 2,
      antialias: true,
      attributionControl: false,
    });
    _map.addControl(new maplibregl.AttributionControl({ compact: true }));

    _map.on('load', () => {
      _overlay = new deck.MapboxOverlay({ interleaved: false, layers: buildLayers(null) });
      _map.addControl(_overlay);
    });
  }

  function selectTarget(id, lng, lat) {
    _selectedId = id;

    _overlay && _overlay.setProps({ layers: buildLayers(id) });
    _map && _map.flyTo({ center: [lng, lat], zoom: Math.max(_map.getZoom(), 5), duration: 900 });

    document.querySelectorAll('.target-row').forEach(el =>
      el.classList.toggle('active', Number(el.dataset.id) === id)
    );

    htmx.ajax('GET', '/targets/' + id + '/detail', { target: '#detail-panel', swap: 'innerHTML' });
  }
  window.selectTarget = selectTarget;

  // Sync map dots when a score is saved (fired via HX-Trigger header)
  document.body.addEventListener('scoreUpdated', (e) => {
    const { id, score } = e.detail;
    const t = TARGETS.find(t => t.id === id);
    if (t) t.score = score;
    _overlay && _overlay.setProps({ layers: buildLayers(_selectedId) });
  });

  initMap();
`;

export default { port: 3000, fetch: app.fetch };
