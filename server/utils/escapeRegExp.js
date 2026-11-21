
function escapeRegExp(string) {
  // Matches characters: . * + ? ^ $ { } ( ) [ ] | \
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { escapeRegExp };