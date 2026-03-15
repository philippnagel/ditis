import type { SimulationResult } from "../simulation.js";

function fmtMoney(v: number): string {
	const abs = Math.abs(v);
	const sign = v < 0 ? "−$" : "+$";
	if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
	if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
	if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
	return `${sign}${abs.toFixed(0)}`;
}

function pct(p: number): string {
	return `${Math.round(p * 100)}%`;
}

export function renderSimulationForm(
	tid: number,
	defaultBudget: number,
): string {
	return `
  <div class="section-label">ROI SIMULATION</div>
  <p class="sim-description">Model 10,000 expedition outcomes based on this target's scoring factors.</p>
  <form class="sim-form"
        hx-post="/targets/${tid}/simulate"
        hx-target="#simulation-section-${tid}"
        hx-swap="innerHTML">
    <div class="sim-inputs">
      <div class="sim-input-group">
        <label>Expedition budget ($)</label>
        <input type="number" name="budget" value="${defaultBudget}" min="0" step="1000">
      </div>
      <div class="sim-input-group">
        <label>Finder share (%)</label>
        <input type="number" name="finder_share" value="80" min="1" max="100">
      </div>
    </div>
    <button class="add-btn" type="submit">▶ Run Simulation</button>
  </form>`;
}

export function renderSimulationResults(
	tid: number,
	result: SimulationResult,
	budget: number,
	finderSharePct: number,
): string {
	const {
		expected_return,
		breakeven_probability,
		p10,
		p50,
		p90,
		histogram,
		min_outcome,
		bucket_size,
	} = result;

	const returnColor = expected_return >= 0 ? "#10b981" : "#ef4444";

	const bars = histogram
		.map((h, i) => {
			const mid = min_outcome + (i + 0.5) * bucket_size;
			return `<div class="sim-bar ${mid < 0 ? "sim-bar-loss" : "sim-bar-gain"}" style="height:${Math.max(2, h)}%" title="${fmtMoney(mid)}"></div>`;
		})
		.join("");

	const axisLeft = fmtMoney(min_outcome + bucket_size * 0.5);
	const axisRight = fmtMoney(min_outcome + bucket_size * 19.5);

	const reRunForm = `
  <form class="sim-form"
        hx-post="/targets/${tid}/simulate"
        hx-target="#simulation-section-${tid}"
        hx-swap="innerHTML">
    <div class="sim-inputs">
      <div class="sim-input-group">
        <label>Expedition budget ($)</label>
        <input type="number" name="budget" value="${budget}" min="0" step="1000">
      </div>
      <div class="sim-input-group">
        <label>Finder share (%)</label>
        <input type="number" name="finder_share" value="${finderSharePct}" min="1" max="100">
      </div>
    </div>
    <button class="add-btn" type="submit">↺ Re-run</button>
  </form>`;

	return `
  <div class="section-label">ROI SIMULATION <span class="section-count">10,000 TRIALS</span></div>
  <div class="sim-stats">
    <div class="sim-stat">
      <div class="sim-stat-label">Expected Return</div>
      <div class="sim-stat-value" style="color:${returnColor}">${fmtMoney(expected_return)}</div>
    </div>
    <div class="sim-stat">
      <div class="sim-stat-label">Breakeven Odds</div>
      <div class="sim-stat-value">${pct(breakeven_probability)}</div>
    </div>
  </div>
  <div class="sim-percentiles">
    <div class="sim-pct-row">
      <span class="sim-pct-label">P10<span class="sim-pct-sub"> worst decile</span></span>
      <span class="sim-pct-val ${p10 >= 0 ? "sim-val-pos" : "sim-val-neg"}">${fmtMoney(p10)}</span>
    </div>
    <div class="sim-pct-row">
      <span class="sim-pct-label">P50<span class="sim-pct-sub"> median</span></span>
      <span class="sim-pct-val ${p50 >= 0 ? "sim-val-pos" : "sim-val-neg"}">${fmtMoney(p50)}</span>
    </div>
    <div class="sim-pct-row">
      <span class="sim-pct-label">P90<span class="sim-pct-sub"> best decile</span></span>
      <span class="sim-pct-val ${p90 >= 0 ? "sim-val-pos" : "sim-val-neg"}">${fmtMoney(p90)}</span>
    </div>
  </div>
  <div class="sim-histogram">${bars}</div>
  <div class="sim-axis">
    <span>${axisLeft}</span>
    <span class="sim-axis-label">outcome distribution</span>
    <span>${axisRight}</span>
  </div>
  ${reRunForm}`;
}
