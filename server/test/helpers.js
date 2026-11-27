import { after, before, beforeEach } from "node:test";
import session from "express-session";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app.js";
import Dish from "../models/Dish.js";

process.env.SESSION_SECRET = "test-secret";

let database;

// Gives each test file its own empty MongoDB, cleared before every test.
export function useTestDatabase() {
  before(async () => {
    database = await MongoMemoryServer.create();
    await mongoose.connect(database.getUri());
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.models).map((model) => model.deleteMany({})));
  });

  after(async () => {
    await mongoose.disconnect();
    await database.stop();
  });
}

export const app = createApp({ sessionStore: new session.MemoryStore() });

export function createDish(fields = {}) {
  return Dish.create({ name: "Pesto Pasta", hall: "Epicuria", ...fields });
}

// Returns an agent that keeps the new user's login cookie between requests.
export async function signUp(username = "joebruin") {
  const agent = request.agent(app);
  const response = await agent
    .post("/api/auth/signup")
    .send({ email: `${username}@ucla.edu`, username, password: "password123" })
    .expect(201);
  agent.user = response.body.user;
  return agent;
}
