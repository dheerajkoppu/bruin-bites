import { Router } from "express";
import Dish from "../models/Dish.js";
import Rating, { scoreFor } from "../models/Rating.js";
import { escapeRegExp } from "../utils/escapeRegExp.js";

const router = Router();

const TOP_DISHES_LIMIT = 10;
const TOP_DISHES_MIN_RANKINGS = 3;
const TOP_DISHES_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Hall names in URLs can differ in case from the stored names.
function hallNamePattern(hallName) {
  return new RegExp(`^${escapeRegExp(hallName)}$`, "i");
}

router.get("/", async (request, response) => {
  const halls = await Dish.distinct("hall");
  response.json(halls);
});

router.get("/:hallName/dishes", async (request, response) => {
  const dishes = await Dish.find({ hall: { $regex: hallNamePattern(request.params.hallName) } });
  response.json(dishes);
});

router.get("/:hallName/top", async (request, response) => {
  const dishes = await Dish.find({ hall: { $regex: hallNamePattern(request.params.hallName) } });
  const since = new Date(Date.now() - TOP_DISHES_WINDOW_MS);
  const recent = await Rating.find({ dish: { $in: dishes.map((dish) => dish._id) }, updatedAt: { $gte: since } });

  // A rating's score depends on how many dishes its owner has in that group.
  const groupSizes = await Rating.aggregate([
    { $match: { user: { $in: recent.map((rating) => rating.user) } } },
    { $group: { _id: { user: "$user", group: "$group" }, count: { $sum: 1 } } },
  ]);
  const sizeOf = new Map(groupSizes.map(({ _id, count }) => [`${_id.user}:${_id.group}`, count]));

  const totals = new Map();
  for (const rating of recent) {
    const score = scoreFor(rating.group, rating.position, sizeOf.get(`${rating.user}:${rating.group}`));
    const total = totals.get(String(rating.dish)) ?? { sum: 0, count: 0 };
    totals.set(String(rating.dish), { sum: total.sum + score, count: total.count + 1 });
  }

  const topDishes = dishes
    .filter((dish) => (totals.get(dish.id)?.count ?? 0) >= TOP_DISHES_MIN_RANKINGS)
    .map((dish) => {
      const { sum, count } = totals.get(dish.id);
      return { ...dish.toJSON(), averageScore: Math.round((sum / count) * 10) / 10, rankingCount: count };
    })
    .sort((first, second) => second.averageScore - first.averageScore)
    .slice(0, TOP_DISHES_LIMIT);
  response.json(topDishes);
});

export default router;
