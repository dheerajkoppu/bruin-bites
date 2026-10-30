import { Navigate } from "react-router";
import { useAuth } from "../context/useAuth.js";

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
      <h1>My Profile</h1>
      <p>Welcome, {user.username}!</p>
      <p>{user.email}</p>
    </div>
  );
}

export default Profile;
