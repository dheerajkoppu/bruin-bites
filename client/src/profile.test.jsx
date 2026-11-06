import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

const account = { _id: "user-1", username: "testbruin", email: "student@ucla.edu" };
const ratings = [
  { _id: "r1", group: "liked", dish: { _id: "d1", name: "Pasta", hall: "Epicuria" } },
  { _id: "r2", group: "fine", dish: { _id: "d2", name: "Salad", hall: "De Neve" } },
  { _id: "r3", group: "disliked", dish: { _id: "d3", name: "Soup", hall: "Bruin Plate" } },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockApi({ session = () => Response.json({ user: account }), getRatings = () => Response.json(ratings), login = account } = {}) {
  const fetchMock = vi.fn(async (url, options) => {
    if (url === "/api/auth/me") return session();
    if (url === "/api/ratings/me") return getRatings(options);
    if (url === "/api/auth/logout") return new Response(null, { status: 204 });
    if (url === "/api/auth/login") return Response.json({ user: login });
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function openProfile() {
  return render(<MemoryRouter initialEntries={["/profile"]}><App /></MemoryRouter>);
}

async function logBackIn(email = account.email) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Log out" }));
  await screen.findByRole("heading", { name: "Log in" });
  expect(screen.queryByText("Pasta")).toBeNull();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), "test password");
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

test("profile displays saved dishes in their rating groups with hall links", async () => {
  mockApi();
  openProfile();
  await screen.findByText("Pasta");
  for (const [label, name] of [["Liked it (1)", "Pasta"], ["It was fine (1)", "Salad"], ["Didn't like it (1)", "Soup"]]) {
    const section = screen.getByRole("region", { name: label });
    expect(within(section).getByText(name)).toBeTruthy();
    expect(within(section).getAllByRole("listitem")).toHaveLength(1);
  }
  expect(screen.getByRole("link", { name: "De Neve" }).getAttribute("href")).toBe("/halls/De%20Neve");
});

test("ratings wait for authentication and show a loading state while fetching", async () => {
  let resolveSession;
  let resolveRatings;
  const fetchMock = mockApi({
    session: () => new Promise((resolve) => { resolveSession = resolve; }),
    getRatings: () => new Promise((resolve) => { resolveRatings = resolve; }),
  });
  openProfile();
  expect(fetchMock.mock.calls.some(([url]) => url === "/api/ratings/me")).toBe(false);
  await act(async () => resolveSession(Response.json({ user: account })));
  expect(await screen.findByText("Loading your ratings…")).toBeTruthy();
  await act(async () => resolveRatings(Response.json(ratings)));
  expect(await screen.findByText("Pasta")).toBeTruthy();
  expect(screen.queryByText("Loading your ratings…")).toBeNull();
});

test("signed-out visitors never request ratings", async () => {
  const fetchMock = mockApi({ session: () => new Response(null, { status: 401 }) });
  openProfile();
  await screen.findByRole("heading", { name: "Log in" });
  expect(fetchMock.mock.calls.some(([url]) => url === "/api/ratings/me")).toBe(false);
});

test("an empty account shows all three groups and a way to explore dishes", async () => {
  mockApi({ getRatings: () => Response.json([]) });
  openProfile();
  expect(await screen.findByText(/You haven't rated any dishes yet/)).toBeTruthy();
  for (const label of ["Liked it (0)", "It was fine (0)", "Didn't like it (0)"]) {
    expect(within(screen.getByRole("region", { name: label })).getByText("No dishes in this group yet.")).toBeTruthy();
  }
  expect(screen.getByRole("link", { name: "Explore dining halls" }).getAttribute("href")).toBe("/");
});

test("failed ratings can be retried without presenting an empty account", async () => {
  let attempts = 0;
  mockApi({ getRatings: () => ++attempts === 1
    ? new Response("Unavailable", { status: 503 }) : Response.json(ratings),
  });
  openProfile();
  expect((await screen.findByRole("alert")).textContent).toContain("Couldn't load your ratings");
  expect(screen.queryByText(/You haven't rated/)).toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Pasta")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("saved ratings are fetched again after logout and login", async () => {
  const fetchMock = mockApi();
  openProfile();
  await screen.findByText("Pasta");
  await logBackIn();
  expect(await screen.findByText("Pasta")).toBeTruthy();
  expect(screen.getByText("Salad")).toBeTruthy();
  expect(screen.getByText("Soup")).toBeTruthy();
  expect(fetchMock.mock.calls.filter(([url]) => url === "/api/ratings/me")).toHaveLength(2);
});

test("a late ratings response after logout cannot overwrite another account's ratings", async () => {
  let resolveFirstRatings;
  let firstSignal;
  let requests = 0;
  mockApi({
    login: { _id: "user-2", username: "otherbruin", email: "other@ucla.edu" },
    getRatings: ({ signal }) => ++requests === 1
      ? new Promise((resolve) => { resolveFirstRatings = resolve; firstSignal = signal; })
      : Response.json([]),
  });
  openProfile();
  await waitFor(() => expect(requests).toBe(1));
  await logBackIn("other@ucla.edu");
  await screen.findByText(/You haven't rated any dishes yet/);
  expect(firstSignal.aborted).toBe(true);
  await act(async () => resolveFirstRatings(Response.json(ratings)));
  expect(screen.queryByText("Pasta")).toBeNull();
  expect(screen.getByText("other@ucla.edu")).toBeTruthy();
});
