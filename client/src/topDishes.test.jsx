import { test, expect, vi, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import Hall from "./pages/Hall.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubHall(topDishes) {
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    const body = url.endsWith("/top") ? topDishes : [];
    return new Response(JSON.stringify(body), { status: 200 });
  }));
}

function renderHall() {
  render(
    <MemoryRouter initialEntries={["/halls/De%20Neve"]}>
      <Routes>
        <Route path="/halls/:hallName" element={<Hall />} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows this week's top dishes with average scores, linked to their pages", async () => {
  stubHall([
    { _id: "a1", name: "Pad Thai", averageScore: 9.2, rankingCount: 5 },
    { _id: "b2", name: "Tacos", averageScore: 8, rankingCount: 3 },
  ]);
  renderHall();

  const list = await screen.findByRole("list", { name: "Top dishes this week" });
  const items = within(list).getAllByRole("listitem");

  expect(items).toHaveLength(2);
  expect(within(items[0]).getByRole("link", { name: "Pad Thai" }).getAttribute("href")).toBe("/dishes/a1");
  expect(within(items[0]).getByText("9.2 / 10")).toBeTruthy();
  expect(within(items[1]).getByText("8.0 / 10")).toBeTruthy();
});

test("shows a message when no dish has enough rankings this week", async () => {
  stubHall([]);
  renderHall();

  expect(await screen.findByText(/No dish has enough rankings this week/)).toBeTruthy();
  expect(screen.queryByRole("list", { name: "Top dishes this week" })).toBeNull();
});

test("shows an error when top dishes fail to load", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (url.endsWith("/top")) {
      return new Response("{}", { status: 500 });
    }
    return new Response("[]", { status: 200 });
  }));
  renderHall();

  expect(await screen.findByText("Could not load this week's top dishes.")).toBeTruthy();
});
