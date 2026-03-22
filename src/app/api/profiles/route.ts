import { createApplicantProfile, listProfiles } from "@/lib/store";
import { jsonError } from "@/lib/http";
import { isApplicantProfileInput } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profiles = await listProfiles();
    return Response.json({ profiles });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to list profiles.",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isApplicantProfileInput(payload)) {
      return Response.json(
        {
          issues: [{ field: "root", message: "Invalid Applicant Profile payload." }],
        },
        { status: 400 },
      );
    }

    const result = await createApplicantProfile(payload);

    if (!result.ok) {
      return Response.json({ issues: result.issues }, { status: 400 });
    }

    return Response.json({ view: result.view }, { status: 201 });
  } catch (error) {
    return jsonError(
      {
        code: "internal_error",
        message: error instanceof Error ? error.message : "Unable to create profile.",
      },
      500,
    );
  }
}
