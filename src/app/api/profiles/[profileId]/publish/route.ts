import { getApplicantProfileView, publishApplicantProfile } from "@/lib/store";
import { jsonError } from "@/lib/http";
import type { PublishProfileResponse } from "@/lib/api-contracts";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const result = await publishApplicantProfile(profileId);

    if (!result?.view || !result.publishedSnapshot) {
      return Response.json({ error: "Profile not found or not ready to publish." }, { status: 404 });
    }

    const refreshed = await getApplicantProfileView(profileId);
    const payload: PublishProfileResponse = {
      view: refreshed ?? result.view,
      publishedSnapshot: result.publishedSnapshot,
      created: result.created,
    };

    if (!result.created) {
      return Response.json(
        {
          ...payload,
          error: "The current scored result has already been published. Submit a new profile version before publishing again.",
        },
        { status: 409 },
      );
    }

    return Response.json(payload);
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to publish profile.",
      },
      500,
    );
  }
}
