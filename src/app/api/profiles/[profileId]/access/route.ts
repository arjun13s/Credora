import { logProfileAccess } from "@/lib/store";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const payload = (await request.json()) as {
      actor?: "applicant" | "reviewer" | "system";
      action?: string;
      detail?: string;
    };

    if (!payload.actor || !payload.action || !payload.detail) {
      return jsonError(
        {
          code: "invalid_payload",
          message: "Access log payload requires actor, action, and detail.",
        },
        400,
      );
    }

    const view = await logProfileAccess(profileId, {
      actor: payload.actor,
      action: payload.action,
      detail: payload.detail,
    });

    if (!view) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json({ view });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to log profile access.",
      },
      500,
    );
  }
}
