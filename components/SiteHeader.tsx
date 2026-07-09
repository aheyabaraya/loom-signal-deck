export type SiteHeaderActive = "home" | "archive" | "members" | "story" | "track" | "cf" | "member" | "vote";

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
        <a aria-current={active === "members" ? "page" : undefined} href="/members">
          Members
        </a>
        <a aria-current={active === "track" ? "page" : undefined} href="/track">
          Track
        </a>
        <a aria-current={active === "cf" ? "page" : undefined} href="/cf">
          CF
        </a>
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
