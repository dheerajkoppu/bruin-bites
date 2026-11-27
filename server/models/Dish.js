import mongoose from "mongoose";

export const HALLS = ["Bruin Plate", "De Neve", "Epicuria", "Feast"];

const dishSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Enter a dish name."], trim: true },
  hall: { type: String, required: [true, "Pick one of the dining halls."], enum: HALLS },
  vegetarian: { type: Boolean, default: false },
  vegan: { type: Boolean, default: false },
  glutenFree: { type: Boolean, default: false },
});

const Dish = mongoose.model("Dish", dishSchema);

export default Dish;
