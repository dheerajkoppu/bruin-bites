const groups = new Set(["liked", "fine", "disliked"]);

export async function getMyRatings(signal) {
  let response;
  try {
    response = await fetch("/api/ratings/me", {
      credentials: "include",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    throw new Error("Your session has expired. Please log out and log in again to see your ratings.");
  }
  if (!response.ok) throw new Error("Couldn't load your ratings. Please try again.");

  const ratings = await response.json().catch(() => null);
  if (!Array.isArray(ratings) || ratings.some((rating) =>
    !rating || !groups.has(rating.group) ||
    !Number.isInteger(rating.position) || rating.position < 0 ||
    !Number.isFinite(rating.score) || rating.score < 0 || rating.score > 10 ||
    typeof rating.dish?._id !== "string" ||
    typeof rating.dish?.name !== "string" ||
    typeof rating.dish?.hall !== "string"
  )) {
    throw new Error("The server returned invalid ratings. Please try again.");
  }
  return ratings;
}
