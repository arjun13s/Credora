import { addDispute } from "@/lib/store";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const payload = (await request.json()) as {
      field?: string;
      explanation?: string;
    };

    if (!payload.field || !payload.explanation) {
      return jsonError(
        {
          code: "invalid_payload",
          message: "Dispute payload requires both field and explanation.",
        },
        400,
      );
    }

    const view = await addDispute(profileId, {
      field: payload.field,
      explanation: payload.explanation,
    });

    if (!view) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json({ view });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to create dispute.",
      },
      500,
    );
  }
}
