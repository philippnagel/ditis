import z from "zod";

export const TargetSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	description: z.string(),
	lat: z.number(),
	lng: z.number(),
	tier: z
		.number()
		.int()
		.min(1)
		.max(4)
		.describe("1=Launch, 2=Growth, 3=Big Bet, 4=Speculative"),
	est_value_usd: z.number().int().describe("Estimated value in USD"),
	legal_framework: z.string(),
	depth_m: z.number().int().nullable(),
	status: z.enum(["research", "survey", "validation", "recovery", "complete"]),
	historical_confidence: z.number().int().min(0).max(100),
	value_score: z.number().int().min(0).max(100),
	location_precision: z.number().int().min(0).max(100),
	legal_feasibility: z.number().int().min(0).max(100),
	recovery_ease: z.number().int().min(0).max(100),
	sensor_validation: z.number().int().min(0).max(100),
	score: z.number().describe("Composite score (0–100)"),
});

export const NewTargetSchema = z.object({
	name: z.string().min(1),
	description: z.string().default(""),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	tier: z.number().int().min(1).max(4),
	est_value_usd: z.number().int().min(0),
	legal_framework: z.string().default(""),
	depth_m: z.number().int().nullable().optional(),
	historical_confidence: z.number().int().min(0).max(100).default(50),
	value_score: z.number().int().min(0).max(100).default(50),
	location_precision: z.number().int().min(0).max(100).default(50),
	legal_feasibility: z.number().int().min(0).max(100).default(50),
	recovery_ease: z.number().int().min(0).max(100).default(50),
	sensor_validation: z.number().int().min(0).max(100).default(0),
});

export const ScoreFactorsSchema = z.object({
	historical_confidence: z
		.number()
		.int()
		.min(0)
		.max(100)
		.describe("25% weight"),
	value_score: z.number().int().min(0).max(100).describe("20% weight"),
	location_precision: z.number().int().min(0).max(100).describe("20% weight"),
	legal_feasibility: z.number().int().min(0).max(100).describe("15% weight"),
	recovery_ease: z.number().int().min(0).max(100).describe("10% weight"),
	sensor_validation: z.number().int().min(0).max(100).describe("10% weight"),
});

export const SourceSchema = z.object({
	id: z.number().int(),
	target_id: z.number().int(),
	title: z.string(),
	url: z.string().nullable(),
	type: z.enum(["archival", "sonar", "survey", "imagery"]),
	confidence_weight: z.number().int().min(0).max(100),
	excerpt: z.string().nullable(),
	created_at: z.string(),
});

export const NewSourceSchema = z.object({
	title: z.string().min(1),
	url: z.string().optional(),
	type: z.enum(["archival", "sonar", "survey", "imagery"]).default("archival"),
	confidence_weight: z.number().int().min(0).max(100).default(70),
	excerpt: z.string().optional(),
});

export const NoteSchema = z.object({
	id: z.number().int(),
	target_id: z.number().int(),
	content: z.string(),
	created_at: z.string(),
});

export const NewNoteSchema = z.object({
	content: z.string().min(1),
});

export const ExpeditionSchema = z.object({
	id: z.number().int(),
	target_id: z.number().int(),
	name: z.string(),
	stage: z.enum(["research", "survey", "validation", "recovery"]),
	status: z.enum(["planned", "active", "complete", "cancelled"]),
	budget_usd: z.number().int().nullable(),
	team: z.string().nullable(),
	start_date: z.string().nullable(),
	end_date: z.string().nullable(),
	notes: z.string().nullable(),
	created_at: z.string(),
});

export const NewExpeditionSchema = z.object({
	name: z.string().min(1),
	stage: z.enum(["research", "survey", "validation", "recovery"]),
	status: z
		.enum(["planned", "active", "complete", "cancelled"])
		.default("planned"),
	budget_usd: z.number().int().nullable().optional(),
	team: z.string().nullable().optional(),
	start_date: z.string().nullable().optional(),
	end_date: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});
