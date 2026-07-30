"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  getFeaturedHomeClips,
  getSocialClipsForMember,
  platformLabel,
  type MemberSocialClip
} from "../data/memberSocialClips";
import { getMember, homeMemberCodes, type MemberCode } from "../data/members";

type ClipLoadMode = "click" | "viewport" | "row";

type SocialProofGridProps = {
  className?: string;
  compact?: boolean;
  loadMode?: ClipLoadMode;
  limit?: number;
  memberCode: MemberCode;
  memberName: string;
  showHeading?: boolean;
};

/** Member-page social proof: all TikTok + YouTube embeds for one member, newest first. */
export function SocialProofGrid({
  className,
  compact = false,
  loadMode = "row",
  limit,
  memberCode,
  memberName,
  showHeading = true
}: SocialProofGridProps) {
  const clips = getSocialClipsForMember(memberCode).slice(0, limit);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const { loadedRowCount, rowIndexById } = useRowLoadQueue(
    gridRef,
    clips.map((clip) => clip.id),
    loadMode === "row"
  );

  if (!clips.length) {
    return null;
  }

  return (
    <section
      className={["tiktok-asset-section", "social-proof-section", compact ? "is-compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${memberName} social proof clips`}
    >
      {showHeading ? (
        <div className="asset-heading tiktok-asset-heading">
          <p>Social Proof</p>
          <h2>{memberName} social clips</h2>
        </div>
      ) : null}

      <div className="tiktok-asset-grid" ref={gridRef}>
        {clips.map((clip, index) => (
          <SocialClipCard
            clip={clip}
            forceLoadPlayer={
              loadMode === "row" && (rowIndexById[clip.id] ?? Number.POSITIVE_INFINITY) < loadedRowCount
            }
            index={index}
            key={clip.id}
            loadMode={loadMode}
            memberCode={memberCode}
            memberName={memberName}
          />
        ))}
      </div>
    </section>
  );
}

/** @deprecated Prefer SocialProofGrid — same component, legacy name. */
export const TikTokAssetGrid = SocialProofGrid;

type FeaturedMemberClipsGridProps = {
  className?: string;
};

/**
 * Home Featured: one latest clip per member, ordered by that clip's
 * publishedAt (newest first). Platform is not a sort key.
 */
export function FeaturedMemberClipsGrid({ className }: FeaturedMemberClipsGridProps) {
  const featuredClips = getFeaturedHomeClips(homeMemberCodes);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const { loadedRowCount, rowIndexById } = useRowLoadQueue(
    gridRef,
    featuredClips.map((clip) => clip.id),
    true
  );

  if (!featuredClips.length) {
    return null;
  }

  return (
    <div className={className} ref={gridRef}>
      {featuredClips.map((clip, index) => {
        const member = getMember(clip.memberCode);
        return (
          <SocialClipCard
            clip={clip}
            cardClassName="member-tiktok-panel home-member-tiktok-panel"
            forceLoadPlayer={(rowIndexById[clip.id] ?? Number.POSITIVE_INFINITY) < loadedRowCount}
            index={index}
            key={clip.id}
            loadMode="row"
            memberCode={member.code}
            memberName={member.name}
          />
        );
      })}
    </div>
  );
}

/** @deprecated Prefer FeaturedMemberClipsGrid. */
export function TikTokFeaturedGrid({
  className
}: {
  className?: string;
  /** Ignored — order is publishedAt newest-first from the social registry. */
  members?: Array<{ code: MemberCode; name: string }>;
}) {
  return <FeaturedMemberClipsGrid className={className} />;
}

type SocialClipCardProps = {
  clip: MemberSocialClip;
  cardClassName?: string;
  forceLoadPlayer?: boolean;
  index: number;
  loadMode: ClipLoadMode;
  memberCode: MemberCode;
  memberName: string;
};

function SocialClipCard({
  clip,
  cardClassName,
  forceLoadPlayer = false,
  index,
  loadMode,
  memberCode,
  memberName
}: SocialClipCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const platformName = platformLabel(clip.platform);
  const isYoutube = clip.platform === "youtube_shorts";

  useEffect(() => {
    if (forceLoadPlayer && !shouldLoadPlayer) {
      setShouldLoadPlayer(true);
    }
  }, [forceLoadPlayer, shouldLoadPlayer]);

  useEffect(() => {
    if (loadMode !== "viewport" || shouldLoadPlayer) {
      return;
    }

    const target = cardRef.current;
    if (!target) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const fallbackTimer = setTimeout(() => setShouldLoadPlayer(true), index * 350);
      return () => clearTimeout(fallbackTimer);
    }

    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        loadTimer = setTimeout(() => {
          setShouldLoadPlayer(true);
        }, Math.min(index, 6) * 420);

        observer.disconnect();
      },
      { rootMargin: "220px 0px 260px" }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
      if (loadTimer) {
        clearTimeout(loadTimer);
      }
    };
  }, [index, loadMode, shouldLoadPlayer]);

  return (
    <article
      className={[
        "tiktok-asset-card",
        isYoutube ? "is-youtube-clip" : "is-tiktok-clip",
        cardClassName,
        shouldLoadPlayer ? "is-player-requested" : "",
        frameLoaded ? "is-player-loaded" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-tiktok-card-id={clip.id}
      ref={cardRef}
    >
      <div className="tiktok-player-frame">
        {shouldLoadPlayer ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={() => setFrameLoaded(true)}
            src={clip.playerUrl}
            title={`${memberName} ${platformName} clip: ${clip.title}`}
          />
        ) : null}
        {!frameLoaded ? (
          <button
            aria-label={`Load ${memberName} ${platformName} preview`}
            className="tiktok-player-placeholder"
            onClick={() => setShouldLoadPlayer(true)}
            type="button"
          >
            <span>
              {memberCode} · {platformName}
            </span>
            <strong>{memberName}</strong>
            <em>{clip.title}</em>
            <b>{getPlaceholderLabel(loadMode, shouldLoadPlayer)}</b>
          </button>
        ) : null}
      </div>
      <div className="tiktok-asset-meta">
        <span className="tiktok-member-label">
          {memberCode} {memberName} · {platformName}
        </span>
        <strong>{clip.title}</strong>
        <span>{formatClipMetrics(clip)}</span>
        <a href={clip.shareUrl} rel="noreferrer" target="_blank">
          Open {platformName} <i />
        </a>
      </div>
    </article>
  );
}

