import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { app, createDish, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

test("lists the halls that have dishes", async () => {
  await createDish({ hall: "Epicuria" });
  await createDish({ name: "Tacos", hall: "Feast" });

  const response = await request(app).get("/api/halls").expect(200);
  assert.deepEqual(response.body.sort(), ["Epicuria", "Feast"]);
});

test("lists a hall's dishes, ignoring the case of the hall name", async () => {
  await createDish({ name: "Pesto Pasta", hall: "De Neve" });
  await createDish({ name: "Tacos", hall: "Feast" });

  const response = await request(app).get("/api/halls/de%20neve/dishes").expect(200);
  assert.deepEqual(response.body.map((dish) => dish.name), ["Pesto Pasta"]);
});

test("top dishes need at least three rankings", async () => {
  const popular = await createDish({ name: "Pesto Pasta" });
  const lessPopular = await createDish({ name: "Tacos" });

  for (const username of ["first", "second", "third"]) {
    const agent = await signUp(username);
    await agent.post("/api/ratings").send({ dishId: popular.id, group: "liked", position: 0 }).expect(201);
    if (username !== "third") {
      await agent.post("/api/ratings").send({ dishId: lessPopular.id, group: "liked", position: 1 }).expect(201);
    }
  }

  const response = await request(app).get("/api/halls/Epicuria/top").expect(200);
  assert.deepEqual(
    response.body.map((dish) => [dish.name, dish.averageScore, dish.rankingCount]),
    [["Pesto Pasta", 10, 3]],
  );
});
