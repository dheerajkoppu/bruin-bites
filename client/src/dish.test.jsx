
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
function setupTest(loggedIn = true, { photos = [], ratings = [], savedDishes = [], upload, saveRating } = {}) {
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

    if (url === "/api/users/me/want-to-try") {
      if (options?.method === "POST") return new Response(null, { status: 201 });
      return Response.json({ wantToTry: savedDishes });
    }

    if (url === "/api/users/me/want-to-try/" + dish._id && options.method === "DELETE") {
      return new Response(null, { status: 204 });
    }

    if (url === "/api/dishes/" + dish._id) {
      return Response.json({ ...dish, photos });
    }

    if (url === "/api/ratings/me") {  
      return Response.json(ratings);
    }

    if (url === "/api/ratings") {
      if (options.method === "POST") {
        return saveRating ? saveRating() : Response.json({ success: true });
      }
    }

    if (url === `/api/dishes/${dish._id}/photos` && upload) {
      return upload(options);
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
          group: "liked",
          position: 0
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

const savedPhoto = { _id: "photo1", url: "/api/photos/photo1" };

test("shows existing dish photos to logged-out visitors", async () => {
  setupTest(false, { photos: [savedPhoto] });
  const image = await screen.findByRole("img", { name: "Pesto Pasta photo 1" });
  expect(image.getAttribute("src")).toBe(savedPhoto.url);
  expect(screen.queryByLabelText("Add a photo (optional)")).toBeNull();
});

for (const type of ["image/jpeg", "image/png"]) {
  test(`uploads an optional ${type} after saving the rating and displays it`, async () => {
    const fakeFetch = setupTest(true, {
      upload: () => Response.json({ photo: savedPhoto }, { status: 201 }),
    });
    const input = await screen.findByLabelText("Add a photo (optional)");
    const file = new File(["photo"], type === "image/png" ? "meal.png" : "meal.jpg", { type });
    await userEvent.upload(input, file);
    await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
    await screen.findByText("Rating and photo saved!");
    const uploadCall = fakeFetch.mock.calls.find(([url]) => url.endsWith("/photos"));
    expect(uploadCall[1].body.get("photo")).toBe(file);
    expect(uploadCall[1].credentials).toBe("include");
    expect(fakeFetch.mock.calls.findIndex(([url]) => url === "/api/ratings"))
      .toBeLessThan(fakeFetch.mock.calls.indexOf(uploadCall));
    expect(await screen.findByRole("img", { name: "Pesto Pasta photo 1" })).toBeTruthy();
    expect(input.files.length).toBe(0);
  });
}

for (const [name, type, size, message] of [
  ["meal.gif", "image/gif", 10, "Photo must be a JPG or PNG."],
  ["meal.png", "image/png", 5 * 1024 * 1024, "Photo must be under 5 MB."],
  ["meal.jpg", "image/jpeg", 5 * 1024 * 1024 + 1, "Photo must be under 5 MB."],
]) {
  test(`rejects ${name} with ${size} bytes before submitting`, async () => {
    const fakeFetch = setupTest();
    const input = await screen.findByLabelText("Add a photo (optional)");
    await userEvent.setup({ applyAccept: false }).upload(input, new File([new Uint8Array(size)], name, { type }));
    expect((await screen.findByRole("alert")).textContent).toBe(message);
    expect(screen.getByRole("button", { name: "Liked it" }).disabled).toBe(true);
    expect(fakeFetch.mock.calls.some(([url]) => url === "/api/ratings" || url.endsWith("/photos"))).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Liked it" }).disabled).toBe(false);
  });
}

test("accepts a photo just under 5 MB", async () => {
  setupTest();
  const input = await screen.findByLabelText("Add a photo (optional)");
  await userEvent.upload(input, new File([new Uint8Array(5 * 1024 * 1024 - 1)], "meal.png", { type: "image/png" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Liked it" }).disabled).toBe(false);
});

test("retries a failed photo upload without saving the rating again", async () => {
  const upload = vi.fn()
    .mockResolvedValueOnce(Response.json({ error: "Photo must be a JPG or PNG." }, { status: 400 }))
    .mockResolvedValueOnce(Response.json({ photo: savedPhoto }, { status: 201 }));
  const fakeFetch = setupTest(true, { upload });
  await userEvent.upload(await screen.findByLabelText("Add a photo (optional)"),
    new File(["photo"], "meal.png", { type: "image/png" }));
  await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Your rating was saved, but the photo was not uploaded.");
  await userEvent.click(screen.getByRole("button", { name: "Retry photo upload" }));
  await screen.findByText("Rating and photo saved!");
  expect(upload).toHaveBeenCalledTimes(2);
  expect(fakeFetch.mock.calls.filter(([url]) => url === "/api/ratings")).toHaveLength(1);
});

test("does not upload a photo if saving the rating fails", async () => {
  const upload = vi.fn();
  setupTest(true, { upload, saveRating: () => new Response(null, { status: 500 }) });
  await userEvent.upload(await screen.findByLabelText("Add a photo (optional)"),
    new File(["photo"], "meal.png", { type: "image/png" }));
  await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Could not save your rating.");
  expect(upload).not.toHaveBeenCalled();
});

test("waits for comparisons and disables controls while the photo uploads", async () => {
  let finishUpload;
  const upload = vi.fn(() => new Promise((resolve) => { finishUpload = resolve; }));
  const fakeFetch = setupTest(true, {
    ratings: [{ group: "liked", position: 0, dish: { _id: "other", name: "Other dish" } }],
    upload,
  });
  const input = await screen.findByLabelText("Add a photo (optional)");
  await userEvent.upload(input, new File(["photo"], "meal.png", { type: "image/png" }));
  await userEvent.click(screen.getByRole("button", { name: "Liked it" }));
  await screen.findByRole("heading", { name: "Which was better?" });
  expect(upload).not.toHaveBeenCalled();
  expect(input.disabled).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Pesto Pasta" }));
  await screen.findByText("Uploading photo…");
  expect(input.disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Liked it" }).disabled).toBe(true);
  expect(screen.queryByRole("img", { name: "Pesto Pasta photo 1" })).toBeNull();
  finishUpload(Response.json({ photo: savedPhoto }, { status: 201 }));
  await screen.findByText("Rating and photo saved!");
  expect(input.disabled).toBe(false);
  expect(fakeFetch.mock.calls.filter(([url]) => url === "/api/ratings")).toHaveLength(1);
});

test("saves a dish to Want to Try and removes it again", async () => {
  const fakeFetch = setupTest();

  await userEvent.click(await screen.findByRole("button", { name: "Save to Want to Try" }));
  expect(fakeFetch).toHaveBeenCalledWith("/api/users/me/want-to-try", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dishId: dish._id })
  });

  await userEvent.click(await screen.findByRole("button", { name: "Remove from Want to Try" }));
  expect(fakeFetch).toHaveBeenCalledWith("/api/users/me/want-to-try/" + dish._id, {
    method: "DELETE",
    credentials: "include"
  });
  expect(await screen.findByRole("button", { name: "Save to Want to Try" })).toBeTruthy();
});

test("shows the remove button when visiting a saved dish", async () => {
  setupTest(true, { savedDishes: [dish] });
  expect(await screen.findByRole("button", { name: "Remove from Want to Try" })).toBeTruthy();
});

test("sends a logged-out visitor to login when saving a dish", async () => {
  const fakeFetch = setupTest(false);
  await userEvent.click(await screen.findByRole("button", { name: "Save to Want to Try" }));
  expect(await screen.findByRole("heading", { name: "Log in" })).toBeTruthy();
  expect(fakeFetch.mock.calls.some(([url]) => url.includes("want-to-try"))).toBe(false);
});

test("sends the user to login when their session expires before saving", async () => {
  const fakeFetch = setupTest();
  const original = fakeFetch.getMockImplementation();
  fakeFetch.mockImplementation(async (url, options) => {
    if (url === "/api/users/me/want-to-try" && options?.method === "POST") return new Response(null, { status: 401 });
    return original(url, options);
  });

  await userEvent.click(await screen.findByRole("button", { name: "Save to Want to Try" }));
  expect(await screen.findByRole("heading", { name: "Log in" })).toBeTruthy();
});
