"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { cfCampaigns } from "../../data/cf";
import { getMember, members, type MemberCode } from "../../data/members";
import { tracks } from "../../data/tracks";
import { ensureHarneSession, getHarneSession } from "../../lib/harne/client";
import {
  fanProfileSchemaVersion,
  marketingPolicyVersion,
  type FanFollowInput,
  type FanProfileInput,
  type FollowSubjectType
} from "../../lib/marketing/contracts";
import {
  readMarketingConsent,
  recordMarketingEvent,
  setMarketingConsent
} from "../../lib/marketing/client";
import type { MarketingMode } from "../../lib/marketing/config";

type StoredFanProfile = {
  favoriteMemberCode: MemberCode;
  favoriteTrackId: string;
  followedKeys: string[];
  crossDeviceEnabled: boolean;
  notificationsEnabled: boolean;
};

const fanProfileStorageKey = "loom.fan.profile.v1";
const initialProfile: StoredFanProfile = {
  favoriteMemberCode: "M01",
  favoriteTrackId: tracks[0].id,
  followedKeys: ["member:M01", `track:${tracks[0].id}`],
  crossDeviceEnabled: false,
  notificationsEnabled: false
};

function parseStoredProfile(value: string | null): StoredFanProfile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredFanProfile>;
    const memberCode = members.some((member) => member.code === parsed.favoriteMemberCode)
      ? (parsed.favoriteMemberCode as MemberCode)
      : initialProfile.favoriteMemberCode;
    const trackId = tracks.some((track) => track.id === parsed.favoriteTrackId)
      ? (parsed.favoriteTrackId as string)
      : initialProfile.favoriteTrackId;
    return {
      favoriteMemberCode: memberCode,
      favoriteTrackId: trackId,
      followedKeys: Array.isArray(parsed.followedKeys)
        ? parsed.followedKeys.filter((key): key is string => typeof key === "string").slice(0, 20)
        : initialProfile.followedKeys,
      crossDeviceEnabled: Boolean(parsed.crossDeviceEnabled),
      notificationsEnabled: Boolean(parsed.notificationsEnabled)
    };
  } catch {
    return null;
  }
}

function splitFollowKey(key: string): { subjectType: FollowSubjectType; subjectKey: string } | null {
  const [subjectType, ...subjectKeyParts] = key.split(":");
  const subjectKey = subjectKeyParts.join(":");
  if (!(["member", "track", "cf"] as string[]).includes(subjectType) || !subjectKey) return null;
  return { subjectType: subjectType as FollowSubjectType, subjectKey };
}

