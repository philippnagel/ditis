export interface ScoreFactors {
	historical_confidence: number; // 0–100
	value_score: number; // 0–100
	location_precision: number; // 0–100
	legal_feasibility: number; // 0–100
	recovery_ease: number; // 0–100 (100 = trivial, 0 = impossible)
	sensor_validation: number; // 0–100
}

export const FACTOR_WEIGHTS: Record<keyof ScoreFactors, number> = {
	historical_confidence: 0.25,
	value_score: 0.2,
	location_precision: 0.2,
	legal_feasibility: 0.15,
	recovery_ease: 0.1,
	sensor_validation: 0.1,
};

export const FACTOR_META: Record<
	keyof ScoreFactors,
	{ label: string; weight: string }
> = {
	historical_confidence: { label: "Historical Confidence", weight: "25%" },
	value_score: { label: "Estimated Value", weight: "20%" },
	location_precision: { label: "Location Precision", weight: "20%" },
	legal_feasibility: { label: "Legal Feasibility", weight: "15%" },
	recovery_ease: { label: "Recovery Ease", weight: "10%" },
	sensor_validation: { label: "Sensor Validation", weight: "10%" },
};

export function computeScore(f: ScoreFactors): number {
	return (
		Math.round(
			(Object.keys(FACTOR_WEIGHTS) as (keyof ScoreFactors)[]).reduce(
				(sum, key) => sum + f[key] * FACTOR_WEIGHTS[key],
				0,
			) * 10,
		) / 10
	);
}

export function scoreColor(score: number): string {
	if (score >= 70) return "#10b981";
	if (score >= 50) return "#f59e0b";
	if (score >= 35) return "#ef4444";
	return "#6b7280";
}

export function tierLabel(tier: number): string {
	return (
		["", "T1 — Launch", "T2 — Growth", "T3 — Big Bet", "T4 — Speculative"][
			tier
		] ?? "Unknown"
	);
}
