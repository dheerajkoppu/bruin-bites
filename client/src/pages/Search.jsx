import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!query) return;
    // Ignores a slow response for a search the user has already replaced.
    let isCurrent = true;
    fetch("/api/dishes?search=" + encodeURIComponent(query))
      .then((response) => {
        if (!response.ok) throw new Error("Could not search dishes.");
        return response.json();
      })
      .then((dishes) => {
        if (isCurrent) setResult({ query, dishes });
      })
      .catch((error) => {
        if (isCurrent) setResult({ query, error: error.message });
      });
    return () => {
      isCurrent = false;
    };
  }, [query]);

  const current = result?.query === query ? result : null;

  return (
    <div>
      <h1>Search</h1>
      {!query && (
        <p>Use the search box at the top of the page to find a dish.</p>
      )}
      {current?.error && (
        <p className="form-error" role="alert">
          {current.error}
        </p>
      )}
      {current?.dishes?.length === 0 && <p>No dishes found</p>}
      {current?.dishes?.map((dish) => (
        <div key={dish._id}>
          <h3>{dish.name}</h3>
          <Link to={"/halls/" + encodeURIComponent(dish.hall)}>
            {dish.hall}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default Search;