export function FanRoom({ mode }: { mode: MarketingMode }) {
  const [favoriteMemberCode, setFavoriteMemberCode] = useState<MemberCode>(initialProfile.favoriteMemberCode);
  const [favoriteTrackId, setFavoriteTrackId] = useState(initialProfile.favoriteTrackId);
  const [followedKeys, setFollowedKeys] = useState<string[]>(initialProfile.followedKeys);
  const [crossDeviceEnabled, setCrossDeviceEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const [status, setStatus] = useState("Your shelf is local to this browser until you choose account sync.");
  const [busy, setBusy] = useState(false);

  const favoriteMember = useMemo(() => getMember(favoriteMemberCode), [favoriteMemberCode]);
  const favoriteTrack = useMemo(
    () => tracks.find((track) => track.id === favoriteTrackId) ?? tracks[0],
    [favoriteTrackId]
  );
  const visibleCf = cfCampaigns.find((campaign) => campaign.status === "final") ?? cfCampaigns[0];

  const followOptions = useMemo(
    () => [
      {
        key: `member:${favoriteMemberCode}`,
        label: `${favoriteMember.name} member signal`,
        detail: "Keep the selected favorite member on the shelf."
      },
      ...tracks.map((track) => ({
        key: `track:${track.id}`,
        label: track.title,
        detail: track.summary
      })),
      {
        key: `cf:${visibleCf.id}`,
        label: visibleCf.shortTitle,
        detail: "Follow one screen-backed CF case without creating a brand claim."
      }
    ],
    [favoriteMember.name, favoriteMemberCode, visibleCf.id, visibleCf.shortTitle]
  );

  useEffect(() => {
    const stored = parseStoredProfile(window.localStorage.getItem(fanProfileStorageKey));
    if (stored) {
      setFavoriteMemberCode(stored.favoriteMemberCode);
      setFavoriteTrackId(stored.favoriteTrackId);
      setFollowedKeys(stored.followedKeys);
      setCrossDeviceEnabled(stored.crossDeviceEnabled);
      setNotificationsEnabled(stored.notificationsEnabled);
    }
    setAnalyticsAllowed(readMarketingConsent() === "analytics");

    if (mode !== "database") return;
    let active = true;
    void (async () => {
      try {
        const session = await getHarneSession();
        if (!session) return;
        const response = await fetch("/api/marketing/profile", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as {
          profile?: {
            favorite_member_code?: MemberCode | null;
            favorite_track_id?: string | null;
            cross_device_enabled?: boolean;
          } | null;
          follows?: Array<{ subject_type: FollowSubjectType; subject_key: string; notifications_enabled: boolean }>;
          consents?: Record<string, { state?: string }>;
        };
        if (!active || !body.profile) return;
        if (body.profile.favorite_member_code) setFavoriteMemberCode(body.profile.favorite_member_code);
        if (body.profile.favorite_track_id) setFavoriteTrackId(body.profile.favorite_track_id);
        setCrossDeviceEnabled(Boolean(body.profile.cross_device_enabled));
        setFollowedKeys((body.follows ?? []).map((follow) => `${follow.subject_type}:${follow.subject_key}`));
        setNotificationsEnabled((body.follows ?? []).some((follow) => follow.notifications_enabled));
        setAnalyticsAllowed(body.consents?.analytics?.state === "granted");
        setStatus("Account shelf loaded through the user-owned profile policy.");
      } catch {
        // Local profile remains the active fallback when an account session is unavailable.
      }
    })();
    return () => {
      active = false;
    };
  }, [mode]);

  function changeFavoriteMember(nextCode: MemberCode) {
    const previousKey = `member:${favoriteMemberCode}`;
    const nextKey = `member:${nextCode}`;
    setFavoriteMemberCode(nextCode);
    setFollowedKeys((current) =>
      current.includes(previousKey)
        ? Array.from(new Set(current.map((key) => (key === previousKey ? nextKey : key))))
        : current
    );
  }

  function toggleFollow(key: string) {
    setFollowedKeys((current) =>
      current.includes(key) ? current.filter((currentKey) => currentKey !== key) : [...current, key]
    );
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Saving your signal shelf...");

    const storedProfile: StoredFanProfile = {
      favoriteMemberCode,
      favoriteTrackId,
      followedKeys,
      crossDeviceEnabled,
      notificationsEnabled
    };
    window.localStorage.setItem(fanProfileStorageKey, JSON.stringify(storedProfile));
    setMarketingConsent(analyticsAllowed ? "analytics" : "essential");

    const follows = followedKeys
      .map(splitFollowKey)
      .filter((follow): follow is NonNullable<typeof follow> => Boolean(follow))
      .map<FanFollowInput>((follow) => ({
        ...follow,
        notificationsEnabled
      }));

    const payload: FanProfileInput = {
      schemaVersion: fanProfileSchemaVersion,
      favoriteMemberCode,
      favoriteTrackId,
      locale: /^[a-z]{2}(?:-[A-Z]{2})?$/.test(navigator.language) ? navigator.language : "en",
      crossDeviceEnabled,
      follows,
      consents: {
        analytics: analyticsAllowed ? "granted" : "withdrawn",
        profileSync: crossDeviceEnabled ? "granted" : "withdrawn",
        notifications: notificationsEnabled ? "granted" : "withdrawn"
      },
      policyVersion: marketingPolicyVersion
    };

    try {
      if (mode === "database" && crossDeviceEnabled) {
        await ensureHarneSession();
        const response = await fetch("/api/marketing/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store"
        });
        if (!response.ok) throw new Error("Account sync is not ready in this environment.");
        setStatus("Saved locally and to your user-owned account shelf.");
      } else if (crossDeviceEnabled) {
        setStatus("Saved locally. Account sync will activate after the database preview gate passes.");
      } else {
        setStatus("Saved to this browser only. No account profile was written.");
      }

      void recordMarketingEvent("profile_saved", {
        contentType: "fan",
        contentKey: "signal-shelf",
        properties: { follow_count: follows.length, cross_device: crossDeviceEnabled }
      });
      void recordMarketingEvent("follow_changed", {
        contentType: "fan",
        contentKey: "signal-shelf",
        properties: { follow_count: follows.length }
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The profile could not be synced. Your local shelf is still saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="fan-room-grid" onSubmit={saveProfile}>
      <section className="fan-shelf-preview" aria-labelledby="fan-shelf-title">
        <p>Signal Shelf</p>
        <div className="fan-shelf-portrait">
          <img src={favoriteMember.image} alt={`${favoriteMember.name} favorite member portrait`} />
          <span>{favoriteMember.code}</span>
        </div>
        <h2 id="fan-shelf-title">{favoriteMember.name}</h2>
        <strong>{favoriteMember.word} Signal</strong>
        <dl>
          <div>
            <dt>Favorite track</dt>
            <dd>{favoriteTrack.title}</dd>
          </div>
          <div>
            <dt>Following</dt>
            <dd>{followedKeys.length} signals</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>{crossDeviceEnabled ? "Account sync requested" : "This browser only"}</dd>
          </div>
        </dl>
      </section>

      <div className="fan-room-controls">
        <section className="fan-control-block">
          <div className="fan-control-heading">
            <small>01</small>
            <div>
              <p>Choose a center</p>
              <h3>Favorite signal</h3>
            </div>
          </div>
          <label>
            Favorite member
            <select value={favoriteMemberCode} onChange={(event) => changeFavoriteMember(event.currentTarget.value as MemberCode)}>
              {members.map((member) => (
                <option key={member.code} value={member.code}>
                  {member.code} · {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Favorite track
            <select value={favoriteTrackId} onChange={(event) => setFavoriteTrackId(event.currentTarget.value)}>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="fan-control-block">
          <div className="fan-control-heading">
            <small>02</small>
            <div>
              <p>Build a return path</p>
              <h3>Follow signals</h3>
            </div>
          </div>
          <div className="fan-follow-list">
            {followOptions.map((option) => {
              const active = followedKeys.includes(option.key);
              return (
                <button
                  aria-pressed={active}
                  className={active ? "is-active" : undefined}
                  key={option.key}
                  onClick={() => toggleFollow(option.key)}
                  type="button"
                >
                  <span>{active ? "Following" : "Follow"}</span>
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="fan-control-block" id="privacy">
          <div className="fan-control-heading">
            <small>03</small>
            <div>
              <p>Your choice</p>
              <h3>Privacy and sync</h3>
            </div>
          </div>
          <label className="fan-check-row">
            <input
              checked={analyticsAllowed}
              onChange={(event) => setAnalyticsAllowed(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>
              <strong>Allow limited analytics signals</strong>
              <small>No email, chat, vote brief, IP, or free-text profile field is added to events.</small>
            </span>
          </label>
          <label className="fan-check-row">
            <input
              checked={crossDeviceEnabled}
              onChange={(event) => setCrossDeviceEnabled(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>
              <strong>Sync this shelf to my Loom account</strong>
              <small>{mode === "database" ? "Uses your Supabase user row and owner-only policy." : "Preview only; no remote write is active."}</small>
            </span>
          </label>
          <label className="fan-check-row">
            <input
              checked={notificationsEnabled}
              onChange={(event) => setNotificationsEnabled(event.currentTarget.checked)}
              type="checkbox"
            />
            <span>
              <strong>Mark notification interest</strong>
              <small>No email or push delivery is connected in this version.</small>
            </span>
          </label>
        </section>

        <div className="fan-save-bar">
          <div>
            <p>{mode === "database" ? "Database-capable preview" : `${mode} mode`}</p>
            <span aria-live="polite">{status}</span>
          </div>
          <button disabled={busy} type="submit">
            {busy ? "Saving" : "Save signal shelf"}
          </button>
        </div>
      </div>
    </form>
  );
}
