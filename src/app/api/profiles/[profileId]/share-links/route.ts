import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  return jsonError(
    {
      code: "invalid_payload",
      message: "Share links have been removed. Publish a public snapshot instead.",
    },
    410,
  );
}

export async function DELETE() {
  return jsonError(
    {
      code: "invalid_payload",
      message: "Share links have been removed. Published snapshots are immutable.",
    },
    410,
  );
}
