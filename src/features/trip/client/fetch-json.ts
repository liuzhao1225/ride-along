"use client";

export class FetchJsonError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "FetchJsonError";
    this.status = status;
    this.payload = payload;
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    throw new FetchJsonError("网络错误", 0, null);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload != null &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "请求失败";
    throw new FetchJsonError(message, response.status, payload);
  }

  return payload as T;
}

export function getFetchJsonErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof FetchJsonError) {
    return error.message;
  }
  return fallback;
}
