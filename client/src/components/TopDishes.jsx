import { useEffect, useState } from "react";
import { Link } from "react-router";

function TopDishes({ hallName }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/halls/" + encodeURIComponent(hallName) + "/top", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load this week's top dishes.");
        }
        return response.json();
      })
      .then((dishes) => setResult({ dishes }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setResult({ error: "Could not load this week's top dishes." });
        }
      });

    return () => controller.abort();
  }, [hallName]);

  return (
    <section aria-labelledby="top-dishes-heading" className="top-dishes">
      <h2 id="top-dishes-heading">Top this week</h2>
      {!result && <p role="status">Loading top dishes…</p>}
      {result?.error && <p role="alert">{result.error}</p>}
      {result?.dishes?.length === 0 && (
        <p className="empty-state">No dish has enough rankings this week yet. Rate a few to get the list started.</p>
      )}
      {result?.dishes?.length > 0 && (
        <ol className="rated-dishes ranked-dishes" role="list" aria-label="Top dishes this week">
          {result.dishes.map((dish, index) => (
            <li key={dish._id}>
              <span className="dish-rank" aria-hidden="true">{index + 1}.</span>
              <div className="ranked-dish-details">
                <Link to={"/dishes/" + dish._id} className="rated-dish-name">{dish.name}</Link>
                <span className="ranking-count">
                  {dish.rankingCount} {dish.rankingCount === 1 ? "ranking" : "rankings"}
                </span>
              </div>
              <span className="dish-score" aria-label={`Average score: ${dish.averageScore.toFixed(1)} out of 10`}>
                {dish.averageScore.toFixed(1)} / 10
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default TopDishes;
