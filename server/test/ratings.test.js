import assert from "node:assert/strict";
import { test } from "node:test";
import { createDish, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

async function rankedNames(agent) {
  const response = await agent.get("/api/ratings/me").expect(200);
  return response.body.map((rating) => [rating.dish.name, rating.group, rating.position, rating.score]);
}

test("rejects bad rating input", async () => {
  const joe = await signUp();
  const dish = await createDish();

  await joe.post("/api/ratings").expect(400);
  await joe.post("/api/ratings").send({ dishId: "not-an-id", group: "liked", position: 0 }).expect(400);
  await joe.post("/api/ratings").send({ dishId: dish.id, group: "amazing", position: 0 }).expect(400);
  await joe.post("/api/ratings").send({ dishId: dish.id, group: "liked", position: -1 }).expect(400);
  await joe.post("/api/ratings").send({ dishId: dish.id, group: "liked", position: 0.5 }).expect(400);
  await joe.post("/api/ratings").send({ dishId: "64b7f0c2a1b2c3d4e5f60718", group: "liked", position: 0 }).expect(404);
});

test("inserting a rating shifts the others down and spreads the scores", async () => {
  const joe = await signUp();
  const pasta = await createDish({ name: "Pesto Pasta" });
  const tacos = await createDish({ name: "Tacos" });

  await joe.post("/api/ratings").send({ dishId: pasta.id, group: "liked", position: 0 }).expect(201);
  await joe.post("/api/ratings").send({ dishId: tacos.id, group: "liked", position: 0 }).expect(201);

  assert.deepEqual(await rankedNames(joe), [
    ["Tacos", "liked", 0, 10],
    ["Pesto Pasta", "liked", 1, 7],
  ]);
});

test("a position past the end of the group becomes last place", async () => {
  const joe = await signUp();
  const dish = await createDish();
  const response = await joe.post("/api/ratings").send({ dishId: dish.id, group: "fine", position: 5 }).expect(201);
  assert.equal(response.body.position, 0);
});

test("moving a rating to another group closes the gap it leaves", async () => {
  const joe = await signUp();
  const pasta = await createDish({ name: "Pesto Pasta" });
  const tacos = await createDish({ name: "Tacos" });
  const soup = await createDish({ name: "Soup" });

  await joe.post("/api/ratings").send({ dishId: pasta.id, group: "liked", position: 0 }).expect(201);
  await joe.post("/api/ratings").send({ dishId: tacos.id, group: "liked", position: 1 }).expect(201);
  await joe.post("/api/ratings").send({ dishId: soup.id, group: "liked", position: 2 }).expect(201);
  await joe.post("/api/ratings").send({ dishId: pasta.id, group: "disliked", position: 0 }).expect(200);

  assert.deepEqual(await rankedNames(joe), [
    ["Pesto Pasta", "disliked", 0, 3.9],
    ["Tacos", "liked", 0, 10],
    ["Soup", "liked", 1, 7],
  ]);
});
