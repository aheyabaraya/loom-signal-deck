# Loom Signal Deck

This standalone repository owns the Signal Deck web product. Production and
Company Ops engineering remain in Loom HQ. Approved publication records and
web-ready assets enter this repository as reviewed projections; production
source media, private records, and live operational state do not.

This folder is the extensible Loom homepage prototype as a Next.js + TypeScript app.
It keeps the approved dark signal-deck visual direction while moving member data,
routes, and interactions into maintainable app structure.

## Files

- `app/`: Next routes for home, archive index, members, story, track, CF, vote, and member detail URLs.
- `components/SignalDeck.tsx`: home signal deck, member switching, and vote modal state.
- `components/ArchiveSectionPages.tsx`: separated archive section pages with focused member, story, track, and CF views.
- `components/ArchiveConsole.tsx`: inactive legacy reference; no route renders it, so do not add active content there.
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
- `styles/99-accessibility.css`: cross-route keyboard focus and reduced-motion overrides, loaded after visual layers.
- `data/media.ts`: small derived view model for storyboards, member boards, and member archives.
- `data/memberTrackAssets.ts`: canonical solo/unit member image catalog with explicit track ownership plus the derived per-member index.
- `data/publicChannels.ts`: public SNS constants for TikTok / Instagram / YouTube (**not X**). Unified handle `loom_m` (hyphen `loom-m` is invalid on IG/TT usernames). Live renames happen in each app; this file only keeps share URLs consistent.
- `data/signalDeckPublications.json`: canonical public-post registry for exact
  member, MV track or CF, final-used visual, share URL, and embed URL. It is
  supplied by the reviewed Company Ops publication-closeout projection. The
  historical `idol_social_public_closeout.py` writer belongs to the production/
  operations integration and is not an executable command in this web repository.
- `data/memberSocialClips.ts`: shared read model for home Featured, member
  Social Proof, member Track Cuts, and track/CF social embeds. It reads the
  canonical public registry first and keeps legacy CF/TikTok catalogs only as
  compatibility inputs. Ordering is newest-first with no platform preference.
- `data/memberTrackCuts.ts`: member **Track Cuts** assembly for profile + `/members` archive. Newest track package first (Pulso before Root Signal); update `TRACK_CUT_RELEASED_AT` when a new package lands.
- `data/tiktokAssets.ts`: legacy TikTok seed catalog still folded into the read
  model; register new public posts through the public-closeout flow.
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
- `pnpm validate:content-data`: validate active member/track/CF/publication ownership, IDs, image paths, and publication image hashes.
- `pnpm validate:member-assets`: check all member portraits, boards, Pulso images, and member/unit catalog files plus duplicate catalog IDs.
- `pnpm validate:public-images`: reject any deployable raster asset that is not WebP.
- `pnpm build`: create a production build.
- `pnpm deploy:preview`: deploy through the safe 80MB-capped Vercel staging path.
- `pnpm deploy:prod`: deploy production through the same safe staging path.

## Maintenance Notes

