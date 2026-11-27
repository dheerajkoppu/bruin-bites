import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { app, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

test("signing up logs the user in without returning the password", async () => {
  const agent = await signUp("joebruin");
  assert.equal(agent.user.username, "joebruin");
  assert.equal(agent.user.password, undefined);

  const response = await agent.get("/api/auth/me").expect(200);
  assert.equal(response.body.user.username, "joebruin");
});

test("signing up with a taken email returns 409", async () => {
  await signUp("joebruin");
  const response = await request(app)
    .post("/api/auth/signup")
    .send({ email: "JoeBruin@ucla.edu", username: "someoneelse", password: "password123" })
    .expect(409);
  assert.equal(response.body.error, "That email is already taken.");
});

test("signing up with a short password returns 400", async () => {
  const response = await request(app)
    .post("/api/auth/signup")
    .send({ email: "joe@ucla.edu", username: "joebruin", password: "short" })
    .expect(400);
  assert.equal(response.body.error, "Password must be at least 8 characters.");
});

test("logging in checks the password", async () => {
  await signUp("joebruin");
  await request(app).post("/api/auth/login").send({ email: "joebruin@ucla.edu", password: "wrongpassword" }).expect(401);
  await request(app).post("/api/auth/login").send({ email: "joebruin@ucla.edu", password: "password123" }).expect(200);
});

test("signing up or logging in with no body is a client error", async () => {
  await request(app).post("/api/auth/signup").expect(400);
  await request(app).post("/api/auth/login").expect(401);
});

test("logging out ends the session", async () => {
  const agent = await signUp("joebruin");
  await agent.post("/api/auth/logout").expect(204);
  await agent.get("/api/auth/me").expect(401);
});

test("routes that need a login return 401 without one", async () => {
  await request(app).get("/api/ratings/me").expect(401);
  await request(app).get("/api/feed").expect(401);
  await request(app).post("/api/dishes").send({ name: "Tacos", hall: "Feast" }).expect(401);
});
