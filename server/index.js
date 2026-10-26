import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import Dish from "./models/Dish.js";
const app = express();
app.use(express.json());

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
