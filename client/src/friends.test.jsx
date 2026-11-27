
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

    if (url === "/api/users/me/following") {
        return Response.json({
            following: []
        });
    }

    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
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

    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
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



test("shows a friend's ranked dishes", async () => {
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

    if (url === "/api/users/sambruin/ratings") {
      return Response.json([
        {
          _id: "rating1",
          group: "liked",
          position: 0,
          score: 10,
          dish: {
            _id: "dish1",
            name: "Pesto Pasta",
            hall: "Bruin Plate"
          }
        }
      ]);
    }

    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
    throw new Error("Unexpected request: " + url);
  });

  vi.stubGlobal("fetch", fakeFetch);

  // Open our friend's profile page
  render(
    <MemoryRouter initialEntries={["/users/sambruin"]}>
      <App />
    </MemoryRouter>
  );

  // Check that the friend's name appears
  expect(
    await screen.findByRole("heading", {
      name: "sambruin's ratings"
    })
  ).toBeTruthy();

  // Check that their rated dish appears
  expect(await screen.findByText("Pesto Pasta")).toBeTruthy();

  // Check the score
  expect(
    screen.getByLabelText("Score: 10.0 out of 10")
  ).toBeTruthy();

  // Check that we requested the correct user's ratings
  expect(fakeFetch).toHaveBeenCalledWith(
    "/api/users/sambruin/ratings",
    expect.objectContaining({
      credentials: "include"
    })
  );
});


test("following someone updates the following list", async () => {
  let isFollowing = false;

  const fakeFetch = vi.fn(async (url, options) => {
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
        following: isFollowing
          ? [{ _id: "user2", username: "sambruin" }]
          : []
      });
    }

    if (url === "/api/users?search=sam") {
      return Response.json([
        { _id: "user2", username: "sambruin" }
      ]);
    }

    if (
      url === "/api/users/sambruin/follow" &&
      options?.method === "POST"
    ) {
      isFollowing = true;
      return Response.json({
        message: "You are now following sambruin"
      });
    }

    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
    throw new Error("Unexpected request: " + url);
  });

  vi.stubGlobal("fetch", fakeFetch);

  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <App />
    </MemoryRouter>
  );

  // Initially, the following list is empty
  expect(
    await screen.findByText("You aren't following anyone yet.")
  ).toBeTruthy();

  // Search for a user
  await userEvent.type(
    screen.getByRole("searchbox", { name: "Find friends" }),
    "sam"
  );

  await userEvent.click(
    screen.getByRole("button", { name: "Search users" })
  );

  // Follow that user
  await userEvent.click(
    await screen.findByRole("button", {
      name: "Follow sambruin"
    })
  );

  // The following list should update without a refresh
  expect(
    await screen.findByRole("button", {
      name: "Unfollow sambruin"
    })
  ).toBeTruthy();
});


test("redirects logged-out users from a friend's profile", async () => {
  const fakeFetch = vi.fn(async (url) => {
    // The visitor is not logged in
    if (url === "/api/auth/me") {
      return new Response(null, { status: 401 });
    }

    // Return an empty list if ratings are requested.
    // The test below checks that they should NOT be.
    if (url === "/api/users/sambruin/ratings") {
      return Response.json([]);
    }

    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
    throw new Error("Unexpected request: " + url);
  });

  vi.stubGlobal("fetch", fakeFetch);

  render(
    <MemoryRouter initialEntries={["/users/sambruin"]}>
      <App />
    </MemoryRouter>
  );

  // Logged-out visitors should see the login page
  expect(
    await screen.findByRole("heading", {
      name: "Log in"
    })
  ).toBeTruthy();

  // Private ratings should never have been requested
  expect(
    fakeFetch.mock.calls.some(
      ([url]) => url === "/api/users/sambruin/ratings"
    )
  ).toBe(false);
});