- Add a new member code once in `memberCodes` in `data/memberAssets.ts`, then add its identity row in `data/members.ts`. Standard `profile.webp` and `character-board.webp` paths are generated automatically.
- If a member uses a non-standard core filename, add only that exception to `memberCoreAssetOverrides` in `data/memberAssets.ts`.
- Add solo or unit-owned images to the owning track package in `data/memberTrackAssets.ts` with `memberAlbumImage` or `memberUnitAlbumImage`. The package assigns `trackId`, and the per-member page index is derived automatically from `memberCodes`.
- A new title can set its optional `display` block (`kind`, `sourceLabel`, `releasedAt`) on the same asset row, so no Track Cuts assembly change is required.
- Character-board and member-archive rows are derived from `members`, `memberAssetsByCode`, and `memberTrackAssetsByCode`; do not duplicate them by hand.
- Add a YouTube track through `defineYoutubeTrack` in `data/tracks.ts`; the embed URL is derived from `youtubeId`.
- Add its storyboard/contact-sheet groups in `data/trackContactSheets.ts`; `trackId` connects the group to the track without UI conditionals.
- For a new MV or CF, register its project row first in `data/tracks.ts` or `baseCfCampaigns` in `data/cf.ts`, then add web-ready WebP assets to the matching `public/assets/tracks/**`, `public/assets/members/**`, or `public/assets/cf/**` package. The content validator rejects unknown ownership and missing files.
- `pnpm build` runs the active content-data validator first, so missing images, unknown member/track/CF links, duplicate IDs, and stale publication image hashes stop the build; deployed-but-unreferenced WebP files are reported for review without being deleted.
- After an authorized TikTok, YouTube/Shorts, or Instagram publication, receive
  a reviewed publication projection from Company Ops with its exact public URL,
  timestamp, visible members, MV track or CF, and final-used visual. Update the
  canonical JSON and referenced web assets together, then validate content data.
  The home/member/track/CF surfaces read that projection automatically. This
  repository does not publish social posts or mutate the operational ledgers.
  Deployment remains a separate approved action.
- The circular map position is controlled by `position.x` and `position.y`.
- The right panel and member page link are updated from React state in `SignalDeck`.
- Public CTAs route to archive, members, story, track, member pages, and Harne. Unset vote and chat modes default to `off`. `.env.example` sets `HARNE_VOTE_MODE=public` and `HARNE_CHAT_MODE=public` as an explicit operator opt-in after remote Harne migrations and a Supabase sign-in path; copying those values is not the unset application default. Supabase-backed routes are implemented but require their configured environment and the release gates in `docs/architecture/testing-and-release.md` before public activation.
- `/archive` and `/story` redirect to active route-owned pages. `ArchiveOverviewPage`, `StoryArchivePage`, and `ArchiveConsole` are inactive legacy references; do not register new images or embeds there.
- `Root Signal` is embedded from YouTube ID `DUyCAFHZ7X0`.
- `data/mediaExperience.ts` is the planned sync layer for member-click media updates: selected member -> video cue, profile image, board image, storyboard set, and track cut ids.
- Member portraits, character boards, storyboards, and track cuts are committed as web-ready assets under `public/assets/**`.
- Keep deployable raster images under `public/**` in WebP. SVG remains suitable for vector-only assets such as the favicon.
- Album and track-specific track cuts stay nested under `albums/code-root-signal/loom-full-code-root-signal/` instead of being mixed into base member assets.
- Core heading and label sizes are named in the `:root` typography tokens at the top of `styles/00-foundations-home.css`; responsive overrides stay in `styles/90-responsive.css`.
- Keep `styles.css` as layered imports only and preserve its order. Add new rules to the matching role file so the cascade remains predictable; reserve `99-accessibility.css` for cross-route accessibility overrides.
- Vercel deploys should use `pnpm deploy:preview` or `pnpm deploy:prod`. The script rejects symlinks and nested environment/key/database files, excludes local tool caches and source/reference folders, and includes only named build/validation scripts. Each attempt uses its own `loom-signal-deck-vercel-stage-*` directory in the OS temporary folder and aborts before upload above 80MB. Dry runs retain their reported stage for inspection; other attempts clean up their own stage. Run `pnpm test:deploy-safety` and `pnpm test:deploy-proxy` to verify packaging with synthetic local fixtures and no deployment.

## Current Scope

The repository contains the visual experience, local marketing preview, and optional Supabase-backed account, vote, chat, and marketing routes. Marketing defaults to `preview`; Harne vote and chat default to `off` when the matching environment variables are unset. `.env.example` is an operator setup template: its `HARNE_VOTE_MODE=public` and `HARNE_CHAT_MODE=public` values are an explicit opt-in, not those unset defaults. These code defaults do not establish the deployed environment's current state. Remote database activation, paid calls, publishing, and deployment follow their explicit release and authority gates; payment checkout remains disabled.
