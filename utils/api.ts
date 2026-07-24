import { API_URL } from "@/constants/env";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Send a request to the configured backend and fail consistently on HTTP errors. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (response.ok) {
    return response;
  }

  let message = `A API respondeu com erro ${response.status}.`;
  try {
    const body = await response.json();
    if (typeof body?.error === "string" && body.error.trim()) {
      message = body.error;
    }
  } catch {
    // Keep the status-based message when the backend does not return JSON.
  }

  throw new ApiError(response.status, message);
}
