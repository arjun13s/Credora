import { getApplicantProfileView } from "@/lib/store";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const view = await getApplicantProfileView(profileId);

    if (!view) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json({ view });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to fetch profile.",
      },
      500,
    );
  }
}
