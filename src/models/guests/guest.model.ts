import mongoose from "mongoose";
import { db } from "../../database";

const guestSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    location: {
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

const guestModel = db.model("guest", guestSchema);

export default guestModel;
