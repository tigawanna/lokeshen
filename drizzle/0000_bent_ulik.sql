CREATE TABLE `kenya_wards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ward_code` text,
	`ward` text NOT NULL,
	`county` text NOT NULL,
	`county_code` integer,
	`sub_county` text,
	`constituency` text NOT NULL,
	`constituency_code` integer,
	`geom` GEOMETRY
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`type` text DEFAULT 'note' NOT NULL,
	`value` real,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`location` GEOMETRY
);
