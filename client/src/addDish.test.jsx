import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { AuthContext } from "./context/useAuth.js";
import Hall from "./pages/Hall.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubHall(addDishResponse) {
  const fetchMock = vi.fn(async (url, options) => {
    if (options?.method === "POST") {
      return addDishResponse();
    }
    const body = url.endsWith("/top") ? [] : [{ _id: "1", name: "Pasta" }];
    return new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderHall(user) {
  render(
    <AuthContext.Provider value={{ user, isLoading: false }}>
      <MemoryRouter initialEntries={["/halls/De%20Neve"]}>
        <Routes>
          <Route path="/halls/:hallName" element={<Hall />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

test("hides the add dish form when logged out", async () => {
  stubHall();
  renderHall(null);

  await screen.findByText("Pasta");
  expect(screen.queryByRole("form", { name: "Add a dish" })).toBeNull();
});

test("adds a dish to the hall's list without a reload", async () => {
  const fetchMock = stubHall(() =>
    new Response(JSON.stringify({ _id: "2", name: "Ramen", hall: "De Neve" }), { status: 201 })
  );
  renderHall({ username: "joe" });

  await screen.findByText("Pasta");
  await userEvent.type(screen.getByLabelText("Dish name"), "Ramen");
  await userEvent.click(screen.getByRole("button", { name: "Add dish" }));

  expect(await screen.findByRole("link", { name: "Ramen" })).toBeTruthy();
  expect(screen.getByLabelText("Dish name").value).toBe("");

  const [url, options] = fetchMock.mock.calls.find(([, callOptions]) => callOptions?.method === "POST");
  expect(url).toBe("/api/dishes");
  expect(JSON.parse(options.body)).toEqual({ name: "Ramen", hall: "De Neve" });
});

test("shows the server's error when the dish already exists", async () => {
  stubHall(() =>
    new Response(JSON.stringify({ error: "Pasta is already on the De Neve menu" }), { status: 409 })
  );
  renderHall({ username: "joe" });

  await screen.findByText("Pasta");
  await userEvent.type(screen.getByLabelText("Dish name"), "Pasta");
  await userEvent.click(screen.getByRole("button", { name: "Add dish" }));

  expect((await screen.findByRole("alert")).textContent).toBe("Pasta is already on the De Neve menu");
});
