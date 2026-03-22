import type { ApiError, ApiResponse } from "@/lib/api-contracts";

export function jsonOk<T>(data: T, status = 200) {
  return Response.json({ ok: true, data } satisfies ApiResponse<T>, { status });
}

export function jsonError(error: ApiError, status = 400) {
  return Response.json({ ok: false, error } satisfies ApiResponse<never>, { status });
}
