import type { Expedition, Note, Source, Target } from "../db.js";
import {
	FACTOR_META,
	gngLabel,
	goNoGo,
	scoreClass,
	scoreColor, // used for slider --fill CSS custom property
	tierLabel,
} from "../scoring.js";
import { renderExpeditionsInner } from "./expeditions.js";
import { renderNotesInner } from "./notes.js";
import { renderSimulationForm } from "./simulation.js";
import { renderSourcesInner } from "./sources.js";

export function renderDetail(
	t: Target,
	srcs: Source[],
	nts: Note[],
	exps: Expedition[],
): string {
	const sClass = scoreClass(t.score);
	const gng = goNoGo(t);
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
          <span class="gonogo-badge gonogo-${gng}">${gngLabel(gng)}</span>
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
          <div class="detail-menu" id="detail-menu-${t.id}">
            <button class="detail-menu-btn"
                    onclick="const m=this.closest('.detail-menu');m.classList.toggle('open')"
                    title="More actions">⋯</button>
            <div class="detail-menu-dropdown">
              <button class="detail-menu-item"
                      onclick="window.print();document.getElementById('detail-menu-${t.id}').classList.remove('open')">Print Report</button>
              <div class="detail-menu-divider"></div>
              <button class="detail-menu-item detail-menu-item-danger"
                      hx-delete="/targets/${t.id}"
                      hx-target="#detail-panel"
                      hx-swap="innerHTML"
                      hx-confirm="Delete '${t.name.replace(/"/g, "&quot;")}' and all its data? This cannot be undone.">Delete Target</button>
            </div>
          </div>
        </div>
      </div>
      <div class="composite-score ${sClass}" id="live-score-wrap">
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
      <hr class="section-divider">
      <div id="expeditions-section-${t.id}">${renderExpeditionsInner(t.id, exps)}</div>
      <hr class="section-divider">
      <div id="simulation-section-${t.id}">${renderSimulationForm(t.id, exps.find((e) => e.budget_usd != null)?.budget_usd ?? 50_000)}</div>
    </div>`;
}
