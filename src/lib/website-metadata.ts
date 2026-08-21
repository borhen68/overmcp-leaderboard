import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import type { IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { normalizeIdentity } from "@/lib/identity";

const MAX_HTML_BYTES = 1_500_000;
const MAX_ICON_BYTES = 96_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 6_000;
const iconDataPattern = /^data:image\/(png|jpeg|webp|gif|x-icon|vnd\.microsoft\.icon);base64,[a-zA-Z0-9+/]+=*$/;

type WebsiteMetadata = {
  identityKey: string;
  sourceUrl: string;
  hostname: string;
  name: string;
  description: string;
  iconDataUrl: string | null;
};

function isPublicIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;

  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function isPublicIpv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  if (normalized.startsWith("ff")) return false;
  if (normalized.startsWith("2001:db8:")) return false;

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPublicIpv4(mapped[1]) : true;
}

function isPublicIp(address: string) {
  const version = isIP(address);
  if (version === 4) return isPublicIpv4(address);
  if (version === 6) return isPublicIpv6(address);
  return false;
}

async function resolvePublicAddress(url: URL) {
  if (url.protocol !== "https:") throw new Error("The website must support HTTPS.");
  if (url.username || url.password) throw new Error("Website URLs cannot include credentials.");
  if (url.port && url.port !== "443") throw new Error("Only standard HTTPS website URLs are supported.");

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname)) {
    if (!isPublicIp(hostname)) throw new Error("Enter a public website URL.");
    return { address: hostname, family: isIP(hostname) };
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("Enter a public website URL.");
  }
  return addresses[0];
}

function headerValue(headers: IncomingHttpHeaders, name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

type PinnedResponse = {
  status: number;
  headers: IncomingHttpHeaders;
  body: Uint8Array;
};

async function pinnedHttpsGet(
  url: URL,
  headers: Record<string, string>,
  maximumBytes: number,
  tooLargeMessage: string,
): Promise<PinnedResponse> {
  const pinnedAddress = await resolvePublicAddress(url);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const request = httpsRequest({
      protocol: "https:",
      hostname,
      port: 443,
      method: "GET",
      path: `${url.pathname}${url.search}`,
      servername: isIP(hostname) ? undefined : hostname,
      family: pinnedAddress.family,
      headers: {
        ...headers,
        Host: url.host,
        "Accept-Encoding": "identity",
      },
      lookup: (_requestedHostname, _options, callback) => {
        callback(null, pinnedAddress.address, pinnedAddress.family);
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    }, (response) => {
      const status = response.statusCode ?? 0;
      if ((status >= 300 && status < 400) || status < 200 || status >= 300) {
        response.resume();
        settled = true;
        resolve({ status, headers: response.headers, body: new Uint8Array() });
        return;
      }

      const declaredLength = Number(headerValue(response.headers, "content-length") ?? 0);
      if (declaredLength > maximumBytes) {
        response.destroy();
        fail(new Error(tooLargeMessage));
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      response.on("data", (chunk: Buffer) => {
        total += chunk.byteLength;
        if (total > maximumBytes) {
          response.destroy();
          fail(new Error(tooLargeMessage));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => {
        if (settled) return;
        settled = true;
        resolve({ status, headers: response.headers, body: Buffer.concat(chunks, total) });
      });
      response.on("error", fail);
    });

    request.on("error", fail);
    request.end();
  });
}

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
      if (token[0] !== "#") return named[token.toLowerCase()] ?? entity;
      const hexadecimal = token[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(token.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
      } catch {
        return entity;
      }
    })
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attributesFromTag(tag: string) {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(tag))) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function metaContent(html: string, keys: string[]) {
  const wanted = new Set(keys);
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = attributesFromTag(match[0]);
    const key = (attributes.get("property") ?? attributes.get("name") ?? "").toLowerCase();
    const content = attributes.get("content");
    if (wanted.has(key) && content) return decodeHtml(content);
  }
  return "";
}

function metadataFromHtml(html: string, fallbackName: string) {
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const name = metaContent(html, ["og:title", "twitter:title"])
    || decodeHtml(documentTitle)
    || fallbackName;
  const description = metaContent(html, ["og:description", "twitter:description", "description"]);

  return {
    name: [...name].slice(0, 100).join("").trim(),
    description: [...description].slice(0, 280).join("").trim(),
  };
}

