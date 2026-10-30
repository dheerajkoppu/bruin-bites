import { Link } from "react-router";
import { useAuth } from "../context/useAuth.js";

function NavBar() {
  const { user } = useAuth();
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Bruin Bites
      </Link>
      <div className="nav-links">
        <Link to="/search">Search</Link>
        {user ? <Link to="/profile">My Profile</Link> : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
