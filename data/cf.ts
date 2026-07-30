import { youtubeEmbedUrl } from "./embedSources";
import { getMemberAssets, type MemberCode } from "./memberAssets";

export type CfCampaign = {
  id: string;
  title: string;
  shortTitle: string;
  status: "final" | "founder_review" | "draft";
  duration: string;
  memberCodes: MemberCode[];
  productLane: string;
  objective: string;
  memoryLine: string;
  story: string;
  viewerRead: string;
  proof: string[];
  locks: string[];
  image: string;
  videoUrl?: string;
  videoEmbedUrl?: string;
  videoPlatform?: "instagram_reels" | "youtube_shorts";
};

export const cfCampaigns: CfCampaign[] = [
  {
    id: "CF_GENTLEMONSTER_BOUQUET_001",
    title: "Bouquet · Dual Gaze Brand Film",
    shortTitle: "Bouquet Gaze",
    status: "final",
    duration: "19s",
    memberCodes: ["M07"],
    productLane: "Fashion / clear eyewear · floral-bead temple",
    objective: "Harness sample · portfolio brand film",
    memoryLine: "Different gazes meet — and a new sense completes.",
    story:
      "A Loom production-harness brand film study: dual glass-corridor gazes, pocket-to-temple bead proof, and a four-contact eyeline finish. Framed as a spec fashion film, not an official brand campaign.",
    viewerRead:
      "Two incomplete views resolve when temple-bead construction locks a shared sense of space.",
    proof: [
      "Split stair and dual corridor gazes",
      "Pocket bead reveal",
      "Temple A/B/C/D face-lock key visuals",
      "Mutual eyeline landing"
    ],
    locks: [
      "Spec concept, not an official brand campaign",
      "Key visual lock: temple A/B/C/D face-lock set",
      "Music bed: Suno",
      "Edit on Grok Build · no logo, price, or retailer claim"
    ],
    image: "/assets/cf/gentle-monster-bouquet/poster-temple-a.webp",
    videoUrl: "https://youtube.com/shorts/br8NKQIHjOQ",
    videoEmbedUrl: youtubeEmbedUrl("br8NKQIHjOQ", "playsinline=1&rel=0"),
    videoPlatform: "youtube_shorts"
  },
  {
    id: "CF_COSMETIC_TARGET_DISCOVERY_001",
    title: "Morning Color · Test Lipstick CF",
    shortTitle: "Morning Lipstick",
    status: "final",
    duration: "8s",
    memberCodes: ["M07"],
    productLane: "Beauty / test lipstick CF",
    objective: "Harness sample · portfolio study",
    memoryLine: "One chosen color starts the day.",
    story:
      "A short morning cosmetic study with Rena: water, light, product motion, and a quiet lip finish. Framed as a Loom production-harness sample rather than a finished brand film.",
    viewerRead:
      "One color choice can feel like the start of the day — visible from object to face.",
    proof: [
      "Bare-foot water open",
      "Curtain cold light",
      "Shadow-driven product roll",
      "Profile apply and frontal hold"
    ],
    locks: [
      "Spec concept, not an official brand campaign",
      "Rena (M07) cast lock",
      "Sound-off master v15",
      "No logo, efficacy, price, or retailer claim"
    ],
    image: "/assets/cf/cosmetic-morning-luma/rena-profile-apply-side.webp",
    videoUrl: "https://youtube.com/shorts/rxwn61IROQc?si=Kz4np2epgWft57Tb",
    videoEmbedUrl: youtubeEmbedUrl("rxwn61IROQc", "playsinline=1&rel=0"),
    videoPlatform: "youtube_shorts"
  },
  {
    id: "CF_COCA_COLA_WORLD_RULE_ENGINE_001",
    title: "Coca-Cola World Rule Engine",
    shortTitle: "Coca-Cola Memory",
    status: "final",
    duration: "18s",
    memberCodes: ["M12"],
    productLane: "Beverage / spec commercial",
    objective: "Portfolio showcase",
    memoryLine: "A cola that brings back a memory.",
    story:
      "A small spec concept experiment about a cola that brings back a memory. Seira lies on a glass Coca-Cola vending machine laid flat across wet pavement. As the camera moves toward her glasses, the soft red cola light catches in her eyes and opens into floating memory cards.",
    viewerRead:
      "The idea is simple: one familiar red glow from a cola can turns the city around her into a place where memories return.",
    proof: [
      "Horizontal glass vending machine",
      "Coca-Cola can and red button system",
      "Soft red glasses glint",
      "Memory-card world expansion"
    ],
    locks: [
      "Spec commercial, not an official brand claim",
      "Seira cast lock",
      "Black/red/cyan grade",
      "No mixed preview versions"
    ],
    image: "/assets/cf/coca-cola-world-rule-engine/poster-final-frame.jpg",
    videoUrl: "https://www.instagram.com/reel/DakEtMMpycX/",
    videoEmbedUrl: "https://www.instagram.com/reel/DakEtMMpycX/embed",
    videoPlatform: "instagram_reels"
  },
  {
    id: "CF_FARE_GATE_STYLE_LOOP_001",
    title: "Fare-Gate Barcode Loop",
    shortTitle: "Fare-Gate Loop",
    status: "founder_review",
    duration: "24s",
    memberCodes: ["M09"],
    productLane: "Fashion / AI ad",
    objective: "Brand lift",
    memoryLine: "개찰구 안쪽, 숨겨진 스타일 루프가 열린다.",
    story:
      "Aria inserts an orange barcode ticket, enters a hidden fare-gate fashion world, triggers an outfit switch, and exits transformed.",
    viewerRead:
      "The whole transformation should feel like it happened inside the subway gate system.",
    proof: ["Orange barcode ticket", "Muted barcode threshold", "Black/orange train interior", "Outfit switch"],
    locks: ["Start and end at the fare gate", "No fake transit partnership", "Barcode bite reads as a fashion-tag hold"],
    image: getMemberAssets("M09").characterBoard
  },
  {
    id: "CF_SAEYAN_PRISM_TINT_001",
    title: "Prism Tint: First Signal",
    shortTitle: "Prism Tint",
    status: "founder_review",
    duration: "24s",
    memberCodes: ["M01"],
    productLane: "Beauty / fictional tint",
    objective: "Portfolio showcase",
    memoryLine: "The first signal turns into color.",
    story:
      "Saeyan turns one fictional tint swipe into a glass-light color bloom, then carries it into her first-signal identity.",
    viewerRead:
      "This must read as a product-led K-beauty tint moment, not just styling or a portrait.",
    proof: ["Applicator before swipe", "One-swipe color bloom", "Visible glass finish", "Clean product-memory packshot"],
    locks: ["No real brand logo or packshot", "Tasteful beauty close-up", "Product action before performance"],
    image: getMemberAssets("M01").characterBoard
  },
  {
    id: "CF_ARIA_SPARK_DRINK_001",
    title: "Spark Drink: Catch The Hook",
    shortTitle: "Spark Drink",
    status: "founder_review",
    duration: "25s",
    memberCodes: ["M09"],
    productLane: "Beverage / fictional refreshment",
    objective: "Portfolio showcase",
    memoryLine: "The first spark turns into a hook.",
    story:
      "Aria cracks a fictional cold can, proves refreshment with fizz and one sip, then turns the sound into a brass hook step.",
    viewerRead:
      "The drink should trigger Aria's hook energy while staying refreshment-led, not health or energy-claim led.",
    proof: ["Can crack in first 2s", "Condensation and fizz", "One sip", "Can remains visible through the hook"],
    locks: ["No real soda or energy brand resemblance", "No health or caffeine claim", "Product stays in final frame"],
    image: getMemberAssets("M09").profile
  }
];
