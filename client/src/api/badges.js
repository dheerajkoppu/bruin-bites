// Contract for #60: GET /api/users/:username returns { username, badges: [{ name, earnedAt }] }.
const descriptions = {
  "First Bite": "Rank your first dish.",
  "Hall Hopper": "Rank a dish at every dining hall.",
};

export function badgeDescription(badge) {
  return descriptions[badge.name] || badge.description || "Earned by ranking dishes.";
}

export async function getBadges(username, signal) {
  const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("Could not load badges. Try again.");
  const data = await response.json();
  if (!Array.isArray(data.badges) || data.badges.some((badge) =>
    !badge || typeof badge.name !== "string" || !badge.name.trim() ||
    typeof badge.earnedAt !== "string" || !Number.isFinite(Date.parse(badge.earnedAt)))) {
    throw new Error("Could not load badges. Try again.");
  }
  return data.badges;
}
