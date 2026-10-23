// Run with `npm run seed` to fill the database with the dishes in dishes.json
import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import Dish from "./models/Dish.js";

const dishes = JSON.parse(fs.readFileSync("./dishes.json", "utf8"));

await mongoose.connect(process.env.MONGODB_URI);
await Dish.deleteMany({});
await Dish.insertMany(dishes);
console.log(`Added ${dishes.length} dishes`);
await mongoose.disconnect();
