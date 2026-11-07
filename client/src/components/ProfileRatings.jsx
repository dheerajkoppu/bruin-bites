import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getMyRatings } from "../api/ratings.js";

const groups = [
  { value: "liked", label: "Liked it" },
  { value: "fine", label: "It was fine" },
  { value: "disliked", label: "Didn't like it" },
];

function ProfileRatings() {
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getMyRatings(controller.signal)
      .then((ratings) => {
        if (!controller.signal.aborted) setResult({ ratings });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ error: error.message });
      });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setResult(null);
    setAttempt((value) => value + 1);
  }

  return (
    <section aria-labelledby="ratings-heading" className="profile-ratings">
      <h2 id="ratings-heading">My ratings</h2>
      <p>Dishes are ranked from best to worst in each group. Scores are out of 10.</p>
      {!result && <p role="status">Loading your ratings…</p>}
      {result?.error && (
        <div>
          <p className="form-error" role="alert">{result.error}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      )}
      {result?.ratings && (
        <>
          {result.ratings.length === 0 && (
            <p>You haven't rated any dishes yet. <Link to="/">Explore dining halls</Link> to find a dish.</p>
          )}
          {groups.map(({ value, label }) => {
            const ratings = result.ratings
              .filter((rating) => rating.group === value)
              .sort((a, b) => a.position - b.position);
            return (
              <section key={value} aria-labelledby={`ratings-${value}`} className="rating-group">
                <h3 id={`ratings-${value}`}>{label} <span className="rating-count">({ratings.length})</span></h3>
                {ratings.length === 0 ? <p>No dishes in this group yet.</p> : (
                  <ol className="rated-dishes ranked-dishes" role="list" aria-label={`${label} ranked dishes`}>
                    {ratings.map(({ dish, score }, index) => (
                      <li key={dish._id}>
                        <span className="dish-rank" aria-hidden="true">{index + 1}.</span>
                        <div className="ranked-dish-details">
                          <span className="rated-dish-name">{dish.name}</span>
                          <Link to={"/halls/" + encodeURIComponent(dish.hall)}>{dish.hall}</Link>
                        </div>
                        <span className="dish-score" aria-label={`Score: ${score.toFixed(1)} out of 10`}>
                          {score.toFixed(1)} / 10
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </>
      )}
    </section>
  );
}

export default ProfileRatings;
