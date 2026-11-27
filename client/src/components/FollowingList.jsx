import { useEffect, useState } from "react";
import { Link } from "react-router";

function FollowingList({ following, setFollowing }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unfollowing, setUnfollowing] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadFollowing() {
      try {
        const response = await fetch("/api/users/me/following", {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Could not load followed users.");
        }

        const data = await response.json();

        if (!ignore) {
          setFollowing(data.following ?? []);
        }
      } catch {
        if (!ignore) {
          // An empty list keeps the Follow buttons in search usable.
          setFollowing([]);
          setError("Could not load followed users.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFollowing();

    return () => {
      ignore = true;
    };
  }, [setFollowing]);

  async function unfollowUser(username) {
    setError("");
    setUnfollowing(username);

    try {
      const response = await fetch(
        "/api/users/" + encodeURIComponent(username) + "/follow",
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error("Could not unfollow user.");
      }

      setFollowing((previous) =>
        previous.filter((person) => person.username !== username)
      );
    } catch {
      setError("Could not unfollow user.");
    } finally {
      setUnfollowing("");
    }
  }

  return (
    <section>
      <h2>Following</h2>

      {loading && <p>Loading followed users...</p>}

      {error !== "" && <p role="alert">{error}</p>}

      {!loading && error === "" && following?.length === 0 && (
        <p>You aren't following anyone yet.</p>
      )}

      {following?.map((person) => (
        <div key={person._id}>
          <Link to={"/users/" + encodeURIComponent(person.username)}>
            {person.username}
          </Link>

          <button
            type="button"
            disabled={unfollowing === person.username}
            onClick={() => unfollowUser(person.username)}
          >
            Unfollow {person.username}
          </button>
        </div>
      ))}
    </section>
  );
}

export default FollowingList;