test("can follow again after unfollowing", async () => {
  let isFollowing = false;

  const fakeFetch = vi.fn(async (url, options) => {
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
        following: isFollowing
          ? [{ _id: "user2", username: "sambruin" }]
          : []
      });
    }

    if (url === "/api/users?search=sam") {
      return Response.json([
        { _id: "user2", username: "sambruin" }
      ]);
    }

    if (url === "/api/users/sambruin/follow") {
      if (options.method === "POST") {
        isFollowing = true;
        return Response.json({ message: "Followed" });
      }

      if (options.method === "DELETE") {
        isFollowing = false;
        return Response.json({ message: "Unfollowed" });
      }
    }

    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
    throw new Error("Unexpected request: " + url);
  });

  vi.stubGlobal("fetch", fakeFetch);

  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <App />
    </MemoryRouter>
  );

  // Search for sambruin
  await userEvent.type(
    await screen.findByRole("searchbox", {
      name: "Find friends"
    }),
    "sam"
  );

  await userEvent.click(
    screen.getByRole("button", { name: "Search users" })
  );

  // Follow sambruin
  await userEvent.click(
    await screen.findByRole("button", {
      name: "Follow sambruin"
    })
  );

  // Wait until they appear in the Following list
  const unfollowButton = await screen.findByRole("button", {
    name: "Unfollow sambruin"
  });

  // Unfollow them
  await userEvent.click(unfollowButton);

  // Wait for the Following list to update
  await waitFor(() => {
    expect(
      screen.queryByRole("button", {
        name: "Unfollow sambruin"
      })
    ).toBeNull();
  });

  // The original Follow button should become available again
  const followAgain = await screen.findByRole("button", {
    name: "Follow sambruin"
  });

  expect(followAgain.disabled).toBe(false);

  // Follow the same person again
  await userEvent.click(followAgain);

  // There should be two POST requests in total
  await waitFor(() => {
    const postRequests = fakeFetch.mock.calls.filter(
      ([url, options]) =>
        url === "/api/users/sambruin/follow" &&
        options?.method === "POST"
    );

    expect(postRequests).toHaveLength(2);
  });
});

test("search shows Following for a friend followed before opening the profile", async () => {
  const friend = { _id: "user2", username: "sambruin" };
  const fakeFetch = vi.fn(async (url) => {
    if (url === "/api/auth/me") {
      return Response.json({ user: { _id: "user1", username: "isaac", email: "isaac@example.com" } });
    }
    if (url === "/api/ratings/me") return Response.json([]);
    if (url === "/api/users/me/following") return Response.json({ following: [friend] });
    if (url === "/api/users?search=sam") return Response.json([friend]);
    throw new Error("Unexpected request: " + url);
  });
  vi.stubGlobal("fetch", fakeFetch);

  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <App />
    </MemoryRouter>
  );

  await screen.findByRole("button", { name: "Unfollow sambruin" });
  await userEvent.type(screen.getByRole("searchbox", { name: "Find friends" }), "sam");
  await userEvent.click(screen.getByRole("button", { name: "Search users" }));

  const button = await screen.findByRole("button", { name: "Following sambruin" });
  expect(button.disabled).toBe(true);
});

test("keeps Follow buttons in search when the following list fails to load", async () => {
  const fakeFetch = vi.fn(async (url) => {
    if (url === "/api/auth/me") {
      return Response.json({ user: { _id: "user1", username: "isaac", email: "isaac@example.com" } });
    }
    if (url === "/api/ratings/me") return Response.json([]);
    if (url === "/api/users/me/want-to-try") return Response.json({ wantToTry: [] });
    if (url === "/api/users/me/following") return new Response(null, { status: 500 });
    if (url === "/api/users?search=sam") return Response.json([{ _id: "user2", username: "sambruin" }]);
    throw new Error("Unexpected request: " + url);
  });
  vi.stubGlobal("fetch", fakeFetch);

  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText("Could not load followed users.")).toBeTruthy();
  await userEvent.type(await screen.findByRole("searchbox", { name: "Find friends" }), "sam");
  await userEvent.click(screen.getByRole("button", { name: "Search users" }));

  expect(await screen.findByRole("button", { name: "Follow sambruin" })).toBeTruthy();
});
