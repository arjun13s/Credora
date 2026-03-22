import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacyReviewRedirect({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  redirect(`/profiles/${reportId}`);
}
