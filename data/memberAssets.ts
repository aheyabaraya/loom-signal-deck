export const memberCodes = [
  "M01",
  "M02",
  "M03",
  "M04",
  "M05",
  "M06",
  "M07",
  "M08",
  "M09",
  "M10",
  "M11",
  "M12",
  "M13"
] as const;

export type MemberCode = (typeof memberCodes)[number];

export type MemberCoreAssets = {
  characterBoard: string;
  profile: string;
};

/**
 * Standard member asset layout.
 *
 * Most members need no entry here: profile and character-board paths are
 * generated from the member code. Add only exceptions when a member uses a
 * differently named or versioned core image.
 */
const memberCoreAssetOverrides: Partial<Record<MemberCode, Partial<MemberCoreAssets>>> = {};

function buildMemberCoreAssets(memberCode: MemberCode): MemberCoreAssets {
  const root = `/assets/members/${memberCode}`;

  return {
    characterBoard: `${root}/character-board.webp`,
    profile: `${root}/profile.webp`,
    ...memberCoreAssetOverrides[memberCode]
  };
}

export const memberAssetsByCode = Object.fromEntries(
  memberCodes.map((memberCode) => [memberCode, buildMemberCoreAssets(memberCode)])
) as Record<MemberCode, MemberCoreAssets>;

export function getMemberAssets(memberCode: MemberCode) {
  return memberAssetsByCode[memberCode];
}

/** Root folder for member-owned assets within any album or campaign package. */
export function getMemberAlbumAssetRoot(memberCode: MemberCode, packageSlug: string) {
  return `/assets/members/${memberCode}/albums/${packageSlug}`;
}

/** Root folder for assets shared by a multi-member pairing. */
export function getMemberUnitAssetRoot(unitCode: string, packageSlug: string) {
  return `/assets/members/duos/albums/${packageSlug}/${unitCode}`;
}
