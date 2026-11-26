import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../context/useAuth.js";

const groupLabels = {
  liked: "Liked it",
  fine: "It was fine",
  disliked: "Didn't like it",
};

function Feed() {
  const { user, isLoading, sessionError, restoreSession } = useAuth();

  if (isLoading) return <p role="status">Checking your session…</p>;
  if (sessionError) {
    return (
      <div>
        <p className="form-error" role="alert">{sessionError}</p>
        <button type="button" onClick={() => restoreSession()}>Try again</button>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return <FriendsFeed key={user._id || user.email} />;
}

function FriendsFeed() {
  const { setUser } = useAuth();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const options = { credentials: "include", signal: controller.signal };

    async function getData(url) {
      const response = await fetch(url, options);
      if (response.status === 401) {
        if (!controller.signal.aborted) setUser(null);
        return undefined;
      }
      if (!response.ok) throw new Error("Could not load your friends' feed. Try again.");
      return response.json();
    }

    async function loadFeed() {
      try {
        const data = await getData("/api/feed");
        if (data === undefined || controller.signal.aborted) return;
        if (!Array.isArray(data)) throw new Error("Invalid feed response.");

        // Populated users or dishes can be null if they have been deleted.
        const items = data.filter((item) => item?.user && item?.dish);
        if (items.some((item) => !item._id || !item.user.username || !item.dish._id ||
          !item.dish.name || !Object.hasOwn(groupLabels, item.group) ||
          !Number.isFinite(Date.parse(item.updatedAt)))) {
          throw new Error("Invalid feed response.");
        }
        items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

        let followsAnyone = true;
        if (items.length === 0) {
          const following = await getData("/api/users/me/following");
          if (following === undefined || controller.signal.aborted) return;
          if (!Array.isArray(following.following)) throw new Error("Invalid following response.");
          followsAnyone = following.following.length > 0;
        }
        if (!controller.signal.aborted) setResult({ items, followsAnyone });
      } catch {
        if (!controller.signal.aborted) {
          setResult({ error: "Could not load your friends' feed. Try again." });
        }
      }
    }

    loadFeed();
    return () => controller.abort();
  }, [attempt, setUser]);

  function retry() {
    setResult(null);
    setAttempt((value) => value + 1);
  }

  return (
    <section aria-labelledby="feed-heading">
      <h1 id="feed-heading">Friends Feed</h1>
      <p>The newest rankings from people you follow.</p>
      {!result && <p role="status">Loading your friends' rankings…</p>}
      {result?.error && (
        <div>
          <p className="form-error" role="alert">{result.error}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      )}
      {result?.items?.length === 0 && (
        result.followsAnyone ? (
          <p>Your friends haven't ranked any dishes yet.</p>
        ) : (
          <p>You aren't following anyone yet. Follow friends to see their rankings. <Link to="/profile">Find friends</Link></p>
        )
      )}
      {result?.items?.length > 0 && (
        <ol className="friends-feed" aria-label="Friends' newest rankings" role="list">
          {result.items.map((item) => (
            <li key={item._id}>
              <p>
                <Link to={`/users/${encodeURIComponent(item.user.username)}`}>{item.user.username}</Link>
                {" ranked "}
                <Link to={`/dishes/${item.dish._id}`}>{item.dish.name}</Link>
                {" in "}<strong>{groupLabels[item.group]}</strong>.
              </p>
              <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default Feed;
