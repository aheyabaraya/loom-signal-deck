# Loom Signal Deck

This folder is the extensible Loom homepage prototype as a Next.js + TypeScript app.
It keeps the approved dark signal-deck visual direction while moving member data,
routes, and interactions into maintainable app structure.

## Files

- `app/`: Next routes for home, archive index, members, story, track, CF, vote, and member detail URLs.
- `components/SignalDeck.tsx`: home signal deck, member switching, and vote modal state.
- `components/ArchiveSectionPages.tsx`: separated archive section pages with focused member, story, track, and CF views.
- `components/ArchiveConsole.tsx`: legacy archive console retained for reference.
- `components/MemberProfilePage.tsx`: dedicated member profile page with portrait, identity board, and member-scoped track cuts.
- `components/TrackVideo.tsx`: reusable YouTube embed block for official track videos.
- `data/memberAssets.ts`: canonical member codes, generated profile/character-board paths, and member/unit album path helpers.
- `data/members.ts`: member identity data, accents, map positions, and vote options.
- `data/tracks.ts`: album/track metadata and official YouTube embed URLs.
- `data/trackContactSheets.ts`: track-to-contact-sheet groups and asset-path assembly.
- `data/embedSources.ts`: shared YouTube/TikTok URL builders and iframe permissions.
- `data/mediaExperience.ts`: member-to-media cue map for future synchronized media switching.
- `styles.css`: ordered global CSS entrypoint. Keep imports in cascade order.
- `styles/00-foundations-home.css`: tokens, reset, shared shell, home deck, track, and social surfaces.
- `styles/20-archive.css`: archive console and media galleries.
- `styles/30-member-pages.css`: member profile and member-owned media sections.
- `styles/40-section-interactions.css`: archive section pages, vote, chat, and interaction surfaces.
- `styles/90-responsive.css`: all responsive overrides, loaded last.
- `data/media.ts`: small derived view model for storyboards, member boards, and member archives.
- `data/memberTrackAssets.ts`: canonical solo/unit member image catalog plus the derived per-member index.
- `data/publicChannels.ts`: public SNS constants for TikTok / Instagram / YouTube (**not X**). Unified handle `loom_m` (hyphen `loom-m` is invalid on IG/TT usernames). Live renames happen in each app; this file only keeps share URLs consistent.
- `data/memberSocialClips.ts`: **single embed registry** for home Featured + member Social Proof (TikTok + YouTube Shorts). Manage new uploads under `manualClipsByMember` by member code with accurate `publishedAt`, then redeploy. Ordering is always newest-first; no platform preference. `featuredMemberClips.ts` is a thin re-export only.
- `data/memberTrackCuts.ts`: member **Track Cuts** assembly for profile + `/members` archive. Newest track package first (Pulso before Root Signal); update `TRACK_CUT_RELEASED_AT` when a new package lands.
- `data/tiktokAssets.ts`: legacy TikTok seed catalog still folded into `memberSocialClips`; prefer writing new clips only in `memberSocialClips.ts`.
- `data/pulsoAssets.ts`: Pulso face-paint and stagewear track cut data shared by member and track pages.
- `public/assets/members/Mxx/`: optimized member archive with profile, character board, and member-scoped track cuts.
- `public/assets/members/duos/`: optimized duo track cuts, still separated by album and track.
- `public/assets/tracks/`: optimized track-level assets such as storyboard previews.
- `assets/`: original web-owned source asset snapshot; preserved locally and excluded from deployment.
- `docs/loom-final-homepage-target.png`: locked visual direction reference; preserved locally and excluded from deployment.

## Commands

- `pnpm install --offline`: install from the local pnpm cache when possible.
- `pnpm dev`: run the local Next dev server.
- `pnpm type-check`: validate TypeScript.
- `pnpm validate:member-assets`: check all member portraits, boards, Pulso images, and member/unit catalog files plus duplicate catalog IDs.
- `pnpm validate:public-images`: reject any deployable raster asset that is not WebP.
- `pnpm build`: create a production build.
- `pnpm deploy:preview`: deploy through the safe 80MB-capped Vercel staging path.
- `pnpm deploy:prod`: deploy production through the same safe staging path.

## Maintenance Notes

- Add a new member code once in `memberCodes` in `data/memberAssets.ts`, then add its identity row in `data/members.ts`. Standard `profile.webp` and `character-board.webp` paths are generated automatically.
- If a member uses a non-standard core filename, add only that exception to `memberCoreAssetOverrides` in `data/memberAssets.ts`.
- Add solo or unit-owned images to `memberTrackAssets` in `data/memberTrackAssets.ts` with `memberAlbumImage` or `memberUnitAlbumImage`. The per-member page index is derived automatically from `memberCodes`.
- A new title can set its optional `display` block (`kind`, `sourceLabel`, `releasedAt`) on the same asset row, so no Track Cuts assembly change is required.
- Character-board and member-archive rows are derived from `members`, `memberAssetsByCode`, and `memberTrackAssetsByCode`; do not duplicate them by hand.
- Add a YouTube track through `defineYoutubeTrack` in `data/tracks.ts`; the embed URL is derived from `youtubeId`.
- Add its storyboard/contact-sheet groups in `data/trackContactSheets.ts`; `trackId` connects the group to the track without UI conditionals.
- Add TikTok or YouTube Shorts through `manualClipsByMember` in `data/memberSocialClips.ts`; shared player/share URLs are derived in `data/embedSources.ts`.
- The circular map position is controlled by `position.x` and `position.y`.
- The right panel and member page link are updated from React state in `SignalDeck`.
- Public CTAs route to archive, members, story, track, member pages, and the local Harne Vote prototype. No database or public vote collection is connected.
- `Root Signal` is embedded from YouTube ID `DUyCAFHZ7X0`.
- `data/mediaExperience.ts` is the planned sync layer for member-click media updates: selected member -> video cue, profile image, board image, storyboard set, and track cut ids.
- Member portraits, character boards, storyboards, and track cuts are committed as web-ready assets under `public/assets/**`.
- Keep deployable raster images under `public/**` in WebP. SVG remains suitable for vector-only assets such as the favicon.
- Album and track-specific track cuts stay nested under `albums/code-root-signal/loom-full-code-root-signal/` instead of being mixed into base member assets.
- Core heading and label sizes are named in the `:root` typography tokens at the top of `styles/00-foundations-home.css`; responsive overrides stay in `styles/90-responsive.css`.
- Keep `styles.css` as imports only and preserve its order. Add new rules to the matching role file so the cascade remains predictable.
- Vercel deploys should use `pnpm deploy:preview` or `pnpm deploy:prod`; the script validates public image formats, excludes source/reference folders, stages only runtime web files under `/tmp/loom-signal-deck-vercel-stage`, and aborts before upload if the package grows past 80MB.

## Current Scope

This is a visual and interaction prototype. It does not connect to a database, collect public votes, publish externally, or call paid media APIs.
