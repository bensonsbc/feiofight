CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`secret` text NOT NULL,
	`name` text NOT NULL,
	`slot` integer,
	`hero` text,
	`seen` integer NOT NULL,
	`input` text,
	`offer` text,
	`answer` text,
	FOREIGN KEY (`room`) REFERENCES `rooms`(`code`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_room_slot` ON `members` (`room`,`slot`);--> statement-breakpoint
CREATE INDEX `members_room_seen` ON `members` (`room`,`seen`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`host` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	`state` text,
	`updated` integer NOT NULL
);
