import { memberArchives, storyboardImages } from "./media";
import type { MemberCode } from "./members";
import { rootSignalTrack } from "./tracks";

export type MemberMediaCue = {
  memberCode: MemberCode;
  trackId: string;
  video: {
    embedUrl: string;
    label: string;
    youtubeId: string;
  };
  profileImage: string;
  boardImage: string;
  storyboardImages: readonly string[];
  stageCutIds: string[];
};

export const rootSignalMemberMediaCues: MemberMediaCue[] = memberArchives.map((archive) => ({
  memberCode: archive.memberCode,
  trackId: rootSignalTrack.id,
  video: {
    embedUrl: rootSignalTrack.embedUrl,
    label: rootSignalTrack.displayTitle,
    youtubeId: rootSignalTrack.youtubeId
  },
  profileImage: archive.profile,
  boardImage: archive.board,
  storyboardImages,
  stageCutIds: archive.stageCuts.map((cut) => cut.id)
}));

export const mediaExperience = {
  defaultTrackId: rootSignalTrack.id,
  memberCues: rootSignalMemberMediaCues,
  track: rootSignalTrack
};

export function getMemberMediaCue(memberCode: MemberCode) {
  return rootSignalMemberMediaCues.find((cue) => cue.memberCode === memberCode);
}
