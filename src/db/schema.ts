import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const productStatuses = ["pending", "active", "hidden"] as const;
const bidStatuses = ["pending", "paid", "expired", "failed", "refunded", "disputed"] as const;
const fundingSources = ["stripe", "credit"] as const;
const nowInMilliseconds = sql`(unixepoch() * 1000)`;

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    identityKey: text("identity_key").notNull(),
    sourceUrl: text("source_url").notNull(),
    displayName: text("display_name", { length: 100 }).notNull(),
    description: text("description", { length: 280 }).notNull(),
    category: text("category", { length: 40 }).notNull(),
    iconDataUrl: text("icon_data_url"),
    status: text("status", { enum: productStatuses }).default("pending").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
  },
  (table) => [
    uniqueIndex("products_identity_key_unique").on(table.identityKey),
    index("products_status_idx").on(table.status),
    index("products_category_idx").on(table.category),
  ],
);

export const bids = sqliteTable(
  "bids",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    refundedCents: integer("refunded_cents").default(0).notNull(),
    status: text("status", { enum: bidStatuses }).default("pending").notNull(),
    fundingSource: text("funding_source", { enum: fundingSources }).default("stripe").notNull(),
    checkoutRequestId: text("checkout_request_id"),
    targetTotalCents: integer("target_total_cents"),
    checkoutSessionId: text("checkout_session_id"),
    paymentIntentId: text("payment_intent_id"),
    customerEmail: text("customer_email"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("bids_checkout_session_unique").on(table.checkoutSessionId),
    uniqueIndex("bids_checkout_request_unique").on(table.checkoutRequestId),
    uniqueIndex("bids_one_pending_per_product").on(table.productId).where(sql`${table.status} = 'pending'`),
    index("bids_product_status_idx").on(table.productId, table.status),
    index("bids_paid_at_idx").on(table.paidAt),
    check("bids_amount_minimum", sql`${table.amountCents} >= 300`),
    check("bids_refund_valid", sql`${table.refundedCents} >= 0 AND ${table.refundedCents} <= ${table.amountCents}`),
  ],
);

export const outboundClicks = sqliteTable(
  "outbound_clicks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    dedupeKey: text("dedupe_key").notNull(),
    clickedAt: integer("clicked_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
  },
  (table) => [
    uniqueIndex("outbound_clicks_dedupe_unique").on(table.dedupeKey),
    index("outbound_clicks_product_date_idx").on(table.productId, table.clickedAt),
  ],
);

export const visitors = sqliteTable(
  "visitors",
  {
    id: text("id").primaryKey(),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
  },
  (table) => [index("visitors_last_seen_idx").on(table.lastSeenAt)],
);

export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: integer("processed_at", { mode: "timestamp_ms" }).default(nowInMilliseconds).notNull(),
});
