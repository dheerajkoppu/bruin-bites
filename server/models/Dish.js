import mongoose from "mongoose";

export const HALLS = ["Bruin Plate", "De Neve", "Epicuria", "Feast"];

const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Enter a dish name."],
    trim: true,
    maxlength: [100, "Keep the dish name under 100 characters."],
  },
  hall: { type: String, required: [true, "Pick one of the dining halls."], enum: HALLS },
  vegetarian: { type: Boolean, default: false },
  vegan: { type: Boolean, default: false },
  glutenFree: { type: Boolean, default: false },
});

// Stops two requests sent at once from both adding the same dish, ignoring case.
dishSchema.index({ hall: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const Dish = mongoose.model("Dish", dishSchema);

export default Dish;
