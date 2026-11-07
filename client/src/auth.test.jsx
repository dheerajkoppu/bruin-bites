import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

const account = { username: "testbruin", email: "student@ucla.edu" };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockApi({ session = () => new Response(null, { status: 401 }), login, logout, signup } = {}) {
  const fetchMock = vi.fn(async (url, options) => {
    if (url === "/api/auth/me") return session(options);
    if (url === "/api/ratings/me") return Response.json([]);
    if (url === "/api/auth/login" && login) return login(options);
    if (url === "/api/auth/logout" && logout) return logout(options);
    if (url === "/api/auth/signup" && signup) return signup(options);
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function openPage(path = "/login") {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

async function fillLogin() {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button", { name: "Log in" }).disabled).toBe(false));
  await user.type(screen.getByLabelText("Email"), account.email);
  await user.type(screen.getByLabelText("Password"), " my password ");
  return user;
}

test("signed-out profile redirects to the login form", async () => {
  mockApi();
  openPage("/profile");
  expect(await screen.findByRole("heading", { name: "Log in" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "My Profile" })).toBeNull();
});

test("profile waits for session restoration instead of redirecting early", async () => {
  let resolveSession;
  mockApi({ session: () => new Promise((resolve) => { resolveSession = resolve; }) });
  openPage("/profile");
  expect(screen.getByText("Checking your session…")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Log in" })).toBeNull();
  resolveSession(Response.json({ user: account }));
  expect(await screen.findByRole("heading", { name: "My Profile" })).toBeTruthy();
  expect(screen.getByRole("link", { name: account.username })).toBeTruthy();
});

test("an existing session on the login page redirects to the profile", async () => {
  mockApi({ session: () => Response.json({ user: account }) });
  openPage();
  expect(await screen.findByRole("heading", { name: "My Profile" })).toBeTruthy();
  expect(screen.getByText(account.email)).toBeTruthy();
});

test("successful login sends credentials and updates the profile and navbar", async () => {
  const fetchMock = mockApi({ login: () => Response.json({ user: account }) });
  openPage();
  const user = await fillLogin();
  await user.click(screen.getByRole("button", { name: "Log in" }));
  expect(await screen.findByRole("heading", { name: "My Profile" })).toBeTruthy();
  expect(screen.getByRole("link", { name: account.username })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
  expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: " my password " }),
  });
});

test.each(["message", "error"])("wrong-password server %s is shown and login can be retried", async (key) => {
  let attempts = 0;
  mockApi({ login: () => ++attempts === 1
    ? Response.json({ [key]: "Incorrect password." }, { status: 401 })
    : Response.json({ user: account }),
  });
  openPage();
  const user = await fillLogin();
  await user.click(screen.getByRole("button", { name: "Log in" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Incorrect password.");
  await user.click(screen.getByRole("button", { name: "Log in" }));
  expect(await screen.findByRole("heading", { name: "My Profile" })).toBeTruthy();
});

test("pending login disables submission and prevents duplicate requests", async () => {
  let resolveLogin;
  const fetchMock = mockApi({ login: () => new Promise((resolve) => { resolveLogin = resolve; }) });
  openPage();
  const user = await fillLogin();
  await user.click(screen.getByRole("button", { name: "Log in" }));
  const pendingButton = screen.getByRole("button", { name: "Logging in…" });
  expect(pendingButton.disabled).toBe(true);
  await user.click(pendingButton);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith("/login"))).toHaveLength(1);
  resolveLogin(Response.json({ user: account }));
  await screen.findByRole("heading", { name: "My Profile" });
});

test("logout clears auth state, redirects, and keeps the profile protected", async () => {
  const fetchMock = mockApi({
    session: () => Response.json({ user: account }),
    logout: () => new Response(null, { status: 204 }),
  });
  openPage("/profile");
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Log out" }));
  expect(await screen.findByRole("heading", { name: "Log in" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: account.username })).toBeNull();
  expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST", credentials: "include" });
});

test("failed logout displays an error and preserves the signed-in user", async () => {
  mockApi({
    session: () => Response.json({ user: account }),
    logout: () => Response.json({ message: "Could not log out. Try again." }, { status: 503 }),
  });
  openPage("/profile");
  await userEvent.setup().click(await screen.findByRole("button", { name: "Log out" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Could not log out. Try again.");
  expect(screen.getByRole("heading", { name: "My Profile" })).toBeTruthy();
  expect(screen.getByRole("link", { name: account.username })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Log out" }).disabled).toBe(false);
});

test("a failed session check can be retried without an incorrect redirect", async () => {
  let attempts = 0;
  mockApi({ session: () => ++attempts === 1
    ? new Response("Unavailable", { status: 503 })
    : Response.json({ user: account }),
  });
  openPage("/profile");
  await screen.findByRole("alert");
  expect(screen.queryByRole("heading", { name: "Log in" })).toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("heading", { name: "My Profile" })).toBeTruthy();
});

test("network errors during login are shown in the form", async () => {
  mockApi({ login: () => { throw new TypeError("Failed to fetch"); } });
  openPage();
  const user = await fillLogin();
  await user.click(screen.getByRole("button", { name: "Log in" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Unable to reach the server");
});

test("malformed login success does not authenticate the user", async () => {
  mockApi({ login: () => Response.json({}) });
  openPage();
  const user = await fillLogin();
  await user.click(screen.getByRole("button", { name: "Log in" }));
  expect((await screen.findByRole("alert")).textContent).toContain("invalid account response");
  expect(screen.queryByRole("heading", { name: "My Profile" })).toBeNull();
});

test("signup updates shared auth state even when an earlier session check is still pending", async () => {
  let resolveSession;
  mockApi({
    session: () => new Promise((resolve) => { resolveSession = resolve; }),
    signup: () => Response.json({ user: account }, { status: 201 }),
  });
  openPage("/signup");
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), account.email);
  await user.type(screen.getByLabelText("Username"), account.username);
  await user.type(screen.getByLabelText("Password"), "test password");
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByRole("heading", { name: "My Profile" })).toBeTruthy();
  resolveSession(new Response(null, { status: 401 }));
  await waitFor(() => expect(screen.getByRole("link", { name: account.username })).toBeTruthy());
  expect(screen.getByRole("button", { name: "Log out" })).toBeTruthy();
});
