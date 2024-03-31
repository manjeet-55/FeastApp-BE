import signup from "./signup.js";
import login from "./login.js";
import { Express } from "express";
export default function (app: Express) {
  app.use("/api", signup);
  app.use("/api", login);
  return app;
}
