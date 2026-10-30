async function authRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      ...options,
      credentials: "include",
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to reach the server. Check your connection and try again.");
  }

  if (path === "me" && response.status === 401) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || data?.error;
    const fallback = path === "signup"
      ? "We couldn't create your account. Please try again."
      : "Something went wrong. Please try again.";
    throw new Error(typeof message === "string" ? message : fallback);
  }
  if (path === "logout") return null;
  if (typeof data?.user?.username !== "string" || typeof data?.user?.email !== "string") {
    throw new Error("The server returned an invalid account response. Please try again.");
  }
  return data.user;
}

export function login({ email, password }) {
  return authRequest("login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
}

export function signup({ email, username, password }) {
  return authRequest("signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), username: username.trim(), password }),
  });
}

export function logout() {
  return authRequest("logout", { method: "POST" });
}

export function getCurrentUser(signal) {
  return authRequest("me", { signal });
}
