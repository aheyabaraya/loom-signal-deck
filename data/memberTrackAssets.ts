import {
  getMemberAlbumAssetRoot,
  getMemberUnitAssetRoot,
  memberCodes,
  type MemberCode
} from "./memberAssets";

export type MemberTrackAsset = {
  id: string;
  memberCode?: MemberCode;
  memberCodes: MemberCode[];
  title: string;
  subtitle: string;
  image: string;
  sourceType: "solo" | "duo";
  display?: {
    kind: string;
    releasedAt: string;
    sourceLabel: string;
  };
};

/** Backwards-compatible view type used by existing gallery components. */
export type StageCut = MemberTrackAsset;

function memberAlbumImage(memberCode: MemberCode, packageSlug: string, relativePath: string) {
  return `${getMemberAlbumAssetRoot(memberCode, packageSlug)}/${relativePath}`;
}

function memberUnitAlbumImage(unitCode: string, packageSlug: string, relativePath: string) {
  return `${getMemberUnitAssetRoot(unitCode, packageSlug)}/${relativePath}`;
}

/**
 * Member-owned image catalog shown in Track Cuts.
 *
 * Add new solo or unit images here. The derived memberTrackAssetsByCode index
 * automatically makes every asset available on each linked member page.
 */
export const memberTrackAssets: MemberTrackAsset[] = [
  {
    "id": "stage-01",
    "memberCode": "M01",
    "memberCodes": [
      "M01"
    ],
    "title": "M01",
    "subtitle": "R01 0-00-0-06 M01",
    "image": memberAlbumImage(
      "M01",
      "code-root-signal",
      "loom-full-code-root-signal/images/01-r01-0-00-0-06-m01.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-02",
    "memberCode": "M01",
    "memberCodes": [
      "M01"
    ],
    "title": "M01",
    "subtitle": "R22 M01 2-33-2-39",
    "image": memberAlbumImage(
      "M01",
      "code-root-signal",
      "loom-full-code-root-signal/images/02-r22-m01-2-33-2-39-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-03",
    "memberCode": "M02",
    "memberCodes": [
      "M02"
    ],
    "title": "M02",
    "subtitle": "R02 0-06-0-14 M02",
    "image": memberAlbumImage(
      "M02",
      "code-root-signal",
      "loom-full-code-root-signal/images/03-r02-0-06-0-14-m02.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-04",
    "memberCode": "M02",
    "memberCodes": [
      "M02"
    ],
    "title": "M02",
    "subtitle": "R19A M02 12s-INSERT",
    "image": memberAlbumImage(
      "M02",
      "code-root-signal",
      "loom-full-code-root-signal/images/04-r19a-m02-12s-insert-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-05",
    "memberCode": "M03",
    "memberCodes": [
      "M03"
    ],
    "title": "M03",
    "subtitle": "R03 0-14-0-24 M03",
    "image": memberAlbumImage(
      "M03",
      "code-root-signal",
      "loom-full-code-root-signal/images/05-r03-0-14-0-24-m03.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-06",
    "memberCode": "M03",
    "memberCodes": [
      "M03"
    ],
    "title": "M03",
    "subtitle": "R12 1-17-1-22 M03",
    "image": memberAlbumImage(
      "M03",
      "code-root-signal",
      "loom-full-code-root-signal/images/06-r12-1-17-1-22-m03.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-07",
    "memberCode": "M03",
    "memberCodes": [
      "M03"
    ],
    "title": "M03",
    "subtitle": "R19A M03 12s-INSERT",
    "image": memberAlbumImage(
      "M03",
      "code-root-signal",
      "loom-full-code-root-signal/images/07-r19a-m03-12s-insert-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-08",
    "memberCode": "M04",
    "memberCodes": [
      "M04"
    ],
    "title": "M04",
    "subtitle": "R04 0-24-0-32 M04",
    "image": memberAlbumImage(
      "M04",
      "code-root-signal",
      "loom-full-code-root-signal/images/08-r04-0-24-0-32-m04.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-09",
    "memberCode": "M04",
    "memberCodes": [
      "M04"
    ],
    "title": "M04",
    "subtitle": "R19B M04 12s-INSERT",
    "image": memberAlbumImage(
      "M04",
      "code-root-signal",
      "loom-full-code-root-signal/images/09-r19b-m04-12s-insert-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-10",
    "memberCode": "M05",
    "memberCodes": [
      "M05"
    ],
    "title": "M05",
    "subtitle": "R05 0-32-0-40 M05",
    "image": memberAlbumImage(
      "M05",
      "code-root-signal",
      "loom-full-code-root-signal/images/10-r05-0-32-0-40-m05.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-11",
    "memberCode": "M05",
    "memberCodes": [
      "M05"
    ],
    "title": "M05",
    "subtitle": "R10B 1-06-1-12 M05",
    "image": memberAlbumImage(
      "M05",
      "code-root-signal",
      "loom-full-code-root-signal/images/11-r10b-1-06-1-12-m05-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-12",
    "memberCode": "M05",
    "memberCodes": [
      "M05"
    ],
    "title": "M05",
    "subtitle": "R16 1-39-1-42 M05",
    "image": memberAlbumImage(
      "M05",
      "code-root-signal",
      "loom-full-code-root-signal/images/12-r16-1-39-1-42-m05.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-13",
    "memberCode": "M05",
    "memberCodes": [
      "M05"
    ],
    "title": "M05",
    "subtitle": "R23 M05 2-39-2-44",
    "image": memberAlbumImage(
      "M05",
      "code-root-signal",
      "loom-full-code-root-signal/images/13-r23-m05-2-39-2-44-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-14",
    "memberCode": "M06",
    "memberCodes": [
      "M06"
    ],
    "title": "M06",
    "subtitle": "R06 0-40-0-48 M06",
    "image": memberAlbumImage(
      "M06",
      "code-root-signal",
      "loom-full-code-root-signal/images/14-r06-0-40-0-48-m06.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-15",
    "memberCode": "M06",
    "memberCodes": [
      "M06"
    ],
    "title": "M06",
    "subtitle": "R06 REMAKE 0-40-0-48",
    "image": memberAlbumImage(
      "M06",
      "code-root-signal",
      "loom-full-code-root-signal/images/15-r06-remake-0-40-0-48-m06-prechorus-axis.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-16",
    "memberCode": "M06",
    "memberCodes": [
      "M06"
    ],
    "title": "M06",
    "subtitle": "R19B M06 12s-INSERT",
    "image": memberAlbumImage(
      "M06",
      "code-root-signal",
      "loom-full-code-root-signal/images/16-r19b-m06-12s-insert-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-17",
    "memberCode": "M07",
    "memberCodes": [
      "M07"
    ],
    "title": "M07",
    "subtitle": "R07 0-48-0-53 M07",
    "image": memberAlbumImage(
      "M07",
      "code-root-signal",
      "loom-full-code-root-signal/images/17-r07-0-48-0-53-m07.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-18",
    "memberCode": "M07",
    "memberCodes": [
      "M07"
    ],
    "title": "M07",
    "subtitle": "R10A 1-06-1-12 M07",
    "image": memberAlbumImage(
      "M07",
      "code-root-signal",
      "loom-full-code-root-signal/images/18-r10a-1-06-1-12-m07-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-19",
    "memberCode": "M07",
    "memberCodes": [
      "M07"
    ],
    "title": "M07",
    "subtitle": "R20 M07 2-12-2-22",
    "image": memberAlbumImage(
      "M07",
      "code-root-signal",
      "loom-full-code-root-signal/images/19-r20-m07-2-12-2-22-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-20",
    "memberCode": "M07",
    "memberCodes": [
      "M07"
    ],
    "title": "M07",
    "subtitle": "R22 M07 2-33-2-39",
    "image": memberAlbumImage(
      "M07",
      "code-root-signal",
      "loom-full-code-root-signal/images/20-r22-m07-2-33-2-39-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-47",
    "memberCode": "M07",
    "memberCodes": [
      "M07"
    ],
    "title": "M07 Rena",
    "subtitle": "CF cosmetic morning · profile apply",
    "image": memberAlbumImage(
      "M07",
      "cf-cosmetic-morning-luma",
      "images/rena-profile-apply-side.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-gm-temple-a",
    "memberCode": "M07",
    "memberCodes": ["M07"],
    "title": "M07 · Bouquet key visual A",
    "subtitle": "Gentle Monster temple face-lock A",
    "image": memberAlbumImage(
      "M07",
      "cf-gentle-monster-bouquet",
      "images/temple-a.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-gm-temple-b",
    "memberCode": "M07",
    "memberCodes": ["M07"],
    "title": "M07 · Bouquet key visual B",
    "subtitle": "Gentle Monster temple face-lock B",
    "image": memberAlbumImage(
      "M07",
      "cf-gentle-monster-bouquet",
      "images/temple-b.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-gm-temple-c",
    "memberCode": "M07",
    "memberCodes": ["M07"],
    "title": "M07 · Bouquet key visual C",
    "subtitle": "Gentle Monster temple face-lock C",
    "image": memberAlbumImage(
      "M07",
      "cf-gentle-monster-bouquet",
      "images/temple-c.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-gm-temple-d",
    "memberCode": "M07",
    "memberCodes": ["M07"],
    "title": "M07 · Bouquet key visual D",
    "subtitle": "Gentle Monster temple face-lock D",
    "image": memberAlbumImage(
      "M07",
      "cf-gentle-monster-bouquet",
      "images/temple-d.webp"
    ),
    "sourceType": "solo"
  },

  {
    "id": "stage-21",
    "memberCode": "M08",
    "memberCodes": [
      "M08"
    ],
    "title": "M08",
    "subtitle": "R09A 0-58-1-06 M08",
    "image": memberAlbumImage(
      "M08",
      "code-root-signal",
      "loom-full-code-root-signal/images/21-r09a-0-58-1-06-m08-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-22",
    "memberCode": "M08",
    "memberCodes": [
      "M08"
    ],
    "title": "M08",
    "subtitle": "R18 M08 1-48-2-00",
    "image": memberAlbumImage(
      "M08",
      "code-root-signal",
      "loom-full-code-root-signal/images/22-r18-m08-1-48-2-00-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-23",
    "memberCode": "M08",
    "memberCodes": [
      "M08"
    ],
    "title": "M08",
    "subtitle": "R21 M08 2-22-2-33",
    "image": memberAlbumImage(
      "M08",
      "code-root-signal",
      "loom-full-code-root-signal/images/23-r21-m08-2-22-2-33-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-24",
    "memberCode": "M09",
    "memberCodes": [
      "M09"
    ],
    "title": "M09",
    "subtitle": "R08 0-53-0-58 M09",
    "image": memberAlbumImage(
      "M09",
      "code-root-signal",
      "loom-full-code-root-signal/images/24-r08-0-53-0-58-m09.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-25",
    "memberCode": "M09",
    "memberCodes": [
      "M09"
    ],
    "title": "M09",
    "subtitle": "R09B 0-58-1-06 M09",
    "image": memberAlbumImage(
      "M09",
      "code-root-signal",
      "loom-full-code-root-signal/images/25-r09b-0-58-1-06-m09-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-26",
    "memberCode": "M09",
    "memberCodes": [
      "M09"
    ],
    "title": "M09",
    "subtitle": "R20 M09 2-12-2-22",
    "image": memberAlbumImage(
      "M09",
      "code-root-signal",
      "loom-full-code-root-signal/images/26-r20-m09-2-12-2-22-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-27",
    "memberCode": "M10",
    "memberCodes": [
      "M10"
    ],
    "title": "M10",
    "subtitle": "R11 1-12-1-17 M10",
    "image": memberAlbumImage(
      "M10",
      "code-root-signal",
      "loom-full-code-root-signal/images/27-r11-1-12-1-17-m10.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-28",
    "memberCode": "M10",
    "memberCodes": [
      "M10"
    ],
    "title": "M10",
    "subtitle": "R18 M10 1-48-2-00",
    "image": memberAlbumImage(
      "M10",
      "code-root-signal",
      "loom-full-code-root-signal/images/28-r18-m10-1-48-2-00-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-29",
    "memberCode": "M11",
    "memberCodes": [
      "M11"
    ],
    "title": "M11",
    "subtitle": "R15 1-33-1-39 M11",
    "image": memberAlbumImage(
      "M11",
      "code-root-signal",
      "loom-full-code-root-signal/images/29-r15-1-33-1-39-m11.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-30",
    "memberCode": "M11",
    "memberCodes": [
      "M11"
    ],
    "title": "M11",
    "subtitle": "R17 1-42-1-48 M11",
    "image": memberAlbumImage(
      "M11",
      "code-root-signal",
      "loom-full-code-root-signal/images/30-r17-1-42-1-48-m11.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-31",
    "memberCode": "M11",
    "memberCodes": [
      "M11"
    ],
    "title": "M11",
    "subtitle": "R19 M11 2-00-2-12",
    "image": memberAlbumImage(
      "M11",
      "code-root-signal",
      "loom-full-code-root-signal/images/31-r19-m11-2-00-2-12-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-32",
    "memberCode": "M12",
    "memberCodes": [
      "M12"
    ],
    "title": "M12",
    "subtitle": "R14 1-28-1-33 M12",
    "image": memberAlbumImage(
      "M12",
      "code-root-signal",
      "loom-full-code-root-signal/images/32-r14-1-28-1-33-m12.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-33",
    "memberCode": "M12",
    "memberCodes": [
      "M12"
    ],
    "title": "M12",
    "subtitle": "R21 M12 2-22-2-33",
    "image": memberAlbumImage(
      "M12",
      "code-root-signal",
      "loom-full-code-root-signal/images/33-r21-m12-2-22-2-33-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-34",
    "memberCode": "M13",
    "memberCodes": [
      "M13"
    ],
    "title": "M13",
    "subtitle": "R13 1-22-1-28 M13",
    "image": memberAlbumImage(
      "M13",
      "code-root-signal",
      "loom-full-code-root-signal/images/34-r13-1-22-1-28-m13.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-35",
    "memberCode": "M13",
    "memberCodes": [
      "M13"
    ],
    "title": "M13",
    "subtitle": "R19 M13 2-00-2-12",
    "image": memberAlbumImage(
      "M13",
      "code-root-signal",
      "loom-full-code-root-signal/images/35-r19-m13-2-00-2-12-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-36",
    "memberCode": "M13",
    "memberCodes": [
      "M13"
    ],
    "title": "M13",
    "subtitle": "R23 M13 2-39-2-44",
    "image": memberAlbumImage(
      "M13",
      "code-root-signal",
      "loom-full-code-root-signal/images/36-r23-m13-2-39-2-44-solo-backdancers.webp"
    ),
    "sourceType": "solo"
  },
  {
    "id": "stage-37",
    "memberCode": "M01",
    "memberCodes": [
      "M01",
      "M07"
    ],
    "title": "M01 / M07",
    "subtitle": "R22 2-33-2-39 M01",
    "image": memberUnitAlbumImage(
      "M01_M07",
      "code-root-signal/loom-full-code-root-signal",
      "images/37-r22-2-33-2-39-m01-m07.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-38",
    "memberCode": "M02",
    "memberCodes": [
      "M02",
      "M03"
    ],
    "title": "M02 / M03",
    "subtitle": "R19A 12s-INSERT M02",
    "image": memberUnitAlbumImage(
      "M02_M03",
      "code-root-signal/loom-full-code-root-signal",
      "images/38-r19a-12s-insert-m02-m03.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-39",
    "memberCode": "M04",
    "memberCodes": [
      "M04",
      "M06"
    ],
    "title": "M04 / M06",
    "subtitle": "R19B 12s-INSERT M04",
    "image": memberUnitAlbumImage(
      "M04_M06",
      "code-root-signal/loom-full-code-root-signal",
      "images/39-r19b-12s-insert-m04-m06.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-40",
    "memberCode": "M05",
    "memberCodes": [
      "M05",
      "M07"
    ],
    "title": "M05 / M07",
    "subtitle": "R10 1-06-1-12 M07",
    "image": memberUnitAlbumImage(
      "M05_M07",
      "code-root-signal/loom-full-code-root-signal",
      "images/40-r10-1-06-1-12-m07-m05.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-41",
    "memberCode": "M05",
    "memberCodes": [
      "M05",
      "M13"
    ],
    "title": "M05 / M13",
    "subtitle": "R23 2-39-2-44 M05",
    "image": memberUnitAlbumImage(
      "M05_M13",
      "code-root-signal/loom-full-code-root-signal",
      "images/41-r23-2-39-2-44-m05-m13.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-42",
    "memberCode": "M07",
    "memberCodes": [
      "M07",
      "M09"
    ],
    "title": "M07 / M09",
    "subtitle": "R20 2-12-2-22 M07",
    "image": memberUnitAlbumImage(
      "M07_M09",
      "code-root-signal/loom-full-code-root-signal",
      "images/42-r20-2-12-2-22-m07-m09.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-43",
    "memberCode": "M08",
    "memberCodes": [
      "M08",
      "M09"
    ],
    "title": "M08 / M09",
    "subtitle": "R09 0-58-1-06 M08",
    "image": memberUnitAlbumImage(
      "M08_M09",
      "code-root-signal/loom-full-code-root-signal",
      "images/43-r09-0-58-1-06-m08-m09.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-44",
    "memberCode": "M08",
    "memberCodes": [
      "M08",
      "M10"
    ],
    "title": "M08 / M10",
    "subtitle": "R18 1-48-2-00 M08",
    "image": memberUnitAlbumImage(
      "M08_M10",
      "code-root-signal/loom-full-code-root-signal",
      "images/44-r18-1-48-2-00-m08-m10.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-45",
    "memberCode": "M08",
    "memberCodes": [
      "M08",
      "M12"
    ],
    "title": "M08 / M12",
    "subtitle": "R21 2-22-2-33 M08",
    "image": memberUnitAlbumImage(
      "M08_M12",
      "code-root-signal/loom-full-code-root-signal",
      "images/45-r21-2-22-2-33-m08-m12.webp"
    ),
    "sourceType": "duo"
  },
  {
    "id": "stage-46",
    "memberCode": "M11",
    "memberCodes": [
      "M11",
      "M13"
    ],
    "title": "M11 / M13",
    "subtitle": "R19 2-00-2-12 M11",
    "image": memberUnitAlbumImage(
      "M11_M13",
      "code-root-signal/loom-full-code-root-signal",
      "images/46-r19-2-00-2-12-m11-m13.webp"
    ),
    "sourceType": "duo"
  }
];

/** Backwards-compatible flat catalog name used by existing archive components. */
export const stageCuts = memberTrackAssets;

export const memberTrackAssetsByCode = Object.fromEntries(
  memberCodes.map((memberCode) => [
    memberCode,
    memberTrackAssets.filter((asset) => asset.memberCodes.includes(memberCode))
  ])
) as Record<MemberCode, MemberTrackAsset[]>;

export function getMemberTrackAssetsForMember(memberCode: MemberCode) {
  return memberTrackAssetsByCode[memberCode];
}
