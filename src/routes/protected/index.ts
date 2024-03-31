import bookMeal from "./meal";
import user from "./user";

export default function (app) {
  app.use("/api", bookMeal);
  app.use("/api", user);

  return app;
}
