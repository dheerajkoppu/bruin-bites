import { Navigate } from "react-router";
import { useAuth } from "../context/useAuth.js";
import ProfileRatings from "../components/ProfileRatings.jsx";

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
    </div>
  );
}

export default Profile;
