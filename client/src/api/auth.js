async function readResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.error;
    throw new Error(
      typeof message === "string"
        ? message
        : "We couldn't create your account. Please try again.",
    );
  }

  if (!data?.user || typeof data.user !== "object") {
    throw new Error("The server returned an invalid account response. Please try again.");
  }

  return data.user;
}

export async function signup({ email, username, password }) {
  let response;
  try {
    response = await fetch("/api/auth/signup", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        username: username.trim(),
        password,
      }),
    });
  } catch {
    throw new Error("Unable to reach the server. Check your connection and try again.");
  }

  return readResponse(response);
}

export async function getCurrentUser(signal) {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    signal,
  });
  if (response.status === 401) return null;
  return readResponse(response);
}
