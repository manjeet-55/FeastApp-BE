import { Schema } from "mongoose";

const bookedDateSchema = new Schema({
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
});

export default bookedDateSchema;
