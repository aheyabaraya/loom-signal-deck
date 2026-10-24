import campaignCatalog from "./marketingCampaigns.json";

export type MarketingCampaignStatus = "active" | "preview" | "paused";
export type MarketingCampaignContentType = "member" | "track" | "cf";

export type MarketingCampaign = {
  id: string;
  slug: string;
  status: MarketingCampaignStatus;
  eyebrow: string;
  title: string;
  audience: string;
  promise: string;
  message: string;
  contentType: MarketingCampaignContentType;
  contentKey: string;
  touchpointId: string;
  hero: {
    image: string;
    alt: string;
  };
  proof: string[];
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
};

export const marketingCampaignCatalogVersion = campaignCatalog.schemaVersion;
export const marketingCampaigns = campaignCatalog.campaigns as MarketingCampaign[];

export function getMarketingCampaign(slug: string) {
  return marketingCampaigns.find((campaign) => campaign.slug === slug);
}
