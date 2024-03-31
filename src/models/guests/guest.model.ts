import { Schema } from "mongoose";
import { db } from "../../database";
import { bookedDateSchema } from "../meal";

const guestSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    bookedDates: [bookedDateSchema],
  },
  {
    timestamps: true,
  },
);

const guestModel = db.model("guest", guestSchema);

export default guestModel;
