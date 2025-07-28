CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'fa-tag' NOT NULL,
	`color` text DEFAULT '#1976D2' NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`target_date` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `spending_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`limit_amount` real NOT NULL,
	`period` text DEFAULT 'monthly' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`is_recurring` integer DEFAULT false NOT NULL,
	`recurring_day` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);