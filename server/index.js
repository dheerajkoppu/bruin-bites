import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import Dish from "./models/Dish.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import { createSession } from "./session.js";

const app = express();
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
    if (dishes.length === 0) {
      return response.status(404).json({ error: "No dishes found for this hall" });
    }
    response.json(dishes);
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

app.use("/api/auth", authRouter);

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
  });
