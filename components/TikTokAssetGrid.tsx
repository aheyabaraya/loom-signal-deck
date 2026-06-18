import type { MemberCode } from "../data/members";
import { getTikTokAssetsForMember } from "../data/tiktokAssets";

type TikTokAssetGridProps = {
  className?: string;
  compact?: boolean;
  limit?: number;
  memberCode: MemberCode;
  memberName: string;
};

export function TikTokAssetGrid({
  className,
  compact = false,
  limit,
  memberCode,
  memberName
}: TikTokAssetGridProps) {
  const assets = getTikTokAssetsForMember(memberCode).slice(0, limit);

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
      <div className="asset-heading tiktok-asset-heading">
        <p>TikTok Proof</p>
        <h2>{memberName} TikTok clips</h2>
      </div>

      <div className="tiktok-asset-grid">
        {assets.map((asset) => (
          <article className="tiktok-asset-card" key={asset.id}>
            <div className="tiktok-player-frame">
              <iframe
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                src={asset.playerUrl}
                title={`${memberName} TikTok clip: ${asset.title}`}
              />
            </div>
            <div className="tiktok-asset-meta">
              <strong>{asset.title}</strong>
              <span>{formatTikTokMetrics(asset)}</span>
              <a href={asset.shareUrl} rel="noreferrer" target="_blank">
                Open TikTok <i />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

type TikTokMetricAsset = ReturnType<typeof getTikTokAssetsForMember>[number];

function formatTikTokMetrics(asset: TikTokMetricAsset) {
  return [
    `${asset.views.toLocaleString()} views`,
    asset.likes === null ? null : `${asset.likes.toLocaleString()} likes`,
    asset.duration === null ? null : `${asset.duration}s`
  ]
    .filter(Boolean)
    .join(" / ");
}
