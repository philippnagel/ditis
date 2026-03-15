import type { Source } from "../db.js";
import { escHtml, fmtDate, SOURCE_TYPE_LABELS } from "./helpers.js";

export function renderSourcesInner(tid: number, srcs: Source[]): string {
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
                hx-target="#detail-panel"
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
  <form class="add-form upload-form"
        hx-post="/targets/${tid}/sources/upload"
        hx-target="#detail-panel"
        hx-swap="innerHTML"
        hx-encoding="multipart/form-data">
    <div class="upload-label">Upload document (PDF or image)</div>
    <div class="add-form-row">
      <input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required class="file-input">
      <select name="type">
        <option value="archival">Archival</option>
        <option value="sonar">Sonar</option>
        <option value="survey">Survey</option>
        <option value="imagery">Imagery</option>
      </select>
    </div>
    <button class="add-btn" type="submit">↑ Upload &amp; Extract</button>
  </form>
  <div class="source-divider">or add manually</div>
  <form class="add-form"
        hx-post="/targets/${tid}/sources"
        hx-target="#detail-panel"
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
