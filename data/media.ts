import type { MemberCode } from "./members";

export type MemberBoard = {
  id: string;
  memberCode: MemberCode;
  title: string;
  subtitle: string;
  image: string;
};

export type StageCut = {
  id: string;
  memberCode?: MemberCode;
  memberCodes: MemberCode[];
  title: string;
  subtitle: string;
  image: string;
  sourceType: "solo" | "duo";
};

export type MemberArchive = {
  memberCode: MemberCode;
  name: string;
  profile: string;
  board: string;
  stageCuts: StageCut[];
};

export const storyboardImages = [
  "/assets/tracks/code-root-signal/storyboards/storyboard-1.webp",
  "/assets/tracks/code-root-signal/storyboards/storyboard-2.webp",
  "/assets/tracks/code-root-signal/storyboards/storyboard-3.webp",
  "/assets/tracks/code-root-signal/storyboards/storyboard-4.webp"
] as const;

export const memberBoards: MemberBoard[] = [
  {
    "id": "M01-board",
    "memberCode": "M01",
    "title": "M01 Saeyan",
    "subtitle": "Character board",
    "image": "/assets/members/M01/character-board.webp"
  },
  {
    "id": "M02-board",
    "memberCode": "M02",
    "title": "M02 Seorin",
    "subtitle": "Character board",
    "image": "/assets/members/M02/character-board.webp"
  },
  {
    "id": "M03-board",
    "memberCode": "M03",
    "title": "M03 Yeul",
    "subtitle": "Character board",
    "image": "/assets/members/M03/character-board.webp"
  },
  {
    "id": "M04-board",
    "memberCode": "M04",
    "title": "M04 Lua",
    "subtitle": "Character board",
    "image": "/assets/members/M04/character-board.webp"
  },
  {
    "id": "M05-board",
    "memberCode": "M05",
    "title": "M05 Faye",
    "subtitle": "Character board",
    "image": "/assets/members/M05/character-board.webp"
  },
  {
    "id": "M06-board",
    "memberCode": "M06",
    "title": "M06 Eryn",
    "subtitle": "Character board",
    "image": "/assets/members/M06/character-board.webp"
  },
  {
    "id": "M07-board",
    "memberCode": "M07",
    "title": "M07 Rena",
    "subtitle": "Character board",
    "image": "/assets/members/M07/character-board.webp"
  },
  {
    "id": "M08-board",
    "memberCode": "M08",
    "title": "M08 Natsu",
    "subtitle": "Character board",
    "image": "/assets/members/M08/character-board.webp"
  },
  {
    "id": "M09-board",
    "memberCode": "M09",
    "title": "M09 Aria",
    "subtitle": "Character board",
    "image": "/assets/members/M09/character-board.webp"
  },
  {
    "id": "M10-board",
    "memberCode": "M10",
    "title": "M10 Karin",
    "subtitle": "Character board",
    "image": "/assets/members/M10/character-board.webp"
  },
  {
    "id": "M11-board",
    "memberCode": "M11",
    "title": "M11 Yuzu",
    "subtitle": "Character board",
    "image": "/assets/members/M11/character-board.webp"
  },
  {
    "id": "M12-board",
    "memberCode": "M12",
    "title": "M12 Seira",
    "subtitle": "Character board",
    "image": "/assets/members/M12/character-board.webp"
  },
  {
    "id": "M13-board",
    "memberCode": "M13",
    "title": "M13 Shion",
    "subtitle": "Character board",
    "image": "/assets/members/M13/character-board.webp"
  }
];

