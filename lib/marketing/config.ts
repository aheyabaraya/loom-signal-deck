export type MarketingMode = "preview" | "database" | "off";
export type StudioMode = "preview" | "database" | "off";

function normalizeMode(value: string | undefined): MarketingMode {
  return value === "database" || value === "off" || value === "preview" ? value : "preview";
}

export function getMarketingMode(): MarketingMode {
  return normalizeMode(process.env.NEXT_PUBLIC_LOOM_MARKETING_MODE);
}

export function getStudioMode(): StudioMode {
  return normalizeMode(process.env.LOOM_STUDIO_MODE ?? process.env.NEXT_PUBLIC_LOOM_MARKETING_MODE);
}

export function isMarketingDatabaseMode() {
  return getMarketingMode() === "database";
}
