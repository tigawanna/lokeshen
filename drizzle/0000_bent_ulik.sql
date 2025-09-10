CREATE TABLE `kenya_wards` IF NOT EXISTS (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ward_code` text,
	`ward` text NOT NULL,
	`county` text NOT NULL,
	`county_code` integer,
	`sub_county` text,
	`constituency` text NOT NULL,
	`constituency_code` integer,
	-- `geom` GEOMETRY
);

SELECT AddGeometryColumn('kenya_wards', 'geom', 4326, 'MULTIPOLYGON', 'XY');

--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`type` text DEFAULT 'note' NOT NULL,
	`value` real,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	-- `location` GEOMETRY
);

SELECT AddGeometryColumn('notes', 'location', 4326, 'POINT', 'XY');
