import type { Expedition, Target } from "../db.js";
import { gngLabel, goNoGo, scoreClass, tierLabel } from "../scoring.js";
import { escHtml, fmtBig } from "./helpers.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPct(v: number): string {
	return `${(v * 100).toFixed(1)}%`;
}

// Probability of clearing all three gates — matches the Monte Carlo model.
function pSuccess(t: Target): number {
	return (t.legal_feasibility / 100) * (t.location_precision / 100);
}

// Expected gross recovery value given success (finder share 80%, recovery fraction mean = ease/200)
function expectedGross(t: Target): number {
	return t.est_value_usd * (t.recovery_ease / 200) * 0.8;
}

// Tier-based capital estimate when no expeditions are logged
const TIER_CAPITAL_ESTIMATE: Record<number, number> = {
	1: 75_000,
	2: 300_000,
	3: 3_000_000,
	4: 150_000,
};

function capitalForTarget(
	t: Target,
	expsByTarget: Map<number, Expedition[]>,
): { amount: number; estimated: boolean } {
	const targetExps = expsByTarget.get(t.id) ?? [];
	let total = 0;
	for (const e of targetExps) {
		const breakdown =
			(e.equipment_usd ?? 0) +
			(e.crew_usd ?? 0) +
			(e.permits_usd ?? 0) +
			(e.logistics_usd ?? 0);
		total += breakdown > 0 ? breakdown : (e.budget_usd ?? 0);
	}
	if (total > 0) return { amount: total, estimated: false };
	return { amount: TIER_CAPITAL_ESTIMATE[t.tier] ?? 150_000, estimated: true };
}

// ─── Tier card ─────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<
	number,
	{ bg: string; text: string; border: string }
> = {
	1: { bg: "#052e1c", text: "#6ee7b7", border: "#065f46" },
	2: { bg: "#1c1917", text: "#fbbf24", border: "#78350f" },
	3: { bg: "#1e1b4b", text: "#a5b4fc", border: "#3730a3" },
	4: { bg: "#1c1917", text: "#9ca3af", border: "#374151" },
};

function renderTierCard(
	tier: number,
	targets: Target[],
	expsByTarget: Map<number, Expedition[]>,
): string {
	if (targets.length === 0) return "";
	const { bg, text, border } = TIER_COLORS[tier];

	let totalValue = 0;
	let totalCapital = 0;
	let totalExpected = 0;
	let goCount = 0;
	let watchCount = 0;
	let scoreSum = 0;

	for (const t of targets) {
		totalValue += t.est_value_usd;
		scoreSum += t.score;
		const { amount: capital } = capitalForTarget(t, expsByTarget);
		totalCapital += capital;
		totalExpected += pSuccess(t) * expectedGross(t) - capital;
		const gng = goNoGo(t);
		if (gng === "go") goCount++;
		else if (gng === "watch") watchCount++;
	}

	const avgScore = Math.round((scoreSum / targets.length) * 10) / 10;

	return `
  <div class="inv-tier-card" style="background:${bg};border-color:${border}">
    <div class="inv-tier-label" style="color:${text}">${tierLabel(tier)}</div>
    <div class="inv-tier-count">${targets.length} target${targets.length !== 1 ? "s" : ""}</div>
    <div class="inv-tier-value">${fmtBig(totalValue)}<span class="inv-tier-value-sub"> est. value</span></div>
    <div class="inv-tier-score-row">
      <span class="inv-tier-score-label">Avg score</span>
      <span class="inv-tier-score ${scoreClass(avgScore)}">${avgScore}</span>
    </div>
    <div class="inv-tier-gate-row">
      ${goCount > 0 ? `<span class="inv-gate-pill inv-gate-go">${goCount} GO</span>` : ""}
      ${watchCount > 0 ? `<span class="inv-gate-pill inv-gate-watch">${watchCount} WATCH</span>` : ""}
    </div>
    <div class="inv-tier-capital">Capital est. ${fmtBig(totalCapital)}</div>
    <div class="inv-tier-expected ${totalExpected >= 0 ? "inv-positive" : "inv-negative"}">
      E(return) ${totalExpected >= 0 ? "+" : ""}${fmtBig(totalExpected)}
    </div>
  </div>`;
}

// ─── Target table row ──────────────────────────────────────────────────────────

function renderTargetRow(
	rank: number,
	t: Target,
	expsByTarget: Map<number, Expedition[]>,
): string {
	const gng = goNoGo(t);
	const p = pSuccess(t);
	const { amount: capital, estimated } = capitalForTarget(t, expsByTarget);
	const en = p * expectedGross(t) - capital;
	const { bg, text } = TIER_COLORS[t.tier];

	return `
  <tr class="inv-target-row">
    <td class="inv-rank">${rank}</td>
    <td class="inv-target-name">${escHtml(t.name)}</td>
    <td><span class="inv-tier-badge" style="background:${bg};color:${text}">T${t.tier}</span></td>
    <td><span class="inv-score-cell ${scoreClass(t.score)}">${t.score}</span></td>
    <td class="inv-num">${fmtBig(t.est_value_usd)}</td>
    <td class="inv-num inv-muted">${fmtBig(capital)}${estimated ? "*" : ""}</td>
    <td class="inv-num">${fmtPct(p)}</td>
    <td class="inv-num ${en >= 0 ? "inv-positive" : "inv-negative"}">${en >= 0 ? "+" : ""}${fmtBig(en)}</td>
    <td><span class="inv-status-badge inv-status-${t.status}">${t.status}</span></td>
    <td><span class="gonogo-badge gonogo-${gng}">${gngLabel(gng)}</span></td>
  </tr>`;
}

