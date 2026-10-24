"use client";

import { useEffect, useState } from "react";
import type { Member, VoteOption } from "../../data/members";
import { recordMarketingEvent } from "../../lib/marketing/client";

export function ShareSignalActions({ member, option }: { member: Member; option: VoteOption }) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    void recordMarketingEvent("share_opened", {
      contentType: "member",
      contentKey: member.code,
      properties: { option_key: option.id }
    });
  }, [member.code, option.id]);

  async function shareSignal() {
    const url = window.location.href;
    const shareData = {
      title: `${member.name} · ${option.label}`,
      text: option.signal,
      url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setStatus("Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus("Private-free share link copied.");
      }
      void recordMarketingEvent("share_created", {
        contentType: "member",
        contentKey: member.code,
        properties: { option_key: option.id }
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") setStatus("The link could not be shared from this browser.");
    }
  }

  return (
    <div className="share-signal-actions">
      <button onClick={() => void shareSignal()} type="button">
        Share this signal
      </button>
      <a href={`/member/${member.code.toLowerCase()}`}>Open {member.name}&apos;s profile</a>
      <a href="/vote">Choose another signal</a>
      <p aria-live="polite">{status}</p>
    </div>
  );
}
