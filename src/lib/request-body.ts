import "server-only";

export class RequestBodyTooLargeError extends Error {}

export async function readTextBody(request: Request, maximumBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maximumBytes) throw new RequestBodyTooLargeError("Request body is too large.");
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maximumBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError("Request body is too large.");
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
}

export async function readJsonBody(request: Request, maximumBytes: number): Promise<unknown> {
  try {
    return JSON.parse(await readTextBody(request, maximumBytes));
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) throw error;
    return null;
  }
}
