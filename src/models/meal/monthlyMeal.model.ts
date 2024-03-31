import mongoose from "mongoose";
import { db } from "../../database";

const monthlyMealSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false,
  },
);

const monthlyMealModel = db.model("MonthlyMeal", monthlyMealSchema);

export default monthlyMealModel;
