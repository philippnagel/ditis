CREATE TABLE `targets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`tier` integer NOT NULL,
	`est_value_usd` integer NOT NULL,
	`legal_framework` text NOT NULL,
	`depth_m` integer,
	`status` text DEFAULT 'research' NOT NULL,
	`historical_confidence` integer NOT NULL,
	`value_score` integer NOT NULL,
	`location_precision` integer NOT NULL,
	`legal_feasibility` integer NOT NULL,
	`recovery_ease` integer NOT NULL,
	`sensor_validation` integer NOT NULL,
	`score` real NOT NULL
);
