import { cfCampaigns } from "../../data/cf";
import { membershipPlans } from "../../data/membershipPlans";
import { members } from "../../data/members";
import { tracks } from "../../data/tracks";
import {
  businessInquirySchemaVersion,
  consentStates,
  fanProfileSchemaVersion,
  followSubjectTypes,
  inquiryBudgetBands,
  inquiryTimelines,
  inquiryTypes,
  marketingContentTypes,
  marketingEventNames,
  marketingEventSchemaVersion,
  marketingPolicyVersion,
  marketingPropertyKeys,
  marketingSources,
  membershipInterestSchemaVersion,
  type BusinessInquiryInput,
  type FanFollowInput,
  type FanProfileInput,
  type MarketingEventInput,
  type MarketingScalar,
  type MembershipInterestInput
} from "./contracts";

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const keyPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const localePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const propertyKeyPattern = /^[a-z][a-z0-9_]{0,39}$/;
const forbiddenPropertyPattern = /(email|name|phone|message|brief|content|token|secret|cookie|ip|address|user)/i;
const propertyStringPattern = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,79}$/;

const memberCodes = new Set<string>(members.map((member) => member.code));
const trackIds = new Set<string>(tracks.map((track) => track.id));
const cfIds = new Set<string>(cfCampaigns.map((campaign) => campaign.id));
const planKeys = new Set<string>(membershipPlans.map((plan) => plan.key));
const allowedPropertyKeys = new Set<string>(marketingPropertyKeys);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

function isString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

function isOptionalString(value: unknown, max: number) {
  return value === undefined || (typeof value === "string" && value.trim().length <= max);
}

function isEnum<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function validateProperties(value: unknown): value is Record<string, MarketingScalar> {
  if (value === undefined) return true;
  if (!isObject(value) || Object.keys(value).length > 12) return false;

  return Object.entries(value).every(([key, property]) => {
    if (!propertyKeyPattern.test(key) || forbiddenPropertyPattern.test(key) || !allowedPropertyKeys.has(key)) return false;
    if (property === null || typeof property === "boolean") return true;
    if (typeof property === "number") return Number.isFinite(property);
    return typeof property === "string" && propertyStringPattern.test(property);
  });
}

export function parseMarketingEventInput(value: unknown): ParseResult<MarketingEventInput> {
  if (!isObject(value)) return { ok: false, message: "Event body must be an object." };
  if (
    !hasOnlyKeys(value, [
      "schemaVersion",
      "idempotencyKey",
      "sessionId",
      "eventName",
      "path",
      "source",
      "occurredAt",
      "campaignId",
      "touchpointId",
      "contentType",
      "contentKey",
      "properties"
    ])
  ) {
    return { ok: false, message: "Event body contains an unknown field." };
  }

  if (value.schemaVersion !== marketingEventSchemaVersion) return { ok: false, message: "Unsupported event schema." };
  if (typeof value.idempotencyKey !== "string" || !uuidPattern.test(value.idempotencyKey)) {
    return { ok: false, message: "Event idempotency key must be a UUID." };
  }
  if (typeof value.sessionId !== "string" || !uuidPattern.test(value.sessionId)) {
    return { ok: false, message: "Event session id must be a UUID." };
  }
  if (!isEnum(value.eventName, marketingEventNames)) return { ok: false, message: "Unknown event name." };
  if (typeof value.path !== "string" || !value.path.startsWith("/") || value.path.length > 500 || value.path.includes("?")) {
    return { ok: false, message: "Event path must be a query-free local path." };
  }
  if (!isEnum(value.source, marketingSources)) return { ok: false, message: "Unknown event source." };
  if (typeof value.occurredAt !== "string") return { ok: false, message: "Event timestamp is required." };

  const occurredAt = Date.parse(value.occurredAt);
  const now = Date.now();
  if (!Number.isFinite(occurredAt) || occurredAt < now - 7 * 24 * 60 * 60 * 1000 || occurredAt > now + 5 * 60 * 1000) {
    return { ok: false, message: "Event timestamp is outside the accepted window." };
  }
  if (value.campaignId !== undefined && (typeof value.campaignId !== "string" || !keyPattern.test(value.campaignId))) {
    return { ok: false, message: "Campaign id is invalid." };
  }
  if (value.touchpointId !== undefined && (typeof value.touchpointId !== "string" || !keyPattern.test(value.touchpointId))) {
    return { ok: false, message: "Touchpoint id is invalid." };
  }
  if (value.contentType !== undefined && !isEnum(value.contentType, marketingContentTypes)) {
    return { ok: false, message: "Content type is invalid." };
  }
  if (value.contentKey !== undefined && !isString(value.contentKey, 1, 120)) {
    return { ok: false, message: "Content key is invalid." };
  }
  if (!validateProperties(value.properties)) return { ok: false, message: "Event properties are not privacy-safe." };

  return { ok: true, value: value as MarketingEventInput };
}

function validateFollow(value: unknown): value is FanFollowInput {
  if (!isObject(value) || !hasOnlyKeys(value, ["subjectType", "subjectKey", "notificationsEnabled"])) return false;
  if (!isEnum(value.subjectType, followSubjectTypes) || typeof value.subjectKey !== "string") return false;
  if (typeof value.notificationsEnabled !== "boolean") return false;
  if (value.subjectType === "member") return memberCodes.has(value.subjectKey);
  if (value.subjectType === "track") return trackIds.has(value.subjectKey);
  return cfIds.has(value.subjectKey);
}

