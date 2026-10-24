"use client";

import { useEffect, useState } from "react";
import type { MembershipPlan } from "../../data/membershipPlans";
import { ensureHarneSession } from "../../lib/harne/client";
import { membershipInterestSchemaVersion } from "../../lib/marketing/contracts";
import { recordMarketingEvent } from "../../lib/marketing/client";
import type { MarketingMode } from "../../lib/marketing/config";

const interestStorageKey = "loom.membership.interests.v1";

export function MembershipInterest({ plans, mode }: { plans: MembershipPlan[]; mode: MarketingMode }) {
  const [interests, setInterests] = useState<string[]>([]);
  const [status, setStatus] = useState("No payment, card, or checkout data is collected.");
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(interestStorageKey) ?? "[]") as unknown;
      if (Array.isArray(stored)) setInterests(stored.filter((value): value is string => typeof value === "string"));
    } catch {
      // An invalid local preview value is ignored instead of reaching the server.
    }
  }, []);

  async function toggleInterest(plan: MembershipPlan) {
    const interested = !interests.includes(plan.key);
    const next = interested ? [...interests, plan.key] : interests.filter((key) => key !== plan.key);
    setInterests(next);
    window.localStorage.setItem(interestStorageKey, JSON.stringify(next));
    setBusyPlan(plan.key);

    try {
      if (mode === "database") {
        await ensureHarneSession();
        const response = await fetch("/api/marketing/membership-interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schemaVersion: membershipInterestSchemaVersion,
            planKey: plan.key,
            state: interested ? "interested" : "withdrawn"
          }),
          cache: "no-store"
        });
        if (!response.ok) throw new Error("Account interest could not be synced.");
        setStatus(`${plan.name} interest ${interested ? "saved" : "withdrawn"}. Billing remains disabled.`);
      } else {
        setStatus(`${plan.name} interest saved in this browser preview. Nothing was purchased.`);
      }

      void recordMarketingEvent("membership_interest", {
        contentType: "membership",
        contentKey: plan.key,
        properties: { state: interested ? "interested" : "withdrawn" }
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Interest could not be synced. The local choice remains saved.");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <>
      <div className="membership-plan-grid">
        {plans.map((plan, index) => {
          const interested = interests.includes(plan.key);
          return (
            <article className={interested ? "is-interested" : undefined} key={plan.key}>
              <div className="membership-plan-topline">
                <small>0{index + 1}</small>
                <span>{plan.status === "available" ? "Open" : "Concept"}</span>
              </div>
              <h2>{plan.name}</h2>
              <strong>{plan.priceDisplay}</strong>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button disabled={busyPlan === plan.key} onClick={() => void toggleInterest(plan)} type="button">
                {busyPlan === plan.key ? "Saving" : interested ? "Withdraw interest" : plan.status === "available" ? "Keep this plan" : "Mark interest"}
              </button>
            </article>
          );
        })}
      </div>
      <p className="membership-status" aria-live="polite">{status}</p>
    </>
  );
}
