CREATE TABLE `race_supports` (
  `id` text PRIMARY KEY NOT NULL,
  `race_day` text NOT NULL,
  `product_id` text NOT NULL,
  `visitor_id` text NOT NULL,
  `dedupe_key` text NOT NULL,
  `supported_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `race_supports_day_visitor_unique` ON `race_supports` (`race_day`,`visitor_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `race_supports_day_signal_unique` ON `race_supports` (`race_day`,`dedupe_key`);--> statement-breakpoint
CREATE INDEX `race_supports_day_product_idx` ON `race_supports` (`race_day`,`product_id`);--> statement-breakpoint
CREATE INDEX `race_supports_supported_at_idx` ON `race_supports` (`supported_at`);
