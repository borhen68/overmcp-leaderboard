import { NextResponse } from "next/server";
import { z } from "zod";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import { readJsonBody, RequestBodyTooLargeError } from "@/lib/request-body";
import { getWebsiteMetadata, signIconPayload } from "@/lib/website-metadata";

export const runtime = "nodejs";

const requestSchema = z.object({
  identity: z.string().trim().min(2).max(500),
});

export async function POST(request: Request) {
  if (!allowRequest(`website-metadata:${clientAddress(request)}`, 12, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many website lookups. Please enter the details manually." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 2_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    throw error;
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid website URL or @handle." }, { status: 400 });

  try {
    const metadata = await getWebsiteMetadata(parsed.data.identity);
    const iconSignature = metadata.iconDataUrl ? signIconPayload(metadata.identityKey, metadata.iconDataUrl) : null;
    return NextResponse.json({ ...metadata, iconSignature }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read that website.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
