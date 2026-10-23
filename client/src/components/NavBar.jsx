import { Link } from "react-router";

function NavBar() {
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Bruin Bites
      </Link>
      <div className="nav-links">
        <Link to="/search">Search</Link>
        <Link to="/login">Log in</Link>
      </div>
    </nav>
  );
}

export default NavBar;
