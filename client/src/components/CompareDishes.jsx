import { useState, useEffect } from "react";
import { getBadges } from "../api/badges.js";

// After you pick a group, asks "which was better?" to binary search where the dish goes.
function CompareDishes({ dish, group, onDone, username }) {
  const [rankedDishes, setRankedDishes] = useState(null);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [error, setError] = useState("");

  async function saveRating(position) {
    // A missing badge API must not prevent the rating from being saved.
    const before = username ? await getBadges(username).catch(() => null) : null;
    fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId: dish._id, group, position }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not save your rating.");
        const after = before ? await getBadges(username).catch(() => null) : null;
        const earned = after?.filter((badge) => !before.some((old) => old.name === badge.name)) || [];
        onDone(earned);
      })
      .catch((error) => setError(error.message));
  }

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/ratings/me")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load your rankings.");
        return response.json();
      })
      .then((ratings) => {
        if (!isCurrent) return;
        // Leave out this dish in case you're re-rating it.
        const sameGroup = ratings
          .filter(
            (rating) => rating.group === group && rating.dish._id !== dish._id,
          )
          .sort((a, b) => a.position - b.position);
        setRankedDishes(sameGroup);
        setLow(0);
        setHigh(sameGroup.length);
        if (sameGroup.length === 0) saveRating(0);
      })
      .catch((error) => {
        if (isCurrent) setError(error.message);
      });
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dish._id, group]);

  function pick(newDishWasBetter) {
    const middle = Math.floor((low + high) / 2);
    const newLow = newDishWasBetter ? low : middle + 1;
    const newHigh = newDishWasBetter ? middle : high;
    setLow(newLow);
    setHigh(newHigh);
    if (newLow === newHigh) saveRating(newLow);
  }

  if (error)
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  if (!rankedDishes) return <p>Loading your rankings…</p>;
  if (low === high) return <p>Saving…</p>;

  const otherDish = rankedDishes[Math.floor((low + high) / 2)].dish;

  return (
    <div className="compare">
      <h2>Which was better?</h2>
      <div className="compare-choices">
        <button type="button" onClick={() => pick(true)}>
          {dish.name}
        </button>
        <button type="button" onClick={() => pick(false)}>
          {otherDish.name}
        </button>
      </div>
    </div>
  );
}

export default CompareDishes;
