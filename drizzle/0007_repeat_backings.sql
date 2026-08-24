DROP INDEX `race_supports_day_visitor_unique`;--> statement-breakpoint
DROP INDEX `race_supports_day_signal_unique`;--> statement-breakpoint
CREATE INDEX `race_supports_day_visitor_idx` ON `race_supports` (`race_day`,`visitor_id`);--> statement-breakpoint
CREATE INDEX `race_supports_day_signal_idx` ON `race_supports` (`race_day`,`dedupe_key`);
