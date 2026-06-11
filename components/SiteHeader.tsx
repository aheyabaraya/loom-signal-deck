export type SiteHeaderActive = "home" | "archive" | "member" | "vote";

type SiteHeaderProps = {
  active?: SiteHeaderActive;
};

export function SiteHeader({ active = "home" }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        LOOM
      </a>
      <nav className="nav" aria-label="Primary navigation">
        <a aria-current={active === "home" ? "page" : undefined} href="/">
          Home
        </a>
        <a aria-current={active === "archive" ? "page" : undefined} href="/archive">
          Archive
        </a>
        <a href="/archive#members">Members</a>
        <a href="/archive#media">Media</a>
        <a href="/archive#tracks">Track 01</a>
        <a href="/archive#cf">CF</a>
        <a aria-current={active === "vote" ? "page" : undefined} href="/vote">
          Vote
        </a>
      </nav>
      <div className="harne">
        <a href="/vote">Harne Vote</a>
        <i />
        <span aria-hidden="true" />
      </div>
    </header>
  );
}