export const stageCuts: StageCut[] = [
  {
    "id": "stage-01",
    "memberCode": "M01",
    "memberCodes": [
      "M01"
    ],
    "title": "M01",
    "subtitle": "R01 0-00-0-06 M01",
    "image": "/assets/members/M01/albums/code-root-signal/loom-full-code-root-signal/images/01-r01-0-00-0-06-m01.webp",
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
    "image": "/assets/members/M01/albums/code-root-signal/loom-full-code-root-signal/images/02-r22-m01-2-33-2-39-solo-backdancers.webp",
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
    "image": "/assets/members/M02/albums/code-root-signal/loom-full-code-root-signal/images/03-r02-0-06-0-14-m02.webp",
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
    "image": "/assets/members/M02/albums/code-root-signal/loom-full-code-root-signal/images/04-r19a-m02-12s-insert-solo-backdancers.webp",
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
    "image": "/assets/members/M03/albums/code-root-signal/loom-full-code-root-signal/images/05-r03-0-14-0-24-m03.webp",
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
    "image": "/assets/members/M03/albums/code-root-signal/loom-full-code-root-signal/images/06-r12-1-17-1-22-m03.webp",
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
    "image": "/assets/members/M03/albums/code-root-signal/loom-full-code-root-signal/images/07-r19a-m03-12s-insert-solo-backdancers.webp",
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
    "image": "/assets/members/M04/albums/code-root-signal/loom-full-code-root-signal/images/08-r04-0-24-0-32-m04.webp",
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
    "image": "/assets/members/M04/albums/code-root-signal/loom-full-code-root-signal/images/09-r19b-m04-12s-insert-solo-backdancers.webp",
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
    "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/10-r05-0-32-0-40-m05.webp",
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
    "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/11-r10b-1-06-1-12-m05-solo-backdancers.webp",
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
    "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/12-r16-1-39-1-42-m05.webp",
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
    "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/13-r23-m05-2-39-2-44-solo-backdancers.webp",
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
    "image": "/assets/members/M06/albums/code-root-signal/loom-full-code-root-signal/images/14-r06-0-40-0-48-m06.webp",
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
    "image": "/assets/members/M06/albums/code-root-signal/loom-full-code-root-signal/images/15-r06-remake-0-40-0-48-m06-prechorus-axis.webp",
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
    "image": "/assets/members/M06/albums/code-root-signal/loom-full-code-root-signal/images/16-r19b-m06-12s-insert-solo-backdancers.webp",
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
    "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/17-r07-0-48-0-53-m07.webp",
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
    "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/18-r10a-1-06-1-12-m07-solo-backdancers.webp",
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
    "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/19-r20-m07-2-12-2-22-solo-backdancers.webp",
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
    "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/20-r22-m07-2-33-2-39-solo-backdancers.webp",
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
    "image": "/assets/members/M08/albums/code-root-signal/loom-full-code-root-signal/images/21-r09a-0-58-1-06-m08-solo-backdancers.webp",
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
    "image": "/assets/members/M08/albums/code-root-signal/loom-full-code-root-signal/images/22-r18-m08-1-48-2-00-solo-backdancers.webp",
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
    "image": "/assets/members/M08/albums/code-root-signal/loom-full-code-root-signal/images/23-r21-m08-2-22-2-33-solo-backdancers.webp",
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
    "image": "/assets/members/M09/albums/code-root-signal/loom-full-code-root-signal/images/24-r08-0-53-0-58-m09.webp",
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
    "image": "/assets/members/M09/albums/code-root-signal/loom-full-code-root-signal/images/25-r09b-0-58-1-06-m09-solo-backdancers.webp",
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
    "image": "/assets/members/M09/albums/code-root-signal/loom-full-code-root-signal/images/26-r20-m09-2-12-2-22-solo-backdancers.webp",
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
    "image": "/assets/members/M10/albums/code-root-signal/loom-full-code-root-signal/images/27-r11-1-12-1-17-m10.webp",
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
    "image": "/assets/members/M10/albums/code-root-signal/loom-full-code-root-signal/images/28-r18-m10-1-48-2-00-solo-backdancers.webp",
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
    "image": "/assets/members/M11/albums/code-root-signal/loom-full-code-root-signal/images/29-r15-1-33-1-39-m11.webp",
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
    "image": "/assets/members/M11/albums/code-root-signal/loom-full-code-root-signal/images/30-r17-1-42-1-48-m11.webp",
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
    "image": "/assets/members/M11/albums/code-root-signal/loom-full-code-root-signal/images/31-r19-m11-2-00-2-12-solo-backdancers.webp",
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
    "image": "/assets/members/M12/albums/code-root-signal/loom-full-code-root-signal/images/32-r14-1-28-1-33-m12.webp",
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
    "image": "/assets/members/M12/albums/code-root-signal/loom-full-code-root-signal/images/33-r21-m12-2-22-2-33-solo-backdancers.webp",
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
    "image": "/assets/members/M13/albums/code-root-signal/loom-full-code-root-signal/images/34-r13-1-22-1-28-m13.webp",
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
    "image": "/assets/members/M13/albums/code-root-signal/loom-full-code-root-signal/images/35-r19-m13-2-00-2-12-solo-backdancers.webp",
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
    "image": "/assets/members/M13/albums/code-root-signal/loom-full-code-root-signal/images/36-r23-m13-2-39-2-44-solo-backdancers.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M01_M07/images/37-r22-2-33-2-39-m01-m07.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M02_M03/images/38-r19a-12s-insert-m02-m03.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M04_M06/images/39-r19b-12s-insert-m04-m06.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M05_M07/images/40-r10-1-06-1-12-m07-m05.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M05_M13/images/41-r23-2-39-2-44-m05-m13.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M07_M09/images/42-r20-2-12-2-22-m07-m09.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M09/images/43-r09-0-58-1-06-m08-m09.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M10/images/44-r18-1-48-2-00-m08-m10.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M12/images/45-r21-2-22-2-33-m08-m12.webp",
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
    "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M11_M13/images/46-r19-2-00-2-12-m11-m13.webp",
    "sourceType": "duo"
  }
];