// ─── Capital deployment summary ────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
	research: "#93c5fd",
	survey: "#c4b5fd",
	validation: "#fdba74",
	recovery: "#6ee7b7",
};
const STAGES = ["research", "survey", "validation", "recovery"] as const;

function renderCapitalSummary(allExps: Expedition[]): string {
	let totalLogged = 0;
	const byStage: Record<string, number> = {};

	for (const e of allExps) {
		const breakdown =
			(e.equipment_usd ?? 0) +
			(e.crew_usd ?? 0) +
			(e.permits_usd ?? 0) +
			(e.logistics_usd ?? 0);
		const amount = breakdown > 0 ? breakdown : (e.budget_usd ?? 0);
		totalLogged += amount;
		byStage[e.stage] = (byStage[e.stage] ?? 0) + amount;
	}

	if (totalLogged === 0)
		return `<p class="inv-empty">No expedition budgets logged yet. Use Generate Plan on any target to build cost estimates.</p>`;

	const bars = STAGES.filter((s) => (byStage[s] ?? 0) > 0)
		.map((s) => {
			const pct = Math.round(((byStage[s] ?? 0) / totalLogged) * 100);
			return `
      <div class="inv-capital-row">
        <span class="inv-capital-stage" style="color:${STAGE_COLORS[s]}">${s.toUpperCase()}</span>
        <div class="inv-capital-bar-wrap">
          <div class="inv-capital-bar" style="width:${pct}%;background:${STAGE_COLORS[s]}"></div>
        </div>
        <span class="inv-capital-amt">${fmtBig(byStage[s] ?? 0)}</span>
      </div>`;
		})
		.join("");

	return `
  <div class="inv-capital-total">Total logged: <strong>${fmtBig(totalLogged)}</strong> across ${allExps.length} expeditions</div>
  <div class="inv-capital-bars">${bars}</div>`;
}

// ─── Main render ───────────────────────────────────────────────────────────────

export function renderInvestorPortal(
	targets: Target[],
	allExps: Expedition[],
): string {
	// Pre-group expeditions by target for O(1) lookup throughout render
	const expsByTarget = new Map<number, Expedition[]>();
	for (const e of allExps) {
		const arr = expsByTarget.get(e.target_id);
		if (arr) arr.push(e);
		else expsByTarget.set(e.target_id, [e]);
	}

	// Single pass over targets for all summary stats + tier grouping
	// (getAllTargets already returns sorted by score DESC — no re-sort needed)
	let totalValue = 0;
	let goCount = 0;
	let totalExpected = 0;
	let totalCapital = 0;
	const tierGroups: Record<number, Target[]> = { 1: [], 2: [], 3: [], 4: [] };

	for (const t of targets) {
		totalValue += t.est_value_usd;
		if (goNoGo(t) === "go") goCount++;
		const { amount: capital } = capitalForTarget(t, expsByTarget);
		totalCapital += capital;
		totalExpected += pSuccess(t) * expectedGross(t) - capital;
		tierGroups[t.tier]?.push(t);
	}

	const tierCards = [1, 2, 3, 4]
		.map((tier) => renderTierCard(tier, tierGroups[tier], expsByTarget))
		.join("");

	const tableRows = targets
		.map((t, i) => renderTargetRow(i + 1, t, expsByTarget))
		.join("");

	return `
  <div class="inv-header">
    <div>
      <div class="inv-title">INVESTOR PORTAL</div>
      <div class="inv-subtitle">Ditis Core · Target Intelligence Platform</div>
    </div>
    <button class="inv-close" onclick="document.getElementById('investor-modal').close()">✕</button>
  </div>

  <div class="inv-summary-bar">
    <div class="inv-summary-stat">
      <div class="inv-summary-num">${fmtBig(totalValue)}</div>
      <div class="inv-summary-label">TOTAL PIPELINE</div>
    </div>
    <div class="inv-summary-sep">·</div>
    <div class="inv-summary-stat">
      <div class="inv-summary-num">${targets.length}</div>
      <div class="inv-summary-label">TARGETS</div>
    </div>
    <div class="inv-summary-sep">·</div>
    <div class="inv-summary-stat">
      <div class="inv-summary-num inv-positive">${goCount}</div>
      <div class="inv-summary-label">GO</div>
    </div>
    <div class="inv-summary-sep">·</div>
    <div class="inv-summary-stat">
      <div class="inv-summary-num ${totalExpected >= 0 ? "inv-positive" : "inv-negative"}">${totalExpected >= 0 ? "+" : ""}${fmtBig(totalExpected)}</div>
      <div class="inv-summary-label">EXPECTED RETURN</div>
    </div>
    <div class="inv-summary-sep">·</div>
    <div class="inv-summary-stat">
      <div class="inv-summary-num">${fmtBig(totalCapital)}</div>
      <div class="inv-summary-label">CAPITAL REQUIRED</div>
    </div>
  </div>

  <div class="inv-section-label">TIER BREAKDOWN</div>
  <div class="inv-tier-grid">${tierCards}</div>

  <div class="inv-section-label">TARGET PORTFOLIO</div>
  <div class="inv-table-wrap">
    <table class="inv-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Target</th>
          <th>Tier</th>
          <th>Score</th>
          <th>Est. Value</th>
          <th>Capital*</th>
          <th>P(Success)</th>
          <th>E(Return)</th>
          <th>Status</th>
          <th>Gate</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <p class="inv-footnote">* Capital = sum of logged expedition budgets; (*) = tier-based estimate. P(Success) = P(legal) × P(location). E(Return) = P(Success) × E(gross recovery at 80% finder share) − capital. Consistent with per-target Monte Carlo model.</p>
  </div>

  <div class="inv-section-label">CAPITAL DEPLOYMENT</div>
  <div class="inv-capital-section">${renderCapitalSummary(allExps)}</div>`;
}
