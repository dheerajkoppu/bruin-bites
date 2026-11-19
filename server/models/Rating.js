import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true },
    group: { type: String, enum: ["liked", "fine", "disliked"], required: true },
    position: { type: Number, min: 0, required: true },
  },
  { timestamps: true },
);

ratingSchema.index({ user: 1, dish: 1 }, { unique: true });

export const groupRanges = {
  liked: { low: 7, high: 10 },
  fine: { low: 4, high: 6.9 },
  disliked: { low: 0, high: 3.9 },
};

// Scores are spread evenly across the group's range, best position first.
export function scoreFor(group, position, groupSize) {
  const { low, high } = groupRanges[group];
  if (groupSize === 1) {
    return high;
  }
  const step = (high - low) / (groupSize - 1);
  return Math.round((high - position * step) * 10) / 10;
}

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
