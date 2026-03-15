import type { Target } from "../db.js";
import { gngLabel, goNoGo, scoreClass } from "../scoring.js";

export function renderTargetRow(t: Target, rank: number): string {
	const sClass = scoreClass(t.score);
	const gng = goNoGo(t);
	const isComplete = t.status === "complete";
	return `
    <div class="target-row${isComplete ? " target-row--complete" : ""}" id="target-row-${t.id}" data-id="${t.id}" data-name="${t.name}" data-lat="${t.lat}" data-lng="${t.lng}"
         onclick="selectTarget(${t.id}, ${t.lng}, ${t.lat})"
         hx-get="/targets/${t.id}/detail"
         hx-target="#detail-panel"
         hx-swap="innerHTML">
      <span class="rank">${isComplete ? "✓" : rank}</span>
      <div class="target-info">
        <div class="target-name">${t.name}</div>
        <div class="target-meta">
          <span class="tier-badge tier-${t.tier}">T${t.tier}</span>
          <span class="status-badge status-${t.status}">${t.status.toUpperCase()}</span>
          <span class="gonogo-pill gonogo-${gng}">${gngLabel(gng)}</span>
        </div>
      </div>
      <div class="score-badge ${sClass}" id="score-badge-${t.id}">${t.score}</div>
    </div>`;
}
