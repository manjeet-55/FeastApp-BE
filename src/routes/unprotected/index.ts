import signup from "./signup";
import login from "./login";
import { Express } from "express";
export default function (app: Express) {
  app.use("/api", signup);
  app.use("/api", login);
  return app;
}
