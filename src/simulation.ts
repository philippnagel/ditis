export interface SimulationInput {
	est_value_usd: number;
	legal_feasibility: number; // 0–100
	location_precision: number; // 0–100
	recovery_ease: number; // 0–100
	expedition_budget: number;
	finder_share: number; // 0–1
}

export interface SimulationResult {
	expected_return: number;
	breakeven_probability: number; // 0–1
	p10: number;
	p50: number;
	p90: number;
	histogram: number[]; // 20 bars, normalized 0–100
	min_outcome: number;
	bucket_size: number;
	trials: number;
}

/**
 * Runs a Monte Carlo ROI simulation with n trials.
 *
 * Each trial models three sequential gates:
 *   1. Legal access achieved?    Bernoulli(legal_feasibility / 100)
 *   2. Target discovered?        Bernoulli(location_precision / 100)
 *   3. Recovery fraction?        Uniform(0, recovery_ease / 100)
 *      Value uncertainty?        Uniform(0.5, 1.5) of est_value_usd
 *
 * Failure at gates 1 or 2 → outcome = –expedition_budget (sunk cost).
 * Success → net = est_value * fraction * uncertainty * finder_share – budget.
 */
export function runMonteCarlo(
	input: SimulationInput,
	n = 10_000,
): SimulationResult {
	const {
		est_value_usd,
		legal_feasibility,
		location_precision,
		recovery_ease,
		expedition_budget,
		finder_share,
	} = input;

	const outcomes = new Float64Array(n);

	for (let i = 0; i < n; i++) {
		if (Math.random() * 100 > legal_feasibility) {
			outcomes[i] = -expedition_budget;
			continue;
		}
		if (Math.random() * 100 > location_precision) {
			outcomes[i] = -expedition_budget;
			continue;
		}
		const recoveryFraction = Math.random() * (recovery_ease / 100);
		const valueMultiplier = 0.5 + Math.random();
		const gross = est_value_usd * recoveryFraction * valueMultiplier;
		outcomes[i] = gross * finder_share - expedition_budget;
	}

	outcomes.sort();

	let sum = 0;
	let breakevenCount = 0;
	for (const v of outcomes) {
		sum += v;
		if (v >= 0) breakevenCount++;
	}

	const expected_return = sum / n;
	const breakeven_probability = breakevenCount / n;
	const p10 = outcomes[Math.floor(n * 0.1)];
	const p50 = outcomes[Math.floor(n * 0.5)];
	const p90 = outcomes[Math.floor(n * 0.9)];

	const min_outcome = outcomes[0];
	const max_outcome = outcomes[n - 1];
	const bucket_size = (max_outcome - min_outcome) / 20 || 1;

	const counts = new Array<number>(20).fill(0);
	for (const v of outcomes) {
		counts[Math.min(19, Math.floor((v - min_outcome) / bucket_size))]++;
	}
	const maxCount = Math.max(...counts);
	const histogram = counts.map((c) => Math.round((c / maxCount) * 100));

	return {
		expected_return,
		breakeven_probability,
		p10,
		p50,
		p90,
		histogram,
		min_outcome,
		bucket_size,
		trials: n,
	};
}
