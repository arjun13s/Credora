import { plaidClient } from "@/lib/plaid";
import { requireAuth } from "@/lib/auth-guard";
import { CountryCode, Products } from "plaid";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = {
    user: { client_user_id: (session.user?.sub as string) || "credora-demo-user" },
    client_name: "Credora",
    products: [Products.Auth, Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  };

  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(configs);
    return Response.json(createTokenResponse.data);
  } catch (error: any) {
    console.error("Plaid link_token error:", error.response?.data || error.message);
    return Response.json(
      { error: error.response?.data?.error_message || error.message },
      { status: 500 },
    );
  }
}
