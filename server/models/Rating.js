import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true },
  group: { type: String, enum: ["liked", "fine", "disliked"], required: true },
  position: { type: Number, min: 0, required: true },
});

ratingSchema.index({ user: 1, dish: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;