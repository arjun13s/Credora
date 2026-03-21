import { plaidClient } from "@/lib/plaid";
import { CountryCode, Products } from "plaid";

export const dynamic = "force-dynamic";

export async function POST() {
  const configs = {
    user: { client_user_id: "credora-demo-user" },
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
