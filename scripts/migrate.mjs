import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error("TURSO_DATABASE_URL is required.");

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const database = drizzle(client);
await migrate(database, { migrationsFolder: "./drizzle" });
client.close();
console.log("OverMCP database is up to date.");
