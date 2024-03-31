import mongoose from "mongoose";
import { db } from "../../database";

const poolSchema = new mongoose.Schema({
  fullName: {
    type: String,
  },
  email: {
    type: String,
    required:true,
  },
  location: {
    type: String,
  },
  hasJoined: {
    type: Boolean,
    default: false,
  },
});

const userPoolModel = db.model("Userpool", poolSchema);

export default userPoolModel;
