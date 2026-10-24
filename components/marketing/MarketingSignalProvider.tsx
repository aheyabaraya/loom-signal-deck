"use client";

import { Analytics } from "@vercel/analytics/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  captureCurrentAttribution,
  readMarketingConsent,
  recordMarketingEvent,
  setMarketingConsent,
  type BrowserConsent
} from "../../lib/marketing/client";
import { getMarketingMode } from "../../lib/marketing/config";

export function MarketingSignalProvider({
  children,
  analyticsProviderEnabled
}: {
  children: ReactNode;
  analyticsProviderEnabled: boolean;
}) {
  const [consent, setConsent] = useState<BrowserConsent>("unknown");
  const recordedPath = useRef<string | null>(null);
  const marketingMode = getMarketingMode();

  useEffect(() => {
    setConsent(readMarketingConsent());
    captureCurrentAttribution();

    function handleConsent(event: Event) {
      const next = (event as CustomEvent<BrowserConsent>).detail;
      if (next === "analytics" || next === "essential") setConsent(next);
    }

    window.addEventListener("loom:consent-changed", handleConsent);
    return () => window.removeEventListener("loom:consent-changed", handleConsent);
  }, []);

  useEffect(() => {
    if (consent !== "analytics") return;
    captureCurrentAttribution();
    const path = window.location.pathname;
    if (recordedPath.current === path) return;
    recordedPath.current = path;
    void recordMarketingEvent("page_view");
  }, [consent]);

  function chooseConsent(next: Exclude<BrowserConsent, "unknown">) {
    setMarketingConsent(next);
    setConsent(next);
  }

  return (
    <>
      {children}
      {consent === "analytics" && marketingMode !== "off" && analyticsProviderEnabled ? <Analytics /> : null}
      {consent === "unknown" && marketingMode !== "off" ? (
        <aside className="signal-consent" aria-labelledby="signal-consent-title" role="dialog">
          <div>
            <p>Signal Privacy</p>
            <strong id="signal-consent-title">Choose what this browser remembers.</strong>
            <span>
              Essential keeps your local choices. Allow signals also records limited, non-identifying page and CTA events.
            </span>
          </div>
          <div className="signal-consent-actions">
            <button onClick={() => chooseConsent("essential")} type="button">
              Essential only
            </button>
            <button className="is-primary" onClick={() => chooseConsent("analytics")} type="button">
              Allow signals
            </button>
            <a href="/fan#privacy">Details</a>
          </div>
        </aside>
      ) : null}
    </>
  );
}
