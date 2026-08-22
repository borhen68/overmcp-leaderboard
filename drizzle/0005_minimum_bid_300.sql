PRAGMA foreign_keys = OFF;--> statement-breakpoint
CREATE TABLE `__new_bids` (
  `id` text PRIMARY KEY NOT NULL,
  `product_id` text NOT NULL,
  `amount_cents` integer NOT NULL,
  `refunded_cents` integer DEFAULT 0 NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `funding_source` text DEFAULT 'stripe' NOT NULL,
  `checkout_request_id` text,
  `target_total_cents` integer,
  `checkout_session_id` text,
  `payment_intent_id` text,
  `customer_email` text,
  `created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
  `paid_at` integer,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT `bids_amount_minimum` CHECK (`amount_cents` >= 300),
  CONSTRAINT `bids_refund_valid` CHECK (`refunded_cents` >= 0 AND `refunded_cents` <= `amount_cents`)
);--> statement-breakpoint
INSERT INTO `__new_bids` (`id`, `product_id`, `amount_cents`, `refunded_cents`, `status`, `funding_source`, `checkout_request_id`, `target_total_cents`, `checkout_session_id`, `payment_intent_id`, `customer_email`, `created_at`, `paid_at`)
SELECT `id`, `product_id`, `amount_cents`, `refunded_cents`, `status`, `funding_source`, `checkout_request_id`, `target_total_cents`, `checkout_session_id`, `payment_intent_id`, `customer_email`, `created_at`, `paid_at` FROM `bids`;--> statement-breakpoint
DROP TABLE `bids`;--> statement-breakpoint
ALTER TABLE `__new_bids` RENAME TO `bids`;--> statement-breakpoint
CREATE UNIQUE INDEX `bids_checkout_session_unique` ON `bids` (`checkout_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bids_checkout_request_unique` ON `bids` (`checkout_request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bids_one_pending_per_product` ON `bids` (`product_id`) WHERE `status` = 'pending';--> statement-breakpoint
CREATE INDEX `bids_product_status_idx` ON `bids` (`product_id`,`status`);--> statement-breakpoint
CREATE INDEX `bids_paid_at_idx` ON `bids` (`paid_at`);--> statement-breakpoint
PRAGMA foreign_keys = ON;
