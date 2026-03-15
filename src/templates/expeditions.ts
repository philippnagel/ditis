import type { Expedition } from "../db.js";
import { escHtml, fmtDate, fmtUsd } from "./helpers.js";

const STAGE_LABELS: Record<string, string> = {
	research: "RESEARCH",
	survey: "SURVEY",
	validation: "VALIDATION",
	recovery: "RECOVERY",
};

const STATUS_LABELS: Record<string, string> = {
	planned: "PLANNED",
	active: "ACTIVE",
	complete: "COMPLETE",
	cancelled: "CANCELLED",
};

function fmtDateRange(start: string | null, end: string | null): string {
	if (!start && !end) return "";
	if (start && !end) return fmtDate(start);
	if (!start && end) return `Until ${fmtDate(end)}`;
	return `${fmtDate(start ?? "")} – ${fmtDate(end ?? "")}`;
}

function renderCostBreakdown(e: Expedition): string {
	const breakdown = [
		e.equipment_usd != null ? `Equipment: ${fmtUsd(e.equipment_usd)}` : null,
		e.crew_usd != null ? `Crew: ${fmtUsd(e.crew_usd)}` : null,
		e.permits_usd != null ? `Permits: ${fmtUsd(e.permits_usd)}` : null,
		e.logistics_usd != null ? `Logistics: ${fmtUsd(e.logistics_usd)}` : null,
	].filter(Boolean);

	if (breakdown.length === 0) return "";

	const total =
		(e.equipment_usd ?? 0) +
		(e.crew_usd ?? 0) +
		(e.permits_usd ?? 0) +
		(e.logistics_usd ?? 0);

	return `<div class="exp-cost-breakdown">${breakdown.join("  ·  ")}  <span class="exp-cost-total">= ${fmtUsd(total)}</span></div>`;
}

export function renderExpeditionsInner(
	tid: number,
	exps: Expedition[],
): string {
	const items = exps
		.map((e) => {
			const dateRange = fmtDateRange(e.start_date, e.end_date);
			const hasBreakdown =
				e.equipment_usd != null ||
				e.crew_usd != null ||
				e.permits_usd != null ||
				e.logistics_usd != null;
			const budgetDisplay =
				!hasBreakdown && e.budget_usd != null ? fmtUsd(e.budget_usd) : null;
			const meta = [dateRange, budgetDisplay].filter(Boolean).join("  ·  ");

			return `
      <div class="exp-item">
        <div class="exp-header">
          <span class="exp-name">${escHtml(e.name)}</span>
          <div class="exp-badges">
            <span class="exp-stage-badge exp-stage-${e.stage}">${STAGE_LABELS[e.stage]}</span>
            <span class="exp-status-badge exp-status-${e.status}">${STATUS_LABELS[e.status]}</span>
          </div>
          <button class="del-btn"
                  hx-delete="/targets/${tid}/expeditions/${e.id}"
                  hx-target="#expeditions-section-${tid}"
                  hx-swap="innerHTML"
                  title="Remove">×</button>
        </div>
        ${meta ? `<div class="exp-meta">${escHtml(meta)}</div>` : ""}
        ${renderCostBreakdown(e)}
        ${e.team ? `<div class="exp-team">${escHtml(e.team)}</div>` : ""}
        ${e.notes ? `<div class="exp-notes">${escHtml(e.notes)}</div>` : ""}
      </div>`;
		})
		.join("");

	return `
  <div class="section-label-row">
    <div class="section-label">
      EXPEDITIONS <span class="section-count">${exps.length}</span>
    </div>
    <button class="generate-btn"
            hx-post="/targets/${tid}/expeditions/generate"
            hx-target="#expeditions-section-${tid}"
            hx-swap="innerHTML"
            hx-indicator="#exp-spinner-${tid}">
      ✦ Generate Plan
      <span id="exp-spinner-${tid}" class="htmx-indicator"> …</span>
    </button>
  </div>
  <div class="exp-list">${exps.length ? items : '<p class="empty-state">No expeditions logged yet.</p>'}</div>
  <form class="add-form"
        hx-post="/targets/${tid}/expeditions"
        hx-target="#expeditions-section-${tid}"
        hx-swap="innerHTML">
    <input name="name" placeholder="Name *" required>
    <div class="add-form-row">
      <select name="stage">
        <option value="research">Research</option>
        <option value="survey">Survey</option>
        <option value="validation">Validation</option>
        <option value="recovery">Recovery</option>
      </select>
      <select name="status">
        <option value="planned">Planned</option>
        <option value="active">Active</option>
        <option value="complete">Complete</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div class="add-form-row">
      <input type="date" name="start_date" placeholder="Start date">
      <input type="date" name="end_date" placeholder="End date">
    </div>
    <input type="number" name="budget_usd" min="0" placeholder="Total Budget (USD)">
    <details class="cost-breakdown-toggle">
      <summary>Cost breakdown (optional)</summary>
      <div class="add-form-row">
        <input type="number" name="equipment_usd" min="0" placeholder="Equipment (USD)">
        <input type="number" name="crew_usd" min="0" placeholder="Crew (USD)">
      </div>
      <div class="add-form-row">
        <input type="number" name="permits_usd" min="0" placeholder="Permits (USD)">
        <input type="number" name="logistics_usd" min="0" placeholder="Logistics (USD)">
      </div>
    </details>
    <input name="team" placeholder="Team members">
    <textarea name="notes" placeholder="Expedition notes…"></textarea>
    <button class="add-btn" type="submit">+ Log Expedition</button>
  </form>`;
}
