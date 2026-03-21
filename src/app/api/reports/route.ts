import { createReport, listReports } from "@/lib/store";
import type { ApplicantInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listReports());
}

export async function POST(request: Request) {
  const input = (await request.json()) as ApplicantInput;
  const report = await createReport(input);

  return Response.json(report, { status: 201 });
}
