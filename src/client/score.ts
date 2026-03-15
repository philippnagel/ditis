import type { ScoreFactors } from "../scoring.js";
import { computeScore, FACTOR_WEIGHTS, scoreColor } from "../scoring.js";

export { scoreColor };

export function updateScore(input: HTMLInputElement): void {
	const valEl = document.getElementById(`val-${input.name}`);
	if (valEl) valEl.textContent = input.value;

	const fc = scoreColor(Number.parseInt(input.value, 10));
	input.style.setProperty("--pct", `${input.value}%`);
	input.style.setProperty("--fill", fc);

	const factors = Object.fromEntries(
		Object.keys(FACTOR_WEIGHTS).map((key) => [
			key,
			Number.parseInt(
				(document.getElementById(`factor-${key}`) as HTMLInputElement | null)
					?.value ?? "0",
				10,
			),
		]),
	) as unknown as ScoreFactors;
	const score = computeScore(factors);

	const scoreEl = document.getElementById("live-score");
	const wrap = document.getElementById("live-score-wrap");
	if (scoreEl) scoreEl.textContent = String(score);
	if (wrap) wrap.style.color = scoreColor(score);

	const saveBtn = document.getElementById("save-scores-btn");
	if (saveBtn && !saveBtn.classList.contains("unsaved")) {
		saveBtn.classList.add("unsaved");
		saveBtn.textContent = "Save Score Changes ●";
	}
}
