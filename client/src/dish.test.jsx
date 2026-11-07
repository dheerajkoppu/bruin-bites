
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

// fake dishes for test bc idt the backend is working as of the writing of this
const dish = {
  _id: "507f1f77bcf86cd799439011",
  name: "Pesto Pasta",
  hall: "Bruin Plate",
  vegetarian: true,
  vegan: false,
  glutenFree: true,
};

// clear stuff
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Set up fake API responses
function setupTest(loggedIn = true) {
  const fakeFetch = vi.fn(async (url, options) => {
    if (url === "/api/auth/me") {
      if (loggedIn) {
        return Response.json({
          user: {
            _id: "user1",
            username: "isaac",
            email: "isaac@example.com"
          }
        });
      } else {
        return new Response(null, { status: 401 });
      }
    }

    if (url === "/api/dishes/" + dish._id) {
      return Response.json(dish);
    }

    if (url === "/api/ratings") {
      if (options.method === "POST") {
        return Response.json({ success: true });
      }
    }

    throw new Error("Unexpected API request: " + url);
  });

  vi.stubGlobal("fetch", fakeFetch);

  render(
    <MemoryRouter initialEntries={["/dishes/" + dish._id]}>
      <App />
    </MemoryRouter>
  );

  return fakeFetch;
}

// TEST 1: Dish information appears
test("shows the dish information", async () => {
  setupTest();

  const heading = await screen.findByRole("heading", {
    name: "Pesto Pasta"
  });

  expect(heading).toBeTruthy();
  expect(screen.getByText("Bruin Plate")).toBeTruthy();
  expect(screen.getByText("Vegetarian")).toBeTruthy();
  expect(screen.getByText("Gluten Free")).toBeTruthy();
});

// TEST 2: Rating buttons appear
test("shows three rating buttons", async () => {
  setupTest();

  await screen.findByRole("heading", {
    name: "Pesto Pasta"
  });

  expect(screen.getByRole("button", {
    name: "Liked it"
  })).toBeTruthy();

  expect(screen.getByRole("button", {
    name: "It was fine"
  })).toBeTruthy();

  expect(screen.getByRole("button", {
    name: "Didn't like it"
  })).toBeTruthy();
});

// TEST 3: Clicking Liked it saves the rating
test("saves a liked rating", async () => {
  const fakeFetch = setupTest();

  await screen.findByRole("heading", {
    name: "Pesto Pasta"
  });

  const button = screen.getByRole("button", {
    name: "Liked it"
  });

  await userEvent.click(button);

  await waitFor(() => {
    expect(fakeFetch).toHaveBeenCalledWith(
      "/api/ratings",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          dishId: dish._id,
          group: "liked"
        })
      })
    );
  });

  expect(await screen.findByText("Rating saved!")).toBeTruthy();
});

// TEST 4: Logged-out users go to login
test("redirects logged out users to login", async () => {
  setupTest(false);

  await screen.findByRole("heading", {
    name: "Pesto Pasta"
  });

  const button = screen.getByRole("button", {
    name: "Liked it"
  });

  await waitFor(() => {
    expect(button.disabled).toBe(false);
  });

  await userEvent.click(button);

  const loginHeading = await screen.findByRole("heading", {
    name: "Log in"
  });

  expect(loginHeading).toBeTruthy();
});
