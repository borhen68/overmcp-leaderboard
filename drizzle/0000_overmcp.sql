PRAGMA foreign_keys = ON;--> statement-breakpoint
CREATE TABLE `products` (
  `id` text PRIMARY KEY NOT NULL,
  `identity_key` text NOT NULL,
  `source_url` text NOT NULL,
  `display_name` text NOT NULL,
  `description` text NOT NULL,
  `category` text NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `products_identity_key_unique` ON `products` (`identity_key`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE TABLE `bids` (
  `id` text PRIMARY KEY NOT NULL,
  `product_id` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `checkout_session_id` text,
  `payment_intent_id` text,
  `customer_email` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `paid_at` integer,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `bids_amount_minimum` CHECK (`amount_cents` >= 500)
);--> statement-breakpoint
CREATE UNIQUE INDEX `bids_checkout_session_unique` ON `bids` (`checkout_session_id`);--> statement-breakpoint
CREATE INDEX `bids_product_status_idx` ON `bids` (`product_id`, `status`);--> statement-breakpoint
CREATE INDEX `bids_paid_at_idx` ON `bids` (`paid_at`);--> statement-breakpoint
CREATE TABLE `outbound_clicks` (
  `id` text PRIMARY KEY NOT NULL,
  `product_id` text NOT NULL,
  `dedupe_key` text NOT NULL,
  `clicked_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
CREATE UNIQUE INDEX `outbound_clicks_dedupe_unique` ON `outbound_clicks` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `outbound_clicks_product_date_idx` ON `outbound_clicks` (`product_id`, `clicked_at`);--> statement-breakpoint
CREATE TABLE `visitors` (
  `id` text PRIMARY KEY NOT NULL,
  `first_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `last_seen_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);--> statement-breakpoint
CREATE INDEX `visitors_last_seen_idx` ON `visitors` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `stripe_events` (
  `id` text PRIMARY KEY NOT NULL,
  `event_type` text NOT NULL,
  `processed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
