import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let cachedDatabase: LibSQLDatabase<typeof schema> | null = null;

export function isDatabaseConfigured() {
  const url = process.env.TURSO_DATABASE_URL;
  return Boolean(url && (url.startsWith("file:") || process.env.TURSO_AUTH_TOKEN));
}

export function getDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not configured.");

  if (!cachedDatabase) {
    const client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    cachedDatabase = drizzle(client, { schema });
  }

  return cachedDatabase;
}
