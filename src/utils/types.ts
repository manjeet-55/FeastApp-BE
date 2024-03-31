import { Document } from "mongoose";
import { Request } from "express";
export interface UserDocument extends Document {
  fullName: string;
  email: string;
  location: string;
  hasJoined: boolean;
  password: string;
}
export interface AuthorizedRequest extends Request {
  user?: any;
}