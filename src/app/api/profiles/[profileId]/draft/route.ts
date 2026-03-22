import { getProfileDraft, updateProfileDraft } from "@/lib/store";
import { jsonError, jsonOk } from "@/lib/http";
import { isApplicantProfilePatch } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  const draft = await getProfileDraft(profileId);

  if (!draft) {
    return jsonError(
      { code: "draft_not_found", message: "Draft not found for this profile." },
      404,
    );
  }

  return jsonOk({ draft });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { input?: unknown };

  if (!payload.input || !isApplicantProfilePatch(payload.input)) {
    return jsonError(
      {
        code: "invalid_payload",
        message: "Draft update requires an input patch object.",
      },
      400,
    );
  }

  const updated = await updateProfileDraft(profileId, payload.input);

  if (!updated) {
    return jsonError(
      { code: "draft_not_found", message: "Draft not found for this profile." },
      404,
    );
  }

  return jsonOk(updated);
}
