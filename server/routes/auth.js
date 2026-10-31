import { Router } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import User from "../models/User.js";

const router = Router();

router.post("/signup", async (request, response) => {
  const { email, username, password } = request.body;
  const user = new User({ email, username, password });
  await user.validate();

  const existing = await User.findOne({ $or: [{ email: user.email }, { username: user.username }] });
  if (existing) {
    const field = existing.email === user.email ? "email" : "username";
    throw new HttpError(409, `That ${field} is already taken.`);
  }

  await user.save();
  request.session.userId = user.id;
  response.status(201).json({ user });
});

router.get("/me", async (request, response) => {
  const user = request.session.userId && (await User.findById(request.session.userId));
  if (!user) {
    throw new HttpError(401, "Not logged in.");
  }
  response.json({ user });
});

export default router;
