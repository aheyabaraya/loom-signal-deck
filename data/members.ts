export type MemberCode =
  | "M01"
  | "M02"
  | "M03"
  | "M04"
  | "M05"
  | "M06"
  | "M07"
  | "M08"
  | "M09"
  | "M10"
  | "M11"
  | "M12"
  | "M13";

export type VoteOption = {
  id: string;
  label: string;
  dimension: string;
  detail: string;
  signal: string;
};

export type Member = {
  code: MemberCode;
  name: string;
  word: string;
  identity: string;
  accent: string;
  position: {
    x: number;
    y: number;
  };
  role: string;
  image: string;
  votePrompt: string;
  voteOptions: VoteOption[];
};

export const defaultMemberCode: MemberCode = "M12";

export const members: Member[] = [
  {
    code: "M01",
    name: "Saeyan",
    word: "Prism",
    identity: "First Signal",
    accent: "#7cc7d8",
    position: { x: 50, y: 30 },
    role: "Loom's first signal.",
    image: "/assets/members/M01/profile.webp",
    votePrompt: "Which thread does Saeyan open first?",
    voteOptions: [
      {
        id: "prism_signal",
        label: "Prism Signal",
        dimension: "First visible cue",
        detail: "Saeyan opens the frame with clean light, direct gaze, and the first stage cue.",
        signal: "Harne felt Saeyan as the member who turns the first signal on."
      },
      {
        id: "rain_glass_memory",
        label: "Rain-Glass Memory",
        dimension: "Soft recall",
        detail: "Her identity expands through reflective glass, water trails, and a memory-like entrance.",
        signal: "Harne felt Saeyan as the member who leaves the clearest afterimage."
      },
      {
        id: "first_light_hook",
        label: "First Light Hook",
        dimension: "Opening hook",
        detail: "She becomes the first hook point: a bright motion that pulls the group into view.",
        signal: "Harne felt Saeyan as the member who catches the song before anyone else."
      }
    ]
  },
  {
    code: "M02",
    name: "Seorin",
    word: "Oracle",
    identity: "Mirror Guide",
    accent: "#d8dce2",
    position: { x: 36, y: 12 },
    role: "Reads the stage through precision.",
    image: "/assets/members/M02/profile.webp",
    votePrompt: "What does Seorin's mirror line reveal?",
    voteOptions: [
      {
        id: "oracle_mirror",
        label: "Oracle Mirror",
        dimension: "Read the room",
        detail: "Seorin expands as the member who sees the hidden stage line before it moves.",
        signal: "Harne felt Seorin as the mirror that reads the next direction."
      },
      {
        id: "quiet_guide",
        label: "Quiet Guide",
        dimension: "Calm direction",
        detail: "Her identity grows through small looks, hand cues, and low-volume control.",
        signal: "Harne felt Seorin as the member who guides without raising her voice."
      },
      {
        id: "precision_line",
        label: "Precision Line",
        dimension: "Exact shape",
        detail: "She sharpens the group through exact posture, clean timing, and controlled spacing.",
        signal: "Harne felt Seorin as the member who makes the formation accurate."
      }
    ]
  },
  {
    code: "M03",
    name: "Yeul",
    word: "Tide",
    identity: "Cobalt Balance",
    accent: "#2f7fc2",
    position: { x: 64, y: 12 },
    role: "Anchors rhythm and balance.",
    image: "/assets/members/M03/profile.webp",
    votePrompt: "Where does Yeul's rhythm settle?",
    voteOptions: [
      {
        id: "tide_balance",
        label: "Tide Balance",
        dimension: "Flow control",
        detail: "Yeul expands through wave-like weight shifts and a rhythm that steadies the stage.",
        signal: "Harne felt Yeul as the member who keeps the motion balanced."
      },
      {
        id: "cobalt_groove",
        label: "Cobalt Groove",
        dimension: "Cool rhythm",
        detail: "Her identity leans into blue-toned movement, grounded steps, and clean pulse.",
        signal: "Harne felt Yeul as the member who makes the groove feel cool and exact."
      },
      {
        id: "clean_anchor",
        label: "Clean Anchor",
        dimension: "Formation base",
        detail: "She becomes the member who lands the center weight so everyone else can move.",
        signal: "Harne felt Yeul as the anchor that keeps the group readable."
      }
    ]
  },
  {
    code: "M04",
    name: "Lua",
    word: "Moon",
    identity: "Lunar Mood",
    accent: "#b7a0cf",
    position: { x: 15, y: 30 },
    role: "Turns the stage into emotion.",
    image: "/assets/members/M04/profile.webp",
    votePrompt: "What moonlit feeling does Lua leave?",
    voteOptions: [
      {
        id: "lunar_bridge",
        label: "Lunar Bridge",
        dimension: "Emotional crossing",
        detail: "Lua expands as the bridge between quiet feeling and visible movement.",
        signal: "Harne felt Lua as the member who carries the song across the softest moment."
      },
      {
        id: "moonlit_mood",
        label: "Moonlit Mood",
        dimension: "Night atmosphere",
        detail: "Her identity grows through silver light, lowered gaze, and a stage that feels hushed.",
        signal: "Harne felt Lua as the member who changes the air around the performance."
      },
      {
        id: "fragile_lift",
        label: "Fragile Lift",
        dimension: "Delicate rise",
        detail: "She lifts emotion with small shoulder, wrist, and head movements that stay controlled.",
        signal: "Harne felt Lua as the member who makes a small motion feel important."
      }
    ]
  },
  {
    code: "M05",
    name: "Faye",
    word: "Pearl",
    identity: "Pearl Lift",
    accent: "#e7dcc4",
    position: { x: 30, y: 50 },
    role: "Lifts the chorus into clarity.",
    image: "/assets/members/M05/profile.webp",
    votePrompt: "What does Faye lift into the room?",
    voteOptions: [
      {
        id: "pearl_lift",
        label: "Pearl Lift",
        dimension: "Chorus rise",
        detail: "Faye expands as the member who lifts the chorus with bright face and open posture.",
        signal: "Harne felt Faye as the member who makes the hook rise cleanly."
      },
      {
        id: "clear_vocal_core",
        label: "Clear Vocal Core",
        dimension: "Voice center",
        detail: "Her identity grows around clarity: direct delivery, steady breath, and a centered frame.",
        signal: "Harne felt Faye as the clear voice at the center of the stage."
      },
      {
        id: "water_chamber_light",
        label: "Water Chamber Light",
        dimension: "Reflective space",
        detail: "She pulls pearl light, water reflection, and soft brightness into the performance.",
        signal: "Harne felt Faye as the member who turns the room translucent."
      }
    ]
  },
  {
    code: "M06",
    name: "Eryn",
    word: "Edge",
    identity: "Gunmetal Edge",
    accent: "#aeb4bd",
    position: { x: 10, y: 57 },
    role: "Cuts the formation with command.",
    image: "/assets/members/M06/profile.webp",
    votePrompt: "What edge does Eryn cut?",
    voteOptions: [
      {
        id: "gunmetal_edge",
        label: "Gunmetal Edge",
        dimension: "Sharp contrast",
        detail: "Eryn expands through dark metal styling, angled shoulders, and clean impact stops.",
        signal: "Harne felt Eryn as the member who gives the group its edge."
      },
      {
        id: "chevron_command",
        label: "Chevron Command",
        dimension: "Directional force",
        detail: "Her identity grows through arrow-like formations and decisive body turns.",
        signal: "Harne felt Eryn as the member who points the formation forward."
      },
      {
        id: "tactical_precision",
        label: "Tactical Precision",
        dimension: "Controlled strike",
        detail: "She reads as exact, compact, and ready: every hit lands with a clear endpoint.",
        signal: "Harne felt Eryn as the member whose control makes the impact believable."
      }
    ]
  },
  {
    code: "M07",
    name: "Rena",
    word: "Command",
    identity: "Ivory Command",
    accent: "#eadfc8",
    position: { x: 50, y: 70 },
    role: "Holds the vertical axis.",
    image: "/assets/members/M07/profile.webp",
    votePrompt: "What axis does Rena command?",
    voteOptions: [
      {
        id: "command_axis",
        label: "Command Axis",
        dimension: "Leader line",
        detail: "Rena expands as the member who holds the vertical line and makes the stage obey.",
        signal: "Harne felt Rena as the axis the group can rotate around."
      },
      {
        id: "runway_leader",
        label: "Runway Leader",
        dimension: "Forward walk",
        detail: "Her identity grows through runway pacing, chin control, and decisive entrance steps.",
        signal: "Harne felt Rena as the member who can lead a stage with one walk."
      },
      {
        id: "ivory_crest",
        label: "Ivory Crest",
        dimension: "High mark",
        detail: "She becomes the clean crest of the frame: bright styling, tall posture, and command.",
        signal: "Harne felt Rena as the member who leaves the highest mark."
      }
    ]
  },
  {
    code: "M08",
    name: "Natsu",
    word: "Veil",
    identity: "Obsidian Counter",
    accent: "#7e8897",
    position: { x: 24, y: 81 },
    role: "Pulls focus through shadow.",
    image: "/assets/members/M08/profile.webp",
    votePrompt: "What hides inside Natsu's veil?",
    voteOptions: [
      {
        id: "obsidian_veil",
        label: "Obsidian Veil",
        dimension: "Hidden focus",
        detail: "Natsu expands through dark backlight, partial cover, and a reveal that stays controlled.",
        signal: "Harne felt Natsu as the member who makes shadow feel intentional."
      },
      {
        id: "smoky_counter",
        label: "Smoky Counter",
        dimension: "Counter-move",
        detail: "Her identity grows when she moves against the obvious beat and pulls attention sideways.",
        signal: "Harne felt Natsu as the member who changes the rhythm from the side."
      },
      {
        id: "gaze_through_shadow",
        label: "Gaze Through Shadow",
        dimension: "Eye contact",
        detail: "She holds the camera through low light, hidden angles, and a slow-returning gaze.",
        signal: "Harne felt Natsu as the member whose eyes cut through the dark."
      }
    ]
  },
  {
    code: "M09",
    name: "Aria",
    word: "Spark",
    identity: "Brass Spark",
    accent: "#c6a15b",
    position: { x: 70, y: 50 },
    role: "Drives the hook forward.",
    image: "/assets/members/M09/profile.webp",
    votePrompt: "What hook does Aria spark first?",
    voteOptions: [
      {
        id: "brass_spark",
        label: "Brass Spark",
        dimension: "Bright ignition",
        detail: "Aria expands as the member who hits the stage with brass-like shine and quick attack.",
        signal: "Harne felt Aria as the spark that makes the hook start."
      },
      {
        id: "chorus_hook",
        label: "Chorus Hook",
        dimension: "Catch point",
        detail: "Her identity grows around the move or look that makes the chorus easy to remember.",
        signal: "Harne felt Aria as the member who makes the chorus stick."
      },
      {
        id: "runway_bounce",
        label: "Runway Bounce",
        dimension: "Forward energy",
        detail: "She brings springy steps, playful force, and a moving runway feel into the group.",
        signal: "Harne felt Aria as the member who pushes the stage forward."
      }
    ]
  },
  {
    code: "M10",
    name: "Karin",
    word: "Force",
    identity: "Cobalt Force",
    accent: "#4a8bf0",
    position: { x: 76, y: 81 },
    role: "Lands the performance impact.",
    image: "/assets/members/M10/profile.webp",
    votePrompt: "What force does Karin land?",
    voteOptions: [
      {
        id: "cobalt_force",
        label: "Cobalt Force",
        dimension: "Blue impact",
        detail: "Karin expands through cool power, strong stops, and a blue-toned performance charge.",
        signal: "Harne felt Karin as the member who gives the stage force."
      },
      {
        id: "low_stance_impact",
        label: "Low Stance Impact",
        dimension: "Grounded hit",
        detail: "Her identity grows when knees sink, boots land, and the camera feels the weight.",
        signal: "Harne felt Karin as the member whose impact starts from the floor."
      },
      {
        id: "arena_power",
        label: "Arena Power",
        dimension: "Large scale",
        detail: "She reads as the member who can make a wide stage feel full with one phrase.",
        signal: "Harne felt Karin as the member built for the biggest room."
      }
    ]
  },
  {
    code: "M11",
    name: "Yuzu",
    word: "Loop",
    identity: "Harbor Loop",
    accent: "#5ec0a3",
    position: { x: 86, y: 30 },
    role: "Pulls the crowd into motion.",
    image: "/assets/members/M11/profile.webp",
    votePrompt: "What loop does Yuzu pull from the crowd?",
    voteOptions: [
      {
        id: "harbor_loop",
        label: "Harbor Loop",
        dimension: "Return motion",
        detail: "Yuzu expands through circular gestures, dock-like night space, and motion that comes back.",
        signal: "Harne felt Yuzu as the member who keeps the stage in motion."
      },
      {
        id: "crowd_pull",
        label: "Crowd Pull",
        dimension: "Fan connection",
        detail: "Her identity grows when she reaches outward and makes the viewer feel invited in.",
        signal: "Harne felt Yuzu as the member who pulls Harne into the performance."
      },
      {
        id: "midnight_bounce",
        label: "Midnight Bounce",
        dimension: "Night pulse",
        detail: "She brings late-night rhythm, springy feet, and a smile that keeps the beat alive.",
        signal: "Harne felt Yuzu as the member who makes the dark stage move."
      }
    ]
  },
  {
    code: "M12",
    name: "Seira",
    word: "Compass",
    identity: "Ash Compass",
    accent: "#b8bec6",
    position: { x: 50, y: 91 },
    role: "Turns the stage with a cool cue.",
    image: "/assets/members/M12/profile.webp",
    votePrompt: "What direction does Seira's ash compass turn?",
    voteOptions: [
      {
        id: "ash_compass",
        label: "Ash Compass",
        dimension: "Direction lock",
        detail: "Seira expands as the member who sets the route with a cool gaze and exact turn.",
        signal: "Harne felt Seira as the member who decides where the stage goes."
      },
      {
        id: "cool_cue",
        label: "Cool Cue",
        dimension: "Small trigger",
        detail: "Her identity grows through one understated cue: a look, wrist turn, or step that starts change.",
        signal: "Harne felt Seira as the member who can move the room quietly."
      },
      {
        id: "smoke_airlock",
        label: "Smoke Airlock",
        dimension: "Pressure chamber",
        detail: "She pulls smoke, metal doors, and sealed-room tension into her performance language.",
        signal: "Harne felt Seira as the member who turns calm into pressure."
      }
    ]
  },
  {
    code: "M13",
    name: "Shion",
    word: "Sigil",
    identity: "Black-Gold Sigil",
    accent: "#d6ad57",
    position: { x: 90, y: 57 },
    role: "Seals the final identity thread.",
    image: "/assets/members/M13/profile.webp",
    votePrompt: "What seal does Shion leave behind?",
    voteOptions: [
      {
        id: "black_gold_sigil",
        label: "Black-Gold Sigil",
        dimension: "Visual mark",
        detail: "Shion expands through black-gold contrast, symbolic hand lines, and a final visual stamp.",
        signal: "Harne felt Shion as the member who leaves the strongest mark."
      },
      {
        id: "final_seal",
        label: "Final Seal",
        dimension: "Ending lock",
        detail: "Her identity grows when she closes the stage with a gaze, hand endpoint, or held pose.",
        signal: "Harne felt Shion as the member who knows how to end the story."
      },
      {
        id: "thread_command",
        label: "Thread Command",
        dimension: "Identity control",
        detail: "She pulls the group threads together and makes the final frame feel intentional.",
        signal: "Harne felt Shion as the member who commands the last connection."
      }
    ]
  }
];

export const memberByCode = new Map(members.map((member) => [member.code, member]));

export function normalizeMemberCode(code: string | undefined): MemberCode {
  const normalized = code?.toUpperCase();

  return memberByCode.has(normalized as MemberCode)
    ? (normalized as MemberCode)
    : defaultMemberCode;
}

export function getMember(code: MemberCode) {
  return memberByCode.get(code) ?? memberByCode.get(defaultMemberCode)!;
}
