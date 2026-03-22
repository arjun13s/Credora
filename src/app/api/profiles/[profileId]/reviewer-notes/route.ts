import { addReviewerNote } from "@/lib/store";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const payload = (await request.json()) as {
      reviewerName?: string;
      note?: string;
      disposition?: "Manual review advised" | "Need more documents" | "Proceed carefully";
    };

    if (!payload.reviewerName || !payload.note || !payload.disposition) {
      return jsonError(
        {
          code: "invalid_payload",
          message: "Reviewer note requires reviewerName, note, and disposition.",
        },
        400,
      );
    }

    const view = await addReviewerNote(profileId, {
      reviewerName: payload.reviewerName,
      note: payload.note,
      disposition: payload.disposition,
    });

    if (!view) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json({ view });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to save reviewer note.",
      },
      500,
    );
  }
}
