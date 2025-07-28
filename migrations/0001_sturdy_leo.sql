CREATE TABLE `family_group_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`family_group_id` text NOT NULL,
	`invited_user_id` text,
	`invited_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`family_group_id`) REFERENCES `family_groups`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `family_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `family_group_id` text NOT NULL REFERENCES family_groups(id);--> statement-breakpoint
ALTER TABLE `savings_goals` ADD `family_group_id` text NOT NULL REFERENCES family_groups(id);--> statement-breakpoint
ALTER TABLE `spending_alerts` ADD `family_group_id` text NOT NULL REFERENCES family_groups(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `family_group_id` text NOT NULL REFERENCES family_groups(id);--> statement-breakpoint
ALTER TABLE `users` ADD `family_group_id` text REFERENCES family_groups(id);