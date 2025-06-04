CREATE TABLE `ballots` (
	`id` text PRIMARY KEY NOT NULL,
	`electionsId` text NOT NULL,
	`rankings` text NOT NULL,
	FOREIGN KEY (`electionsId`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` text NOT NULL,
	`user_id` text NOT NULL,
	`bot_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bot_id`) REFERENCES `bots`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chats_chat_id_user_id_bot_id_unique` ON `chats` (`chat_id`,`user_id`,`bot_id`);--> statement-breakpoint
CREATE TABLE `elections` (
	`id` text PRIMARY KEY NOT NULL,
	`chatId` integer NOT NULL,
	`question` text NOT NULL,
	FOREIGN KEY (`chatId`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `options` (
	`id` text PRIMARY KEY NOT NULL,
	`electionsId` text NOT NULL,
	`option` text NOT NULL,
	FOREIGN KEY (`electionsId`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `options_electionsId_option_unique` ON `options` (`electionsId`,`option`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text,
	`username` text
);
