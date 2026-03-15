import type { Target } from "../db.js";
import { renderTargetRow } from "./target-row.js";

export function renderPipelineStats(targets: Target[]): string {
	const totalValue = targets.reduce((sum, t) => sum + t.est_value_usd, 0);
	const valueFmt =
		totalValue >= 1e9
			? `$${(totalValue / 1e9).toFixed(1)}B+`
			: `$${(totalValue / 1e6).toFixed(1)}M+`;
	return `<span class="pipeline-stat"><span class="pipeline-num">${targets.length}</span> TARGETS</span>
      <span class="pipeline-sep">·</span>
      <span class="pipeline-stat"><span class="pipeline-num">${valueFmt}</span> PIPELINE</span>`;
}

export function renderPage(targets: Target[]): string {
	const targetRows = targets.map((t, i) => renderTargetRow(t, i + 1)).join("");
	const targetsJson = JSON.stringify(targets);

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ditis Core</title>
  <link rel="stylesheet" href="/public/app.css">
  <script>document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark';</script>
</head>
<body>
  <aside id="sidebar">
    <header class="sidebar-header">
      <div>
        <div class="logo">DITIS CORE</div>
        <div class="logo-sub">Target Intelligence</div>
      </div>
      <div class="header-actions">
        <button class="add-target-btn" onclick="document.getElementById('add-target-modal').showModal()">+ New</button>
        <button id="routes-toggle" class="routes-toggle-btn" onclick="toggleRoutes()" title="Toggle historical trade routes">Routes</button>
        <button id="theme-toggle" onclick="toggleTheme()" title="Toggle light/dark mode">◐</button>
      </div>
    </header>
    <div id="pipeline-stats" class="pipeline-stats">${renderPipelineStats(targets)}</div>
    <div class="list-search">
      <input type="search" id="target-search" placeholder="Filter targets…" oninput="filterTargets(this.value)">
    </div>
    <div class="list-header">RANKED BY SCORE</div>
    <div id="target-list">${targetRows}</div>
    <div id="detail-panel">
      <p class="detail-empty">Select a target to view intelligence report.</p>
    </div>
  </aside>
  <div id="map"></div>
  <div id="tooltip"></div>

  <dialog id="add-target-modal">
    <div class="modal-header">
      <span class="modal-title">NEW TARGET</span>
      <button class="modal-close" onclick="document.getElementById('add-target-modal').close()">✕</button>
    </div>
    <form hx-post="/targets"
          hx-target="#detail-panel"
          hx-swap="innerHTML"
          hx-on::after-request="if(event.detail.successful){document.getElementById('add-target-modal').close();document.getElementById('target-search').value='';filterTargets('')}">
      <div class="modal-body">
        <div class="form-row">
          <label>Name *</label>
          <input type="text" name="name" required placeholder="e.g. Atocha Galleon">
        </div>
        <div class="form-row-2">
          <div class="form-row">
            <label>Latitude *</label>
            <input type="number" name="lat" required step="0.001" placeholder="27.640">
          </div>
          <div class="form-row">
            <label>Longitude *</label>
            <input type="number" name="lng" required step="0.001" placeholder="-80.370">
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-row">
            <label>Tier *</label>
            <select name="tier" required>
              <option value="1">T1 — Launch</option>
              <option value="2">T2 — Growth</option>
              <option value="3">T3 — Big Bet</option>
              <option value="4" selected>T4 — Speculative</option>
            </select>
          </div>
          <div class="form-row">
            <label>Est. Value (USD) *</label>
            <input type="number" name="est_value_usd" required min="0" placeholder="1000000">
          </div>
        </div>
        <div class="form-row">
          <label>Description</label>
          <textarea name="description" rows="3" placeholder="Brief description of the target…"></textarea>
        </div>
        <div class="form-row">
          <label>Legal Framework</label>
          <input type="text" name="legal_framework" placeholder="e.g. UK Merchant Shipping Act 1995">
        </div>
        <div class="form-row">
          <label>Depth (m)</label>
          <input type="number" name="depth_m" min="0" placeholder="Leave blank for terrestrial">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-cancel" onclick="document.getElementById('add-target-modal').close()">Cancel</button>
        <button type="submit" class="btn-primary">Add Target</button>
      </div>
    </form>
  </dialog>

  <script id="targets-data" type="application/json">${targetsJson}</script>
  <script src="/public/app.js" defer></script>
</body>
</html>`;
}
