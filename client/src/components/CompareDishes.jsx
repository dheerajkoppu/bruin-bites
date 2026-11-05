import { useState, useEffect } from "react";

// After you pick a group, asks "which was better?" to binary search where the dish goes.
function CompareDishes({ dish, group, onDone }) {
  const [rankedDishes, setRankedDishes] = useState(null);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [error, setError] = useState("");

  function saveRating(position) {
    fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId: dish._id, group, position }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not save your rating.");
        onDone();
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
        const sameGroup = ratings
          .filter((rating) => rating.group === group)
          .sort((a, b) => a.position - b.position);
        setRankedDishes(sameGroup);
        setLow(0);
        setHigh(sameGroup.length);
      })
      .catch((error) => {
        if (isCurrent) setError(error.message);
      });
    return () => {
      isCurrent = false;
    };
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
    <div>
      <h2>Which was better?</h2>
      <button type="button" onClick={() => pick(true)}>
        {dish.name}
      </button>
      <button type="button" onClick={() => pick(false)}>
        {otherDish.name}
      </button>
    </div>
  );
}

export default CompareDishes;
