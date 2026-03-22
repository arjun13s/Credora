import { jsonError, jsonOk } from "@/lib/http";
import { getProfileEvaluation } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  const evaluation = await getProfileEvaluation(profileId);

  if (!evaluation) {
    return jsonError(
      { code: "profile_not_found", message: "Profile not found." },
      404,
    );
  }

  return jsonOk({ evaluation });
}
