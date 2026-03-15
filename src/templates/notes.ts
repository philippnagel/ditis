import type { Note } from "../db.js";
import { escHtml, fmtDate } from "./helpers.js";

export function renderNotesInner(tid: number, nts: Note[]): string {
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
