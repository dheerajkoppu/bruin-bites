import { useState } from "react";

function AddDish({ hallName, onAdded }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/dishes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), hall: hallName }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error || "Couldn't add the dish. Please try again.");
        return;
      }

      onAdded(data);
      setName("");
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="add-dish-form" aria-label="Add a dish" onSubmit={handleSubmit}>
      <label htmlFor="add-dish-name">Dish name</label>
      <div className="add-dish-row">
        <input
          id="add-dish-name"
          required
          placeholder="Missing something? Add it here"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting || name.trim() === ""}>
          {isSubmitting ? "Adding…" : "Add dish"}
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  );
}

export default AddDish;
