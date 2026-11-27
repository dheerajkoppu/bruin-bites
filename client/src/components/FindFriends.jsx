
import { useState } from "react";

function FindFriends({ following, onFollowed }) {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    const username = searchText.trim();

    if (username === "") {
      return;
    }

    setError("");
    setUsers([]);
    setSearching(true);

    try {
      const response = await fetch(
        "/api/users?search=" + encodeURIComponent(username),
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setUsers(data);
    } catch {
      setError("Could not search users.");
    } finally {
      setSearching(false);
    }
  }

  async function followUser(person) {
    setError("");

    try {
      const response = await fetch(
        "/api/users/" + encodeURIComponent(person.username) + "/follow",
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error("Follow failed");
      }

      onFollowed(person);
    } catch {
      setError("Could not follow user.");
    }
  }

  return (
    <section>
      <h2>Find Friends</h2>

      <form onSubmit={handleSearch}>
        <input
          type="search"
          aria-label="Find friends"
          placeholder="Search usernames"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />

        <button type="submit" disabled={searching}>
          Search users
        </button>
      </form>

      {error !== "" && <p role="alert">{error}</p>}

      {users.map((user) => {
        const isFollowing = following?.some((friend) => friend._id === user._id);
        return (
          <div key={user._id}>
            <span>{user.username}</span>

            {following !== null && (
              <button
                type="button"
                disabled={isFollowing}
                onClick={() => followUser(user)}
              >
                {isFollowing ? "Following " : "Follow "}{user.username}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

export default FindFriends;
