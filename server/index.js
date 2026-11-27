import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import path from "node:path";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import dishesRouter from "./routes/dishes.js";
import feedRouter from "./routes/feed.js";
import hallsRouter from "./routes/halls.js";
import photosRouter from "./routes/photos.js";
import ratingsRouter from "./routes/ratings.js";
import usersRouter from "./routes/users.js";
import { createSession } from "./session.js";

const app = express();
// Render sits behind a proxy, and Express only sends the secure login cookie if it trusts it
app.set("trust proxy", 1);
app.use(express.json());
app.use(createSession());

app.get("/api/health", (request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/halls", hallsRouter);
app.use("/api/dishes", dishesRouter);
app.use("/api/ratings", ratingsRouter);
app.use("/api/users", usersRouter);
app.use("/api/feed", feedRouter);
app.use("/api", photosRouter);

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
