import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { getCurrentUser, signup } from "./auth.js";

afterEach(() => mock.restoreAll());

const account = { email: "student@example.com", username: "bruin" };
const fields = { ...account, password: " my password " };

test("signup sends trimmed identity fields, preserves the password, and includes cookies", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    Response.json({ user: account }, { status: 201 }),
  );
  assert.deepEqual(await signup({ ...fields, email: ` ${fields.email} `, username: " bruin " }), account);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, "/api/auth/signup");
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "include");
  assert.equal(options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(options.body), fields);
});

for (const key of ["message", "error"]) {
  test(`signup preserves the server's duplicate-account ${key}`, async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({ [key]: "This username is already taken." }, { status: 409 }),
    );
    await assert.rejects(signup(fields), { message: "This username is already taken." });
  });
}

test("signup handles a non-JSON API error", async () => {
  mock.method(globalThis, "fetch", async () => new Response("Unavailable", { status: 503 }));
  await assert.rejects(signup(fields), /couldn't create your account/);
});

test("signup handles a network failure", async () => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(signup(fields), /Unable to reach the server/);
});

test("signup rejects success responses without a user", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({}));
  await assert.rejects(signup(fields), /invalid account response/);
});

test("session restoration returns the current user and passes an abort signal", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ user: account }));
  const controller = new AbortController();
  assert.deepEqual(await getCurrentUser(controller.signal), account);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, [
    "/api/auth/me", { credentials: "include", signal: controller.signal },
  ]);
});

test("an unauthenticated session returns no user", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
  assert.equal(await getCurrentUser(), null);
});
