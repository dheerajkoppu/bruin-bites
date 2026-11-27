// Runs the real Express server against a throwaway MongoDB so tests never touch the shared database
import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const serverDirectory = path.join(import.meta.dirname, "..", "server");
const database = await MongoMemoryServer.create();

const environment = {
  ...process.env,
  MONGODB_URI: database.getUri("bruin-bites-e2e"),
  PORT: process.env.E2E_PORT ?? "4100",
  SESSION_SECRET: "end-to-end-test-secret",
};

execFileSync("node", ["seed.js"], { cwd: serverDirectory, env: environment, stdio: "inherit" });

const server = spawn("node", ["index.js"], { cwd: serverDirectory, env: environment, stdio: "inherit" });

async function shutDown() {
  server.kill();
  await database.stop();
  process.exit();
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
server.on("exit", shutDown);
