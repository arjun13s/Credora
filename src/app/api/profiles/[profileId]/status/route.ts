import { jsonError, jsonOk } from "@/lib/http";
import { getProfileStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  const status = await getProfileStatus(profileId);

  if (!status) {
    return jsonError(
      { code: "profile_not_found", message: "Profile not found." },
      404,
    );
  }

  return jsonOk({ status });
}