export const memberArchives: MemberArchive[] = [
  {
    "memberCode": "M01",
    "name": "Saeyan",
    "profile": "/assets/members/M01/profile.webp",
    "board": "/assets/members/M01/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-01",
        "memberCode": "M01",
        "memberCodes": [
          "M01"
        ],
        "title": "M01",
        "subtitle": "R01 0-00-0-06 M01",
        "image": "/assets/members/M01/albums/code-root-signal/loom-full-code-root-signal/images/01-r01-0-00-0-06-m01.webp",
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
        "image": "/assets/members/M01/albums/code-root-signal/loom-full-code-root-signal/images/02-r22-m01-2-33-2-39-solo-backdancers.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M01_M07/images/37-r22-2-33-2-39-m01-m07.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M02",
    "name": "Seorin",
    "profile": "/assets/members/M02/profile.webp",
    "board": "/assets/members/M02/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-03",
        "memberCode": "M02",
        "memberCodes": [
          "M02"
        ],
        "title": "M02",
        "subtitle": "R02 0-06-0-14 M02",
        "image": "/assets/members/M02/albums/code-root-signal/loom-full-code-root-signal/images/03-r02-0-06-0-14-m02.webp",
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
        "image": "/assets/members/M02/albums/code-root-signal/loom-full-code-root-signal/images/04-r19a-m02-12s-insert-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M02_M03/images/38-r19a-12s-insert-m02-m03.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M03",
    "name": "Yeul",
    "profile": "/assets/members/M03/profile.webp",
    "board": "/assets/members/M03/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-05",
        "memberCode": "M03",
        "memberCodes": [
          "M03"
        ],
        "title": "M03",
        "subtitle": "R03 0-14-0-24 M03",
        "image": "/assets/members/M03/albums/code-root-signal/loom-full-code-root-signal/images/05-r03-0-14-0-24-m03.webp",
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
        "image": "/assets/members/M03/albums/code-root-signal/loom-full-code-root-signal/images/06-r12-1-17-1-22-m03.webp",
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
        "image": "/assets/members/M03/albums/code-root-signal/loom-full-code-root-signal/images/07-r19a-m03-12s-insert-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M02_M03/images/38-r19a-12s-insert-m02-m03.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M04",
    "name": "Lua",
    "profile": "/assets/members/M04/profile.webp",
    "board": "/assets/members/M04/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-08",
        "memberCode": "M04",
        "memberCodes": [
          "M04"
        ],
        "title": "M04",
        "subtitle": "R04 0-24-0-32 M04",
        "image": "/assets/members/M04/albums/code-root-signal/loom-full-code-root-signal/images/08-r04-0-24-0-32-m04.webp",
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
        "image": "/assets/members/M04/albums/code-root-signal/loom-full-code-root-signal/images/09-r19b-m04-12s-insert-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M04_M06/images/39-r19b-12s-insert-m04-m06.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M05",
    "name": "Faye",
    "profile": "/assets/members/M05/profile.webp",
    "board": "/assets/members/M05/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-10",
        "memberCode": "M05",
        "memberCodes": [
          "M05"
        ],
        "title": "M05",
        "subtitle": "R05 0-32-0-40 M05",
        "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/10-r05-0-32-0-40-m05.webp",
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
        "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/11-r10b-1-06-1-12-m05-solo-backdancers.webp",
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
        "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/12-r16-1-39-1-42-m05.webp",
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
        "image": "/assets/members/M05/albums/code-root-signal/loom-full-code-root-signal/images/13-r23-m05-2-39-2-44-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M05_M07/images/40-r10-1-06-1-12-m07-m05.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M05_M13/images/41-r23-2-39-2-44-m05-m13.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M06",
    "name": "Eryn",
    "profile": "/assets/members/M06/profile.webp",
    "board": "/assets/members/M06/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-14",
        "memberCode": "M06",
        "memberCodes": [
          "M06"
        ],
        "title": "M06",
        "subtitle": "R06 0-40-0-48 M06",
        "image": "/assets/members/M06/albums/code-root-signal/loom-full-code-root-signal/images/14-r06-0-40-0-48-m06.webp",
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
        "image": "/assets/members/M06/albums/code-root-signal/loom-full-code-root-signal/images/15-r06-remake-0-40-0-48-m06-prechorus-axis.webp",
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
        "image": "/assets/members/M06/albums/code-root-signal/loom-full-code-root-signal/images/16-r19b-m06-12s-insert-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M04_M06/images/39-r19b-12s-insert-m04-m06.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M07",
    "name": "Rena",
    "profile": "/assets/members/M07/profile.webp",
    "board": "/assets/members/M07/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-17",
        "memberCode": "M07",
        "memberCodes": [
          "M07"
        ],
        "title": "M07",
        "subtitle": "R07 0-48-0-53 M07",
        "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/17-r07-0-48-0-53-m07.webp",
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
        "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/18-r10a-1-06-1-12-m07-solo-backdancers.webp",
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
        "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/19-r20-m07-2-12-2-22-solo-backdancers.webp",
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
        "image": "/assets/members/M07/albums/code-root-signal/loom-full-code-root-signal/images/20-r22-m07-2-33-2-39-solo-backdancers.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M01_M07/images/37-r22-2-33-2-39-m01-m07.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M05_M07/images/40-r10-1-06-1-12-m07-m05.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M07_M09/images/42-r20-2-12-2-22-m07-m09.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M08",
    "name": "Natsu",
    "profile": "/assets/members/M08/profile.webp",
    "board": "/assets/members/M08/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-21",
        "memberCode": "M08",
        "memberCodes": [
          "M08"
        ],
        "title": "M08",
        "subtitle": "R09A 0-58-1-06 M08",
        "image": "/assets/members/M08/albums/code-root-signal/loom-full-code-root-signal/images/21-r09a-0-58-1-06-m08-solo-backdancers.webp",
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
        "image": "/assets/members/M08/albums/code-root-signal/loom-full-code-root-signal/images/22-r18-m08-1-48-2-00-solo-backdancers.webp",
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
        "image": "/assets/members/M08/albums/code-root-signal/loom-full-code-root-signal/images/23-r21-m08-2-22-2-33-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M09/images/43-r09-0-58-1-06-m08-m09.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M10/images/44-r18-1-48-2-00-m08-m10.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M12/images/45-r21-2-22-2-33-m08-m12.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M09",
    "name": "Aria",
    "profile": "/assets/members/M09/profile.webp",
    "board": "/assets/members/M09/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-24",
        "memberCode": "M09",
        "memberCodes": [
          "M09"
        ],
        "title": "M09",
        "subtitle": "R08 0-53-0-58 M09",
        "image": "/assets/members/M09/albums/code-root-signal/loom-full-code-root-signal/images/24-r08-0-53-0-58-m09.webp",
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
        "image": "/assets/members/M09/albums/code-root-signal/loom-full-code-root-signal/images/25-r09b-0-58-1-06-m09-solo-backdancers.webp",
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
        "image": "/assets/members/M09/albums/code-root-signal/loom-full-code-root-signal/images/26-r20-m09-2-12-2-22-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M07_M09/images/42-r20-2-12-2-22-m07-m09.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M09/images/43-r09-0-58-1-06-m08-m09.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M10",
    "name": "Karin",
    "profile": "/assets/members/M10/profile.webp",
    "board": "/assets/members/M10/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-27",
        "memberCode": "M10",
        "memberCodes": [
          "M10"
        ],
        "title": "M10",
        "subtitle": "R11 1-12-1-17 M10",
        "image": "/assets/members/M10/albums/code-root-signal/loom-full-code-root-signal/images/27-r11-1-12-1-17-m10.webp",
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
        "image": "/assets/members/M10/albums/code-root-signal/loom-full-code-root-signal/images/28-r18-m10-1-48-2-00-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M10/images/44-r18-1-48-2-00-m08-m10.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M11",
    "name": "Yuzu",
    "profile": "/assets/members/M11/profile.webp",
    "board": "/assets/members/M11/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-29",
        "memberCode": "M11",
        "memberCodes": [
          "M11"
        ],
        "title": "M11",
        "subtitle": "R15 1-33-1-39 M11",
        "image": "/assets/members/M11/albums/code-root-signal/loom-full-code-root-signal/images/29-r15-1-33-1-39-m11.webp",
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
        "image": "/assets/members/M11/albums/code-root-signal/loom-full-code-root-signal/images/30-r17-1-42-1-48-m11.webp",
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
        "image": "/assets/members/M11/albums/code-root-signal/loom-full-code-root-signal/images/31-r19-m11-2-00-2-12-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M11_M13/images/46-r19-2-00-2-12-m11-m13.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M12",
    "name": "Seira",
    "profile": "/assets/members/M12/profile.webp",
    "board": "/assets/members/M12/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-32",
        "memberCode": "M12",
        "memberCodes": [
          "M12"
        ],
        "title": "M12",
        "subtitle": "R14 1-28-1-33 M12",
        "image": "/assets/members/M12/albums/code-root-signal/loom-full-code-root-signal/images/32-r14-1-28-1-33-m12.webp",
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
        "image": "/assets/members/M12/albums/code-root-signal/loom-full-code-root-signal/images/33-r21-m12-2-22-2-33-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M08_M12/images/45-r21-2-22-2-33-m08-m12.webp",
        "sourceType": "duo"
      }
    ]
  },
  {
    "memberCode": "M13",
    "name": "Shion",
    "profile": "/assets/members/M13/profile.webp",
    "board": "/assets/members/M13/character-board.webp",
    "stageCuts": [
      {
        "id": "stage-34",
        "memberCode": "M13",
        "memberCodes": [
          "M13"
        ],
        "title": "M13",
        "subtitle": "R13 1-22-1-28 M13",
        "image": "/assets/members/M13/albums/code-root-signal/loom-full-code-root-signal/images/34-r13-1-22-1-28-m13.webp",
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
        "image": "/assets/members/M13/albums/code-root-signal/loom-full-code-root-signal/images/35-r19-m13-2-00-2-12-solo-backdancers.webp",
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
        "image": "/assets/members/M13/albums/code-root-signal/loom-full-code-root-signal/images/36-r23-m13-2-39-2-44-solo-backdancers.webp",
        "sourceType": "solo"
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M05_M13/images/41-r23-2-39-2-44-m05-m13.webp",
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
        "image": "/assets/members/duos/albums/code-root-signal/loom-full-code-root-signal/M11_M13/images/46-r19-2-00-2-12-m11-m13.webp",
        "sourceType": "duo"
      }
    ]
  }
];
