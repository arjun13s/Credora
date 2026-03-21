import { createReport } from "@/lib/store";
import type { ApplicantInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = (await request.json()) as ApplicantInput;
  const report = createReport(input);

  return Response.json(report, { status: 201 });
}
