import { useEffect, useState } from "react";
import { Link } from "react-router";

const listUrl = "/api/users/me/want-to-try";

function WantToTry({ dish }) {
  const [savedDishes, setSavedDishes] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadDishes() {
      try {
        const response = await fetch(listUrl, {
          credentials: "include"
        });
        if (!response.ok) throw new Error();
        const { wantToTry: dishes } = await response.json();
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
      const response = await fetch(listUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishId: dish._id })
      });
      if (!response.ok) throw new Error();
      setSavedDishes((previous) => [...previous, dish]);
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
      const response = await fetch(listUrl + "/" + id, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) throw new Error();
      setSavedDishes((previous) => previous.filter((item) => item._id !== id));
    } catch {
      setError("Could not remove this dish.");
    } finally {
      setSaving(false);
    }
  }

  function showDishes() {
    if (savedDishes === null) {
      if (error) return null;
      return <p>Loading Want to Try...</p>;
    }

    if (dish) {
      const saved = savedDishes.some((item) => item._id === dish._id);
      return (
        <button
          type="button"
          disabled={saving}
          onClick={saved ? () => removeDish(dish._id) : saveDish}
        >
          {saved ? "Remove from Want to Try" : "Save to Want to Try"}
        </button>
      );
    }

    if (savedDishes.length === 0) {
      return <p>You haven't saved any dishes yet.</p>;
    }

    return (
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
    );
  }

  return (
    <section>
      {!dish && <h2>Want to Try</h2>}
      {showDishes()}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

export default WantToTry;
