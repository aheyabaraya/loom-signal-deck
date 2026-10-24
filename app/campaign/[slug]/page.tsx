import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignLanding } from "../../../components/marketing/CampaignLanding";
import { getMarketingCampaign, marketingCampaigns } from "../../../data/marketingCampaigns";

export function generateStaticParams() {
  return marketingCampaigns.map((campaign) => ({ slug: campaign.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getMarketingCampaign(slug);
  if (!campaign) return { title: "Campaign not found · Loom" };

  return {
    title: `${campaign.title} · Loom Signal Deck`,
    description: campaign.promise,
    openGraph: {
      title: campaign.title,
      description: campaign.promise,
      images: [{ url: campaign.hero.image, alt: campaign.hero.alt }]
    }
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = getMarketingCampaign(slug);
  if (!campaign) notFound();

  return <CampaignLanding campaign={campaign} />;
}
