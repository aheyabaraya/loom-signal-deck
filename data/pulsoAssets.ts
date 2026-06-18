import type { MemberCode } from "./members";

export type PulsoVisualAsset = {
  image: string;
  label: string;
  memberCode?: MemberCode;
  memberName?: string;
  title: string;
};

export type PulsoTrackCut = {
  id: string;
  image: string;
  memberCode: MemberCode;
  memberCodes: MemberCode[];
  sourceType: "pulso-face" | "pulso-stagewear";
  subtitle: string;
  title: string;
};

export type PulsoVisualGroup = {
  eyebrow: string;
  sheets: PulsoVisualAsset[];
  summary?: string;
  title: string;
};

export type PulsoWardrobeSet = {
  assets: PulsoVisualAsset[];
  eyebrow: string;
  summary: string;
  title: string;
};

// Pulso preview/contact-sheet mirrors were cleaned from web/public on 2026-06-18.
// The canonical final master and registry now live in the IDOL run/catalog paths.
export const pulsoContactSheetGroups: PulsoVisualGroup[] = [];

const pulsoMemberLooks = [
  {
    memberCode: "M01",
    memberName: "Saeyan",
    country: "Korea",
    faceImage: "/assets/tracks/world-cup-pulso/members/M01/pulso-face-taegukgi.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M01/pulso-stagewear-sl07-white-black-hero-asym.webp",
    stagewearTitle: "SL07 White-black hero asym"
  },
  {
    memberCode: "M02",
    memberName: "Seorin",
    country: "Japan",
    faceImage: "/assets/tracks/world-cup-pulso/members/M02/pulso-face-hinomaru.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M02/pulso-stagewear-sl04-white-black-asym-shorts.webp",
    stagewearTitle: "SL04 White-black asym shorts"
  },
  {
    memberCode: "M03",
    memberName: "Yeul",
    country: "Brazil",
    faceImage: "/assets/tracks/world-cup-pulso/members/M03/pulso-face-brazil.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M03/pulso-stagewear-sl05-blue-black-one-sleeve-mini.webp",
    stagewearTitle: "SL05 Blue-black one-sleeve mini"
  },
  {
    memberCode: "M04",
    memberName: "Lua",
    country: "Morocco",
    faceImage: "/assets/tracks/world-cup-pulso/members/M04/pulso-face-morocco.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M04/pulso-stagewear-sl08-green-black-skirt-panel.webp",
    stagewearTitle: "SL08 Green-black skirt panel"
  },
  {
    memberCode: "M05",
    memberName: "Faye",
    country: "France",
    faceImage: "/assets/tracks/world-cup-pulso/members/M05/pulso-face-france.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M05/pulso-stagewear-sl02-black-white-hardware-pants.webp",
    stagewearTitle: "SL02 Black-white hardware"
  },
  {
    memberCode: "M06",
    memberName: "Eryn",
    country: "Germany",
    faceImage: "/assets/tracks/world-cup-pulso/members/M06/pulso-face-germany.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M06/pulso-stagewear-sl06-red-black-rap-mesh-pants.webp",
    stagewearTitle: "SL06 Red-black rap mesh"
  },
  {
    memberCode: "M07",
    memberName: "Rena",
    country: "Mexico",
    faceImage: "/assets/tracks/world-cup-pulso/members/M07/pulso-face-mexico.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M07/pulso-stagewear-sl11-black-gold-white-lower.webp",
    stagewearTitle: "SL11 Black-gold white lower"
  },
  {
    memberCode: "M08",
    memberName: "Natsu",
    country: "Argentina",
    faceImage: "/assets/tracks/world-cup-pulso/members/M08/pulso-face-argentina.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M08/pulso-stagewear-sl01-red-black-leather-mini.webp",
    stagewearTitle: "SL01 Red-black leather mini"
  },
  {
    memberCode: "M09",
    memberName: "Aria",
    country: "Colombia",
    faceImage: "/assets/tracks/world-cup-pulso/members/M09/pulso-face-colombia.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M09/pulso-stagewear-sl03-yellow-black-jersey-mini.webp",
    stagewearTitle: "SL03 Yellow-black jersey mini"
  },
  {
    memberCode: "M10",
    memberName: "Karin",
    country: "USA",
    faceImage: "/assets/tracks/world-cup-pulso/members/M10/pulso-face-usa.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M10/pulso-stagewear-sl09-blue-black-number-mini.webp",
    stagewearTitle: "SL09 Blue-black athletic mini"
  },
  {
    memberCode: "M11",
    memberName: "Yuzu",
    country: "Senegal",
    faceImage: "/assets/tracks/world-cup-pulso/members/M11/pulso-face-senegal.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M11/pulso-stagewear-sl10-checker-asym-skirt.webp",
    stagewearTitle: "SL10 Checker asym skirt"
  },
  {
    memberCode: "M12",
    memberName: "Seira",
    country: "Canada",
    faceImage: "/assets/tracks/world-cup-pulso/members/M12/pulso-face-canada.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M12/pulso-stagewear-sl12-black-gold-finale-mini.webp",
    stagewearTitle: "SL12 Black-gold finale mini"
  },
  {
    memberCode: "M13",
    memberName: "Shion",
    country: "Portugal",
    faceImage: "/assets/tracks/world-cup-pulso/members/M13/pulso-face-portugal.webp",
    stagewearImage:
      "/assets/tracks/world-cup-pulso/members/M13/pulso-stagewear-sl12-black-gold-finale-mini.webp",
    stagewearTitle: "SL12 Black-gold finale mini"
  }
] satisfies Array<{
  country: string;
  faceImage: string;
  memberCode: MemberCode;
  memberName: string;
  stagewearImage: string;
  stagewearTitle: string;
}>;

