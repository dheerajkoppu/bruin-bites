import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

const dishes = [{ _id: "1", name: "Pesto Pasta Bowl", hall: "Bruin Plate" }];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderApp(initialEntry = "/search") {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url.startsWith("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Not logged in." }), {
          status: 401,
        });
      }
      if (url.startsWith("/api/dishes")) {
        const matches = url.includes("pasta") ? dishes : [];
        return new Response(JSON.stringify(matches), { status: 200 });
      }
      return new Response("[]", { status: 200 });
    }),
  );
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

test("the navbar search lists each matching dish and its hall", async () => {
  renderApp("/");
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search dishes" }),
    " pasta {Enter}",
  );

  expect(
    await screen.findByRole("heading", { name: "Pesto Pasta Bowl" }),
  ).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Bruin Plate" }).getAttribute("href"),
  ).toBe("/halls/Bruin%20Plate");
  expect(fetch).toHaveBeenCalledWith("/api/dishes?search=pasta");
});

test("a search with no matches shows No dishes found", async () => {
  renderApp("/search?q=zzz");

  expect(await screen.findByText("No dishes found")).toBeTruthy();
});

test("a blank search box does not search", async () => {
  renderApp("/");
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Search dishes" }),
    "   {Enter}",
  );

  expect(screen.queryByRole("heading", { name: "Search" })).toBeNull();
  expect(fetch).not.toHaveBeenCalledWith(
    expect.stringContaining("/api/dishes"),
  );
});

test("a failed search shows an error", async () => {
  renderApp("/search?q=pasta");
  fetch.mockImplementation(async () => new Response("{}", { status: 500 }));
  cleanup();
  render(
    <MemoryRouter initialEntries={["/search?q=pasta"]}>
      <App />
    </MemoryRouter>,
  );

  expect((await screen.findByRole("alert")).textContent).toBe(
    "Could not search dishes.",
  );
});
