ALTER TABLE `bids` ADD `checkout_request_id` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `target_total_cents` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `bids_checkout_request_unique` ON `bids` (`checkout_request_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bids_one_pending_per_product` ON `bids` (`product_id`) WHERE `status` = 'pending';
