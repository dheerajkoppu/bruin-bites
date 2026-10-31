import { test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import Hall from "./pages/Hall.jsx";

test("diet filters show the correct dishes", async () => {
  const dishes = [
    {
      _id: "1",
      name: "Pasta",
      vegetarian: true,
      vegan: false,
      glutenFree: false
    },
    {
      _id: "2",
      name: "Salad",
      vegetarian: true,
      vegan: true,
      glutenFree: true
    },
    {
      _id: "3",
      name: "Chicken",
      vegetarian: false,
      vegan: false,
      glutenFree: true
    }
  ];

  vi.stubGlobal("fetch", vi.fn(async () => {
    return new Response(JSON.stringify(dishes), {
      status: 200
    });
  }));

  render(
    <MemoryRouter initialEntries={["/halls/De%20Neve"]}>
      <Routes>
        <Route path="/halls/:hallName" element={<Hall />} />
      </Routes>
    </MemoryRouter>
  );

  await screen.findByText("Pasta");

  const filter = screen.getByLabelText("Filter by diet:");

  await userEvent.selectOptions(filter, "vegetarian");

  expect(screen.getByText("Pasta")).toBeTruthy();
  expect(screen.getByText("Salad")).toBeTruthy();
  expect(screen.queryByText("Chicken")).toBeNull();

  await userEvent.selectOptions(filter, "vegan");

  expect(screen.getByText("Salad")).toBeTruthy();
  expect(screen.queryByText("Pasta")).toBeNull();
  expect(screen.queryByText("Chicken")).toBeNull();

  await userEvent.selectOptions(filter, "glutenFree");

  expect(screen.getByText("Salad")).toBeTruthy();
  expect(screen.getByText("Chicken")).toBeTruthy();
  expect(screen.queryByText("Pasta")).toBeNull();

  await userEvent.selectOptions(filter, "all");

  expect(screen.getByText("Pasta")).toBeTruthy();
  expect(screen.getByText("Salad")).toBeTruthy();
  expect(screen.getByText("Chicken")).toBeTruthy();
});
