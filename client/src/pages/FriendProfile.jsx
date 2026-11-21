
import { useParams } from "react-router";
import ProfileRatings from "../components/ProfileRatings.jsx";

function FriendProfile() {
  const { username } = useParams();

  return (
    <div>
      <h1>{username}'s ratings</h1>

      <ProfileRatings
        key={username}
        username={username}
      />
    </div>
  );
}

export default FriendProfile;
