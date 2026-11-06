import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { getMyRatings } from "./ratings.js";

afterEach(() => mock.restoreAll());

const rating = { group: "liked", dish: { _id: "dish-1", name: "Pasta", hall: "Epicuria" } };

test("ratings are requested from the current session without caching", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json([rating]));
  const controller = new AbortController();
  assert.deepEqual(await getMyRatings(controller.signal), [rating]);
  assert.deepEqual(fetchMock.mock.calls[0].arguments, [
    "/api/ratings/me", { credentials: "include", cache: "no-store", signal: controller.signal },
  ]);
});

test("unauthorized ratings explain how to restore access", async () => {
  mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
  await assert.rejects(getMyRatings(), /session has expired/);
});

test("non-JSON server errors produce a useful message", async () => {
  mock.method(globalThis, "fetch", async () => new Response("Unavailable", { status: 503 }));
  await assert.rejects(getMyRatings(), /Couldn't load your ratings/);
});

test("network errors produce a useful message", async () => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(getMyRatings(), /Unable to reach the server/);
});

for (const data of [{}, [null], [{ ...rating, group: "unknown" }], [{ ...rating, dish: null }]]) {
  test(`malformed ratings are rejected: ${JSON.stringify(data)}`, async () => {
    mock.method(globalThis, "fetch", async () => Response.json(data));
    await assert.rejects(getMyRatings(), /invalid ratings/);
  });
}

test("aborted requests preserve the abort error", async () => {
  const error = new DOMException("Aborted", "AbortError");
  mock.method(globalThis, "fetch", async () => { throw error; });
  await assert.rejects(getMyRatings(), (caught) => caught === error);
});
