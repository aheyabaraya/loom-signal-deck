import { MemberProfilePage } from "../../../components/MemberProfilePage";
import { memberArchives } from "../../../data/media";
import { getMember, members, normalizeMemberCode } from "../../../data/members";

export function generateStaticParams() {
  return members.map((member) => ({ code: member.code.toLowerCase() }));
}

export default async function MemberPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const memberCode = normalizeMemberCode(code);
  const member = getMember(memberCode);
  const archive = memberArchives.find((item) => item.memberCode === memberCode);

  return <MemberProfilePage archive={archive} member={member} />;
}
