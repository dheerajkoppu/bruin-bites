import { Navigate } from "react-router";
import { useAuth } from "../context/useAuth.js";
import ProfileRatings from "../components/ProfileRatings.jsx";
import FindFriends from "../components/FindFriends.jsx";
import FollowingList from "../components/FollowingList.jsx";
import WantToTry from "../components/WantToTry.jsx";
import { useState } from "react";

function Friends() {
  const [following, setFollowing] = useState(null);

  return (
    <>
      <FindFriends
        following={following}
        onFollowed={(person) => {
          setFollowing((previous) => {
            if (previous.some((friend) => friend._id === person._id)) return previous;
            return [...previous, person];
          });
        }}
      />

      <FollowingList following={following} setFollowing={setFollowing} />
    </>
  );
}

function Profile() {
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

  return (
    <div>
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Welcome, {user.username}!</p>
        <p>{user.email}</p>
      </div>
      <ProfileRatings key={user._id || user.email} />

      <WantToTry key={user._id || user.email} />

      {/* Keyed so a different signed-in user gets a fresh following list. */}
      <Friends key={user._id || user.email} />
    </div>
  );
}

export default Profile;
