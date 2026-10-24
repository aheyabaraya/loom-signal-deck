"use client";

import { useRef, useState, type FormEvent } from "react";
import { ensureHarneSession } from "../../lib/harne/client";
import {
  businessInquirySchemaVersion,
  marketingPolicyVersion,
  type BusinessInquiryInput,
  type InquiryBudgetBand,
  type InquiryTimeline,
  type InquiryType
} from "../../lib/marketing/contracts";
import { recordMarketingEvent } from "../../lib/marketing/client";
import type { MarketingMode } from "../../lib/marketing/config";

export function BusinessInquiryForm({ mode }: { mode: MarketingMode }) {
  const [status, setStatus] = useState(
    mode === "database"
      ? "Secure delivery is available after validation and consent."
      : "Preview validation is active. This environment will not transmit or retain the form."
  );
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    void recordMarketingEvent("inquiry_started", { contentType: "business", contentKey: "project-inquiry" });
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const payload: BusinessInquiryInput = {
      schemaVersion: businessInquirySchemaVersion,
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      company: String(formData.get("company") ?? "").trim() || undefined,
      inquiryType: String(formData.get("inquiryType")) as InquiryType,
      goal: String(formData.get("goal") ?? "").trim(),
      timeline: String(formData.get("timeline")) as InquiryTimeline,
      budgetBand: String(formData.get("budgetBand")) as InquiryBudgetBand,
      contactConsent: true,
      policyVersion: marketingPolicyVersion
    };

    if (mode !== "database") {
      setStatus("Preview validation passed. No name, email, company, or project text left this browser.");
      return;
    }

    setBusy(true);
    setStatus("Creating a private inquiry receipt...");
    try {
      await ensureHarneSession();
      const response = await fetch("/api/marketing/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
      });
      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (!response.ok) throw new Error(body?.error?.message ?? "The inquiry could not be delivered.");
      form.reset();
      setStatus("Inquiry saved privately. The Studio summary receives only a count, not your message text.");
      void recordMarketingEvent("inquiry_submitted", {
        contentType: "business",
        contentKey: "project-inquiry",
        properties: { inquiry_type: payload.inquiryType, timeline: payload.timeline }
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The inquiry could not be delivered.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="business-inquiry-form" onFocus={markStarted} onSubmit={submitInquiry}>
      <div className="business-form-heading">
        <p>Project inquiry</p>
        <h2>Start with the business question.</h2>
        <span>
          Tell us the goal, timing, and working range. This form never puts contact details into marketing event properties.
        </span>
      </div>

      <div className="business-form-grid">
        <label>
          Name
          <input autoComplete="name" maxLength={100} minLength={2} name="name" required />
        </label>
        <label>
          Email
          <input autoComplete="email" maxLength={254} name="email" required type="email" />
        </label>
        <label>
          Company / team <small>optional</small>
          <input autoComplete="organization" maxLength={120} name="company" />
        </label>
        <label>
          Project type
          <select defaultValue="brand_film" name="inquiryType">
            <option value="brand_film">Brand film</option>
            <option value="fashion_content">Fashion content</option>
            <option value="beauty_content">Beauty content</option>
            <option value="ai_content_system">AI content system</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Timeline
          <select defaultValue="exploring" name="timeline">
            <option value="exploring">Exploring</option>
            <option value="within_1_month">Within 1 month</option>
            <option value="within_3_months">Within 3 months</option>
            <option value="later">Later</option>
          </select>
        </label>
        <label>
          Working budget range
          <select defaultValue="undecided" name="budgetBand">
            <option value="undecided">Undecided</option>
            <option value="under_3m_krw">Under KRW 3M</option>
            <option value="3m_to_10m_krw">KRW 3M–10M</option>
            <option value="over_10m_krw">Over KRW 10M</option>
          </select>
        </label>
        <label className="business-goal-field">
          What should change for the audience?
          <textarea maxLength={1200} minLength={20} name="goal" required rows={6} />
        </label>
      </div>

      <label className="business-consent-row">
        <input name="contactConsent" required type="checkbox" />
        <span>I agree that this contact information may be stored only to review and answer this inquiry.</span>
      </label>

      <div className="business-submit-row">
        <p aria-live="polite">{status}</p>
        <button disabled={busy} type="submit">
          {busy ? "Sending" : mode === "database" ? "Send private inquiry" : "Validate preview form"}
        </button>
      </div>
    </form>
  );
}
