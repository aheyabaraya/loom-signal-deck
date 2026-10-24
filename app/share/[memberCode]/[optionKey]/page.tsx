import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareSignalActions } from "../../../../components/marketing/ShareSignalActions";
import { SiteHeader } from "../../../../components/SiteHeader";
import { members } from "../../../../data/members";

function resolveSignal(memberCode: string, optionKey: string) {
  const member = members.find((candidate) => candidate.code.toLowerCase() === memberCode.toLowerCase());
  const option = member?.voteOptions.find((candidate) => candidate.id === optionKey);
  return member && option ? { member, option } : null;
}

export function generateStaticParams() {
  return members.flatMap((member) =>
    member.voteOptions.map((option) => ({ memberCode: member.code.toLowerCase(), optionKey: option.id }))
  );
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ memberCode: string; optionKey: string }>;
}): Promise<Metadata> {
  const { memberCode, optionKey } = await params;
  const signal = resolveSignal(memberCode, optionKey);
  if (!signal) return { title: "Signal not found · Loom" };

  return {
    title: `${signal.member.name} · ${signal.option.label} · Loom`,
    description: signal.option.signal,
    openGraph: {
      title: `${signal.member.name} · ${signal.option.label}`,
      description: signal.option.signal,
      images: [{ url: signal.member.image, alt: `${signal.member.name} ${signal.option.label} signal` }]
    }
  };
}

export default async function ShareSignalPage({
  params
}: {
  params: Promise<{ memberCode: string; optionKey: string }>;
}) {
  const { memberCode, optionKey } = await params;
  const signal = resolveSignal(memberCode, optionKey);
  if (!signal) notFound();

  return (
    <main className="shell section-shell marketing-shell share-signal-shell" style={{ "--accent": signal.member.accent } as React.CSSProperties}>
      <div className="stage-texture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <SiteHeader active="share" />

      <section className="share-signal-card" aria-labelledby="share-signal-title">
        <figure>
          <img src={signal.member.image} alt={`${signal.member.name} signal portrait`} />
          <figcaption>{signal.member.code}</figcaption>
        </figure>
        <div>
          <p>Harne Identity Signal</p>
          <h1 id="share-signal-title">{signal.option.label}</h1>
          <strong>{signal.member.name} · {signal.option.dimension}</strong>
          <blockquote>{signal.option.signal}</blockquote>
          <span>{signal.option.detail}</span>
          <ShareSignalActions member={signal.member} option={signal.option} />
        </div>
      </section>

      <p className="share-privacy-note">
        This public card contains only a member code and a public option key. It contains no account, ballot, session, email, or chat data.
      </p>
    </main>
  );
}
