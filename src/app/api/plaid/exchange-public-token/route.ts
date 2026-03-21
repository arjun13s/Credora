import { plaidClient } from "@/lib/plaid";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { public_token } = await request.json();

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    // In a real app, you would save response.data.access_token to your database.
    // For this demo, we just return a success message.
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
