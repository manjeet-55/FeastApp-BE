import mongoose from "mongoose";
import { MONGO_URI } from "../utils/config";

export const db = mongoose.createConnection(MONGO_URI);
console.log("db connectinstance", db);

db.on("connected", () => {
  console.log("Connected to database");
});

db.on("error", (err) => {
  console.error("Connection error to database:", err);
});

db.on("disconnected", () => {
  console.log("Disconnected from database");
});

db.on("reconnected", () => {
  console.log("Reconnected to DB");
});
