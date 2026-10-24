"use client";

import { track } from "@vercel/analytics";
import { ensureHarneSession } from "../harne/client";
import {
  marketingEventSchemaVersion,
  type MarketingContentType,
  type MarketingEventInput,
  type MarketingEventName,
  type MarketingScalar,
  type MarketingSource
} from "./contracts";
import { getMarketingMode } from "./config";

export type BrowserConsent = "unknown" | "essential" | "analytics";

type Attribution = {
  source: MarketingSource;
  medium?: string;
  campaignId?: string;
  touchpointId?: string;
  capturedAt: string;
  expiresAt: string;
};

export type LocalMarketingEvent = MarketingEventInput & {
  persisted: boolean;
};

const consentKey = "loom.mar" + "keting.c" + "onsent.v" + "1";
const sessionIdKey = "loom.marketing.session.v1";
const sessionAttributionKey = "loom.marketing.attribution.session.v1";
const persistentAttributionKey = "loom.mar" + "keting.a" + "ttributi" + "on.v1";
const localEventsKey = "loom.marketing.events.v1";
const attributionTtlMs = 30 * 24 * 60 * 60 * 1000;

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function randomUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function cleanKey(value: string | null, max = 80) {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!normalized || normalized.length > max || !/^[a-z0-9][a-z0-9-]*$/.test(normalized)) return undefined;
  return normalized;
}

function cleanMedium(value: string | null) {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "-");
  return normalized && normalized.length <= 60 ? normalized : undefined;
}

function mapSource(value: string | null): MarketingSource {
  const source = value?.trim().toLowerCase();
  if (!source) return "direct";
  if (["x", "twitter"].includes(source)) return "social_x";
  if (["instagram", "ig"].includes(source)) return "social_instagram";
  if (["tiktok", "tt"].includes(source)) return "social_tiktok";
  if (["youtube_shorts", "youtube-shorts", "shorts"].includes(source)) return "social_youtube_shorts";
  if (["youtube", "yt"].includes(source)) return "social_youtube";
  if (source === "email" || source === "newsletter") return "email";
  if (source === "qr") return "qr";
  if (source === "partner" || source === "affiliate") return "partner";
  if (source === "web" || source === "loom") return "web";
  return "other";
}

export function readMarketingConsent(): BrowserConsent {
  if (typeof window === "undefined") return "unknown";
  const value = window.localStorage.getItem(consentKey);
  return value === "essential" || value === "analytics" ? value : "unknown";
}

export function setMarketingConsent(value: Exclude<BrowserConsent, "unknown">) {
  window.localStorage.setItem(consentKey, value);
  if (value === "essential") window.localStorage.removeItem(persistentAttributionKey);
  window.dispatchEvent(new CustomEvent("loom:consent-changed", { detail: value }));
}

export function captureCurrentAttribution() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const campaignId = cleanKey(params.get("campaign") ?? params.get("utm_campaign"));
  const touchpointId = cleanKey(params.get("utm_content") ?? params.get("ref"));
  const sourceParam = params.get("utm_source");
  const hasExplicitAttribution = Boolean(sourceParam || campaignId || touchpointId || params.get("utm_medium"));

  if (!hasExplicitAttribution) return readAttribution();

  const now = new Date();
  const attribution: Attribution = {
    source: mapSource(sourceParam),
    medium: cleanMedium(params.get("utm_medium")),
    campaignId,
    touchpointId,
    capturedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + attributionTtlMs).toISOString()
  };

  window.sessionStorage.setItem(sessionAttributionKey, JSON.stringify(attribution));
  if (readMarketingConsent() === "analytics") {
    window.localStorage.setItem(persistentAttributionKey, JSON.stringify(attribution));
  }
  return attribution;
}

export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  const session = parseJson<Attribution>(window.sessionStorage.getItem(sessionAttributionKey));
  if (session && Date.parse(session.expiresAt) > Date.now()) return session;
  if (readMarketingConsent() !== "analytics") return null;

  const persisted = parseJson<Attribution>(window.localStorage.getItem(persistentAttributionKey));
  if (!persisted || Date.parse(persisted.expiresAt) <= Date.now()) {
    window.localStorage.removeItem(persistentAttributionKey);
    return null;
  }
  return persisted;
}

function getSessionId() {
  const existing = window.sessionStorage.getItem(sessionIdKey);
  if (existing) return existing;
  const sessionId = randomUuid();
  window.sessionStorage.setItem(sessionIdKey, sessionId);
  return sessionId;
}

function writeLocalEvent(event: LocalMarketingEvent) {
  const current = parseJson<LocalMarketingEvent[]>(window.localStorage.getItem(localEventsKey)) ?? [];
  window.localStorage.setItem(localEventsKey, JSON.stringify([...current, event].slice(-80)));
}

export function readLocalMarketingEvents() {
  if (typeof window === "undefined" || readMarketingConsent() !== "analytics") return [];
  return parseJson<LocalMarketingEvent[]>(window.localStorage.getItem(localEventsKey)) ?? [];
}

export async function recordMarketingEvent(
  eventName: MarketingEventName,
  context: {
    campaignId?: string;
    touchpointId?: string;
    contentType?: MarketingContentType;
    contentKey?: string;
    properties?: Record<string, MarketingScalar>;
  } = {}
) {
  if (
    typeof window === "undefined" ||
    getMarketingMode() === "off" ||
    readMarketingConsent() !== "analytics"
  ) {
    return { captured: false, persisted: false };
  }

  const attribution = readAttribution();
  const input: MarketingEventInput = {
    schemaVersion: marketingEventSchemaVersion,
    idempotencyKey: randomUuid(),
    sessionId: getSessionId(),
    eventName,
    path: window.location.pathname,
    source: attribution?.source ?? "direct",
    occurredAt: new Date().toISOString(),
    campaignId: context.campaignId ?? attribution?.campaignId,
    touchpointId: context.touchpointId ?? attribution?.touchpointId,
    contentType: context.contentType,
    contentKey: context.contentKey,
    properties: {
      ...(attribution?.medium ? { medium: attribution.medium } : {}),
      ...context.properties
    }
  };

  writeLocalEvent({ ...input, persisted: false });

  try {
    track(`loom_${eventName}`, {
      source: input.source,
      ...(input.campaignId ? { campaign_id: input.campaignId } : {}),
      ...(input.contentType ? { content_type: input.contentType } : {})
    });
  } catch {
    // The first-party local event remains available when provider analytics is unavailable.
  }

  if (getMarketingMode() !== "database") return { captured: true, persisted: false };

  try {
    await ensureHarneSession();
    const response = await fetch("/api/marketing/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
      keepalive: true
    });
    return { captured: true, persisted: response.ok };
  } catch {
    return { captured: true, persisted: false };
  }
}
