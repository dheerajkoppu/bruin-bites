
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth.js";
import CompareDishes from "../components/CompareDishes.jsx";

function Dish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [dish, setDish] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
  let ignore = false;

  async function loadDish() {
    setDish(null);
    setError("");

    try {
      const response = await fetch("/api/dishes/" + id);

      if (!response.ok) {
        if (!ignore) {
          setError("Could not find this dish.");
        }
        return;
      }

      const data = await response.json();

      if (!ignore) {
        setDish(data);
      }
    } catch {
      if (!ignore) {
        setError("Could not load this dish.");
      }
    }
  }

  loadDish();

  return () => {
    ignore = true;
  };
}, [id]);

  function startRating(group) {
    if (isLoading) {
      return;
    }

    if (!user) {
      navigate("/login");
      return;
    }

    setMessage("");
    setSelectedGroup(group);
  }

  if (error !== "") {
    return <p role="alert">{error}</p>;
  }

  if (dish === null) {
    return <p>Loading dish...</p>;
  }

  return (
    <div>
      <h1>{dish.name}</h1>

      <p>{dish.hall}</p>

      {dish.vegetarian && <p>Vegetarian</p>}
      {dish.vegan && <p>Vegan</p>}
      {dish.glutenFree && <p>Gluten Free</p>}

      
      <h2>Rate this dish</h2>

      <button
        disabled={isLoading || selectedGroup !== null}
        onClick={() => startRating("liked")}
      >
        Liked it
      </button>

      <button
        disabled={isLoading || selectedGroup !== null}
        onClick={() => startRating("fine")}
      >
        It was fine
      </button>

      <button
        disabled={isLoading || selectedGroup !== null}
        onClick={() => startRating("disliked")}
      >
        Didn't like it
      </button>

      {selectedGroup !== null && (
        <CompareDishes
          dish={dish}
          group={selectedGroup}
          onDone={() => {
            setSelectedGroup(null);
            setMessage("Rating saved!");
          }}
        />
      )}

      {message !== "" && <p role="status">{message}</p>}

    </div>
  );
}

export default Dish;
