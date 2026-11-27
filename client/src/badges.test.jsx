import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

const account = { _id: "me", username: "bruin", email: "bruin@ucla.edu" };
const first = { name: "First Bite", earnedAt: "2026-11-27T12:00:00.000Z" };
const hopper = { name: "Hall Hopper", earnedAt: "2026-11-27T13:00:00.000Z" };
const dish = { _id: "dish1", name: "Pasta", hall: "De Neve" };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup({ path = "/profile", badges = () => Response.json({ badges: [] }), session = () => Response.json({ user: account }), save = () => Response.json({ _id: "rating1" }), photo = () => Response.json({ photo: { _id: "photo1", url: "/api/photos/photo1" } }, { status: 201 }) } = {}) {
  const fakeFetch = vi.fn(async (url, options) => {
    if (url === "/api/auth/me") return session();
    if (url === "/api/users/bruin" || url === "/api/users/friend") return badges(url, options);
    if (url === "/api/ratings/me" || url === "/api/users/friend/ratings") return Response.json([]);
    if (url === "/api/users/me/following") return Response.json({ following: [] });
    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
    if (url === "/api/dishes/dish1") return Response.json(dish);
    if (url === "/api/ratings") return save();
    if (url === "/api/dishes/dish1/photos") return photo();
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fakeFetch);
  const view = render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
  return { ...view, fakeFetch };
}

for (const [path, username] of [["/profile", "bruin"], ["/users/friend", "friend"]]) {
  test(`${path} displays earned badges with names, descriptions, and dates`, async () => {
    const { fakeFetch } = setup({ path, badges: () => Response.json({ badges: [first, hopper] }) });
    const list = await screen.findByRole("list", { name: "Earned badges" });
    expect(within(list).getByRole("heading", { name: "First Bite" })).toBeTruthy();
    expect(within(list).getByText("Rank your first dish.")).toBeTruthy();
    expect(within(list).getByRole("heading", { name: "Hall Hopper" })).toBeTruthy();
    expect(within(list).getByText("Rank a dish at every dining hall.")).toBeTruthy();
    expect(list.querySelector("time").dateTime).toBe(first.earnedAt);
    expect(fakeFetch).toHaveBeenCalledWith(`/api/users/${username}`, expect.objectContaining({ credentials: "include", cache: "no-store", signal: expect.any(AbortSignal) }));
  });

  test(`${path} explains how to earn the first badge`, async () => {
    setup({ path });
    const section = await screen.findByRole("region", { name: "Badges" });
    expect(await within(section).findByText(/first dish.*First Bite/)).toBeTruthy();
    expect(within(section).queryByRole("list")).toBeNull();
  });
}

for (const [label, fail] of [
  ["unavailable API", () => new Response(null, { status: 404 })],
  ["forbidden profile", () => new Response(null, { status: 403 })],
  ["network failure", () => { throw new TypeError("Failed to fetch"); }],
  ["missing badges", () => Response.json({ username: "bruin" })],
  ["invalid badge", () => Response.json({ badges: [{ name: "First Bite", earnedAt: "invalid" }] })],
]) {
  test(`${label} shows an error rather than an empty badge list and can retry`, async () => {
    const badges = vi.fn().mockImplementationOnce(fail).mockResolvedValueOnce(Response.json({ badges: [first] }));
    setup({ badges });
    const section = await screen.findByRole("region", { name: "Badges" });
    expect((await within(section).findByRole("alert")).textContent).toContain("Could not load badges");
    expect(within(section).queryByText(/No badges yet/)).toBeNull();
    await userEvent.click(within(section).getByRole("button", { name: "Retry badges" }));
    expect(await within(section).findByText("First Bite")).toBeTruthy();
  });
}

test("badge requests wait for authentication and abort when the profile unmounts", async () => {
  let resolveSession;
  let signal;
  const { fakeFetch, unmount } = setup({
    session: () => new Promise((resolve) => { resolveSession = resolve; }),
    badges: (_url, options) => { signal = options.signal; return new Promise(() => {}); },
  });
  expect(fakeFetch.mock.calls.some(([url]) => url === "/api/users/bruin")).toBe(false);
  await act(async () => resolveSession(Response.json({ user: account })));
  await screen.findByText("Loading badges…");
  unmount();
  expect(signal.aborted).toBe(true);
});

test("signed-out visitors never request badges", async () => {
  const { fakeFetch } = setup({ session: () => new Response(null, { status: 401 }) });
  await screen.findByRole("heading", { name: "Log in" });
  expect(fakeFetch.mock.calls.some(([url]) => url === "/api/users/bruin")).toBe(false);
});

for (const [label, before, after, earned] of [
  ["first ranking", [], [first], 'You earned "First Bite"!'],
  ["last hall ranking", [first], [first, hopper], 'You earned "Hall Hopper"!'],
  ["multiple awards", [], [first, hopper], 'You earned "First Bite" and "Hall Hopper"!'],
  ["re-ranking", [first], [first], null],
]) {
  test(`${label} announces only newly earned badges`, async () => {
    const badges = vi.fn()
      .mockResolvedValueOnce(Response.json({ badges: before }))
      .mockResolvedValueOnce(Response.json({ badges: after }));
    setup({ path: "/dishes/dish1", badges });
    await userEvent.click(await screen.findByRole("button", { name: "Liked it" }));
    await screen.findByText("Rating saved!");
    if (earned) expect(screen.getByText(earned)).toBeTruthy();
    else expect(screen.queryByText(/You earned/)).toBeNull();
    expect(badges).toHaveBeenCalledTimes(2);
  });
}

test("a failed ranking never announces or checks for a new badge", async () => {
  const badges = vi.fn(() => Response.json({ badges: [] }));
  setup({ path: "/dishes/dish1", badges, save: () => new Response(null, { status: 500 }) });
  await userEvent.click(await screen.findByRole("button", { name: "Liked it" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Could not save your rating.");
  expect(badges).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/You earned/)).toBeNull();
});

for (const failedCheck of [1, 2]) {
  test(`failure of badge check ${failedCheck} does not fail a saved ranking or claim an award`, async () => {
    let calls = 0;
    setup({ path: "/dishes/dish1", badges: () => ++calls === failedCheck
      ? new Response(null, { status: 503 })
      : Response.json({ badges: [] }),
    });
    await userEvent.click(await screen.findByRole("button", { name: "Liked it" }));
    expect(await screen.findByText("Rating saved!")).toBeTruthy();
    expect(screen.queryByText(/You earned/)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
}

for (const uploadFails of [false, true]) {
  test(`badge message survives ${uploadFails ? "failed" : "successful"} photo upload`, async () => {
    const badges = vi.fn()
      .mockResolvedValueOnce(Response.json({ badges: [] }))
      .mockResolvedValueOnce(Response.json({ badges: [first] }));
    setup({ path: "/dishes/dish1", badges, photo: uploadFails
      ? () => new Response(null, { status: 500 })
      : undefined,
    });
    await userEvent.upload(await screen.findByLabelText("Add a photo (optional)"), new File(["photo"], "dish.png", { type: "image/png" }));
    await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
    expect(await screen.findByText('You earned "First Bite"!')).toBeTruthy();
    if (uploadFails) await screen.findByRole("alert");
    else await screen.findByText("Rating and photo saved!");
    expect(screen.getByText('You earned "First Bite"!')).toBeTruthy();
  });
}
