
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth.js";

function Dish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [dish, setDish] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function saveRating(group) {
    if (isLoading || saving) {
      return;
    }

    if (user === null) {
      navigate("/login");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          dishId: id,
          group: group
        })
      });

      if (response.status === 401) {
        navigate("/login");
        return;
      }

      if (!response.ok) {
        setMessage("Could not save your rating.");
        return;
      }

      setMessage("Rating saved!");
    } catch {
      setMessage("Could not connect to the server.");
    } finally {
      setSaving(false);
    }
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
        disabled={saving || isLoading}
        onClick={() => saveRating("liked")}
      >
        Liked it
      </button>

      <button
        disabled={saving || isLoading}
        onClick={() => saveRating("fine")}
      >
        It was fine
      </button>

      <button
        disabled={saving || isLoading}
        onClick={() => saveRating("disliked")}
      >
        Didn't like it
      </button>

      {message !== "" && <p role="status">{message}</p>}
    </div>
  );
}

export default Dish;
