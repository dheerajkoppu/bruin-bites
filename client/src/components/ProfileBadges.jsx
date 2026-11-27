import { useEffect, useState } from "react";
import { badgeDescription, getBadges } from "../api/badges.js";

function ProfileBadges({ username, ownProfile = false }) {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getBadges(username, controller.signal)
      .then((badges) => {
        if (!controller.signal.aborted) setResult({ badges });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ error: "Could not load badges. Try again." });
      });
    return () => controller.abort();
  }, [username, attempt]);

  return (
    <section aria-labelledby="badges-heading" className="profile-badges">
      <h2 id="badges-heading">Badges</h2>
      {!result && <p role="status">Loading badges…</p>}
      {result?.error && (
        <div>
          <p className="form-error" role="alert">{result.error}</p>
          <button type="button" onClick={() => {
            setResult(null);
            setAttempt((value) => value + 1);
          }}>Retry badges</button>
        </div>
      )}
      {result?.badges?.length === 0 && (
        <p>{ownProfile
          ? 'No badges yet. Rank your first dish to earn "First Bite"!'
          : `${username} has no badges yet. Ranking a first dish earns "First Bite"!`}</p>
      )}
      {result?.badges?.length > 0 && (
        <ul className="badge-list" aria-label="Earned badges">
          {result.badges.map((badge) => (
            <li key={badge.name}>
              <h3>{badge.name}</h3>
              <p>{badgeDescription(badge)}</p>
              <time dateTime={badge.earnedAt}>Earned {new Date(badge.earnedAt).toLocaleDateString()}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ProfileBadges;
