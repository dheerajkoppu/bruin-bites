import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

const account = { _id: "me", username: "bruin", email: "bruin@ucla.edu" };
const rankings = [
  { _id: "old", user: { username: "alice" }, dish: { _id: "pasta", name: "Pesto Pasta" }, group: "liked", updatedAt: "2026-11-24T12:00:00.000Z" },
  { _id: "new", user: { username: "bob" }, dish: { _id: "soup", name: "Tomato Soup" }, group: "fine", updatedAt: "2026-11-26T12:00:00.000Z" },
  { _id: "middle", user: { username: "carol" }, dish: { _id: "salad", name: "Kale Salad" }, group: "disliked", updatedAt: "2026-11-25T12:00:00.000Z" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup({ session = () => Response.json({ user: account }), feed = () => Response.json(rankings), following = () => Response.json({ following: [] }), path = "/feed" } = {}) {
  const fakeFetch = vi.fn(async (url, options) => {
    if (url === "/api/auth/me") return session(options);
    if (url === "/api/feed") return feed(options);
    if (url === "/api/users/me/following") return following(options);
    if (url === "/api/ratings/me") return Response.json([]);
    if (url === "/api/auth/logout") return new Response(null, { status: 204 });
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fakeFetch);
  const view = render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
  return { fakeFetch, ...view };
}

test("navbar opens the feed and rankings show newest first with friend, dish, group, and time", async () => {
  const { fakeFetch } = setup({ path: "/profile" });
  await userEvent.click(await screen.findByRole("link", { name: "Friends Feed" }));
  const list = await screen.findByRole("list", { name: "Friends' newest rankings" });
  const items = within(list).getAllByRole("listitem");
  expect(items.map((item) => item.querySelector("time").dateTime)).toEqual([
    rankings[1].updatedAt, rankings[2].updatedAt, rankings[0].updatedAt,
  ]);
  for (const [index, ranking, label] of [[0, rankings[1], "It was fine"], [1, rankings[2], "Didn't like it"], [2, rankings[0], "Liked it"]]) {
    expect(within(items[index]).getByRole("link", { name: ranking.user.username }).getAttribute("href")).toBe(`/users/${ranking.user.username}`);
    expect(within(items[index]).getByRole("link", { name: ranking.dish.name }).getAttribute("href")).toBe(`/dishes/${ranking.dish._id}`);
    expect(within(items[index]).getByText(label)).toBeTruthy();
    expect(items[index].querySelector("time").textContent).toBe(new Date(ranking.updatedAt).toLocaleString());
  }
  expect(fakeFetch).toHaveBeenCalledWith("/api/feed", expect.objectContaining({ credentials: "include", signal: expect.any(AbortSignal) }));
});

test("no follows shows a prompt and working link to find friends", async () => {
  setup({ feed: () => Response.json([]) });
  expect(await screen.findByText(/You aren't following anyone yet/)).toBeTruthy();
  await userEvent.click(screen.getByRole("link", { name: "Find friends" }));
  expect(await screen.findByRole("searchbox", { name: "Find friends" })).toBeTruthy();
});

test("friends without rankings show a separate empty message", async () => {
  setup({ feed: () => Response.json([]), following: () => Response.json({ following: [{ username: "alice" }] }) });
  expect(await screen.findByText("Your friends haven't ranked any dishes yet.")).toBeTruthy();
  expect(screen.queryByText(/You aren't following anyone yet/)).toBeNull();
});

test("signed-out users go to login without requesting a feed", async () => {
  const { fakeFetch } = setup({ session: () => new Response(null, { status: 401 }) });
  await screen.findByRole("heading", { name: "Log in" });
  expect(fakeFetch.mock.calls.some(([url]) => url === "/api/feed")).toBe(false);
});

test("waits for session restoration before requesting the feed", async () => {
  let resolveSession;
  const { fakeFetch } = setup({ session: () => new Promise((resolve) => { resolveSession = resolve; }) });
  expect(screen.getByText("Checking your session…")).toBeTruthy();
  expect(fakeFetch.mock.calls.some(([url]) => url === "/api/feed")).toBe(false);
  expect(screen.queryByRole("heading", { name: "Log in" })).toBeNull();
  resolveSession(Response.json({ user: account }));
  await screen.findByRole("list", { name: "Friends' newest rankings" });
});

test("a failed session check can be retried without redirecting to login", async () => {
  const session = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ user: account }));
  setup({ session });
  await screen.findByRole("alert");
  expect(screen.queryByRole("heading", { name: "Log in" })).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("list", { name: "Friends' newest rankings" });
});

for (const endpoint of ["feed", "following"]) {
  test(`an expired session on ${endpoint} clears stale auth and goes to login`, async () => {
    setup({
      feed: () => endpoint === "feed" ? new Response(null, { status: 401 }) : Response.json([]),
      following: () => new Response(null, { status: 401 }),
    });
    await screen.findByRole("heading", { name: "Log in" });
    expect(screen.queryByRole("link", { name: "Friends Feed" })).toBeNull();
  });
}

for (const [name, fail] of [
  ["server error", () => new Response("Unavailable", { status: 503 })],
  ["network error", () => { throw new TypeError("Failed to fetch"); }],
  ["malformed response", () => Response.json({})],
]) {
  test(`${name} shows an error and retry loads the rankings`, async () => {
    const feed = vi.fn().mockImplementationOnce(fail).mockResolvedValueOnce(Response.json(rankings));
    setup({ feed });
    expect((await screen.findByRole("alert")).textContent).toBe("Could not load your friends' feed. Try again.");
    expect(screen.queryByText(/You aren't following anyone yet/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("list", { name: "Friends' newest rankings" });
  });
}

test("failed following request is not displayed as an empty following list", async () => {
  setup({ feed: () => Response.json([]), following: () => new Response(null, { status: 500 }) });
  await screen.findByRole("alert");
  expect(screen.queryByText(/You aren't following anyone yet/)).toBeNull();
});

test("unmount aborts an in-flight feed request", async () => {
  let requestSignal;
  const { unmount } = setup({ feed: (options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  } });
  await screen.findByText("Loading your friends' rankings…");
  unmount();
  expect(requestSignal.aborted).toBe(true);
});

test("logging out removes the feed and redirects to login", async () => {
  setup();
  await screen.findByRole("list", { name: "Friends' newest rankings" });
  await userEvent.click(screen.getByRole("button", { name: "Log out" }));
  await screen.findByRole("heading", { name: "Log in" });
  expect(screen.queryByRole("list", { name: "Friends' newest rankings" })).toBeNull();
});
