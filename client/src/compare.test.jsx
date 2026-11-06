import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompareDishes from "./components/CompareDishes.jsx";

const newDish = { _id: "new", name: "New Dish" };

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Makes `count` liked dishes named Dish 0 (best) to Dish count-1 (worst).
function likedRatings(count) {
  const ratings = [];
  for (let i = 0; i < count; i++) {
    ratings.push({
      group: "liked",
      position: i,
      dish: { _id: String(i), name: "Dish " + i },
    });
  }
  return ratings;
}

function renderCompare(ratings) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url === "/api/ratings/me") {
        return new Response(JSON.stringify(ratings), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    }),
  );
  const onDone = vi.fn();
  render(<CompareDishes dish={newDish} group="liked" onDone={onDone} />);
  return onDone;
}

function savedBody() {
  const call = fetch.mock.calls.find(([url]) => url === "/api/ratings");
  return JSON.parse(call[1].body);
}

test("an empty group saves at position 0 without asking", async () => {
  const onDone = renderCompare([
    { group: "fine", position: 0, dish: { _id: "x", name: "Other" } },
  ]);

  await vi.waitFor(() => expect(onDone).toHaveBeenCalled());
  expect(screen.queryByText("Which was better?")).toBeNull();
  expect(savedBody()).toEqual({ dishId: "new", group: "liked", position: 0 });
});

test("a group of 10 takes at most 4 questions", async () => {
  const onDone = renderCompare(likedRatings(10));

  let questions = 0;
  while (!onDone.mock.calls.length) {
    await screen.findByText("Which was better?");
    questions++;
    // The new dish is worse than Dish 6 but better than Dish 7.
    const otherName = screen.getAllByRole("button")[1].textContent;
    const newIsBetter = Number(otherName.split(" ")[1]) > 6;
    await userEvent.click(
      screen.getByRole("button", {
        name: newIsBetter ? "New Dish" : otherName,
      }),
    );
  }

  expect(questions).toBeLessThanOrEqual(4);
  expect(savedBody().position).toBe(7);
});

test("re-rating a dish doesn't compare it with itself", async () => {
  const ratings = likedRatings(1);
  ratings.push({ group: "liked", position: 1, dish: newDish });
  renderCompare(ratings);

  await screen.findByText("Which was better?");
  expect(
    screen.getAllByRole("button").map((button) => button.textContent),
  ).toEqual(["New Dish", "Dish 0"]);
});
