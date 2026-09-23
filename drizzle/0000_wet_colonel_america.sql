CREATE TABLE `records` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `id`)
);
