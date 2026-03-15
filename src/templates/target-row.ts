import type { Target } from "../db.js";
import { goNoGo, scoreColor } from "../scoring.js";

export function renderTargetRow(t: Target, rank: number): string {
	const color = scoreColor(t.score);
	const gng = goNoGo(t);
	return `
    <div class="target-row" id="target-row-${t.id}" data-id="${t.id}" data-name="${t.name}" data-lat="${t.lat}" data-lng="${t.lng}"
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
          <span class="gonogo-pill gonogo-${gng}">${gng === "go" ? "GO" : gng === "watch" ? "WATCH" : "NO-GO"}</span>
        </div>
      </div>
      <div class="score-badge" id="score-badge-${t.id}" style="color:${color}">${t.score}</div>
    </div>`;
}
