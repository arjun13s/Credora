import { createShareLink, getApplicantProfileView, revokeShareLinks } from "@/lib/store";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    await createShareLink(profileId);
    const view = await getApplicantProfileView(profileId);

    if (!view) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json({ view });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to create share link.",
      },
      500,
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const view = await revokeShareLinks(profileId);

    if (!view) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    return Response.json({ view });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to revoke share links.",
      },
      500,
    );
  }
}
