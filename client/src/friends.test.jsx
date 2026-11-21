
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("searches for a friend by username", async () => {
  // Fake API responses for testing
  const fakeFetch = vi.fn(async (url) => {
    if (url === "/api/auth/me") {
      return Response.json({
        user: {
          _id: "user1",
          username: "isaac",
          email: "isaac@example.com"
        }
      });
    }

    if (url === "/api/ratings/me") {
      return Response.json([]);
    }

    if (url === "/api/users?search=sam") {
      return Response.json([
        {
          _id: "user2",
          username: "sambruin"
        }
      ]);
    }

    throw new Error("Unexpected request: " + url);
  });

  vi.stubGlobal("fetch", fakeFetch);

  // Open the profile page
  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <App />
    </MemoryRouter>
  );

  // Search for sam
  const searchBox = await screen.findByRole("searchbox", {
    name: "Find friends"
  });

  await userEvent.type(searchBox, "sam");

  await userEvent.click(
    screen.getByRole("button", { name: "Search users" })
  );

  // Check that the result appears
  expect(await screen.findByText("sambruin")).toBeTruthy();

  expect(
    screen.getByRole("button", { name: "Follow sambruin" })
  ).toBeTruthy();

  // Check the API request
  expect(fakeFetch).toHaveBeenCalledWith(
    "/api/users?search=sam",
    expect.objectContaining({
      credentials: "include"
    })
  );
});
