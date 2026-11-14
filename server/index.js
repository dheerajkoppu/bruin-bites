import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import Dish from "./models/Dish.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import { createSession } from "./session.js";
import Rating from "./models/Rating.js";
import { requireLogin } from "./middleware/requireLogin.js";

const app = express();
// Render sits behind a proxy, and Express only sends the secure login cookie if it trusts it
app.set("trust proxy", 1);
app.use(express.json());
app.use(createSession());

function escapeRegExp(string) {
  // Matches characters: . * + ? ^ $ { } ( ) [ ] | \
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  }

app.get("/api/health", (request, response) => {
  response.json({ status: "ok" });
});

app.get("/api/halls", async (request, response) => {
  try {
    const halls = await Dish.distinct("hall");
    response.json(halls);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/halls/:hallName/dishes", async (request, response) => {
  try {
    const escaped = escapeRegExp(request.params.hallName);
    const regex = new RegExp(`^${escaped}$`, "i");
    const dishes = await Dish.find({ hall: { $regex: regex } });
    response.json(dishes);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/dishes/:dishId", async (request, response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(request.params.dishId)) {
      return response.status(404).json({ error: "Invalid dish ID" });
    }
    const dish = await Dish.findById(request.params.dishId);
    if (!dish) {
      return response.status(404).json({ error: "Dish not found" });
    }
    response.json(dish);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/dishes", async (request, response) => {
  try {
    const { search } = request.query;
    if (typeof search !== "string" || search.trim() === "") {
      return response.json([]);
    }
    const escaped = escapeRegExp(search);
    const regex = new RegExp(escaped, "i");
    const dishes = await Dish.find({ name: { $regex: regex } });
    response.json(dishes);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/ratings/me", requireLogin, async (request, response) => {
  try {
    const ratings = await Rating.find({ user: request.session.userId }).populate("dish");
    response.json(ratings);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/ratings", requireLogin, async (request, response) => {
  try {
    const { dishId, group, position } = request.body;

    if (!mongoose.Types.ObjectId.isValid(dishId)) {
      return response.status(400).json({ error: "Invalid dish ID" });
    }

    if (!Number.isInteger(position) || position < 0) {
      return response.status(400).json({ error: "Position must be a non-negative integer" });
    }

    const dish = await Dish.findById(dishId);
    if (!dish) {
      return response.status(404).json({ error: "Dish not found" });
    }

    if (!["liked", "fine", "disliked"].includes(group)) {
      return response.status(400).json({ error: "Invalid rating group" });
    }

    const existingRating = await Rating.findOne({
      user: request.session.userId,
      dish: dishId,
    });

       // 1. Re-rating? Close the gap it leaves in its old group
    if (existingRating) {
      await Rating.updateMany(
        { user: request.session.userId, group: existingRating.group, position: { $gt: existingRating.position } },
        { $inc: { position: -1 } }
      );
    }

    // 2. Make room in the new group
    await Rating.updateMany(
      { user: request.session.userId, group, position: { $gte: position } },
      { $inc: { position: 1 } }
    );

    // 3a. Re-rating: move it to its new spot
    if (existingRating) {
      existingRating.group = group;
      existingRating.position = position;
      await existingRating.save();
      return response.json(existingRating);
    }

    // 3b. New rating: create it at its spot
    const newRating = new Rating({
      user: request.session.userId,
      dish: dishId,
      group,
      position,
    });
    await newRating.save();
    response.status(201).json(newRating); 
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
});

app.use("/api/auth", authRouter);

// Serve the built React app so the site and the API share one domain in production
const clientBuildDirectory = path.join(import.meta.dirname, "..", "client", "dist");
app.use(express.static(clientBuildDirectory));
app.use((request, response, next) => {
  if (request.method !== "GET" || request.path.startsWith("/api")) {
    return next();
  }
  response.sendFile(path.join(clientBuildDirectory, "index.html"));
});

app.use(errorHandler);

const port = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  });
