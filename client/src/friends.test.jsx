
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import App from "./App.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("searches for a friend by username and follows them", async () => {
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
    if (url === "/api/users/sambruin/follow") {
        return Response.json({
            message: "You are now following sambruin"
        });
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


  // Click the Follow button
  await userEvent.click(
    screen.getByRole("button", {
      name: "Follow sambruin"
    })
  );

  // Check that a POST request was sent
  await waitFor(() => {
    expect(fakeFetch).toHaveBeenCalledWith(
      "/api/users/sambruin/follow",
      expect.objectContaining({
        method: "POST",
        credentials: "include"
      })
    );
  });

  // Check that the button changes after following
  expect(
    await screen.findByRole("button", {
      name: "Following sambruin"
    })
  ).toBeTruthy();

});



test("shows followed users and lets you unfollow", async () => {
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

    if (url === "/api/users/me/following") {
      return Response.json({
        following: [
          {
            _id: "user2",
            username: "sambruin"
          }
        ]
      });
    }

    if (url === "/api/users/sambruin/follow") {
      return Response.json({
        message: "You have unfollowed sambruin"
      });
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

  // Check that the followed user appears
  expect(await screen.findByText("sambruin")).toBeTruthy();

  const unfollowButton = screen.getByRole("button", {
    name: "Unfollow sambruin"
  });

  // Click Unfollow
  await userEvent.click(unfollowButton);

  // Check that the DELETE request was sent
  await waitFor(() => {
    expect(fakeFetch).toHaveBeenCalledWith(
      "/api/users/sambruin/follow",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include"
      })
    );
  });

  // Check that the unfollow button disappears
  await waitFor(() => {
    expect(
      screen.queryByRole("button", {
        name: "Unfollow sambruin"
      })
    ).toBeNull();
  });
});