function useRowLoadQueue(
  gridRef: RefObject<HTMLDivElement | null>,
  itemIds: string[],
  enabled: boolean
) {
  const [loadedRowCount, setLoadedRowCount] = useState(enabled ? 0 : Number.POSITIVE_INFINITY);
  const [rowIndexById, setRowIndexById] = useState<Record<string, number>>({});
  const itemKey = itemIds.join("|");

  useEffect(() => {
    if (!enabled) {
      setLoadedRowCount(Number.POSITIVE_INFINITY);
      return;
    }

    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    let started = false;
    let cleanupTimers: Array<ReturnType<typeof setTimeout>> = [];

    const measureRows = () => {
      const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-tiktok-card-id]"));
      const rowTops: number[] = [];
      const nextRowIndexById: Record<string, number> = {};

      cards.forEach((card) => {
        const id = card.dataset.tiktokCardId;
        if (!id) {
          return;
        }

        const top = Math.round(card.offsetTop);
        let rowIndex = rowTops.findIndex((rowTop) => Math.abs(rowTop - top) <= 4);
        if (rowIndex === -1) {
          rowTops.push(top);
          rowTops.sort((a, b) => a - b);
          rowIndex = rowTops.findIndex((rowTop) => Math.abs(rowTop - top) <= 4);
        }

        nextRowIndexById[id] = rowIndex;
      });

      setRowIndexById(nextRowIndexById);
      return rowTops.length;
    };

    const startLoadingRows = () => {
      if (started) {
        return;
      }

      started = true;
      const rowCount = measureRows();
      setLoadedRowCount(rowCount > 0 ? 1 : 0);

      for (let row = 2; row <= rowCount; row += 1) {
        const timer = setTimeout(() => {
          setLoadedRowCount((current) => Math.max(current, row));
        }, (row - 1) * 1700);
        cleanupTimers.push(timer);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      startLoadingRows();
      return () => {
        cleanupTimers.forEach((timer) => clearTimeout(timer));
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        startLoadingRows();
        observer.disconnect();
      },
      { rootMargin: "260px 0px 320px" }
    );

    observer.observe(grid);
    return () => {
      observer.disconnect();
      cleanupTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [enabled, gridRef, itemKey]);

  return { loadedRowCount, rowIndexById };
}

function getPlaceholderLabel(loadMode: ClipLoadMode, shouldLoadPlayer: boolean) {
  if (shouldLoadPlayer) {
    return "Loading Preview";
  }

  return loadMode === "click" ? "Load Preview" : "Queued By Row";
}

function formatClipMetrics(clip: Pick<MemberSocialClip, "views" | "likes" | "duration" | "platform">) {
  return [
    clip.views === null ? null : `${clip.views.toLocaleString()} views`,
    clip.likes === null ? null : `${clip.likes.toLocaleString()} likes`,
    clip.duration === null ? null : `${clip.duration}s`,
    clip.views === null && clip.likes === null && clip.duration === null
      ? platformLabel(clip.platform)
      : null
  ]
    .filter(Boolean)
    .join(" / ");
}
