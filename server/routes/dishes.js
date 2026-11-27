import { Router } from "express";
import mongoose from "mongoose";
import { HttpError } from "../middleware/errorHandler.js";
import Dish from "../models/Dish.js";
import Photo from "../models/Photo.js";
import { escapeRegExp } from "../utils/escapeRegExp.js";

const router = Router();

router.get("/", async (request, response) => {
  const { search } = request.query;
  if (typeof search !== "string" || search.trim() === "") {
    return response.json([]);
  }
  const dishes = await Dish.find({ name: { $regex: new RegExp(escapeRegExp(search), "i") } });
  response.json(dishes);
});

router.get("/:dishId", async (request, response) => {
  if (!mongoose.Types.ObjectId.isValid(request.params.dishId)) {
    throw new HttpError(404, "Invalid dish ID");
  }
  const dish = await Dish.findById(request.params.dishId);
  if (!dish) {
    throw new HttpError(404, "Dish not found");
  }
  const photos = await Photo.find({ dish }).sort({ createdAt: -1 });
  response.json({ ...dish.toJSON(), photos });
});

export default router;
