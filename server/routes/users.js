import { Router } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";
import User from "../models/User.js";
import { rankedRatingsFor } from "../models/Rating.js";
import { escapeRegExp } from "../utils/escapeRegExp.js";

const router = Router();

router.post("/:username/follow", requireLogin, async (request, response) => {
  const { username } = request.params;
  const userId = request.session.userId;

  const userToFollow = await User.findOne({ username });

  if (!userToFollow) {
    throw new HttpError(404, "User not found");
  }

  if (userToFollow._id.equals(userId)) {
    throw new HttpError(400, "You cannot follow yourself");
  }

  await User.findByIdAndUpdate(userId, { $addToSet: { following: userToFollow._id } });

  response.status(200).json({ message: `You are now following ${username}` });
});

router.delete("/:username/follow", requireLogin, async (request, response) => {
  const { username } = request.params;
  const userId = request.session.userId;

  const userToUnfollow = await User.findOne({ username });

  if (!userToUnfollow) {
    throw new HttpError(404, "User not found");
  }

  if (userToUnfollow._id.equals(userId)) {
    throw new HttpError(400, "You cannot unfollow yourself");
  }

  await User.findByIdAndUpdate(userId, { $pull: { following: userToUnfollow._id } });

  response.status(200).json({ message: `You have unfollowed ${username}` });
});

router.get("/me/following", requireLogin, async (request, response) => {
  const userId = request.session.userId;

  const user = await User.findById(userId).populate("following", "username");

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  response.status(200).json({ following: user.following });
});

router.get("/:username/ratings", requireLogin, async (request, response) => {
  const { username } = request.params;

  const user = await User.findOne({ username });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  if (!user._id.equals(request.session.userId) && !await User.exists({ _id: request.session.userId, following: user._id })) {
    throw new HttpError(403, "You are not allowed to view this user's ratings");
  }

  const ratings = await rankedRatingsFor(user._id);
  response.json(ratings);
});

router.get("/", requireLogin, async (request, response) => {
  const { search } = request.query;

  if (typeof search !== "string" || search.trim() === "") {
    return response.json([]);
  }

  const escaped = escapeRegExp(search);
  const regex = new RegExp(escaped, "i");

  const users = await User.find({ username: { $regex: regex }, _id: { $ne: request.session.userId } }).select("username").limit(10);
  response.json(users);
});

export default router;