function iconUrlsFromHtml(html: string, pageUrl: URL) {
  const candidates: Array<{ url: URL; score: number }> = [];

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = attributesFromTag(match[0]);
    const rel = (attributes.get("rel") ?? "").toLowerCase().split(/\s+/);
    const href = attributes.get("href");
    if (!href || !rel.some((item) => item === "icon" || item === "shortcut" || item === "apple-touch-icon")) continue;

    try {
      const url = new URL(href, pageUrl);
      const sizes = attributes.get("sizes") ?? "";
      const numericSize = Number.parseInt(sizes.match(/(\d+)x\d+/i)?.[1] ?? "0", 10);
      const score = rel.includes("apple-touch-icon") ? 400 + numericSize : 200 + numericSize;
      candidates.push({ url, score });
    } catch {
      // Ignore malformed icon references and try the conventional favicon.
    }
  }

  candidates.push({ url: new URL("/favicon.ico", pageUrl.origin), score: 1 });
  return [...new Map(candidates
    .sort((a, b) => b.score - a.score)
    .map((candidate) => [candidate.url.toString(), candidate.url])).values()].slice(0, 6);
}

function detectedIconMime(bytes: Uint8Array) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)).startsWith("GIF8")) return "image/gif";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  if (bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0) return "image/x-icon";
  return null;
}

async function fetchIconDataUrl(initialUrl: URL) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await pinnedHttpsGet(
      currentUrl,
      {
        Accept: "image/png,image/jpeg,image/webp,image/gif,image/x-icon,*/*;q=0.2",
        "User-Agent": "OverMCP-Metadata/1.0 (+https://overmcp.com)",
      },
      MAX_ICON_BYTES,
      "Image is too large.",
    );

    if (response.status >= 300 && response.status < 400) {
      const location = headerValue(response.headers, "location");
      if (!location || redirectCount === MAX_REDIRECTS) return null;
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (response.status < 200 || response.status >= 300) return null;
    const mime = detectedIconMime(response.body);
    if (!mime) return null;
    return `data:${mime};base64,${Buffer.from(response.body).toString("base64")}`;
  }

  return null;
}

async function firstUsableIcon(html: string, pageUrl: URL) {
  for (const iconUrl of iconUrlsFromHtml(html, pageUrl)) {
    try {
      const icon = await fetchIconDataUrl(iconUrl);
      if (icon) return icon;
    } catch {
      // Continue to the next declared icon or the conventional favicon.
    }
  }
  return null;
}

function metadataSigningSecret() {
  return process.env.METADATA_SIGNING_SECRET ?? process.env.ANALYTICS_SALT;
}

export function signIconPayload(identityKey: string, iconDataUrl: string) {
  const secret = metadataSigningSecret();
  if (!secret || !isSafeIconDataUrl(iconDataUrl)) return null;
  return createHmac("sha256", secret).update(identityKey).update("\0").update(iconDataUrl).digest("hex");
}

export function isSafeIconDataUrl(iconDataUrl: string) {
  return iconDataUrl.length <= Math.ceil(MAX_ICON_BYTES * 4 / 3) + 100 && iconDataPattern.test(iconDataUrl);
}

export function verifyIconPayload(identityKey: string, iconDataUrl?: string, signature?: string) {
  if (!iconDataUrl || !signature || !isSafeIconDataUrl(iconDataUrl)) return false;
  const expected = signIconPayload(identityKey, iconDataUrl);
  if (!expected || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}

export async function getWebsiteMetadata(input: string): Promise<WebsiteMetadata> {
  const identity = normalizeIdentity(input);
  if (identity.identityKey.startsWith("x:")) {
    return { identityKey: identity.identityKey, sourceUrl: identity.sourceUrl, hostname: "x.com", name: identity.suggestedName, description: "", iconDataUrl: null };
  }

  let currentUrl = new URL(identity.sourceUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await pinnedHttpsGet(
      currentUrl,
      {
        Accept: "text/html,application/xhtml+xml;q=0.9",
        "User-Agent": "OverMCP-Metadata/1.0 (+https://overmcp.com)",
      },
      MAX_HTML_BYTES,
      "That website page is too large to read automatically.",
    );

    if (response.status >= 300 && response.status < 400) {
      const location = headerValue(response.headers, "location");
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("That website redirected too many times.");
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (response.status < 200 || response.status >= 300) throw new Error("That website did not return a readable page.");
    const contentType = headerValue(response.headers, "content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("That URL is not an HTML website page.");
    }

    const html = new TextDecoder().decode(response.body);
    const metadata = metadataFromHtml(html, identity.suggestedName);
    const iconDataUrl = await firstUsableIcon(html, currentUrl);
    return {
      identityKey: identity.identityKey,
      sourceUrl: currentUrl.toString().replace(/\/$/, ""),
      hostname: currentUrl.hostname.replace(/^www\./, ""),
      iconDataUrl,
      ...metadata,
    };
  }

  throw new Error("Unable to read that website.");
}
