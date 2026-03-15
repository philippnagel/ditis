CREATE TABLE `expeditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` integer NOT NULL,
	`name` text NOT NULL,
	`stage` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`budget_usd` integer,
	`team` text,
	`start_date` text,
	`end_date` text,
	`notes` text,
	`created_at` text NOT NULL
);
