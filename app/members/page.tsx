import { MembersArchivePage } from "../../components/ArchiveSectionPages";
import { normalizeMemberCode } from "../../data/members";

type MembersPageProps = {
  searchParams?: Promise<{
    member?: string | string[];
  }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const memberParam = Array.isArray(params?.member) ? params?.member[0] : params?.member;

  return <MembersArchivePage initialCode={normalizeMemberCode(memberParam)} />;
}
