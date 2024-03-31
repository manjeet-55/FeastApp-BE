import mongoose from "mongoose";
import { db } from "../../database";

const mealSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    bookedDates: [
      {
        date: {
          type: String,
        },
        mealTaken: {
          type: Boolean,
          default: false,
        },
        bookedBy: {
          type: String,
        },
        bookedByEmail: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const mealModel = db.model("Meal", mealSchema);

export default mealModel;
