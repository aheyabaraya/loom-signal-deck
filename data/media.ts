import { getMemberAssets, type MemberCode } from "./memberAssets";
import { members } from "./members";
import { getMemberTrackAssetsForMember, stageCuts, type StageCut } from "./memberTrackAssets";

export { stageCuts, type StageCut } from "./memberTrackAssets";

export type MemberBoard = {
  id: string;
  memberCode: MemberCode;
  title: string;
  subtitle: string;
  image: string;
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

export const memberBoards: MemberBoard[] = members.map((member) => ({
  id: `${member.code}-board`,
  memberCode: member.code,
  title: `${member.code} ${member.name}`,
  subtitle: "Character board",
  image: getMemberAssets(member.code).characterBoard
}));

export const memberArchives: MemberArchive[] = members.map((member) => ({
  memberCode: member.code,
  name: member.name,
  profile: member.image,
  board: getMemberAssets(member.code).characterBoard,
  stageCuts: getMemberTrackAssetsForMember(member.code)
}));
