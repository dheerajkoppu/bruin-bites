import assert from "node:assert/strict";
import { test } from "node:test";
import { createDish, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

test("the feed shows ratings only from people you follow", async () => {
  const joe = await signUp("joebruin");
  const josie = await signUp("josie");
  const stranger = await signUp("stranger");
  const pasta = await createDish({ name: "Pesto Pasta" });
  const tacos = await createDish({ name: "Tacos" });

  await josie.post("/api/ratings").send({ dishId: pasta.id, group: "liked", position: 0 }).expect(201);
  await stranger.post("/api/ratings").send({ dishId: tacos.id, group: "disliked", position: 0 }).expect(201);
  await joe.post("/api/users/josie/follow").expect(200);

  const response = await joe.get("/api/feed").expect(200);
  assert.deepEqual(
    response.body.map((rating) => [rating.user.username, rating.dish.name, rating.group]),
    [["josie", "Pesto Pasta", "liked"]],
  );
});
