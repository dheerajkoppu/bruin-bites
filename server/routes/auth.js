import { Router } from "express";
import { promisify } from "node:util";
import { HttpError } from "../middleware/errorHandler.js";
import User from "../models/User.js";

const router = Router();

// A new session ID stops a cookie planted before login from working after it.
async function startSession(request, user) {
  await promisify(request.session.regenerate).call(request.session);
  request.session.userId = user.id;
}

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
  await startSession(request, user);
  response.status(201).json({ user });
});

router.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const user = await User.findOne({ email: String(email ?? "").trim().toLowerCase() }).select("+password");
  if (!user || !(await user.checkPassword(String(password ?? "")))) {
    throw new HttpError(401, "Incorrect email or password.");
  }
  await startSession(request, user);
  response.json({ user });
});

router.post("/logout", (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    response.clearCookie("connect.sid");
    response.sendStatus(204);
  });
});

router.get("/me", async (request, response) => {
  const user = request.session.userId && (await User.findById(request.session.userId));
  if (!user) {
    throw new HttpError(401, "Not logged in.");
  }
  response.json({ user });
});

export default router;
