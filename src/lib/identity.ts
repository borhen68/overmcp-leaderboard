const handlePattern = /^@([a-zA-Z0-9_]{1,15})$/;

export type NormalizedIdentity = {
  identityKey: string;
  sourceUrl: string;
  suggestedName: string;
};

export function normalizeIdentity(input: string): NormalizedIdentity {
  const trimmed = input.trim();
  const handle = trimmed.match(handlePattern);

  if (handle) {
    const username = handle[1].toLowerCase();
    return {
      identityKey: `x:${username}`,
      sourceUrl: `https://x.com/${username}`,
      suggestedName: `@${username}`,
    };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid public URL or @handle.");
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Only public HTTP and HTTPS URLs are supported.");
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!hostname.includes(".") || isPrivateHostname(hostname)) {
    throw new Error("Enter a public website URL.");
  }

  url.protocol = "https:";
  url.hostname = hostname;
  url.hash = "";
  url.username = "";
  url.password = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  }
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");

  const normalized = url.toString().replace(/\/$/, "");
  return {
    identityKey: `website:${normalized.toLowerCase()}`,
    sourceUrl: normalized,
    suggestedName: hostname,
  };
}

function isPrivateHostname(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return true;
  if (hostname === "0.0.0.0" || hostname === "::1") return true;
  if (/^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  const private172 = hostname.match(/^172\.(\d{1,3})\./);
  return private172 ? Number(private172[1]) >= 16 && Number(private172[1]) <= 31 : false;
}
