import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import Dish from "../models/Dish.js";
import { app, createDish, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

test("adds a dish, matching the hall name loosely", async () => {
  const agent = await signUp();
  const response = await agent.post("/api/dishes").send({ name: "  Carne   Asada Tacos ", hall: " feast " }).expect(201);
  assert.equal(response.body.name, "Carne Asada Tacos");
  assert.equal(response.body.hall, "Feast");
});

test("adding a dish with no body returns 400", async () => {
  const agent = await signUp();
  const response = await agent.post("/api/dishes").expect(400);
  assert.equal(response.body.error, "Enter a dish name.");
});

test("adding a dish to an unknown hall returns 400", async () => {
  const agent = await signUp();
  const response = await agent.post("/api/dishes").send({ name: "Tacos", hall: "Rendezvous" }).expect(400);
  assert.equal(response.body.error, "Pick one of the dining halls.");
});

test("adding a dish with a name over 100 characters returns 400", async () => {
  const agent = await signUp();
  await agent.post("/api/dishes").send({ name: "a".repeat(101), hall: "Feast" }).expect(400);
});

test("adding a dish the hall already has returns 409, ignoring case and spacing", async () => {
  const agent = await signUp();
  await createDish({ name: "Mac and Cheese", hall: "De Neve" });

  const response = await agent.post("/api/dishes").send({ name: "mac  and CHEESE", hall: "De Neve" }).expect(409);
  assert.equal(response.body.error, "Mac and Cheese is already on the De Neve menu.");
});

test("the same dish can be on two different halls", async () => {
  const agent = await signUp();
  await createDish({ name: "Pesto Pasta", hall: "Epicuria" });
  await agent.post("/api/dishes").send({ name: "Pesto Pasta", hall: "Bruin Plate" }).expect(201);
});

test("two requests sent at once create the dish only once", async () => {
  const agent = await signUp();
  const responses = await Promise.all([
    agent.post("/api/dishes").send({ name: "Pesto Pasta", hall: "Epicuria" }),
    agent.post("/api/dishes").send({ name: "pesto pasta", hall: "Epicuria" }),
  ]);

  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(await Dish.countDocuments(), 1);
});

test("diet flags are saved only when they are true", async () => {
  const agent = await signUp();
  const response = await agent
    .post("/api/dishes")
    .send({ name: "Vegan Chili", hall: "Bruin Plate", vegan: true, vegetarian: "yes" })
    .expect(201);
  assert.equal(response.body.vegan, true);
  assert.equal(response.body.vegetarian, false);
  assert.equal(response.body.glutenFree, false);
});

test("searches dishes by name", async () => {
  await createDish({ name: "Pesto Pasta" });
  await createDish({ name: "Orange Chicken", hall: "Feast" });

  const response = await request(app).get("/api/dishes").query({ search: "pasta" }).expect(200);
  assert.deepEqual(response.body.map((dish) => dish.name), ["Pesto Pasta"]);

  const empty = await request(app).get("/api/dishes").query({ search: "  " }).expect(200);
  assert.deepEqual(empty.body, []);
});

test("searching with regex characters matches them literally", async () => {
  await createDish({ name: "Pesto Pasta" });
  const response = await request(app).get("/api/dishes").query({ search: ".*" }).expect(200);
  assert.deepEqual(response.body, []);
});

test("gets one dish with its photos", async () => {
  const dish = await createDish();
  const response = await request(app).get(`/api/dishes/${dish.id}`).expect(200);
  assert.equal(response.body.name, "Pesto Pasta");
  assert.deepEqual(response.body.photos, []);
});

test("getting a dish that doesn't exist returns 404", async () => {
  await request(app).get("/api/dishes/not-an-id").expect(404);
  await request(app).get("/api/dishes/64b7f0c2a1b2c3d4e5f60718").expect(404);
});