export const pulsoFacePaintAssets: PulsoVisualAsset[] = pulsoMemberLooks.map((look) => ({
  image: look.faceImage,
  label: `${look.memberCode} / ${look.country}`,
  memberCode: look.memberCode,
  memberName: look.memberName,
  title: `${look.memberName} minimal face paint`
}));

export const pulsoStagewearAssets: PulsoVisualAsset[] = pulsoMemberLooks.map((look) => ({
  image: look.stagewearImage,
  label: look.memberCode,
  memberCode: look.memberCode,
  memberName: look.memberName,
  title: `${look.memberName} ${look.stagewearTitle}`
}));

export const pulsoTrackCuts: PulsoTrackCut[] = pulsoMemberLooks.flatMap((look) => [
  {
    id: `pulso-${look.memberCode.toLowerCase()}-face`,
    image: look.faceImage,
    memberCode: look.memberCode,
    memberCodes: [look.memberCode],
    sourceType: "pulso-face",
    subtitle: `${look.country} minimal face paint`,
    title: `${look.memberCode} ${look.memberName}`
  },
  {
    id: `pulso-${look.memberCode.toLowerCase()}-stagewear`,
    image: look.stagewearImage,
    memberCode: look.memberCode,
    memberCodes: [look.memberCode],
    sourceType: "pulso-stagewear",
    subtitle: look.stagewearTitle,
    title: `${look.memberCode} ${look.memberName}`
  }
]);

export const pulsoWardrobeSets: PulsoWardrobeSet[] = [
  {
    assets: pulsoFacePaintAssets,
    eyebrow: "Pulso Face Paint",
    summary:
      "One minimal national-color face-paint close-up per member, optimized from the World Cup Pulso visual-board series.",
    title: "Member Face Paint Cuts"
  },
  {
    assets: pulsoStagewearAssets,
    eyebrow: "Pulso Stagewear",
    summary:
      "Founder stagewear lineup matches per member, converted into web-ready wardrobe reference cards.",
    title: "Member Stagewear Cuts"
  }
];

export function getPulsoTrackCutsForMember(memberCode: MemberCode) {
  return pulsoTrackCuts.filter((cut) => cut.memberCode === memberCode);
}
