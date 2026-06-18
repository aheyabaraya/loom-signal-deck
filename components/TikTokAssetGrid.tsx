"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { TikTokMemberAsset } from "../data/tiktokAssets";
import type { MemberCode } from "../data/members";
import { getTikTokAssetsForMember } from "../data/tiktokAssets";

type TikTokLoadMode = "click" | "viewport" | "row";
type FeaturedTikTokMember = {
  code: MemberCode;
  name: string;
};

type TikTokAssetGridProps = {
  className?: string;
  compact?: boolean;
  loadMode?: TikTokLoadMode;
  limit?: number;
  memberCode: MemberCode;
  memberName: string;
  showHeading?: boolean;
};

export function TikTokAssetGrid({
  className,
  compact = false,
  loadMode = "row",
  limit,
  memberCode,
  memberName,
  showHeading = true
}: TikTokAssetGridProps) {
  const assets = getTikTokAssetsForMember(memberCode).slice(0, limit);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const { loadedRowCount, rowIndexById } = useRowLoadQueue(
    gridRef,
    assets.map((asset) => asset.id),
    loadMode === "row"
  );

  if (!assets.length) {
    return null;
  }

  return (
    <section
      className={["tiktok-asset-section", compact ? "is-compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${memberName} TikTok assets`}
    >
      {showHeading ? (
        <div className="asset-heading tiktok-asset-heading">
          <p>TikTok Proof</p>
          <h2>{memberName} TikTok clips</h2>
        </div>
      ) : null}

      <div className="tiktok-asset-grid" ref={gridRef}>
        {assets.map((asset, index) => (
          <TikTokAssetCard
            asset={asset}
            forceLoadPlayer={
              loadMode === "row" && (rowIndexById[asset.id] ?? Number.POSITIVE_INFINITY) < loadedRowCount
            }
            index={index}
            key={asset.id}
            loadMode={loadMode}
            memberCode={memberCode}
            memberName={memberName}
          />
        ))}
      </div>
    </section>
  );
}

type TikTokFeaturedGridProps = {
  className?: string;
  members: FeaturedTikTokMember[];
};

export function TikTokFeaturedGrid({ className, members }: TikTokFeaturedGridProps) {
  const featuredAssets = members
    .map((member) => ({
      asset: getTikTokAssetsForMember(member.code)[0],
      member
    }))
    .filter((item): item is { asset: TikTokMemberAsset; member: FeaturedTikTokMember } => Boolean(item.asset));
  const gridRef = useRef<HTMLDivElement | null>(null);
  const { loadedRowCount, rowIndexById } = useRowLoadQueue(
    gridRef,
    featuredAssets.map(({ asset }) => asset.id),
    true
  );

  if (!featuredAssets.length) {
    return null;
  }

  return (
    <div className={className} ref={gridRef}>
      {featuredAssets.map(({ asset, member }, index) => (
        <TikTokAssetCard
          asset={asset}
          cardClassName="member-tiktok-panel home-member-tiktok-panel"
          forceLoadPlayer={(rowIndexById[asset.id] ?? Number.POSITIVE_INFINITY) < loadedRowCount}
          index={index}
          key={asset.id}
          loadMode="row"
          memberCode={member.code}
          memberName={member.name}
        />
      ))}
    </div>
  );
}

type TikTokAssetCardProps = {
  asset: TikTokMemberAsset;
  cardClassName?: string;
  forceLoadPlayer?: boolean;
  index: number;
  loadMode: TikTokLoadMode;
  memberCode: MemberCode;
  memberName: string;
};

function TikTokAssetCard({
  asset,
  cardClassName,
  forceLoadPlayer = false,
  index,
  loadMode,
  memberCode,
  memberName
}: TikTokAssetCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const [shouldLoadPlayer, setShouldLoadPlayer] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);

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
        cardClassName,
        shouldLoadPlayer ? "is-player-requested" : "",
        frameLoaded ? "is-player-loaded" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-tiktok-card-id={asset.id}
      ref={cardRef}
    >
      <div className="tiktok-player-frame">
        {shouldLoadPlayer ? (
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={() => setFrameLoaded(true)}
            src={asset.playerUrl}
            title={`${memberName} TikTok clip: ${asset.title}`}
          />
        ) : null}
        {!frameLoaded ? (
          <button
            aria-label={`Load ${memberName} TikTok preview`}
            className="tiktok-player-placeholder"
            onClick={() => setShouldLoadPlayer(true)}
            type="button"
          >
            <span>{memberCode}</span>
            <strong>{memberName}</strong>
            <em>{asset.title}</em>
            <b>{getPlaceholderLabel(loadMode, shouldLoadPlayer)}</b>
          </button>
        ) : null}
      </div>
      <div className="tiktok-asset-meta">
        <span className="tiktok-member-label">
          {memberCode} {memberName}
        </span>
        <strong>{asset.title}</strong>
        <span>{formatTikTokMetrics(asset)}</span>
        <a href={asset.shareUrl} rel="noreferrer" target="_blank">
          Open TikTok <i />
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

function getPlaceholderLabel(loadMode: TikTokLoadMode, shouldLoadPlayer: boolean) {
  if (shouldLoadPlayer) {
    return "Loading Preview";
  }

  return loadMode === "click" ? "Load Preview" : "Queued By Row";
}

function formatTikTokMetrics(asset: TikTokMemberAsset) {
  return [
    `${asset.views.toLocaleString()} views`,
    asset.likes === null ? null : `${asset.likes.toLocaleString()} likes`,
    asset.duration === null ? null : `${asset.duration}s`
  ]
    .filter(Boolean)
    .join(" / ");
}
