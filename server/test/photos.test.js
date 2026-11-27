import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import { app, createDish, signUp, useTestDatabase } from "./helpers.js";

useTestDatabase();

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);

test("uploads a PNG and serves it back", async () => {
  const joe = await signUp();
  const dish = await createDish();

  const uploaded = await joe
    .post(`/api/dishes/${dish.id}/photos`)
    .attach("photo", pngBytes, "pasta.png")
    .expect(201);
  assert.equal(uploaded.body.photo.data, undefined);

  const served = await request(app).get(uploaded.body.photo.url).expect(200);
  assert.equal(served.headers["content-type"], "image/png");
  assert.deepEqual(served.body, pngBytes);

  const withPhotos = await request(app).get(`/api/dishes/${dish.id}`).expect(200);
  assert.equal(withPhotos.body.photos.length, 1);
});

test("rejects a file that isn't a JPG or PNG, even with an image name", async () => {
  const joe = await signUp();
  const dish = await createDish();
  const response = await joe
    .post(`/api/dishes/${dish.id}/photos`)
    .attach("photo", Buffer.from("not really an image"), "pasta.png")
    .expect(400);
  assert.equal(response.body.error, "Photo must be a JPG or PNG.");
});

test("uploading with no file or to a missing dish fails", async () => {
  const joe = await signUp();
  const dish = await createDish();
  await joe.post(`/api/dishes/${dish.id}/photos`).expect(400);
  await joe.post("/api/dishes/64b7f0c2a1b2c3d4e5f60718/photos").attach("photo", pngBytes, "pasta.png").expect(404);
});

test("getting a photo that doesn't exist returns 404", async () => {
  await request(app).get("/api/photos/not-an-id").expect(404);
});