export function parseFanProfileInput(value: unknown): ParseResult<FanProfileInput> {
  if (!isObject(value)) return { ok: false, message: "Profile body must be an object." };
  if (
    !hasOnlyKeys(value, [
      "schemaVersion",
      "favoriteMemberCode",
      "favoriteTrackId",
      "locale",
      "crossDeviceEnabled",
      "follows",
      "consents",
      "policyVersion"
    ])
  ) {
    return { ok: false, message: "Profile body contains an unknown field." };
  }

  if (value.schemaVersion !== fanProfileSchemaVersion) return { ok: false, message: "Unsupported profile schema." };
  if (value.favoriteMemberCode !== null && (typeof value.favoriteMemberCode !== "string" || !memberCodes.has(value.favoriteMemberCode))) {
    return { ok: false, message: "Favorite member is invalid." };
  }
  if (value.favoriteTrackId !== null && (typeof value.favoriteTrackId !== "string" || !trackIds.has(value.favoriteTrackId))) {
    return { ok: false, message: "Favorite track is invalid." };
  }
  if (typeof value.locale !== "string" || !localePattern.test(value.locale)) return { ok: false, message: "Locale is invalid." };
  if (typeof value.crossDeviceEnabled !== "boolean") return { ok: false, message: "Cross-device choice is invalid." };
  if (!Array.isArray(value.follows) || value.follows.length > 20 || !value.follows.every(validateFollow)) {
    return { ok: false, message: "Follow selection is invalid." };
  }
  const followKeys = value.follows.map((follow) => `${follow.subjectType}:${follow.subjectKey}`);
  if (new Set(followKeys).size !== followKeys.length) return { ok: false, message: "Follow selection contains duplicates." };
  if (!isObject(value.consents) || !hasOnlyKeys(value.consents, ["analytics", "profileSync", "notifications"])) {
    return { ok: false, message: "Consent selection is invalid." };
  }
  if (!Object.values(value.consents).every((state) => state === undefined || isEnum(state, consentStates))) {
    return { ok: false, message: "Consent state is invalid." };
  }
  if (value.policyVersion !== marketingPolicyVersion) return { ok: false, message: "Policy version is invalid." };
  if (value.follows.some((follow) => follow.notificationsEnabled) && value.consents.notifications !== "granted") {
    return { ok: false, message: "Notification follow requires notification consent." };
  }

  return { ok: true, value: value as FanProfileInput };
}

export function parseBusinessInquiryInput(value: unknown): ParseResult<BusinessInquiryInput> {
  if (!isObject(value)) return { ok: false, message: "Inquiry body must be an object." };
  if (
    !hasOnlyKeys(value, [
      "schemaVersion",
      "name",
      "email",
      "company",
      "inquiryType",
      "goal",
      "timeline",
      "budgetBand",
      "contactConsent",
      "policyVersion"
    ])
  ) {
    return { ok: false, message: "Inquiry contains an unknown field." };
  }
  if (value.schemaVersion !== businessInquirySchemaVersion) return { ok: false, message: "Unsupported inquiry schema." };
  if (!isString(value.name, 2, 100)) return { ok: false, message: "Name must be between 2 and 100 characters." };
  if (
    typeof value.email !== "string" ||
    value.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)
  ) {
    return { ok: false, message: "Email address is invalid." };
  }
  if (!isOptionalString(value.company, 120)) return { ok: false, message: "Company is too long." };
  if (!isEnum(value.inquiryType, inquiryTypes)) return { ok: false, message: "Inquiry type is invalid." };
  if (!isString(value.goal, 20, 1200)) return { ok: false, message: "Project goal must be between 20 and 1200 characters." };
  if (!isEnum(value.timeline, inquiryTimelines)) return { ok: false, message: "Timeline is invalid." };
  if (!isEnum(value.budgetBand, inquiryBudgetBands)) return { ok: false, message: "Budget range is invalid." };
  if (value.contactConsent !== true) return { ok: false, message: "Contact consent is required." };
  if (value.policyVersion !== marketingPolicyVersion) return { ok: false, message: "Policy version is invalid." };

  return {
    ok: true,
    value: {
      ...(value as BusinessInquiryInput),
      name: value.name.trim(),
      email: value.email.trim().toLowerCase(),
      company: typeof value.company === "string" ? value.company.trim() : undefined,
      goal: value.goal.trim()
    }
  };
}

export function parseMembershipInterestInput(value: unknown): ParseResult<MembershipInterestInput> {
  if (!isObject(value) || !hasOnlyKeys(value, ["schemaVersion", "planKey", "state"])) {
    return { ok: false, message: "Membership interest body is invalid." };
  }
  if (value.schemaVersion !== membershipInterestSchemaVersion) return { ok: false, message: "Unsupported membership schema." };
  if (typeof value.planKey !== "string" || !planKeys.has(value.planKey)) return { ok: false, message: "Plan key is invalid." };
  if (value.state !== "interested" && value.state !== "withdrawn") return { ok: false, message: "Interest state is invalid." };
  return { ok: true, value: value as MembershipInterestInput };
}
