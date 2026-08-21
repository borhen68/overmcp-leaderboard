import { eq } from "drizzle-orm";
import { getDatabase, isDatabaseConfigured } from "@/db";
import { products } from "@/db/schema";

export const runtime = "nodejs";

const storedIconPattern = /^data:(image\/(?:png|jpeg|webp|gif|x-icon|vnd\.microsoft\.icon));base64,([a-zA-Z0-9+/]+=*)$/;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) return new Response(null, { status: 404 });

  const { id } = await context.params;
  const product = (await getDatabase()
    .select({ iconDataUrl: products.iconDataUrl, status: products.status })
    .from(products)
    .where(eq(products.id, id))
    .limit(1))[0];

  if (!product?.iconDataUrl || product.status !== "active") return new Response(null, { status: 404 });
  const match = product.iconDataUrl.match(storedIconPattern);
  if (!match) return new Response(null, { status: 404 });

  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
  return new Response(bytes, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      "Content-Type": match[1],
      "Content-Length": String(bytes.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
