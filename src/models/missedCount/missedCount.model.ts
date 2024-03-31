import mongoose from "mongoose";
import { db } from "../../database";

const missedCountSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    users: [
      {
        email: {
          type: String,
          required: true,
        },
        name: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const missedCount = db.model("MissedCount", missedCountSchema);

export default missedCount;
