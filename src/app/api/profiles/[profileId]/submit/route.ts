import { jsonError, jsonOk } from "@/lib/http";
import { submitProfileDraft } from "@/lib/store";
import { isApplicantProfilePatch } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  const payload = (await request.json().catch(() => ({}))) as { input?: unknown };

  if (payload.input !== undefined && !isApplicantProfilePatch(payload.input)) {
    return jsonError(
      {
        code: "invalid_payload",
        message: "Submission patch must be a partial Applicant Profile input object.",
      },
      400,
    );
  }

  const submitted = await submitProfileDraft(
    profileId,
    payload.input as Parameters<typeof submitProfileDraft>[1],
  );

  if (!submitted.ok) {
    if (submitted.code === "draft_not_found") {
      return jsonError(
        { code: "draft_not_found", message: "Draft not found for this profile." },
        404,
      );
    }

    return jsonError(
      {
        code: "validation_failed",
        message: "Profile draft could not be submitted.",
        details: {
          issues: submitted.issues,
          draft: submitted.draft,
        },
      },
      400,
    );
  }

  return jsonOk(submitted, 201);
}
