import assert from "node:assert/strict";
import { test } from "node:test";
import Dish from "../models/Dish.js";
import User from "../models/User.js";
import { createDish, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

test("following someone twice lists them once", async () => {
  const joe = await signUp("joebruin");
  await signUp("josie");

  await joe.post("/api/users/josie/follow").expect(200);
  await joe.post("/api/users/josie/follow").expect(200);

  const response = await joe.get("/api/users/me/following").expect(200);
  assert.deepEqual(response.body.following.map((person) => person.username), ["josie"]);
});

test("following yourself returns 400 and following nobody returns 404", async () => {
  const joe = await signUp("joebruin");
  await joe.post("/api/users/joebruin/follow").expect(400);
  await joe.post("/api/users/nobody/follow").expect(404);
});

test("unfollowing removes the user from the following list", async () => {
  const joe = await signUp("joebruin");
  await signUp("josie");
  await joe.post("/api/users/josie/follow").expect(200);
  await joe.delete("/api/users/josie/follow").expect(200);

  const response = await joe.get("/api/users/me/following").expect(200);
  assert.deepEqual(response.body.following, []);
});

test("a friend's ratings are visible only to people who follow them", async () => {
  const joe = await signUp("joebruin");
  const josie = await signUp("josie");
  const dish = await createDish();
  await josie.post("/api/ratings").send({ dishId: dish.id, group: "liked", position: 0 }).expect(201);

  await joe.get("/api/users/josie/ratings").expect(403);
  await joe.post("/api/users/josie/follow").expect(200);

  const response = await joe.get("/api/users/josie/ratings").expect(200);
  assert.equal(response.body[0].dish.name, "Pesto Pasta");
  await josie.get("/api/users/josie/ratings").expect(200);
});

test("user search leaves out the person searching", async () => {
  const joe = await signUp("joebruin");
  await signUp("joeschmoe");

  const response = await joe.get("/api/users").query({ search: "joe" }).expect(200);
  assert.deepEqual(response.body.map((person) => person.username), ["joeschmoe"]);
});

test("adds, lists and removes Want to Try dishes", async () => {
  const joe = await signUp();
  const dish = await createDish();

  await joe.post("/api/users/me/want-to-try").send({ dishId: dish.id }).expect(200);
  await joe.post("/api/users/me/want-to-try").send({ dishId: dish.id }).expect(200);

  const listed = await joe.get("/api/users/me/want-to-try").expect(200);
  assert.equal(listed.body.wantToTry.length, 1);
  assert.equal(listed.body.wantToTry[0].name, "Pesto Pasta");
  assert.equal(listed.body.wantToTry[0].hall, "Epicuria");

  await joe.delete(`/api/users/me/want-to-try/${dish.id}`).expect(200);
  const emptied = await joe.get("/api/users/me/want-to-try").expect(200);
  assert.deepEqual(emptied.body.wantToTry, []);
});

test("Want to Try rejects missing, malformed and unknown dish ids", async () => {
  const joe = await signUp();
  await joe.post("/api/users/me/want-to-try").expect(400);
  await joe.post("/api/users/me/want-to-try").send({ dishId: 123 }).expect(400);
  await joe.post("/api/users/me/want-to-try").send({ dishId: "64b7f0c2a1b2c3d4e5f60718" }).expect(404);
  await joe.delete("/api/users/me/want-to-try/not-an-id").expect(400);
});

test("a Want to Try dish can be removed after the dish is deleted", async () => {
  const joe = await signUp();
  const dish = await createDish();
  await joe.post("/api/users/me/want-to-try").send({ dishId: dish.id }).expect(200);
  await Dish.deleteMany({});

  await joe.delete(`/api/users/me/want-to-try/${dish.id}`).expect(200);
  const user = await User.findById(joe.user._id);
  assert.deepEqual(user.wantToTry, []);
});
