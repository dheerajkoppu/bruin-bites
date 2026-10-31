import { useAuth } from "../context/useAuth.js";

function Profile() {
  const { user } = useAuth();
  return (
    <div>
      <h1>My Profile</h1>
      {user && (
        <>
          <p>Welcome, {user.username}!</p>
          <p>{user.email}</p>
        </>
      )}
    </div>
  );
}

export default Profile;
