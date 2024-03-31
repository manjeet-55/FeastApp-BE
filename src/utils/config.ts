import dotenv from "dotenv";
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;
export const SECRET = process.env.SECRET;
export const JWT_EXPIRY = 2592000;
export const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
export const SENDER_EMAIL = process.env.SENDER_EMAIL;
export const PORT = process.env.PORT;
export const USERPOOL_MONGO_URI = process.env.USERPOOL_MONGO_URI;
export const RESET_PASSWORD_URL = process.env.RESET_PASSWORD_URL;
