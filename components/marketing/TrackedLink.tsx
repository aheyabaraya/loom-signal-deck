"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { MarketingContentType, MarketingEventName, MarketingScalar } from "../../lib/marketing/contracts";
import { recordMarketingEvent } from "../../lib/marketing/client";

type TrackedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  eventName?: MarketingEventName;
  campaignId?: string;
  touchpointId?: string;
  contentType?: MarketingContentType;
  contentKey?: string;
  eventProperties?: Record<string, MarketingScalar>;
};

export function TrackedLink({
  children,
  eventName = "cta_click",
  campaignId,
  touchpointId,
  contentType,
  contentKey,
  eventProperties,
  onClick,
  ...anchorProps
}: TrackedLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          void recordMarketingEvent(eventName, {
            campaignId,
            touchpointId,
            contentType,
            contentKey,
            properties: eventProperties
          });
        }
      }}
    >
      {children}
    </a>
  );
}
