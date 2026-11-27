import { Router } from "express";
import { HttpError } from "../middleware/errorHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";
import User from "../models/User.js";
import Rating from "../models/Rating.js";

const router = Router();

router.get("/", requireLogin, async (request, response) => {
  const currentUser = await User.findById(request.session.userId).select("following");
  if (!currentUser) {
    throw new HttpError(404, "User not found");
  }
  const feed = await Rating.find({ user: { $in: currentUser.following } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .select("user dish group updatedAt")
    .populate("user", "username")
    .populate("dish", "name hall");

  response.json(feed);
});

export default router;