export const marketingEventSchemaVersion = "loom-marketing-event.v1" as const;
export const fanProfileSchemaVersion = "loom-fan-profile.v1" as const;
export const businessInquirySchemaVersion = "loom-business-inquiry.v1" as const;
export const membershipInterestSchemaVersion = "loom-membership-interest.v1" as const;
export const marketingPolicyVersion = "loom-privacy-2026-08" as const;

export const marketingEventNames = [
  "page_view",
  "campaign_entry",
  "cta_click",
  "member_select",
  "track_open",
  "vote_started",
  "vote_saved",
  "share_created",
  "share_opened",
  "profile_saved",
  "follow_changed",
  "inquiry_started",
  "inquiry_submitted",
  "membership_interest"
] as const;

export const marketingSources = [
  "direct",
  "web",
  "social_x",
  "social_instagram",
  "social_tiktok",
  "social_youtube",
  "social_youtube_shorts",
  "email",
  "qr",
  "partner",
  "other"
] as const;

export const marketingContentTypes = ["member", "track", "cf", "vote", "fan", "business", "membership"] as const;
export const marketingPropertyKeys = [
  "medium",
  "cta_position",
  "state",
  "inquiry_type",
  "timeline",
  "follow_count",
  "cross_device",
  "option_key",
  "vote_kind"
] as const;
export const followSubjectTypes = ["member", "track", "cf"] as const;
export const consentStates = ["granted", "withdrawn"] as const;
export const inquiryTypes = ["brand_film", "fashion_content", "beauty_content", "ai_content_system", "other"] as const;
export const inquiryTimelines = ["exploring", "within_1_month", "within_3_months", "later"] as const;
export const inquiryBudgetBands = ["undecided", "under_3m_krw", "3m_to_10m_krw", "over_10m_krw"] as const;

export type MarketingEventName = (typeof marketingEventNames)[number];
export type MarketingSource = (typeof marketingSources)[number];
export type MarketingContentType = (typeof marketingContentTypes)[number];
export type FollowSubjectType = (typeof followSubjectTypes)[number];
export type ConsentState = (typeof consentStates)[number];
export type InquiryType = (typeof inquiryTypes)[number];
export type InquiryTimeline = (typeof inquiryTimelines)[number];
export type InquiryBudgetBand = (typeof inquiryBudgetBands)[number];
export type MarketingScalar = string | number | boolean | null;

export type MarketingEventInput = {
  schemaVersion: typeof marketingEventSchemaVersion;
  idempotencyKey: string;
  sessionId: string;
  eventName: MarketingEventName;
  path: string;
  source: MarketingSource;
  occurredAt: string;
  campaignId?: string;
  touchpointId?: string;
  contentType?: MarketingContentType;
  contentKey?: string;
  properties?: Record<string, MarketingScalar>;
};

export type FanFollowInput = {
  subjectType: FollowSubjectType;
  subjectKey: string;
  notificationsEnabled: boolean;
};

export type FanProfileInput = {
  schemaVersion: typeof fanProfileSchemaVersion;
  favoriteMemberCode: string | null;
  favoriteTrackId: string | null;
  locale: string;
  crossDeviceEnabled: boolean;
  follows: FanFollowInput[];
  consents: {
    analytics?: ConsentState;
    profileSync?: ConsentState;
    notifications?: ConsentState;
  };
  policyVersion: typeof marketingPolicyVersion;
};

export type BusinessInquiryInput = {
  schemaVersion: typeof businessInquirySchemaVersion;
  name: string;
  email: string;
  company?: string;
  inquiryType: InquiryType;
  goal: string;
  timeline: InquiryTimeline;
  budgetBand: InquiryBudgetBand;
  contactConsent: true;
  policyVersion: typeof marketingPolicyVersion;
};

export type MembershipInterestInput = {
  schemaVersion: typeof membershipInterestSchemaVersion;
  planKey: string;
  state: "interested" | "withdrawn";
};

export type MarketingSummary = {
  windowStart: string;
  generatedAt: string;
  eventsTotal: number;
  eventsByName: Record<string, number>;
  campaigns: Record<string, number>;
  inquiriesByStatus: Record<string, number>;
  membershipByPlan: Record<string, number>;
};
