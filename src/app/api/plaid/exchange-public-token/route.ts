import { plaidClient } from "@/lib/plaid";
import { plaidExchangeSchema, parseBody } from "@/lib/schemas";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await request.json();
  const parsed = parseBody(plaidExchangeSchema, raw);
  if (!parsed.success) return parsed.error;

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: parsed.data.public_token,
    });

    return Response.json({
      access_token: response.data.access_token,
      item_id: response.data.item_id,
      success: true,
    });
  } catch (error: any) {
    console.error("Plaid exchange error:", error.response?.data || error.message);
    return Response.json(
      { error: error.response?.data?.error_message || error.message },
      { status: 500 },
    );
  }
}
