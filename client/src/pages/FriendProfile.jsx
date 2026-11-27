import { Navigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth.js";
import ProfileRatings from "../components/ProfileRatings.jsx";
import ProfileBadges from "../components/ProfileBadges.jsx";

function FriendProfile() {
  const { username } = useParams();
  const { user, isLoading, sessionError, restoreSession } = useAuth();

  // Wait until we know whether the visitor is logged in
  if (isLoading) {
    return <p role="status">Checking your session...</p>;
  }

  // Handle a problem checking the login session
  if (sessionError) {
    return (
      <div>
        <p role="alert">{sessionError}</p>
        <button onClick={() => restoreSession()}>
          Try again
        </button>
      </div>
    );
  }

  // Send logged-out visitors to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged-in visitors can view their friend's rankings
  return (
    <div>
      <h1>{username}'s ratings</h1>
      <ProfileBadges key={username} username={username} />

      <ProfileRatings
        key={username}
        username={username}
      />
    </div>
  );
}

export default FriendProfile;
