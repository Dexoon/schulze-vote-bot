PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ballots` (
	`id` text PRIMARY KEY NOT NULL,
	`electionsId` text NOT NULL,
	`rankings` text NOT NULL,
	FOREIGN KEY (`electionsId`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_ballots`("id", "electionsId", "rankings") SELECT "id", "electionsId", "rankings" FROM `ballots`;--> statement-breakpoint
DROP TABLE `ballots`;--> statement-breakpoint
ALTER TABLE `__new_ballots` RENAME TO `ballots`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_options` (
	`electionsId` text NOT NULL,
	`option` text NOT NULL,
	PRIMARY KEY(`electionsId`, `option`),
	FOREIGN KEY (`electionsId`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_options`("electionsId", "option") SELECT "electionsId", "option" FROM `options`;--> statement-breakpoint
DROP TABLE `options`;--> statement-breakpoint
ALTER TABLE `__new_options` RENAME TO `options`;--> statement-breakpoint
DELETE FROM chats
  WHERE rowid NOT IN (
    SELECT MIN(rowid) FROM chats GROUP BY chat_id
  );--> statement-breakpoint
CREATE UNIQUE INDEX `chats_chat_id_unique` ON `chats` (`chat_id`);
