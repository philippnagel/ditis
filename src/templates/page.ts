import type { Target } from "../db.js";
import { goNoGo } from "../scoring.js";
import { fmtBig } from "./helpers.js";
import { renderTargetRow } from "./target-row.js";

export function renderPipelineStats(targets: Target[]): string {
	const totalValue = targets.reduce((sum, t) => sum + t.est_value_usd, 0);
	const valueFmt = `${fmtBig(totalValue)}+`;
	const goCount = targets.filter((t) => goNoGo(t) === "go").length;
	return `<span class="pipeline-stat"><span class="pipeline-num">${targets.length}</span> TARGETS</span>
      <span class="pipeline-sep">·</span>
      <span class="pipeline-stat pipeline-stat-go"><span class="pipeline-num">${goCount}</span> GO</span>
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
        <button class="investor-btn"
                hx-get="/investor"
                hx-target="#investor-modal-body"
                hx-swap="innerHTML"
                hx-on::after-request="document.getElementById('investor-modal').showModal()"
                title="Investor Portal">Investor</button>
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
        <div class="form-row">
          <label>Location *</label>
          <input type="text" id="location-search" placeholder="Search location… e.g. Vero Beach, FL" oninput="debounceGeocode(this.value)" autocomplete="off">
          <input type="hidden" name="lat" id="lat-hidden">
          <input type="hidden" name="lng" id="lng-hidden">
          <div id="geocode-result" class="geocode-result"></div>
          <button type="button" class="manual-coords-toggle" onclick="toggleManualCoords()">Enter coordinates manually</button>
          <div id="manual-coords" class="manual-coords" style="display:none">
            <div class="form-row-2">
              <input type="number" id="lat-manual" step="0.001" placeholder="Lat e.g. 27.640" oninput="applyManualCoords()">
              <input type="number" id="lng-manual" step="0.001" placeholder="Lng e.g. -80.370" oninput="applyManualCoords()">
            </div>
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
        <button type="submit" id="add-target-submit" class="btn-primary" disabled>Add Target</button>
      </div>
    </form>
  </dialog>

  <script>
    (function () {
      var _geocodeTimer = null;

      function resetGeocodeState() {
        document.getElementById('lat-hidden').value = '';
        document.getElementById('lng-hidden').value = '';
        document.getElementById('geocode-result').textContent = '';
        document.getElementById('add-target-submit').disabled = true;
      }

      window.debounceGeocode = function (val) {
        clearTimeout(_geocodeTimer);
        resetGeocodeState();
        var q = val.trim();
        if (!q) return;
        _geocodeTimer = setTimeout(function () { geocodeLocation(q); }, 500);
      };

      window.geocodeLocation = function (q) {
        var resultEl = document.getElementById('geocode-result');
        resultEl.textContent = 'Searching…';
        fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=1', {
          headers: { 'User-Agent': 'DitisCore/0.1' }
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || data.length === 0) {
              resultEl.textContent = 'No results found.';
              return;
            }
            var place = data[0];
            var lat = parseFloat(place.lat);
            var lng = parseFloat(place.lon);
            document.getElementById('lat-hidden').value = lat.toFixed(6);
            document.getElementById('lng-hidden').value = lng.toFixed(6);
            resultEl.textContent = place.display_name + ' (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
            document.getElementById('add-target-submit').disabled = false;
          })
          .catch(function () {
            resultEl.textContent = 'Geocoding failed. Please try again.';
          });
      };

      window.toggleManualCoords = function () {
        var el = document.getElementById('manual-coords');
        var isHidden = el.style.display === 'none';
        el.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
          document.getElementById('location-search').value = '';
          resetGeocodeState();
          document.getElementById('geocode-result').textContent = '';
        } else {
          document.getElementById('lat-manual').value = '';
          document.getElementById('lng-manual').value = '';
          resetGeocodeState();
        }
      };

      window.applyManualCoords = function () {
        var lat = parseFloat(document.getElementById('lat-manual').value);
        var lng = parseFloat(document.getElementById('lng-manual').value);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          document.getElementById('lat-hidden').value = lat.toFixed(6);
          document.getElementById('lng-hidden').value = lng.toFixed(6);
          document.getElementById('geocode-result').textContent = lat.toFixed(4) + ', ' + lng.toFixed(4);
          document.getElementById('add-target-submit').disabled = false;
        } else {
          document.getElementById('lat-hidden').value = '';
          document.getElementById('lng-hidden').value = '';
          document.getElementById('add-target-submit').disabled = true;
        }
      };

      // Reset geocode state when modal is closed so a re-open starts fresh
      var modal = document.getElementById('add-target-modal');
      if (modal) {
        modal.addEventListener('close', function () {
          document.getElementById('location-search').value = '';
          document.getElementById('manual-coords').style.display = 'none';
          document.getElementById('lat-manual').value = '';
          document.getElementById('lng-manual').value = '';
          resetGeocodeState();
        });
      }
    })();
  </script>

  <dialog id="investor-modal" class="investor-modal">
    <div id="investor-modal-body" class="inv-body"></div>
  </dialog>

  <script id="targets-data" type="application/json">${targetsJson}</script>
  <script src="/public/app.js" defer></script>
</body>
</html>`;
}
