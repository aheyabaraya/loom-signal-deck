import type { MemberCode } from "./members";

export type TikTokMemberAsset = {
  id: string;
  memberCode: MemberCode;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  capturedAt: string;
  shareUrl: string;
  playerUrl: string;
};

const capturedAt = "2026-06-11T14:55:00+09:00";

function playerUrl(id: string) {
  return `https://www.tiktok.com/player/v1/${id}?music_info=1&description=1&controls=1&autoplay=0&loop=0&rel=0`;
}

export const tiktokMemberAssets: TikTokMemberAsset[] = [
  {
    id: "7642332420485745941",
    memberCode: "M01",
    title: "M01 stage Saeyan",
    views: 236,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642332420485745941",
    playerUrl: playerUrl("7642332420485745941")
  },
  {
    id: "7642016307218484500",
    memberCode: "M01",
    title: "M01 Saeyan",
    views: 209,
    likes: 4,
    comments: 0,
    shares: 0,
    duration: 6,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642016307218484500",
    playerUrl: playerUrl("7642016307218484500")
  },
  {
    id: "7642322056196967701",
    memberCode: "M01",
    title: "M01 MV Saeyan",
    views: 154,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642322056196967701",
    playerUrl: playerUrl("7642322056196967701")
  },
  {
    id: "7642014141602909460",
    memberCode: "M01",
    title: "Saeyan corridor",
    views: 149,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642014141602909460",
    playerUrl: playerUrl("7642014141602909460")
  },
  {
    id: "7642013136366685461",
    memberCode: "M01",
    title: "Saeyan MV",
    views: 116,
    likes: 1,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642013136366685461",
    playerUrl: playerUrl("7642013136366685461")
  },
  {
    id: "7642319743843749141",
    memberCode: "M02",
    title: "M02 stage",
    views: 188,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642319743843749141",
    playerUrl: playerUrl("7642319743843749141")
  },
  {
    id: "7642323655300599060",
    memberCode: "M02",
    title: "M02 MV Seorin",
    views: 165,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642323655300599060",
    playerUrl: playerUrl("7642323655300599060")
  },
  {
    id: "7642015568916237588",
    memberCode: "M02",
    title: "M02 Seorin",
    views: 154,
    likes: 4,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642015568916237588",
    playerUrl: playerUrl("7642015568916237588")
  },
  {
    id: "7642016845368675605",
    memberCode: "M03",
    title: "M03 Yeul",
    views: 136,
    likes: 3,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642016845368675605",
    playerUrl: playerUrl("7642016845368675605")
  },
  {
    id: "7642330107624934676",
    memberCode: "M04",
    title: "M04 Lua stage",
    views: 251,
    likes: 12,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642330107624934676",
    playerUrl: playerUrl("7642330107624934676")
  },
  {
    id: "7642328448530156820",
    memberCode: "M04",
    title: "M04 Lua MV",
    views: 195,
    likes: 6,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642328448530156820",
    playerUrl: playerUrl("7642328448530156820")
  },
  {
    id: "7642320408972299540",
    memberCode: "M04",
    title: "M04 stage",
    views: 193,
    likes: 14,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642320408972299540",
    playerUrl: playerUrl("7642320408972299540")
  },
  {
    id: "7642017750809939221",
    memberCode: "M04",
    title: "M04 Lua hand",
    views: 175,
    likes: 3,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642017750809939221",
    playerUrl: playerUrl("7642017750809939221")
  },
  {
    id: "7642027905098288405",
    memberCode: "M04",
    title: "M04 Lua stage",
    views: 161,
    likes: 3,
    comments: 2,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642027905098288405",
    playerUrl: playerUrl("7642027905098288405")
  },
  {
    id: "7642019253809351956",
    memberCode: "M05",
    title: "M05 Faye",
    views: 144,
    likes: 8,
    comments: 0,
    shares: 0,
    duration: 8,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642019253809351956",
    playerUrl: playerUrl("7642019253809351956")
  },
  {
    id: "7642330933701643540",
    memberCode: "M05",
    title: "M05 Faye stage",
    views: 135,
    likes: 1,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642330933701643540",
    playerUrl: playerUrl("7642330933701643540")
  },
  {
    id: "7642333620027575573",
    memberCode: "M05",
    title: "M05 Faye MV",
    views: 130,
    likes: 3,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642333620027575573",
    playerUrl: playerUrl("7642333620027575573")
  },
  {
    id: "7642902100430572821",
    memberCode: "M05",
    title: "M05 Faye",
    views: 122,
    likes: 2,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642902100430572821",
    playerUrl: playerUrl("7642902100430572821")
  },
  {
    id: "7642334391234055444",
    memberCode: "M06",
    title: "M06 Eryn MV",
    views: 223,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642334391234055444",
    playerUrl: playerUrl("7642334391234055444")
  },
  {
    id: "7642027344676343061",
    memberCode: "M06",
    title: "M06 Eryn stage",
    views: 147,
    likes: 4,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642027344676343061",
    playerUrl: playerUrl("7642027344676343061")
  },
  {
    id: "7641221894288755988",
    memberCode: "M07",
    title: "M07 Rena rescue",
    views: 270,
    likes: 9,
    comments: 0,
    shares: 0,
    duration: 8,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7641221894288755988",
    playerUrl: playerUrl("7641221894288755988")
  },
  {
    id: "7641247627270737173",
    memberCode: "M07",
    title: "M07",
    views: 268,
    likes: 12,
    comments: 2,
    shares: 0,
    duration: 16,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7641247627270737173",
    playerUrl: playerUrl("7641247627270737173")
  },
  {
    id: "7642027630186745108",
    memberCode: "M07",
    title: "M07 Rena stage",
    views: 180,
    likes: 3,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642027630186745108",
    playerUrl: playerUrl("7642027630186745108")
  },
  {
    id: "7642026869667220757",
    memberCode: "M07",
    title: "M07 Rena stage",
    views: 151,
    likes: 4,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642026869667220757",
    playerUrl: playerUrl("7642026869667220757")
  },
  {
    id: "7641244293717413140",
    memberCode: "M08",
    title: "M08",
    views: 337,
    likes: 10,
    comments: 0,
    shares: 0,
    duration: 5,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7641244293717413140",
    playerUrl: playerUrl("7641244293717413140")
  },
  {
    id: "7642022666899328277",
    memberCode: "M09",
    title: "M09 Aria",
    views: 235,
    likes: 5,
    comments: 0,
    shares: 0,
    duration: 6,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642022666899328277",
    playerUrl: playerUrl("7642022666899328277")
  },
  {
    id: "7642022195899731220",
    memberCode: "M09",
    title: "M09 Aria",
    views: 152,
    likes: 7,
    comments: 0,
    shares: 0,
    duration: 12,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642022195899731220",
    playerUrl: playerUrl("7642022195899731220")
  },
  {
    id: "7642024152974527764",
    memberCode: "M13",
    title: "M13 Shion",
    views: 169,
    likes: 5,
    comments: 0,
    shares: 0,
    duration: 10,
    capturedAt,
    shareUrl: "https://www.tiktok.com/@loom_mm/video/7642024152974527764",
    playerUrl: playerUrl("7642024152974527764")
  }
];

export function getTikTokAssetsForMember(memberCode: MemberCode) {
  return tiktokMemberAssets
    .filter((asset) => asset.memberCode === memberCode)
    .sort((a, b) => b.views - a.views);
}
