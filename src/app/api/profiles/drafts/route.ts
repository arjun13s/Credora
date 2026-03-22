import { createProfileDraft } from "@/lib/store";
import { jsonError, jsonOk } from "@/lib/http";
import { isApplicantProfilePatch } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    input?: unknown;
  };

  if (payload.input !== undefined && !isApplicantProfilePatch(payload.input)) {
    return jsonError(
      {
        code: "invalid_payload",
        message: "Draft payload must contain a partial Applicant Profile input object.",
      },
      400,
    );
  }

  const created = await createProfileDraft(payload.input);
  return jsonOk(created, 201);
}
