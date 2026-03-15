import type { Expedition } from "../db.js";
import { escHtml, fmtDate } from "./helpers.js";

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

export function renderExpeditionsInner(
	tid: number,
	exps: Expedition[],
): string {
	const items = exps
		.map((e) => {
			const dateRange = fmtDateRange(e.start_date, e.end_date);
			const meta = [
				dateRange,
				e.budget_usd != null
					? `$${e.budget_usd.toLocaleString("en-US")}`
					: null,
			]
				.filter(Boolean)
				.join("  ·  ");

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
        ${e.team ? `<div class="exp-team">${escHtml(e.team)}</div>` : ""}
        ${e.notes ? `<div class="exp-notes">${escHtml(e.notes)}</div>` : ""}
      </div>`;
		})
		.join("");

	return `
  <div class="section-label">
    EXPEDITIONS <span class="section-count">${exps.length}</span>
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
    <input type="number" name="budget_usd" min="0" placeholder="Budget (USD)">
    <input name="team" placeholder="Team members">
    <textarea name="notes" placeholder="Expedition notes…"></textarea>
    <button class="add-btn" type="submit">+ Log Expedition</button>
  </form>`;
}
