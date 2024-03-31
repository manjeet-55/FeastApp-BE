import mongoose from "mongoose";
import { db } from "../../database";
import bookedDateSchema from "./mealBookedDate.model";

const mealSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    bookedDates: [bookedDateSchema],
  },
  {
    timestamps: true,
  },
);

const mealModel = db.model("Meal", mealSchema);

export default mealModel;
