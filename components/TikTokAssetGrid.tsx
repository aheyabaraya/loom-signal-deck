import type { MemberCode } from "../data/members";
import { getTikTokAssetsForMember } from "../data/tiktokAssets";

type TikTokAssetGridProps = {
  className?: string;
  memberCode: MemberCode;
  memberName: string;
};

export function TikTokAssetGrid({ className, memberCode, memberName }: TikTokAssetGridProps) {
  const assets = getTikTokAssetsForMember(memberCode);

  if (!assets.length) {
    return null;
  }

  return (
    <section
      className={["tiktok-asset-section", className].filter(Boolean).join(" ")}
      aria-label={`${memberName} TikTok assets with 100 or more views`}
    >
      <div className="asset-heading tiktok-asset-heading">
        <p>TikTok Proof</p>
        <h2>{memberName} 100+ view clips</h2>
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
              <span>
                {asset.views.toLocaleString()} views / {asset.likes.toLocaleString()} likes / {asset.duration}s
              </span>
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
