CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target_id` integer NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`type` text DEFAULT 'archival' NOT NULL,
	`confidence_weight` integer DEFAULT 70 NOT NULL,
	`excerpt` text,
	`created_at` text NOT NULL
);
