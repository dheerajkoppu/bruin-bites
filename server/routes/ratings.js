import { Router } from "express";
import mongoose from "mongoose";
import { HttpError } from "../middleware/errorHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";
import Dish from "../models/Dish.js";
import Rating, { groupRanges, rankedRatingsFor } from "../models/Rating.js";

const router = Router();

router.get("/me", requireLogin, async (request, response) => {
  const ratings = await rankedRatingsFor(request.session.userId);
  response.json(ratings);
});

// Saves a rating at a position in its group, shifting the user's other ratings to keep positions gap-free.
router.post("/", requireLogin, async (request, response) => {
  const { dishId, group, position } = request.body;
  const userId = request.session.userId;

  if (!mongoose.Types.ObjectId.isValid(dishId)) {
    throw new HttpError(400, "Invalid dish ID");
  }
  if (!Number.isInteger(position) || position < 0) {
    throw new HttpError(400, "Position must be a non-negative integer");
  }
  if (!(await Dish.exists({ _id: dishId }))) {
    throw new HttpError(404, "Dish not found");
  }
  if (!Object.hasOwn(groupRanges, group)) {
    throw new HttpError(400, "Invalid rating group");
  }

  const existingRating = await Rating.findOne({ user: userId, dish: dishId });

  const othersInNewGroup = { user: userId, group };
  if (existingRating) {
    othersInNewGroup._id = { $ne: existingRating._id };
  }

  // Past the end of the group means last place, so scores stay inside the group's range
  const othersInGroup = await Rating.countDocuments(othersInNewGroup);
  const cappedPosition = Math.min(position, othersInGroup);

  if (existingRating) {
    // Close the gap the rating leaves in its old group
    await Rating.updateMany(
      { user: userId, group: existingRating.group, position: { $gt: existingRating.position } },
      { $inc: { position: -1 } },
      { timestamps: false },
    );
  }

  await Rating.updateMany(
    { ...othersInNewGroup, position: { $gte: cappedPosition } },
    { $inc: { position: 1 } },
    { timestamps: false },
  );

  if (existingRating) {
    existingRating.group = group;
    existingRating.position = cappedPosition;
    await existingRating.save();
    return response.json(existingRating);
  }

  const newRating = await Rating.create({ user: userId, dish: dishId, group, position: cappedPosition });
  response.status(201).json(newRating);
});

export default router;
