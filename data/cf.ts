import type { MemberCode } from "./members";

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
  instagramUrl?: string;
  instagramEmbedUrl?: string;
};

export const cfCampaigns: CfCampaign[] = [
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
    instagramUrl: "https://www.instagram.com/reel/DakEtMMpycX/",
    instagramEmbedUrl: "https://www.instagram.com/reel/DakEtMMpycX/embed"
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
    image: "/assets/members/M09/character-board.webp"
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
    image: "/assets/members/M01/character-board.webp"
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
    image: "/assets/members/M09/profile.webp"
  }
];
