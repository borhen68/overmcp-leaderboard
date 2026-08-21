import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { visitors } from "@/db/schema";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";

const payloadSchema = z.object({ visitorId: z.uuid() });

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: false }, { status: 503 });
  if (!allowRequest(`presence:${clientAddress(request)}`, 120, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many presence updates." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 1_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    throw error;
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid visitor id." }, { status: 400 });

  const db = getDatabase();
  const now = new Date();
  await db
    .insert(visitors)
    .values({ id: parsed.data.visitorId, firstSeenAt: now, lastSeenAt: now })
    .onConflictDoUpdate({ target: visitors.id, set: { lastSeenAt: now } });

  return NextResponse.json({ ok: true });
}
