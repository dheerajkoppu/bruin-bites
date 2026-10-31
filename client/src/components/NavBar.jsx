import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth.js";

function NavBar() {
  const { user, isLoading, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();
    const query = searchText.trim();
    if (query) navigate("/search?q=" + encodeURIComponent(query));
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setError("");
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Bruin Bites
      </Link>
      <div className="nav-links">
        <form className="search-form" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            aria-label="Search dishes"
            placeholder="Search dishes"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        {isLoading ? <span role="status">Checking session…</span> : user ? (
          <>
            <Link to="/profile">{user.username}</Link>
            <button className="nav-button" type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
        {error && <span className="form-error" role="alert">{error}</span>}
      </div>
    </nav>
  );
}

export default NavBar;
