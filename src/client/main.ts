import {
	addMapTarget,
	type ClientTarget,
	initMap,
	removeMapTarget,
	selectTarget,
	setMapFilter,
	setTargetScore,
	toggleRoutes,
	toggleTheme,
} from "./map.js";
import { updateScore } from "./score.js";

// Read target data embedded in the HTML
const targetsEl = document.getElementById("targets-data");
const targets: ClientTarget[] = targetsEl
	? (JSON.parse(targetsEl.textContent ?? "[]") as ClientTarget[])
	: [];

// Expose functions for inline HTML event handlers
declare global {
	interface Window {
		selectTarget: typeof selectTarget;
		updateScore: typeof updateScore;
		toggleTheme: typeof toggleTheme;
		toggleRoutes: typeof toggleRoutes;
		filterTargets: (q: string) => void;
	}
}

window.selectTarget = selectTarget;
window.updateScore = updateScore;
window.toggleTheme = toggleTheme;
window.toggleRoutes = toggleRoutes;

window.filterTargets = (q: string) => {
	const lower = q.toLowerCase();
	const matchingIds: number[] = [];
	for (const el of document.querySelectorAll<HTMLElement>(".target-row")) {
		const matches = (el.dataset.name ?? "").toLowerCase().includes(lower);
		el.style.display = matches ? "" : "none";
		if (matches) matchingIds.push(Number(el.dataset.id));
	}
	setMapFilter(q ? matchingIds : null);
};

// Sync map dots when a score is saved
document.body.addEventListener("scoreUpdated", (e) => {
	const { id, score } = (e as CustomEvent<{ id: number; score: number }>)
		.detail;
	setTargetScore(id, score);
});

// Add new target to map when created via the UI form
document.body.addEventListener("targetAdded", (e) => {
	const target = (e as CustomEvent<ClientTarget>).detail;
	addMapTarget(target);
	selectTarget(target.id, target.lng, target.lat);
});

// Remove target from map when deleted
document.body.addEventListener("targetRemoved", (e) => {
	const { id } = (e as CustomEvent<{ id: number }>).detail;
	removeMapTarget(id);
});

// Close detail menu when clicking outside
document.addEventListener("click", (e) => {
	if (!(e.target as Element).closest(".detail-menu")) {
		document.querySelector(".detail-menu.open")?.classList.remove("open");
	}
});

initMap(targets);
