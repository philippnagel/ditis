import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const targets = sqliteTable("targets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	description: text("description").notNull(),
	lat: real("lat").notNull(),
	lng: real("lng").notNull(),
	tier: integer("tier").notNull(),
	est_value_usd: integer("est_value_usd").notNull(),
	legal_framework: text("legal_framework").notNull(),
	depth_m: integer("depth_m"),
	status: text("status", {
		enum: ["research", "survey", "validation", "recovery", "complete"],
	})
		.notNull()
		.default("research"),
	historical_confidence: integer("historical_confidence").notNull(),
	value_score: integer("value_score").notNull(),
	location_precision: integer("location_precision").notNull(),
	legal_feasibility: integer("legal_feasibility").notNull(),
	recovery_ease: integer("recovery_ease").notNull(),
	sensor_validation: integer("sensor_validation").notNull(),
	score: real("score").notNull(),
});

export const sources = sqliteTable("sources", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	target_id: integer("target_id").notNull(),
	title: text("title").notNull(),
	url: text("url"),
	type: text("type", { enum: ["archival", "sonar", "survey", "imagery"] })
		.notNull()
		.default("archival"),
	confidence_weight: integer("confidence_weight").notNull().default(70),
	excerpt: text("excerpt"),
	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});

export const notes = sqliteTable("notes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	target_id: integer("target_id").notNull(),
	content: text("content").notNull(),
	created_at: text("created_at")
		.notNull()
		.$defaultFn(() => new Date().toISOString()),
});
