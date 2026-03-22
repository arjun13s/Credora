import { jsonOk } from "@/lib/http";
import { listProfileSummaries } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const summaries = await listProfileSummaries();
  return jsonOk({ profiles: summaries });
}
