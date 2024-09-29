CREATE TABLE `links` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`shortcode` text NOT NULL,
	`originalUrl` text NOT NULL,
	`public` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shorcodeIdx` ON `links` (`shortcode`);