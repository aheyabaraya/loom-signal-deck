# Loom Signal Deck

This folder is the extensible Loom homepage prototype as a Next.js + TypeScript app.
It keeps the approved dark signal-deck visual direction while moving member data,
routes, and interactions into maintainable app structure.

## Files

- `app/`: Next routes for the home entry, archive deck, vote entry, and member detail URLs.
- `components/SignalDeck.tsx`: home signal deck, member switching, and vote modal state.
- `components/ArchiveConsole.tsx`: archive console for Track 01, storyboards, member boards, and member-filtered stage cuts.
- `components/MemberProfilePage.tsx`: dedicated member profile page with portrait, identity board, and member-scoped stage cuts.
- `components/TrackVideo.tsx`: reusable YouTube embed block for `Loom Track 01 Root Signal`.
- `data/members.ts`: member data, image paths, accents, map positions, and vote options.
- `data/tracks.ts`: album/track metadata and official YouTube embed URLs.
- `data/mediaExperience.ts`: member-to-media cue map for future synchronized media switching.
- `styles.css`: global visual system, responsive layout, stage map, and panel treatment.
- `data/media.ts`: generated storyboard, member board, and stage cut image index.
- `public/assets/members/Mxx/`: optimized member archive with profile, character board, and member-scoped stage cuts.
- `public/assets/members/duos/`: optimized duo stage cuts, still separated by album and track.
- `public/assets/tracks/`: optimized track-level assets such as storyboard previews.
- `assets/`: original web-owned source asset snapshot.
- `docs/loom-final-homepage-target.png`: locked visual direction reference for this prototype.

## Commands

- `pnpm install --offline`: install from the local pnpm cache when possible.
- `pnpm dev`: run the local Next dev server.
- `pnpm type-check`: validate TypeScript.
- `pnpm build`: create a production build.

## Maintenance Notes

- Member profile data lives in the `members` array in `data/members.ts`.
- Each member needs `code`, `name`, `word`, `identity`, `accent`, `position`, `role`, `image`, `votePrompt`, and `voteOptions`.
- The circular map position is controlled by `position.x` and `position.y`.
- The right panel and member page link are updated from React state in `SignalDeck`.
- Public CTAs route to archive, member pages, Track 01, and the local Harne Vote prototype. No database or public vote collection is connected.
- `Loom Track 01 Root Signal` is embedded from YouTube ID `DUyCAFHZ7X0`.
- `data/mediaExperience.ts` is the planned sync layer for member-click media updates: selected member -> video cue, profile image, board image, storyboard set, and stage cut ids.
- Member portraits, character boards, storyboards, and stage cuts are committed as web-ready assets under `public/assets/**`.
- Album and track-specific stage cuts stay nested under `albums/code-root-signal/loom-full-code-root-signal/` instead of being mixed into base member assets.

## Current Scope

This is a visual and interaction prototype. It does not connect to a database, collect public votes, publish externally, or call paid media APIs.
