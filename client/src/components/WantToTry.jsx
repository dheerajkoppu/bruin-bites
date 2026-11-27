import { useEffect, useState } from "react";
import { Link } from "react-router";

function WantToTry({ dish }) {
  const [savedDishes, setSavedDishes] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadDishes() {
      try {
        const response = await fetch("/api/users/me/want-to-try", {
          credentials: "include"
        });
        if (!response.ok) throw new Error();
        const dishes = await response.json();
        if (!Array.isArray(dishes)) throw new Error();
        if (!ignore) setSavedDishes(dishes);
      } catch {
        if (!ignore) setError("Could not load your Want to Try list.");
      }
    }

    loadDishes();
    return () => {
      ignore = true;
    };
  }, []);

  async function saveDish() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/users/me/want-to-try", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId: dish._id })
      });
      if (!response.ok) throw new Error();
      setSavedDishes([...savedDishes, dish]);
    } catch {
      setError("Could not save this dish.");
    } finally {
      setSaving(false);
    }
  }

  async function removeDish(id) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/users/me/want-to-try/" + id, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error();
      setSavedDishes(savedDishes.filter((item) => item._id !== id));
    } catch {
      setError("Could not remove this dish.");
    } finally {
      setSaving(false);
    }
  }

  if (dish) {
    if (savedDishes === null) {
      if (error) return <p role="alert">{error}</p>;
      return <p>Loading Want to Try...</p>;
    }
    const saved = savedDishes.some((item) => item._id === dish._id);
    return (
      <div>
        <button type="button" disabled={saving} onClick={saved ? () => removeDish(dish._id) : saveDish}>
          {saved ? "Remove from Want to Try" : "Save to Want to Try"}
        </button>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <section>
      <h2>Want to Try</h2>
      {error && <p role="alert">{error}</p>}
      {savedDishes === null && !error && <p>Loading Want to Try...</p>}
      {savedDishes?.length === 0 && <p>You haven't saved any dishes yet.</p>}
      {savedDishes && savedDishes.length > 0 && (
        <ul>
          {savedDishes.map((item) => (
            <li key={item._id}>
              <Link to={"/dishes/" + item._id}>{item.name}</Link> ({item.hall}){" "}
              <button type="button" disabled={saving} onClick={() => removeDish(item._id)}>
                Remove {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default WantToTry;
