
import { useState } from "react";

function FindFriends({ onFollowed }) {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [followed, setFollowed] = useState([]);

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

  async function followUser(username) {
    setError("");

    try {
      const response = await fetch(
        "/api/users/" + encodeURIComponent(username) + "/follow",
        {
          method: "POST",
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error("Follow failed");
      }

      setFollowed((previous) => [...previous, username]);
      onFollowed();
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

      {users.map((user) => (
        <div key={user._id}>
          <span>{user.username}</span>

          <button
            type="button"
            disabled={followed.includes(user.username)}
            onClick={() => followUser(user.username)}
          >
            {followed.includes(user.username)
              ? "Following " + user.username
              : "Follow " + user.username}
          </button>
        </div>
      ))}
    </section>
  );
}

export default FindFriends;
